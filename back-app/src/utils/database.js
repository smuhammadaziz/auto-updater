// back-app/src/utils/database.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");

// Use the environment variable set in server.js
const dbPath =
  process.env.DATABASE_PATH || path.join(__dirname, "..", "storage.db");

// Ensure the directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create or connect to the database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`Error connecting to database at ${dbPath}:`, err.message);
  } else {
    console.log(`Connected to database at ${dbPath}`);
  }
});

module.exports = db;
