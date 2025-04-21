const db = require("../models/ksbModel");
const axios = require("axios");
const os = require("os");
const { v4: uuidv4 } = require("uuid");

module.exports = async (req, res) => {
  let storage = {};

  try {
    let { id: ksb_id } = req.params;
    const username = "Pos";
    const password = "xqZrj8Nt";
    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );

    const computerName = os.hostname();
    const osType = os.type();
    const deviceInfo = `${computerName}_${osType}`;

    let device_id;
    await new Promise((resolve, reject) => {
      db.get(
        "SELECT device_id FROM device WHERE device_info = ?",
        [deviceInfo],
        async (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              device_id = row.device_id;
            } else {
              device_id = uuidv4();
              await new Promise((resolve, reject) => {
                db.run(
                  "INSERT INTO device (device_id, device_info) VALUES (?, ?)",
                  [device_id, deviceInfo],
                  function (err) {
                    if (err) reject(err);
                    else resolve();
                  }
                );
              });
            }

            db.get(
              "SELECT * FROM ksb_ids WHERE ksb_id = ? AND device_id = ?",
              [ksb_id, device_id],
              async (err, row) => {
                if (err) {
                  reject(err);
                } else {
                  if (!row) {
                    const currentTime = new Date().toISOString();
                    await new Promise((resolve, reject) => {
                      db.run(
                        "INSERT INTO ksb_ids (ksb_id, device_id, created_date, entered_date, permission) VALUES (?, ?, ?, ?, ?)",
                        [ksb_id, device_id, currentTime, currentTime, false],
                        function (err) {
                          if (err) reject(err);
                          else resolve();
                        }
                      );
                    });
                  } else {
                    await new Promise((resolve, reject) => {
                      db.run(
                        "UPDATE ksb_ids SET permission = ? WHERE ksb_id = ? AND device_id = ?",
                        [true, ksb_id, device_id],
                        function (err) {
                          if (err) reject(err);
                          else resolve();
                        }
                      );
                    });
                  }

                  const response = await axios.get(
                    `http://crm.ksbapps.uz:20151/KSB_CRM/hs/workplace/ksb-info/${ksb_id}`,
                    {
                      headers: { Authorization: `Basic ${credentials}` },
                    }
                  );

                  if (
                    response.status === 200 &&
                    response.data.status === "successfully"
                  ) {
                    db.all(
                      "SELECT * FROM ksb_ids WHERE device_id = ?",
                      [device_id],
                      (err, rows) => {
                        if (err) {
                          throw err;
                        }
                        storage[device_id] = rows.map((row) => ({
                          ksb_id: row.ksb_id,
                          device_id: row.device_id,
                          device_info: deviceInfo,
                          created_date: row.created_date,
                          entered_date: row.entered_date,
                          permission: row.permission,
                        }));

                        res.json({
                          response: response.data,
                          storage: {
                            [device_id]: storage[device_id],
                          },
                        });
                      }
                    );
                  } else {
                    res.status(response.status).json(response.data);
                  }
                  resolve();
                }
              }
            );
          }
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
