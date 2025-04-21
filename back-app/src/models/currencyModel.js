const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS currencyRate (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        ksb_id TEXT,
        uzs TEXT,
        usd TEXT,
        uzsName TEXT,
        usdName TEXT
    )`);
});

const currencyModel = {
  findAllCurrencyInfo: (device_id, ksb_id) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM currencyRate WHERE device_id = ? AND ksb_id = ?",
        [device_id, ksb_id],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  createCurrency: (deviceId, ksbId, currencyData) => {
    return new Promise((resolve, reject) => {
      if (!currencyData || currencyData.length === 0) {
        reject(new Error("No currency data provided"));
        return;
      }

      db.get(
        `SELECT * FROM currencyRate WHERE device_id = ? AND ksb_id = ?`,
        [deviceId, ksbId],
        (err, existingRow) => {
          if (err) {
            reject(err);
            return;
          }

          const userData = {
            device_id: deviceId,
            ksb_id: ksbId,
            uzs: existingRow?.uzs || "0",
            usd: existingRow?.usd || "0",
            uzsName: existingRow?.uzsName || "UZS",
            usdName: existingRow?.usdName || "USD",
          };

          currencyData.forEach((item) => {
            if (item.key === "usd") {
              userData.usd = item.rate.toString();
              userData.usdName = item.name;
            } else if (item.key === "uzs") {
              userData.uzs = item.rate.toString();
              userData.uzsName = item.name;
            }
          });

          if (!existingRow) {
            db.run(
              `INSERT INTO currencyRate 
              (device_id, ksb_id, uzs, usd, uzsName, usdName)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [
                userData.device_id,
                userData.ksb_id,
                userData.uzs,
                userData.usd,
                userData.uzsName,
                userData.usdName,
              ],
              function (err) {
                if (err) reject(err);
                else {
                  resolve(this.lastID);
                }
              }
            );
          } else {
            db.run(
              `UPDATE currencyRate 
              SET uzs = ?, usd = ?, uzsName = ?, usdName = ?
              WHERE device_id = ? AND ksb_id = ?`,
              [
                userData.uzs,
                userData.usd,
                userData.uzsName,
                userData.usdName,
                userData.device_id,
                userData.ksb_id,
              ],
              function (err) {
                if (err) reject(err);
                else {
                  resolve(existingRow.id);
                }
              }
            );
          }
        }
      );
    });
  },
};

module.exports = currencyModel;
