const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        ksb_id TEXT,
        usertype TEXT,
        password TEXT,
        date TEXT,
        showSettings INTEGER DEFAULT 1,
        authenticateCount INTEGER DEFAULT 0,
        last_entered_time TEXT,
        ip_address TEXT,
        location TEXT,
        UNIQUE(device_id, ksb_id, usertype)
    )`);
});

const userAuthModel = {
  findUsers: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM users WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  findUser: (deviceId, ksbId, usertype) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE device_id = ? AND ksb_id = ? AND usertype = ?",
        [deviceId, ksbId, usertype],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  createUser: (userData) => {
    return new Promise((resolve, reject) => {
      const {
        device_id,
        ksb_id,
        usertype,
        password = "",
        date = null,
        showSettings = 1,
        authenticateCount = 0,
        last_entered_time = null,
        ip_address = null,
        location = null,
      } = userData;

      db.run(
        `INSERT OR REPLACE INTO users 
                (device_id, ksb_id, usertype, password, date, showSettings, 
                authenticateCount, last_entered_time, ip_address, location)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          device_id,
          ksb_id,
          usertype,
          password,
          date,
          showSettings,
          authenticateCount,
          last_entered_time,
          ip_address,
          location,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  updateUser: (deviceId, ksbId, usertype, updates) => {
    return new Promise((resolve, reject) => {
      const updateFields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updates), deviceId, ksbId, usertype];

      db.run(
        `UPDATE users SET ${updateFields} 
                WHERE device_id = ? AND ksb_id = ? AND usertype = ?`,
        values,
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },
};

module.exports = userAuthModel;
