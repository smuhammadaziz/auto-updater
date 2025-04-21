const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

const passwordModel = {
  findUserByUsertype: (usertype) => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE usertype = ?`,
        [usertype],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  },

  updateUserPassword: (usertype, hashedPassword) => {
    return new Promise((resolve, reject) => {
      const currentTime = new Date().toISOString();
      db.run(
        `UPDATE users 
         SET password = ?, 
             date = ?
         WHERE usertype = ?`,
        [hashedPassword, currentTime, usertype],
        function (err) {
          if (err) reject(err);
          else resolve(this.changes > 0);
        }
      );
    });
  },

  hashPassword: async (password) => {
    return await bcrypt.hash(password, 10);
  },

  comparePassword: async (inputPassword, storedPassword) => {
    return await bcrypt.compare(inputPassword, storedPassword);
  },
};

module.exports = passwordModel;
