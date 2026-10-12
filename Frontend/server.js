const cors = require('cors')
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const db = require("../database/database");
const query = db.prepare(`
INSERT INTO users (username, password_hash) 
VALUES(?, ?)
`);

app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"))
app.use(express.json());

app.get('/', (req, res) => {
res.render('homepage')
})
app.get('/login', (req, res) => {
res.render('login')
})

app.post('/register', (req, res) => {
console.log(req.body)
res.send("thanks for filling from")
})

app.post("/signup", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const passwordHash = await bcrypt.hash(password, 8);
    query.run(username, passwordHash);
});

signUpFormButton.addEventListener('click', () => {
if(!username === username){
    alert("Incorrect username")
}
else if(!password === password){
    alert("Incorrect password")
}
})