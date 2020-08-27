require('dotenv').config()

const express = require('express')
const app = express()
const port = 3000

const jwt = require('jsonwebtoken')

app.use(express.json())

var mysql = require('mysql'); 

var con = mysql.createConnection({
  host: "localhost",
  user: "macros",
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

app.get('/users', authenticateToken, (req, res) => {
    con.query(`SELECT * FROM users where name = "${req.body.name}"`, function (err, result, fields) {
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

