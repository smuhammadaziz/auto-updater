const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Existing products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    ksb_id TEXT,
    product_data TEXT,
    all_product_count INTEGER,
    UNIQUE(device_id, ksb_id)
  )`);

  // Updated Symbol table
  db.run(`CREATE TABLE IF NOT EXISTS symbols (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT,
    name TEXT,
    archive BOOLEAN,
    device_id TEXT,
    ksb_id TEXT
  )`);

  // Updated Warehouse table
  db.run(`CREATE TABLE IF NOT EXISTS warehouses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT,
    name TEXT,
    archive BOOLEAN,
    device_id TEXT,
    ksb_id TEXT
  )`);

  // Updated Price Type table
  db.run(`CREATE TABLE IF NOT EXISTS price_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT,
    name TEXT,
    archive BOOLEAN,
    productByCurrency BOOLEAN,
    currency TEXT,
    device_id TEXT,
    ksb_id TEXT
  )`);

  // Updated Currency table
  db.run(`CREATE TABLE IF NOT EXISTS currencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id TEXT,
    name TEXT,
    archive BOOLEAN,
    key TEXT,
    rate REAL,
    device_id TEXT,
    ksb_id TEXT
  )`);

  // Updated Removed Items table
  db.run(`CREATE TABLE IF NOT EXISTS removed (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    ksb_id TEXT,
    removed_items TEXT
  )`);
});

const productModel = {
  upsertRemovedItems: (device_id, ksb_id, removed_items) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM removed WHERE device_id = ? AND ksb_id = ?`,
        [device_id, ksb_id],
        (err, row) => {
          if (err) {
            return reject(err);
          }

          if (row) {
            db.run(
              `UPDATE removed SET removed_items = ? WHERE id = ?`,
              [JSON.stringify(removed_items), row.id],
              function (err) {
                if (err) reject(err);
                else resolve(row.id);
              }
            );
          } else {
            db.run(
              `INSERT INTO removed (device_id, ksb_id, removed_items) VALUES (?, ?, ?)`,
              [device_id, ksb_id, JSON.stringify(removed_items)],
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

  getRemovedItems: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM removed WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, row) => {
          if (err) reject(err);
          else {
            if (row) {
              row.removed_items = JSON.parse(row.removed_items);
            }
            resolve(row);
          }
        }
      );
    });
  },

  upsertProducts: (deviceId, ksbId, productData, productCount) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR REPLACE INTO products (device_id, ksb_id, product_data, all_product_count)
         VALUES (?, ?, ?, ?)`,
        [deviceId, ksbId, JSON.stringify(productData), productCount],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });
  },

  getProducts: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM products WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, row) => {
          if (err) reject(err);
          else {
            if (row) {
              row.product_data = JSON.parse(row.product_data);
            }
            resolve(row);
          }
        }
      );
    });
  },

  upsertSymbols: (deviceId, ksbId, symbolData) => {
    return new Promise((resolve, reject) => {
      const stmtInsert = db.prepare(`
        INSERT INTO symbols (item_id, name, archive, device_id, ksb_id) 
        VALUES (?, ?, ?, ?, ?)
      `);
      const stmtUpdate = db.prepare(`
        UPDATE symbols SET name = ?, archive = ? WHERE item_id = ? AND ksb_id = ? AND device_id = ?
      `);

      const promises = symbolData.item.map((item_id, index) => {
        const detail = symbolData.detail[index];
        return new Promise((innerResolve, innerReject) => {
          db.get(
            `SELECT * FROM symbols WHERE item_id = ? AND ksb_id = ? AND device_id = ?`,
            [item_id, ksbId, deviceId],
            (err, row) => {
              if (err) innerReject(err);
              if (!row) {
                stmtInsert.run(
                  item_id,
                  detail.name,
                  detail.archive,
                  deviceId,
                  ksbId,
                  (runErr) => {
                    if (runErr) innerReject(runErr);
                    else innerResolve();
                  }
                );
              } else {
                // Update only if fields have changed
                if (
                  row.name !== detail.name ||
                  row.archive !== detail.archive
                ) {
                  stmtUpdate.run(
                    detail.name,
                    detail.archive,
                    item_id,
                    ksbId,
                    deviceId,
                    (updateErr) => {
                      if (updateErr) innerReject(updateErr);
                      else innerResolve();
                    }
                  );
                } else {
                  innerResolve();
                }
              }
            }
          );
        });
      });

      Promise.all(promises)
        .then(() => {
          stmtInsert.finalize();
          stmtUpdate.finalize();
          resolve();
        })
        .catch(reject);
    });
  },

  upsertWarehouses: (deviceId, ksbId, warehouseData) => {
    return new Promise((resolve, reject) => {
      const stmtInsert = db.prepare(`
        INSERT INTO warehouses (item_id, name, archive, device_id, ksb_id) 
        VALUES (?, ?, ?, ?, ?)
      `);
      const stmtUpdate = db.prepare(`
        UPDATE warehouses SET name = ?, archive = ? WHERE item_id = ? AND ksb_id = ? AND device_id = ?
      `);

      const promises = warehouseData.item.map((item_id, index) => {
        const detail = warehouseData.detail[index];
        return new Promise((innerResolve, innerReject) => {
          db.get(
            `SELECT * FROM warehouses WHERE item_id = ? AND ksb_id = ? AND device_id = ?`,
            [item_id, ksbId, deviceId],
            (err, row) => {
              if (err) innerReject(err);
              if (!row) {
                stmtInsert.run(
                  item_id,
                  detail.name,
                  detail.archive,
                  deviceId,
                  ksbId,
                  (runErr) => {
                    if (runErr) innerReject(runErr);
                    else innerResolve();
                  }
                );
              } else {
                // Update only if fields have changed
                if (
                  row.name !== detail.name ||
                  row.archive !== detail.archive
                ) {
                  stmtUpdate.run(
                    detail.name,
                    detail.archive,
                    item_id,
                    ksbId,
                    deviceId,
                    (updateErr) => {
                      if (updateErr) innerReject(updateErr);
                      else innerResolve();
                    }
                  );
                } else {
                  innerResolve();
                }
              }
            }
          );
        });
      });

      Promise.all(promises)
        .then(() => {
          stmtInsert.finalize();
          stmtUpdate.finalize();
          resolve();
        })
        .catch(reject);
    });
  },

  upsertPriceTypes: (deviceId, ksbId, priceTypeData) => {
    return new Promise((resolve, reject) => {
      const stmtInsert = db.prepare(`
        INSERT INTO price_types (item_id, name, archive, productByCurrency, currency, device_id, ksb_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const stmtUpdate = db.prepare(`
        UPDATE price_types SET name = ?, archive = ?, productByCurrency = ?, currency = ? WHERE item_id = ? AND ksb_id = ? AND device_id = ?
      `);

      const promises = priceTypeData.item.map((item_id, index) => {
        const detail = priceTypeData.detail[index];
        return new Promise((innerResolve, innerReject) => {
          db.get(
            `SELECT * FROM price_types WHERE item_id = ? AND ksb_id = ? AND device_id = ?`,
            [item_id, ksbId, deviceId],
            (err, row) => {
              if (err) innerReject(err);
              if (!row) {
                stmtInsert.run(
                  item_id,
                  detail.name,
                  detail.archive,
                  detail.productByCurrency,
                  detail.currency,
                  deviceId,
                  ksbId,
                  (runErr) => {
                    if (runErr) innerReject(runErr);
                    else innerResolve();
                  }
                );
              } else {
                // Update only if fields have changed
                if (
                  row.name !== detail.name ||
                  row.archive !== detail.archive
                ) {
                  stmtUpdate.run(
                    detail.name,
                    detail.archive,
                    detail.productByCurrency,
                    detail.currency,
                    item_id,
                    ksbId,
                    deviceId,
                    (updateErr) => {
                      if (updateErr) innerReject(updateErr);
                      else innerResolve();
                    }
                  );
                } else {
                  innerResolve();
                }
              }
            }
          );
        });
      });

      Promise.all(promises)
        .then(() => {
          stmtInsert.finalize();
          stmtUpdate.finalize();
          resolve();
        })
        .catch(reject);
    });
  },

  upsertCurrencies: (deviceId, ksbId, currencyData) => {
    return new Promise((resolve, reject) => {
      const stmtInsert = db.prepare(`
        INSERT INTO currencies (item_id, name, archive, key, rate, device_id, ksb_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const stmtUpdate = db.prepare(`
        UPDATE currencies SET name = ?, archive = ?, key = ?, rate = ? WHERE item_id = ? AND ksb_id = ? AND device_id = ?
      `);

      const promises = currencyData.item.map((item_id, index) => {
        const detail = currencyData.detail[index];
        return new Promise((innerResolve, innerReject) => {
          db.get(
            `SELECT * FROM currencies WHERE item_id = ? AND ksb_id = ? AND device_id = ?`,
            [item_id, ksbId, deviceId],
            (err, row) => {
              if (err) innerReject(err);
              if (!row) {
                stmtInsert.run(
                  item_id,
                  detail.name,
                  detail.archive,
                  detail.key,
                  detail.rate,
                  deviceId,
                  ksbId,
                  (runErr) => {
                    if (runErr) innerReject(runErr);
                    else innerResolve();
                  }
                );
              } else {
                // Update only if fields have changed
                if (
                  row.name !== detail.name ||
                  row.archive !== detail.archive ||
                  row.key !== detail.key ||
                  row.rate !== detail.rate
                ) {
                  stmtUpdate.run(
                    detail.name,
                    detail.archive,
                    detail.key,
                    detail.rate,
                    item_id,
                    ksbId,
                    deviceId,
                    (updateErr) => {
                      if (updateErr) innerReject(updateErr);
                      else innerResolve();
                    }
                  );
                } else {
                  innerResolve();
                }
              }
            }
          );
        });
      });

      Promise.all(promises)
        .then(() => {
          stmtInsert.finalize();
          stmtUpdate.finalize();
          resolve();
        })
        .catch(reject);
    });
  },

  getSymbols: (deviceId, ksbId, itemId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM symbols WHERE device_id = ? AND ksb_id = ? AND item_id = ?",
        [deviceId, ksbId, itemId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getAllSymbols: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM symbols WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getWarehouses: (deviceId, ksbId, itemId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM warehouses WHERE device_id = ? AND ksb_id = ? AND item_id = ?",
        [deviceId, ksbId, itemId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getAllWarehouses: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM warehouses WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getPriceTypes: (deviceId, ksbId, itemId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM price_types WHERE device_id = ? AND ksb_id = ? AND item_id = ?",
        [deviceId, ksbId, itemId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getAllPriceTypes: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM price_types WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getCurrencies: (deviceId, ksbId, itemId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM currencies WHERE device_id = ? AND ksb_id = ? AND item_id = ?",
        [deviceId, ksbId, itemId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },

  getCurrencyData: (deviceId, ksbId) => {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM currencies WHERE device_id = ? AND ksb_id = ?",
        [deviceId, ksbId],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  },
};

module.exports = productModel;
