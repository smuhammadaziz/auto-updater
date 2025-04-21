const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

const { v4: uuidv4 } = require("uuid");

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      summa TEXT DEFAULT '3000000',
      discount TEXT DEFAULT '24%',
      client_name TEXT DEFAULT 'Oddiy haridor',
      client TEXT DEFAULT '000000000-0000000-0000000-00000',
      status TEXT DEFAULT 'process',
      ksb_id TEXT,
      device_id TEXT,
      mainWarehouse TEXT,
      mainPriceType TEXT,
      mainRate TEXT,
      mainCurrency TEXT,
      mainComment TEXT,
      mainBelowCost BOOLEAN DEFAULT 0,
      date TEXT,
      cash TEXT DEFAULT '[]',
      payments TEXT DEFAULT '[]',
      products TEXT
    )`,
    (err) => {
      if (err) {
        console.error("Error creating sales table:", err.message);
      }
    }
  );
});

const salesModel = {
  upsertSale: (salesId, saleData, callback) => {
    const {
      ksb_id,
      device_id,
      discount,
      status,
      date,
      product,
      mainWarehouse,
      mainPriceType,
      mainRate,
      mainCurrency,
      mainComment,
      mainBelowCost,
      payments,
    } = saleData;

    db.get(`SELECT * FROM sales WHERE id = ?`, [salesId], (err, row) => {
      if (err) return callback(err);
      if (row) {
        const existingProducts = JSON.parse(row.products || "[]");
        const existingProductIndex = existingProducts.findIndex(
          (prod) => prod.product_id === product.product_id
        );
        let updatedSumma = Number(row.summa) || 0;
        if (existingProductIndex !== -1) {
          const existingProduct = existingProducts[existingProductIndex];
          const oldSumma = Number(existingProduct.summa) || 0;
          const salePrice = product.product_info[0]?.price[0]?.sale || 0;
          if (product.narxi !== salePrice) {
            existingProducts.push({
              ...product,
              product_warehouse: product.product_warehouse || null,
              product_currency: product.product_currency || null,
              id: uuidv4(),
            });
            updatedSumma += Number(product.summa);
          } else {
            existingProducts[existingProductIndex] = {
              ...existingProduct,
              soni: Number(existingProduct.soni) + Number(product.soni),
              summa: Number(existingProduct.summa) + Number(product.summa),
              narxi: product.narxi,
              product_info: product.product_info,
              product_warehouse:
                product.product_warehouse || existingProduct.product_warehouse,
              product_currency:
                product.product_currency || existingProduct.product_currency,
            };
            const newSumma = Number(
              existingProducts[existingProductIndex].summa
            );
            updatedSumma = updatedSumma - oldSumma + newSumma;
          }
        } else {
          existingProducts.push({
            ...product,
            product_warehouse: product.product_warehouse || null,
            product_currency: product.product_currency || null,
            id: uuidv4(),
          });
          updatedSumma += Number(product.summa);
        }
        const updatedProducts = JSON.stringify(existingProducts);

        const existingPayments = JSON.parse(row.payments || "[]");
        if (payments) {
          existingPayments.push(payments);
        }
        const updatedPayments = JSON.stringify(existingPayments);

        db.run(
          `UPDATE sales SET 
            products = ?, 
            discount = ?,
            status = ?,
            ksb_id = ?,
            device_id = ?,
            date = ?,
            summa = ?, 
            mainWarehouse = ?, 
            mainPriceType = ?, 
            mainRate = ?, 
            mainCurrency = ?, 
            mainComment = ?, 
            mainBelowCost = ?, 
            payments = ?
           WHERE id = ?`,
          [
            updatedProducts,
            discount || row.discount,
            status || row.status,
            ksb_id || row.ksb_id,
            device_id || row.device_id,
            date || row.date,
            updatedSumma.toString(),
            mainWarehouse || row.mainWarehouse,
            mainPriceType || row.mainPriceType,
            mainRate || row.mainRate,
            mainCurrency || row.mainCurrency,
            mainComment || row.mainComment,
            mainBelowCost !== undefined
              ? mainBelowCost
                ? 1
                : 0
              : row.mainBelowCost,
            updatedPayments,
            salesId,
          ],
          function (updateErr) {
            if (updateErr) return callback(updateErr);
            callback(null, {
              ...row,
              products: updatedProducts,
              discount: discount,
              status: status,
              ksb_id: ksb_id,
              device_id: device_id,
              date: date,
              summa: updatedSumma,
              mainWarehouse,
              mainPriceType,
              mainRate,
              mainCurrency,
              mainComment,
              mainBelowCost,
              payments: updatedPayments,
            });
          }
        );
      } else {
        const newProducts = JSON.stringify([
          {
            ...product,
            product_warehouse: product.product_warehouse || null,
            product_currency: product.product_currency || null,
            id: uuidv4(),
          },
        ]);

        const initialPayments =
          payments && Array.isArray(payments) ? JSON.stringify(payments) : "[]";

        const newSale = {
          id: salesId,
          summa: product.summa,
          discount: "24%",
          client_name: "Oddiy haridor",
          client: "000000000-0000000-0000000-00000",
          status: "process",
          ksb_id,
          device_id,
          mainWarehouse: mainWarehouse || null,
          mainPriceType: mainPriceType || null,
          mainRate: mainRate || null,
          mainCurrency: mainCurrency || null,
          mainComment: mainComment || null,
          mainBelowCost: mainBelowCost ? 1 : 0,
          date,
          cash: "[]",
          payments: initialPayments,
          products: newProducts,
        };

        db.run(
          `INSERT INTO sales (
            id, summa, discount, client_name, client, status, 
            ksb_id, device_id, mainWarehouse, mainPriceType, 
            mainRate, mainCurrency, mainComment, mainBelowCost, 
            date, cash, payments, products
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          Object.values(newSale),
          function (insertErr) {
            if (insertErr) return callback(insertErr);
            callback(null, newSale);
          }
        );
      }
    });
  },

  getSaleById: (salesId, callback) => {
    db.get(`SELECT * FROM sales WHERE id = ?`, [salesId], (err, row) => {
      if (err) return callback(err);

      if (row) {
        let products = [];
        let payments = [];
        try {
          payments = JSON.parse(row.payments || "[]");
          products = JSON.parse(row.products || "[]");
        } catch (parseErr) {
          return callback(new Error("Failed to parse products JSON."));
        }

        const sale = { ...row, payments, products };
        callback(null, sale);
      } else {
        callback(null, null);
      }
    });
  },

  deleteSaleById: (salesId, callback) => {
    db.get(`SELECT * FROM sales WHERE id = ?`, [salesId], (err, row) => {
      if (err) return callback(err);
      if (!row) {
        return callback(null, {
          success: false,
          message: `Sale with ID ${salesId} not found.`,
        });
      }

      db.run(
        `UPDATE sales SET products = ?, summa = 0 WHERE id = ?`,
        [JSON.stringify([]), salesId],
        function (updateErr) {
          if (updateErr) return callback(updateErr);
          callback(null, {
            success: true,
            message: `Products in sale with ID ${salesId} have been cleared successfully.`,
          });
        }
      );
    });
  },

  deleteOneSalesData: (salesId, callback) => {
    db.get(`SELECT * FROM sales WHERE id = ?`, [salesId], (err, row) => {
      if (err) return callback(err);
      if (!row) {
        return callback(null, {
          success: false,
          message: `Sale with ID ${salesId} not found.`,
        });
      }

      db.run(`DELETE FROM sales WHERE id = ?`, [salesId], function (deleteErr) {
        if (deleteErr) return callback(deleteErr);
        callback(null, {
          success: true,
          message: `Sale with ID ${salesId} has been deleted successfully.`,
        });
      });
    });
  },

  deleteProductFromSale: (salesId, ksbId, productId, callback) => {
    db.get(
      `SELECT * FROM sales WHERE id = ? AND ksb_id = ?`,
      [salesId, ksbId],
      (err, row) => {
        if (err) return callback(err);
        if (!row) {
          return callback(null, {
            success: false,
            message: "Sale not found or ksb_id mismatch.",
          });
        }

        let products = JSON.parse(row.products || "[]");

        const updatedProducts = products.filter(
          (product) => product.id !== productId
        );

        if (products.length === updatedProducts.length) {
          return callback(null, {
            success: false,
            message: "Product not found in the sale.",
          });
        }

        const updatedSumma = updatedProducts.reduce(
          (total, product) => total + (product.summa || 0),
          0
        );

        db.run(
          `UPDATE sales SET products = ?, summa = ? WHERE id = ? AND ksb_id = ?`,
          [JSON.stringify(updatedProducts), updatedSumma, salesId, ksbId],
          function (updateErr) {
            if (updateErr) return callback(updateErr);
            callback(null, {
              success: true,
              message: "Product deleted successfully.",
              updatedSumma,
            });
          }
        );
      }
    );
  },
  createNewSale: (id, callback) => {
    const query = `
      INSERT INTO sales (
        id,
        summa,
        discount,
        client_name,
        client,
        status,
        ksb_id,
        device_id,
        mainWarehouse,
        mainPriceType,
        mainRate,
        mainCurrency,
        mainComment,
        mainBelowCost,
        date,
        cash,
        payments,
        products
      ) VALUES (
        ?, -- id from the request
        '0', -- Default value for summa
        '0', -- Default value for discount
        'Оддий Харидор', -- Default value for client_name
        '00000000-0000-0000-0000-000000000000', -- Default value for client
        'process', -- Default value for status
        NULL, -- ksb_id, empty
        NULL, -- device_id, empty
        NULL, -- mainWarehouse, empty
        NULL, -- mainPriceType, empty
        NULL, -- mainRate, empty
        NULL, -- mainCurrency, empty
        NULL, -- mainComment, empty
        NULL, -- mainBelowCost, default value
        NULL, -- date, empty
        NULL, -- Default value for cash
        NULL, -- Default value for payments
        NULL -- products, empty
      )
    `;

    db.run(query, [id], function (err) {
      if (err) {
        return callback(err);
      }
      callback(null, {
        success: true,
        message: `Sale with ID ${id} has been created successfully.`,
      });
    });
  },
  getSalesWithNonEmptyProducts: (ksb_id) => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM sales WHERE products IS NOT NULL AND products != '[]' AND ksb_id = ?`,
        [ksb_id],
        (err, rows) => {
          if (err) {
            return reject(new Error(`Failed to fetch sales: ${err.message}`));
          }

          try {
            const sales = rows.map((row) => ({
              ...row,
              products: JSON.parse(row.products || "[]"),
              payments: JSON.parse(row.payments || "[]"),
            }));
            resolve(sales);
          } catch (parseErr) {
            reject(new Error("Failed to parse JSON data."));
          }
        }
      );
    });
  },

  updateSaleDiscount: (salesId, newDiscount) => {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE sales SET discount = ? WHERE id = ?`,
        [newDiscount, salesId],
        function (err) {
          if (err) {
            return reject(
              new Error(`Failed to update discount: ${err.message}`)
            );
          }

          if (this.changes === 0) {
            return reject(new Error("Sale not found"));
          }

          resolve({ message: "Discount updated successfully", salesId });
        }
      );
    });
  },

  // In salesModel.js, add this new function:
  updateProductInSale: (salesId, productId, newCount) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM sales WHERE id = ?`, [salesId], (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error("Sale not found"));

        try {
          const products = JSON.parse(row.products || "[]");
          const productIndex = products.findIndex((p) => p.id === productId);

          if (productIndex === -1)
            return reject(new Error("Product not found in sale"));

          // Parse newCount to float and validate
          const count = parseFloat(newCount);
          if (isNaN(count) || count <= 0)
            return reject(new Error("Invalid count value"));

          // Calculate new summa based on count and price
          const price = parseFloat(products[productIndex].narxi);
          const newSumma = count * price;

          // Update product values
          products[productIndex].soni = count.toString();
          products[productIndex].summa = newSumma;

          // Calculate total summa for the sale
          const totalSumma = products.reduce(
            (total, product) => total + parseFloat(product.summa || 0),
            0
          );

          // Update the database with the new values
          db.run(
            `UPDATE sales SET products = ?, summa = ? WHERE id = ?`,
            [JSON.stringify(products), totalSumma.toString(), salesId],
            function (updateErr) {
              if (updateErr) return reject(updateErr);

              if (this.changes === 0)
                return reject(new Error("Failed to update sale"));

              resolve({
                message: "Product count updated successfully",
                updatedProducts: products,
                totalSumma,
              });
            }
          );
        } catch (parseErr) {
          reject(new Error("Failed to parse products JSON"));
        }
      });
    });
  },
};

module.exports = salesModel;
