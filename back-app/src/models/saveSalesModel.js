const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);
const productModel = require("./productUpdateModel");
const { error } = require("console");

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS savedSales (
      id TEXT PRIMARY KEY,
      ksb_id TEXT,
      device_id TEXT,
      date TEXT,
      status TEXT,
      client_id TEXT,
      client_name TEXT,
      total_price TEXT,
      details TEXT,
      products TEXT,
      payments TEXT,
      seller TEXT,
      deliverCount INTEGER DEFAULT 0,
      showError BOOLEAN DEFAULT 0,
      errorMessage TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Error creating savedSales table:", err.message);
      }
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS salesTrash (
      id TEXT PRIMARY KEY,
      ksb_id TEXT,
      device_id TEXT,
      date TEXT,
      status TEXT,
      client_id TEXT,
      client_name TEXT,
      total_price TEXT,
      details TEXT,
      products TEXT,
      payments TEXT,
      seller TEXT,
      deliverCount INTEGER DEFAULT 0,
      showError BOOLEAN DEFAULT 0,
      errorMessage TEXT,
      deleted_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    )`,
    (err) => {
      if (err) {
        console.error("Error creating salesTrash table:", err.message);
      }
    }
  );
});

const saveSalesModel = {
  getAllSavedSales: (ksb_id) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM savedSales WHERE ksb_id = ?`,
        [ksb_id],
        (err, rows) => {
          if (err) {
            return reject(err);
          }

          if (rows && rows.length > 0) {
            const sales = rows.map((row) => {
              let details = [];
              let products = [];
              let payments = [];
              try {
                details = JSON.parse(row.details || "[]");
                products = JSON.parse(row.products || "[]");
                payments = JSON.parse(row.payments || "[]");
              } catch (parseErr) {
                return reject(new Error("Failed to parse JSON data."));
              }
              return {
                ...row,
                details,
                products,
                payments,
                deliverCount: row.deliverCount || 0,
                showError: row.showError === 1,
                errorMessage: row.errorMessage || "",
              };
            });
            resolve(sales);
          } else {
            resolve([]);
          }
        }
      );
    });
  },

  createNewSales: (sales_id, salesData) => {
    return new Promise(async (resolve, reject) => {
      const {
        ksb_id,
        device_id,
        date,
        status,
        client_id,
        client_name,
        total_price,
        details,
        products,
        payments,
        seller,
      } = salesData;

      try {
        db.get(
          `SELECT * FROM savedSales WHERE id = ?`,
          [sales_id],
          async (err, existingSale) => {
            if (err) {
              return reject(err);
            }

            let finalDetails = details;
            let finalProducts = products;
            let finalPayments = payments;

            if (products && products.length > 0) {
              try {
                const dbProducts = await productModel.getProductsFromDb(
                  ksb_id,
                  device_id
                );

                for (const saleProduct of products) {
                  const dbProduct = dbProducts.find(
                    (p) => p.product_id === saleProduct.product
                  );

                  if (dbProduct) {
                    const updatedStock = dbProduct.stock.map((stockItem) => {
                      if (stockItem.warehouse === saleProduct.warehouse) {
                        const newQty =
                          parseFloat(stockItem.qty) -
                          parseFloat(saleProduct.quantity);
                        return {
                          ...stockItem,
                          qty: newQty >= 0 ? newQty : 0,
                        };
                      }
                      return stockItem;
                    });

                    await productModel.upsertProducts(
                      [
                        {
                          ...dbProduct,
                          stock: updatedStock,
                          product_id: dbProduct.product_id,
                        },
                      ],
                      ksb_id,
                      device_id
                    );
                  }
                }
              } catch (stockUpdateError) {
                console.error(
                  "Error updating product stock:",
                  stockUpdateError
                );
              }
            }

            if (existingSale) {
              const existingDetails = JSON.parse(existingSale.details || "[]");
              const existingProducts = JSON.parse(
                existingSale.products || "[]"
              );
              const existingPayments = JSON.parse(
                existingSale.payments || "[]"
              );

              finalDetails = [details[0]];

              finalProducts = products.reduce(
                (acc, newProduct) => {
                  const existingIndex = existingProducts.findIndex(
                    (ep) => ep.product === newProduct.product
                  );

                  if (existingIndex > -1) {
                    acc[existingIndex] = {
                      ...existingProducts[existingIndex],
                      ...newProduct,
                    };
                  } else {
                    acc.push(newProduct);
                  }
                  return acc;
                },
                [...existingProducts]
              );

              db.run(
                `UPDATE savedSales 
               SET ksb_id = ?, device_id = ?, date = ?, status = ?,
                   client_id = ?, client_name = ?, total_price = ?,
                   details = ?, products = ?, payments = ?, seller = ?
               WHERE id = ?`,
                [
                  ksb_id,
                  device_id,
                  date,
                  status,
                  client_id,
                  client_name,
                  total_price,
                  JSON.stringify(finalDetails),
                  JSON.stringify(finalProducts),
                  JSON.stringify(finalPayments),
                  seller,
                  sales_id,
                ],
                (err) => {
                  if (err) return reject(err);
                  resolve({
                    id: sales_id,
                    message: "Sale updated successfully",
                  });
                }
              );
            } else {
              db.run(
                `INSERT INTO savedSales (
                id, ksb_id, device_id, date, status, client_id,
                client_name, total_price, details, products, payments, seller
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  sales_id,
                  ksb_id,
                  device_id,
                  date,
                  status,
                  client_id,
                  client_name,
                  total_price,
                  JSON.stringify([details[0]]),
                  JSON.stringify(products),
                  JSON.stringify(payments),
                  seller,
                ],
                (err) => {
                  if (err) return reject(err);
                  resolve({
                    id: sales_id,
                    message: "Sale created successfully",
                  });
                }
              );
            }
          }
        );
      } catch (error) {
        reject(error);
      }
    });
  },

  getSaleById: (sales_id) => {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM savedSales WHERE id = ?",
        [sales_id],
        (err, row) => {
          if (err) return reject(err);
          if (!row) return resolve(null);

          row.details = JSON.parse(row.details || "[]");
          row.products = JSON.parse(row.products || "[]");
          row.payments = JSON.parse(row.payments || "[]");

          resolve(row);
        }
      );
    });
  },

  deleteOneTrashSale: (salesId, callback) => {
    db.get(`SELECT * FROM salesTrash WHERE id = ?`, [salesId], (err, row) => {
      if (err) return callback(err);
      if (!row) {
        return callback(null, {
          success: false,
          message: `Sale with ID ${salesId} not found.`,
        });
      }

      db.run(
        `DELETE FROM salesTrash WHERE id = ?`,
        [salesId],
        function (deleteErr) {
          if (deleteErr) return callback(deleteErr);
          callback(null, {
            success: true,
            message: `Sale with ID ${salesId} has been deleted successfully.`,
          });
        }
      );
    });
  },
};

module.exports = saveSalesModel;
