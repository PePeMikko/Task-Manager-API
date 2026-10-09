const Database = require("better-sqlite3");

const db = new Database("./task.db");

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
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    )
`);
module.exports = db;