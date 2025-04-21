const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS cash (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        ksb_id TEXT,
        cash_id TEXT,
        deletable BOOLEAN,
        name TEXT,
        archive BOOLEAN
    )`);
});

const userCashModel = {
  findAllCashInfo: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM cash WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  createCash: (userData) => {
    return new Promise((resolve, reject) => {
      const { device_id, ksb_id, cash_id, deletable, name, archive } = userData;

      db.get(
        `SELECT * FROM cash WHERE device_id = ? AND ksb_id = ? AND cash_id = ?`,
        [device_id, ksb_id, cash_id],
        (err, existingRow) => {
          if (err) {
            reject(err);
            return;
          }

          if (!existingRow) {
            db.run(
              `INSERT INTO cash 
              (device_id, ksb_id, cash_id, deletable, name, archive)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [device_id, ksb_id, cash_id, deletable, name, archive],
              function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          } else {
            resolve(existingRow.id);
          }
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
        `UPDATE cash SET ${updateFields} 
                WHERE device_id = ? AND ksb_id = ?`,
        values,
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },
};

module.exports = userCashModel;
