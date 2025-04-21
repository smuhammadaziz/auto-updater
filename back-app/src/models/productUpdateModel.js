const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");

let db = null;

const getDb = () => {
  if (!db) {
    db = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error("Error opening database:", err.message);
          throw err;
        }

        db.configure("busyTimeout", 30000);
      }
    );

    db.serialize(() => {
      db.run("PRAGMA foreign_keys = ON;");
      db.run("PRAGMA journal_mode = WAL;");
      db.run(`CREATE TABLE IF NOT EXISTS productData (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ksb_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        is_deleted INTEGER DEFAULT 0,
        name TEXT,
        archive INTEGER DEFAULT 0,
        symbol TEXT,
        currency TEXT,
        article TEXT,
        type TEXT,
        box INTEGER,
        stock TEXT,
        price TEXT,
        barcodes TEXT,
        product_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`);
      db.run(
        "CREATE INDEX IF NOT EXISTS idx_device_ksb ON productData(device_id, ksb_id);"
      );
    });
  }
  return db;
};

const runQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.run(query, params, function (err) {
      if (err) {
        console.error(`Error executing query: ${query}`, err);
        reject(err);
      } else {
        resolve({
          lastID: this.lastID,
          changes: this.changes,
        });
      }
    });
  });
};

const allQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    const db = getDb();
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error(`Error executing query: ${query}`, err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const productExists = async (product_id) => {
  try {
    const rows = await allQuery(
      "SELECT 1 FROM productData WHERE product_id = ? LIMIT 1",
      [product_id]
    );
    return rows.length > 0;
  } catch (err) {
    console.error("Error checking if product exists:", err);
    return false;
  }
};

const upsertProducts = async (products, ksb_id, device_id) => {
  try {
    let successCount = 0;
    let errorCount = 0;
    let newProducts = 0;
    let updatedProducts = 0;

    for (const product of products) {
      try {
        const exists = await productExists(product.product_id);

        if (exists) {
          await runQuery(
            `
            UPDATE productData SET
              ksb_id = ?,
              device_id = ?,
              is_deleted = ?,
              name = ?,
              archive = ?,
              symbol = ?,
              currency = ?,
              article = ?,
              type = ?,
              box = ?,
              stock = ?,
              price = ?,
              barcodes = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
          `,
            [
              ksb_id,
              device_id,
              product.delete ? 1 : 0,
              product.name || "",
              product.archive ? 1 : 0,
              product.symbol || "",
              product.currency || "",
              product.article || "",
              product.type || "",
              product.box || 0,
              JSON.stringify(product.stock || []),
              JSON.stringify(product.price || {}),
              JSON.stringify(product.barcode || []),
              product.product_id,
            ]
          );
          updatedProducts++;
        } else {
          await runQuery(
            `
            INSERT INTO productData (
              ksb_id, device_id, is_deleted, name, archive, symbol, currency,
              article, type, box, stock, price, barcodes, product_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              ksb_id,
              device_id,
              product.delete ? 1 : 0,
              product.name || "",
              product.archive ? 1 : 0,
              product.symbol || "",
              product.currency || "",
              product.article || "",
              product.type || "",
              product.box || 0,
              JSON.stringify(product.stock || []),
              JSON.stringify(product.price || {}),
              JSON.stringify(product.barcode || []),
              product.product_id || "",
            ]
          );
          newProducts++;
        }
        successCount++;
      } catch (err) {
        console.error(
          `Error processing product ${product?.product_id || "unknown"}:`,
          err
        );
        errorCount++;
      }
    }

    const countResult = await allQuery(
      "SELECT COUNT(*) as count FROM productData WHERE device_id = ? AND ksb_id = ?",
      [device_id, ksb_id]
    );

    const updatedProductsData = await allQuery(
      "SELECT * FROM productData WHERE device_id = ? AND ksb_id = ?",
      [device_id, ksb_id]
    );

    return {
      successCount,
      errorCount,
      newProducts,
      updatedProducts,
      totalCount: countResult[0].count,
      products: updatedProductsData,
    };
  } catch (err) {
    console.error("Error in upsertProducts:", err);
    throw err;
  }
};

const getProductsFromDb = async (ksb_id, device_id) => {
  try {
    const products = await allQuery(
      "SELECT * FROM productData WHERE ksb_id = ? AND device_id = ?",
      [ksb_id, device_id]
    );

    return products.map((product) => ({
      ...product,
      stock: JSON.parse(product.stock || "[]"),
      price: JSON.parse(product.price || "{}"),
      barcodes: JSON.parse(product.barcodes || "[]"),
      is_deleted: product.is_deleted === 1,
      archive: product.archive === 1,
    }));
  } catch (err) {
    console.error("Error fetching products:", err);
    throw err;
  }
};

const closeDb = () => {
  if (db) {
    db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed.");
      }
    });
    db = null;
  }
};

process.on("SIGINT", () => {
  closeDb();
  process.exit(0);
});

process.on("SIGTERM", () => {
  closeDb();
  process.exit(0);
});

module.exports = {
  upsertProducts,
  getProductsFromDb,
  closeDb,
};
