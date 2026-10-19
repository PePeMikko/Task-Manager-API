const Database = require("better-sqlite3");

const db = new Database("./database.db");

db.exec(`
    CREATE TABLE IF NOT EXISTS users(
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT NOT NULL UNIQUE,
     password_hash TEXT NOT NULL)
`);
db.pragma("foreign_keys = ON");
db.exec(`
    CREATE TABLE IF NOT EXISTS tasks(
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT ,
    status TEXT ,
    created_at TEXT,
    due_date TEXT,
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    )
`);
module.exports = db;