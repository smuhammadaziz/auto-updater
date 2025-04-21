const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS registered_device (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_name TEXT,
    ksb_id TEXT,
    device_id TEXT,
    user_type TEXT,
    device_registered_time TEXT,
    user_id TEXT,
    UNIQUE(ksb_id, device_id, user_id)
  )`);
});

const deviceModel = {
  registerDevice: (deviceData) => {
    return new Promise((resolve, reject) => {
      const {
        device_name,
        ksb_id,
        device_id,
        user_type,
        device_registered_time,
        user_id,
      } = deviceData;

      db.run(
        `INSERT INTO registered_device 
        (device_name, ksb_id, device_id, user_type, device_registered_time, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(ksb_id, device_id, user_id) DO NOTHING`,
        [
          device_name,
          ksb_id,
          device_id,
          user_type,
          device_registered_time,
          user_id,
        ],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  getDevice: (deviceId, ksbId, user_id) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM registered_device WHERE device_id = ? AND ksb_id = ? AND user_id = ?",
        [deviceId, ksbId, user_id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  getAllDevices: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM registered_device WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },
};

module.exports = deviceModel;
