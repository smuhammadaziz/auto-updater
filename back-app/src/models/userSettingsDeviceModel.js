const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS settingsDevice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        ksb_id TEXT,
        format TEXT,
        box BOOLEAN,
        one_row BOOLEAN,
        one_qty BOOLEAN,
        change_price BOOLEAN,
        change_sum BOOLEAN,
        maxReturnedSum TEXT,
        auto_print BOOLEAN,
        time_print TEXT,
        UNIQUE(device_id, ksb_id) 
    )`);
});

const settingsDeviceModel = {
  findAllUserSettings: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM settingsDevice WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else {
            if (rows) {
              if (rows.format) {
                rows.format = JSON.parse(rows.format);
              }
              resolve(rows);
            } else {
              resolve([]);
            }
          }
        }
      );
    });
  },

  findDeviceSettings: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM settingsDevice WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, row) => {
          if (err) reject(err);
          else {
            if (row) row.format = row.format ? JSON.parse(row.format) : {};
            resolve(row);
          }
        }
      );
    });
  },

  upsertUserSettings: (deviceId, ksbId, userSettingsData) => {
    return new Promise((resolve, reject) => {
      if (!userSettingsData) {
        reject(new Error("Invalid user settings data"));
        return;
      }

      db.get(
        "SELECT id FROM settingsDevice WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, row) => {
          if (err) {
            reject(err);
            return;
          }

          const timePrintValue =
            userSettingsData.time_print === 0
              ? "0"
              : String(userSettingsData.time_print);

          if (row) {
            // If a row exists, update it
            db.run(
              `UPDATE settingsDevice SET 
              format = ?, box = ?, one_row = ?, one_qty = ?, 
              change_price = ?, change_sum = ?, maxReturnedSum = ?, 
              auto_print = ?, time_print = ?
              WHERE device_id = ? AND ksb_id = ?`,
              [
                JSON.stringify(userSettingsData.format || {}),
                userSettingsData.box || false,
                userSettingsData.one_row || false,
                userSettingsData.one_qty || false,
                userSettingsData.change_price || false,
                userSettingsData.change_sum || false,
                userSettingsData.maxReturnedSum || "",
                userSettingsData.auto_print || false,
                timePrintValue,
                deviceId,
                ksbId,
              ],
              function (err) {
                if (err) reject(err);
                else resolve(this.changes);
              }
            );
          } else {
            // If no row exists, insert a new one
            db.run(
              `INSERT INTO settingsDevice
              (device_id, ksb_id, format, box, one_row, one_qty, change_price, change_sum, maxReturnedSum, auto_print, time_print)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                deviceId,
                ksbId,
                JSON.stringify(userSettingsData.format || {}),
                userSettingsData.box || false,
                userSettingsData.one_row || false,
                userSettingsData.one_qty || false,
                userSettingsData.change_price || false,
                userSettingsData.change_sum || false,
                userSettingsData.maxReturnedSum || "",
                userSettingsData.auto_print || false,
                timePrintValue,
              ],
              function (err) {
                if (err) reject(err);
                else resolve(this.lastID);
              }
            );
          }
        }
      );
    });
  },
};

module.exports = settingsDeviceModel;
