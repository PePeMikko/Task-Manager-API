const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const db = require("./database");
const path = require("path");
const crypto = require("crypto");



app.use(express.static(path.join(__dirname, "../Frontend")));
app.use(express.urlencoded({ extended: false}));
app.use(express.json())
const sessions = new Map();

function requireAuth(req,res,next){
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ")
    ? header.slice(7)
    : null;
    const userId = token ? sessions.get(token) : null;
    if(!userId){
        return res.status(401).json
({
    error: "Please log in again."
});
    }
    req.userId =userId;
    req.token = token;
    next();
}

app.post("/signup", async (req, res) => {
    const username = req.body.username;
     const password = req.body.password;
     const confirmPassword = req.body.confirmPassword;

if(!username || !password || !confirmPassword){
    return res.send("Fill in your information.");
}

if(password !== confirmPassword){
    return res.send("Passwords do not match, try again.");
}

const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
if(existingUser){
    return res.send("Username already taken.");
}

 const passwordHash = await bcrypt.hash(password, 8);

  db.prepare(
    "INSERT INTO users (username,password_hash) VALUES (?, ?)"
  ).run(username,passwordHash);
  res.redirect("/index.html");
});



  app.post("/login", async (req, res) => {
    const username = req.body.username;
     const password = req.body.password; 
     if(!username || !password){
        return res.status(400).json({
            error: "Fill in your information."
        })
     }
const user = db.prepare(
    "SELECT * FROM users WHERE username = ?"
).get(username);

if(!user){ 
    return res.status(401).json({"error": "Username not found"});
}

const passwordMatch = await bcrypt.compare(
    password, 
    user.password_hash
);

if(!passwordMatch){
    return res.status(401).json({"error": "Wrong password"});
}
const token = crypto.randomBytes(32).toString("hex");
 sessions.set(token,user.id);
res.json({
    token: token,
    username: user.username
})
 });
 


 app.listen(3000, () => {
console.log("Server starting.")
 });