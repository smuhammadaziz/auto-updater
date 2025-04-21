const axios = require("axios");
const productModel = require("../models/productModel");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

const removeController = {
  getRemovedItem: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await productModel.getRemovedItems(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Removed items not found",
        });
      }

      res.json(result.removed_items);
    } catch (error) {
      console.error("Error retrieving products:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  removeItems: async (req, res) => {
    try {
      const { ksb_id, device_id } = req.params;
      const {
        "ipaddress:port": ipAddressPort,
        database,
        userName,
        userPassword,
      } = req.body;

      const removedItems = await productModel.getRemovedItems(
        device_id,
        ksb_id
      );

      if (!removedItems || !removedItems.removed_items) {
        return res.status(404).json({ message: "No items found to remove." });
      }

      const removeUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/remove/ksb?text=pos`;

      const response = await fetch(removeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(`${userName}:${userPassword}`).toString("base64"),
        },
        body: JSON.stringify({
          ksb_id,
          device_id,
          removed_items: removedItems.removed_items,
        }),
      });

      const data = await response.json();

      if (data.status === "successfully") {
        db.run(
          `DELETE FROM removed WHERE device_id = ? AND ksb_id = ?`,
          [device_id, ksb_id],
          function (err) {
            if (err) {
              return res
                .status(500)
                .json({ message: "Error deleting data from database." });
            }
            return res.status(200).json({
              message:
                "Successfully removed items and deleted from the database.",
              time: data.date,
            });
          }
        );
      } else {
        return res.status(400).json({
          message: "Failed to remove items from the external service.",
        });
      }
    } catch (error) {
      console.error("Error in removeItems API:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  },
  sendDataToRemoveAPI: async (req, res) => {
    const { ksb_id, device_id } = req.params;
    const {
      "ipaddress:port": ipAddressPort,
      database,
      userName,
      userPassword,
    } = req.body;

    try {
      const removeUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/remove/ksb?text=pos`;

      const response = await fetch(removeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(`${userName}:${userPassword}`).toString("base64"),
        },
        body: JSON.stringify({
          ksb_id,
          device_id,
          removed_items: [],
        }),
      });

      const data = await response.json();

      console.log(data);

      res.json({
        status: data.status,
        time: data?.date,
      });
    } catch (err) {
      console.error("Error in sendDataToRemoveAPI:", err);
    }
  },
};

module.exports = removeController;
