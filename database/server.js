const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const db = require("./database");
const query = db.prepare(`
INSERT INTO users (username, password_hash) 
VALUES(?, ?)
`);
app.use(express.urlencoded({ extended: false}));
app.post("/signup", async (req, res) => {
    const username = req.body.username;
     const password = req.body.password;
     const passwordHash = await bcrypt.hash(password, 8);
     query.run(username, passwordHash);
});