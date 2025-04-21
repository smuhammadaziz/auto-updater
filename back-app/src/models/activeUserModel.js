const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

const activeUserModel = {
  getActiveUsers: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT usertype, password, date, showSettings, authenticateCount, 
                last_entered_time, ip_address, location 
         FROM users 
         WHERE device_id = ? AND ksb_id = ? 
         AND password != '' AND authenticateCount > 0`,
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },
};

module.exports = activeUserModel;
