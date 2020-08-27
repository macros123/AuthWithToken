require('dotenv').config()

const express = require('express')
const app = express()
const port = 4000
const formidable = require('formidable');
const fs = require('fs');

const jwt = require('jsonwebtoken')

app.use(express.json())

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Lavhaimt1",
  database: "test"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
});
con.query('drop table IF EXISTS users', function (err) {
    if(err) throw err
    con.query('create table IF NOT EXISTS users ( id datetime unique, name TEXT, password TEXT )', function (err) {
        if(err) throw err
        con.query('insert into users values (NOW(), "qwe", "123")', function (err) {
            if(err) throw err
            console.log('база пересоздана')
        })
    })
})
/////AUTH

const refreshTokens = []

app.get('/new_token', (req, res) => {
    const refreshToken = req.body.token
    console.log(refreshToken)
    if(refreshToken == null) return res.sendStatus(403)
    else {
        if(!refreshTokens.includes(refreshToken)) return res.sendStatus(403)
        else {
            jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
                if(err) res.sendStatus(403)
                else {
                    const accessToken = generateAccessToken({name: user.name})
                    res.json({accessToken: accessToken})
                }
            })
        }
    }
})

app.post('/signin', (req, res) => {
    con.query(`SELECT * FROM users where name = "${req.body.name}"`, function (err, result, fields) {
        if (err) res.sendStatus(500);
        else {
            if (result.length === 0) res.sendStatus(401)
            else {
                if (result[0].password === req.body.password) {
                    const user = {name: req.body.name}
                    const accessToken = generateAccessToken(user)
                    const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET)
                    refreshTokens.push(refreshToken)
                    res.json({accessToken: accessToken, message: 'успех', refreshToken: refreshToken})
                }
                else res.send('пароль не верный')
            }
        }
    });
})

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '20m'})
}

app.post('/signup', (req, res) => {
    con.query(`SELECT * FROM users where name = "${req.body.name}"`, function (err, result) {
        if (err) res.sendStatus(500);
        else {
            if (result.length !== 0) res.sendStatus(403)
            else {
                con.query(`insert into users values (NOW(), '${req.body.name}','${req.body.password}')`, function (err) {
                    if (err) res.send(err);
                    else res.sendStatus(201)
                });
            }
        }
    });
})
////


app.get('/users', authenticateToken, (req, res) => {
    con.query(`SELECT * FROM users `, function (err, result, fields) {
        if (err) res.sendStatus(500);
        else {
            res.send({users: result})
        }
    });

})

app.get('/info', authenticateToken, (req, res) => {
    con.query(`SELECT * FROM users`, function (err, result, fields) {
        if (err) res.sendStatus(500);
        else {
            res.send(result.filter(user => user.name === req.user.name))
        }
    });
})
app.use('/file', authenticateToken)
app.post('/file/upload', (req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        const file = files['/file/upload']
        const oldPath = file.path;
        const newPath = './files/' + file.name;
        const name = file.name;
        const extension = file.name.split('.').pop();
        const type = file.type.substring(0, 40);
        const size = file.size;
        fs.rename(oldPath, newPath, function (err) {
            if (err) throw err;
            con.query(`insert into files (name, extension, type, size, date) values ("${name}", "${extension}", "${type}", ${size}, NOW())`, function (err) {
                if(err) throw err
                res.json({message: 'got it'})
            })
        });
    });
})

app.get('/file/list', (req, res) => {
    const countOnOnePage = req.body.list_size
    const page = req.body.page || 1 //pagination waiting for page in body
    const query = `select * from files where id <= ${page*countOnOnePage} and id > ${page*countOnOnePage - countOnOnePage}`
    const queryCount = `select count(*) as count from files`
    con.query(queryCount, function (err, resultCount, fields) {
        if(err) throw err
        con.query(query, function (err, result, fields) {
            if(err) throw err
            res.json({result: result, pages: Math.ceil(resultCount[0].count / countOnOnePage)})
        })
    })

})

app.get('/file/:id', (req, res) => {
    const query = `select * from files where id = ${req.params.id}`
    con.query(query, function (err, result, fields) {
        if(err) throw err
        res.json(result)
    })
})

app.get('/file/download/:id', (req, res) => {
    const query = `select * from files where id = ${req.params.id}`
    con.query(query, function (err, result, fields) {
        if(err) throw err
        const file = `./files/${result[0].name}`;
        console.log(file)
        res.download(file);
    })
})


app.delete('/file/delete/:id', (req, res) => {
    const sql = `DELETE FROM files WHERE id = ${req.params.id}`;
    con.query(sql, function (err, result) {
        if (err) throw err;
        if(result.affectedRows > 0) res.send({message: 'deleted'})
        else res.send({message: 'not found'})
    });
})

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if(token == null) return res.sendStatus(401)
    else {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
            if(err) return res.sendStatus(403)
            else {
                req.user = user
                next()
            }
        })
    }
}
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

