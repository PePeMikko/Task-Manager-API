const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const db = require("./database");
const path = require("path");
const crypto = require("crypto");
const { error } = require("console");



app.use(express.static(path.join(__dirname, "Frontend")));
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
    return res.status(400).json({"error": "Fill in your information."});
}

if(password !== confirmPassword){
    return res.status(400).json({"error":"Passwords do not match, try again."});
}

const existingUser = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
if(existingUser){
    return res.status(401).json({"error": "Username already taken."});
}

 const passwordHash = await bcrypt.hash(password, 8);

  db.prepare(
    "INSERT INTO users (username,password_hash) VALUES (?, ?)"
  ).run(username,passwordHash);
  res.status(201).json({message: "User created successfully"});
  
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
 
app.get("/tasks",requireAuth, (req, res) => {
const tasks = db.prepare("SELECT * FROM tasks WHERE user_id = ?").all(req.userId);
res.json(tasks);
});

app.post("/tasks", requireAuth, (req,res) => {
const { title, description, category, due_date} = req.body;

if(!title){
    return res.status(400).json({error: "Title is required"})
}
const result = db.prepare(`
    INSERT INTO tasks (user_id, title, description, category, due_date, status)
    VALUES (?,?,?,?,?, 'pending')
    `).run(
        req.userId,
        title,
        description || "",
        category || "",
        due_date || ""
    );
    const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    res.status(200).json(newTask);
});
app.put("/tasks/:id", requireAuth, (req, res) => {
    const taskId = req.params.id;
    console.log("Päivityspyyntö saapui:", req.body);
    const { title, description, category, due_date, status } = req.body;
    const task = db.prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?").get(taskId,req.userId);
    if(!task){
        return res.status(404).json({error: "Task not found"});
    }
    const result = db.prepare(`
    UPDATE tasks 
    SET title = COALESCE(?, title), 
        description = COALESCE(?, description), 
        category = COALESCE(?, category), 
        due_date = COALESCE(?, due_date), 
        status = COALESCE(?, status)
    WHERE id = ? AND user_id = ?  
    `).run(
        title,
        description ,
        category,
        due_date,
        taskId,
        req.userId,
        status
    );
    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId);
    res.json(updatedTask);
});
app.delete("/tasks/:id", requireAuth, (req,res) => {
    const taskId = req.params.id;
    const result = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(taskId,req.userId);
    if(result.changes === 0){
        return res.status(404).json({error: "Task not found"});
    }
    res.json({message: "Task deleted"});
});
 app.listen(5500, () => {
console.log("Server starting.")
 });