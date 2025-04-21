const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

const createTables = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS device (
      device_id TEXT PRIMARY KEY,
      device_info TEXT
    );`);

    db.run(`CREATE TABLE IF NOT EXISTS ksb_ids (
      ksb_id TEXT,
      device_id TEXT,
      created_date TEXT,
      entered_date TEXT,
      permission BOOLEAN DEFAULT FALSE,
      FOREIGN KEY(device_id) REFERENCES device(device_id)
    );`);
  });
};

createTables();

module.exports = db;
