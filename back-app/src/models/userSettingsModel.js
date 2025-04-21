const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id TEXT,
        ksb_id TEXT,
        user_id TEXT,
        usertype TEXT,
        password TEXT,
        user_name TEXT,
        warehouse TEXT,
        price_types TEXT,
        cash TEXT,
        currency TEXT,
        max_discount TEXT,
        change_price BOOLEAN,
        view_buy BOOLEAN,
        UNIQUE(device_id, ksb_id, user_id) 
    )`);
});

const userAuthModel = {
  findAllUserSettings: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM settings WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const transformedRows = rows.map((row) => ({
              ...row,
              warehouse: row.warehouse ? JSON.parse(row.warehouse) : [],
              price_types: row.price_types ? JSON.parse(row.price_types) : [],
              cash: row.cash ? JSON.parse(row.cash) : [],
            }));
            resolve(transformedRows);
          }
        }
      );
    });
  },

  findUser: (deviceId, ksbId, user_id) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM settings WHERE device_id = ? AND ksb_id = ? AND user_id = ?",
        [deviceId, ksbId, user_id],
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
        user_id,
        usertype,
        password = "",
        user_name,
        warehouse,
        price_types,
        cash,
        currency,
        max_discount,
        change_price,
        view_buy,
      } = userData;

      db.get(
        "SELECT id FROM settings WHERE device_id = ? AND ksb_id = ? AND user_id = ?",
        [device_id, ksb_id, user_id],
        (err, row) => {
          if (err) {
            reject(err);
          } else if (row) {
            // Update existing record if found
            db.run(
              `UPDATE settings SET usertype = ?, password = ?, user_name = ?, warehouse = ?, 
               price_types = ?, cash = ?, currency = ?, max_discount = ?, change_price = ?, view_buy = ?
               WHERE device_id = ? AND ksb_id = ? AND user_id = ?`,
              [
                usertype,
                password,
                user_name,
                JSON.stringify(warehouse),
                JSON.stringify(price_types),
                JSON.stringify(cash),
                currency,
                max_discount,
                device_id,
                ksb_id,
                user_id,
                change_price,
                view_buy,
              ],
              function (err) {
                if (err) reject(err);
                else resolve(this.changes);
              }
            );
          } else {
            // Insert new record if no match found
            db.run(
              `INSERT INTO settings 
              (device_id, ksb_id, user_id, usertype, password, user_name, warehouse, price_types, cash, currency, max_discount, change_price, view_buy)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                device_id,
                ksb_id,
                user_id,
                usertype,
                password,
                user_name,
                JSON.stringify(warehouse),
                JSON.stringify(price_types),
                JSON.stringify(cash),
                currency,
                max_discount,
                change_price,
                view_buy,
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

  updateUser: (deviceId, ksbId, usertype, updates) => {
    return new Promise((resolve, reject) => {
      const updateFields = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(", ");
      const values = [...Object.values(updates), deviceId, ksbId, usertype];

      db.run(
        `UPDATE settings SET ${updateFields} 
                WHERE device_id = ? AND ksb_id = ? AND usertype = ?`,
        values,
        function (err) {
          if (err) reject(err);
          else resolve(this.changes);
        }
      );
    });
  },

  upsertUserSettings: (deviceId, ksbId, userSettingsData) => {
    return new Promise((resolve, reject) => {
      if (!userSettingsData || !userSettingsData.users) {
        reject(new Error("Invalid user settings data"));
        return;
      }

      let stmtInsert;
      let stmtUpdate;

      db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
          if (err) {
            return reject(err);
          }

          try {
            stmtInsert = db.prepare(`
              INSERT INTO settings
              (device_id, ksb_id, user_id, user_name, warehouse, price_types, cash, currency, max_discount, change_price, view_buy)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            stmtUpdate = db.prepare(`
              UPDATE settings SET user_name = ?, warehouse = ?, price_types = ?, cash = ?, currency = ?, max_discount = ?, change_price = ?, view_buy = ?
              WHERE device_id = ? AND ksb_id = ? AND user_id = ?
            `);

            const promises = userSettingsData.users.map((user) => {
              return new Promise((userResolve, userReject) => {
                db.get(
                  "SELECT id FROM settings WHERE device_id = ? AND ksb_id = ? AND user_id = ?",
                  [deviceId, ksbId, user.id],
                  (err, row) => {
                    if (err) {
                      return userReject(err);
                    }

                    try {
                      if (row) {
                        stmtUpdate.run(
                          user.name,
                          JSON.stringify(user.warehouse || []),
                          JSON.stringify(user.price_type || []),
                          JSON.stringify(user.cash || []),
                          user.currency || null,
                          user.max_discount || 0,
                          user.change_price,
                          user.view_buy,
                          deviceId,
                          ksbId,
                          user.id,
                          (err) => {
                            if (err) userReject(err);
                            else userResolve();
                          }
                        );
                      } else {
                        stmtInsert.run(
                          deviceId,
                          ksbId,
                          user.id,
                          user.name,
                          JSON.stringify(user.warehouse || []),
                          JSON.stringify(user.price_type || []),
                          JSON.stringify(user.cash || []),
                          user.currency || null,
                          user.max_discount || 0,
                          user.change_price,
                          user.view_buy,
                          (err) => {
                            if (err) userReject(err);
                            else userResolve();
                          }
                        );
                      }
                    } catch (error) {
                      userReject(error);
                    }
                  }
                );
              });
            });

            Promise.all(promises)
              .then(() => {
                stmtInsert.finalize((err) => {
                  if (err) throw err;
                  stmtUpdate.finalize((err) => {
                    if (err) throw err;
                    db.run("COMMIT", (err) => {
                      if (err) {
                        db.run("ROLLBACK", () => {
                          reject(err);
                        });
                      } else {
                        resolve(userSettingsData.users.length);
                      }
                    });
                  });
                });
              })
              .catch((err) => {
                if (stmtInsert) stmtInsert.finalize();
                if (stmtUpdate) stmtUpdate.finalize();
                db.run("ROLLBACK", () => {
                  reject(err);
                });
              });
          } catch (error) {
            if (stmtInsert) stmtInsert.finalize();
            if (stmtUpdate) stmtUpdate.finalize();
            db.run("ROLLBACK", () => {
              reject(error);
            });
          }
        });
      });
    });
  },
};

module.exports = userAuthModel;
