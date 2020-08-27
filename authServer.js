require('dotenv').config()

const express = require('express')
const app = express()
const port = 4000

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

const refreshTokens = []

app.get('/token', (req, res) => {
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
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '20s'})
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

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`) 
})

