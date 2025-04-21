const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../storage.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
  }
});

db.configure("busyTimeout", 30000);

db.run("PRAGMA journal_mode = WAL;", (err) => {
  if (err) {
    console.error("Error setting journal mode to WAL:", err.message);
  } else {
    console.log("Journal mode set to WAL.");
  }
});

const createTables = () => {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ksb_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        client_data TEXT NOT NULL,
        client_total_count INTEGER NOT NULL,
        CONSTRAINT unique_ksb_device UNIQUE (ksb_id, device_id)
      )`
    );

    db.run(
      `CREATE INDEX IF NOT EXISTS idx_ksb_device ON clients (ksb_id, device_id)`
    );
  });
};

createTables();

const insertOrUpdateClientData = (ksbId, deviceId, clientData) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      db.get(
        `SELECT * FROM clients WHERE ksb_id = ? AND device_id = ?`,
        [ksbId, deviceId],
        (err, row) => {
          if (err) {
            console.error("Error checking existing record:", err);
            db.run("ROLLBACK");
            reject(err);
            return;
          }

          const query = row
            ? `UPDATE clients SET client_data = ?, client_total_count = ? WHERE ksb_id = ? AND device_id = ?`
            : `INSERT INTO clients (client_data, client_total_count, ksb_id, device_id) VALUES (?, ?, ?, ?)`;

          const params = [clientData.data, clientData.total, ksbId, deviceId];

          db.run(query, params, function (err) {
            if (err) {
              console.error("Error in database operation:", err);
              db.run("ROLLBACK");
              reject(err);
              return;
            }

            db.get(
              `SELECT * FROM clients WHERE ksb_id = ? AND device_id = ?`,
              [ksbId, deviceId],
              (err, result) => {
                if (err) {
                  db.run("ROLLBACK");
                  reject(err);
                  return;
                }
                db.run("COMMIT", (err) => {
                  if (err) {
                    db.run("ROLLBACK");
                    reject(err);
                  } else {
                    resolve(result);
                  }
                });
              }
            );
          });
        }
      );
    });
  });
};

const getClientData = (ksbId, deviceId) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT client_data FROM clients WHERE ksb_id = ? AND device_id = ?`,
      [ksbId, deviceId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (!row) {
          resolve(null);
          return;
        }

        try {
          const parsedData = JSON.parse(row.client_data);
          resolve(parsedData);
        } catch (parseErr) {
          reject(parseErr);
        }
      }
    );
  });
};

const deleteClient = (ksb_id, device_id, client_id, callback) => {
  db.get(
    "SELECT client_data, client_total_count FROM clients WHERE ksb_id = ? AND device_id = ?",
    [ksb_id, device_id],
    (err, row) => {
      if (err) return callback(err, null);
      if (!row) return callback(null, { message: "Client not found" });

      let clientData;
      let newClients = [];
      try {
        clientData = JSON.parse(row.client_data);

        if (!Array.isArray(clientData)) {
          return callback(new Error("client_data is not an array"), null);
        }
      } catch (error) {
        return callback(error, null);
      }

      const clientIndex = clientData.findIndex(
        (client) => client.client_id === client_id
      );

      if (clientData[clientIndex]) {
        clientData[clientIndex].delete = true;
      } else {
        console.error(`Invalid index: ${clientIndex}`);
      }

      if (clientIndex === -1) {
        return callback(null, { message: "Client ID not found" });
      }

      clientData[clientIndex].delete = true;

      const updatedCount = clientData.filter((client) => !client.delete).length;

      const removedClients = clientData.filter(
        (client) => client.client_id === client_id
      );

      const updatedClients = clientData.filter(
        (client) => client.client_id !== client_id
      );

      db.run(
        "UPDATE clients SET client_data = ?, client_total_count = ? WHERE ksb_id = ? AND device_id = ?",
        [JSON.stringify(updatedClients), updatedCount, ksb_id, device_id],
        (updateErr) => {
          if (updateErr) return callback(updateErr, null);
          callback(null, { message: "Client deleted successfully" });
        }
      );
    }
  );
};

module.exports = {
  db,
  insertOrUpdateClientData,
  getClientData,
  deleteClient,
};
