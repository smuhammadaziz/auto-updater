const axios = require("axios");
const productModel = require("../models/productModel");
const clientModel = require("../models/clientModel");
const userSettingsModel = require("../models/userSettingsModel");
const userAuthModel = require("../models/userSettingsModel");
const userCashModel = require("../models/cashModel");
const currencyModel = require("../models/currencyModel");
const settingsDeviceModel = require("../models/userSettingsDeviceModel");
const {
  upsertProducts,
  getProductsFromDb,
} = require("../models/productUpdateModel");

const productUpdateController = {
  updatingSymbols: async (req, res) => {
    const { device_id, ksb_id } = req.params;
    const {
      "ipaddress:port": ipAddressPort,
      database,
      userName,
      userPassword,
    } = req.body;

    const baseUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/symbol/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`;
    const removeUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/remove/ksb?text=pos`;

    const removedItemsList = [];

    try {
      const authHeader = Buffer.from(`${userName}:${userPassword}`).toString(
        "base64"
      );

      const response = await axios.get(baseUrl, {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      if (response.data?.item) {
        removedItemsList.push(...response.data.item);
      }

      await productModel.upsertSymbols(device_id, ksb_id, response?.data);

      //   await fetch(removeUrl, {
      //     method: "POST",
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization:
      //         "Basic " +
      //         Buffer.from(`${userName}:${userPassword}`).toString("base64"),
      //     },
      //     body: JSON.stringify({
      //       ksb_id,
      //       device_id,
      //       removed_items: removedItemsList,
      //     }),
      //   });

      //   console.log(await removedAPI.json());

      const io = req.app.get("io");

      io.emit("updatingSymbols");

      res.json("Change successfully");
    } catch (err) {
      console.error("Error when updating symbol data in table:", err.message);
      res.status(500).json({ error: "Failed to update symbol data" });
    }
  },
  updatingCurrency: async (req, res) => {
    const { device_id, ksb_id } = req.params;
    const {
      "ipaddress:port": ipAddressPort,
      database,
      userName,
      userPassword,
    } = req.body;

    const baseUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/currency/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`;
    const removeUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/remove/ksb?text=pos`;

    const removedItemsList = [];

    try {
      const authHeader = Buffer.from(`${userName}:${userPassword}`).toString(
        "base64"
      );

      const response = await axios.get(baseUrl, {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      if (response.data?.item) {
        removedItemsList.push(...response.data.item);
      }

      await productModel.upsertCurrencies(device_id, ksb_id, response?.data);

      const io = req.app.get("io");

      io.emit("updatingCurrencies");

      res.json("Change successfully");
    } catch (err) {
      console.error("Error when updating symbol data in table:", err.message);
      res.status(500).json({ error: "Failed to update symbol data" });
    }
  },
  updatingPriceTypes: async (req, res) => {
    const { device_id, ksb_id } = req.params;
    const {
      "ipaddress:port": ipAddressPort,
      database,
      userName,
      userPassword,
    } = req.body;

    const baseUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/price_type/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`;
    const removeUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/remove/ksb?text=pos`;

    const removedItemsList = [];

    try {
      const authHeader = Buffer.from(`${userName}:${userPassword}`).toString(
        "base64"
      );

      const response = await axios.get(baseUrl, {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      if (response.data?.item) {
        removedItemsList.push(...response.data.item);
      }

      await productModel.upsertPriceTypes(device_id, ksb_id, response?.data);

      const io = req.app.get("io");

      io.emit("updatingPriceType");

      res.json("Change successfully");
    } catch (err) {
      console.error("Error when updating symbol data in table:", err.message);
      res.status(500).json({ error: "Failed to update symbol data" });
    }
  },
  updatingWarehouse: async (req, res) => {
    const { device_id, ksb_id } = req.params;
    const {
      "ipaddress:port": ipAddressPort,
      database,
      userName,
      userPassword,
    } = req.body;

    const baseUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/warehouse/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`;
    const removeUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/remove/ksb?text=pos`;

    const removedItemsList = [];

    try {
      const authHeader = Buffer.from(`${userName}:${userPassword}`).toString(
        "base64"
      );

      const response = await axios.get(baseUrl, {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      });

      if (response.data?.item) {
        removedItemsList.push(...response.data.item);
      }

      await productModel.upsertWarehouses(device_id, ksb_id, response?.data);

      const io = req.app.get("io");

      io.emit("updatingWarehouse");

      res.json("Change successfully");
    } catch (err) {
      console.error("Error when updating symbol data in table:", err.message);
      res.status(500).json({ error: "Failed to update symbol data" });
    }
  },
  updateProductUpdate: async (req, res) => {
    const { device_id, ksb_id } = req.params;
    try {
      const data = await productModel.getProducts(device_id, ksb_id);
      if (!data) {
        console.log("No products found for update");
        return res
          .status(404)
          .json({ message: "No products found for update." });
      }

      const products = data.product_data;

      // Validate products data before processing
      if (!Array.isArray(products) || products.length === 0) {
        return res
          .status(400)
          .json({ message: "No valid products data provided" });
      }

      // Add retry mechanism for SQLITE_BUSY errors
      let retries = 3;
      let result;

      while (retries > 0) {
        try {
          result = await upsertProducts(products, ksb_id, device_id);
          break; // Success - exit the retry loop
        } catch (err) {
          if (err.code === "SQLITE_BUSY" && retries > 1) {
            // Wait a bit before retrying (exponential backoff)
            const delay = (4 - retries) * 1000;
            console.log(
              `Database busy, retrying in ${delay}ms... (${
                retries - 1
              } retries left)`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            retries--;
          } else {
            // Other error or out of retries, propagate the error
            throw err;
          }
        }
      }

      const io = req.app.get("io");

      io.emit("gettingAllUpdatedProductData");

      return res.status(200).json({
        message: "Products updated successfully",
        newProducts: result.newProducts,
        updatedProducts: result.updatedProducts,
        failed: result.errorCount,
        totalProducts: result.totalCount,
      });
    } catch (err) {
      console.error("Error updating products:", err);

      // Provide more specific error messages based on error code
      let errorMessage = "Internal server error";
      let statusCode = 500;

      if (err.code === "SQLITE_BUSY") {
        errorMessage = "Database is busy, please try again in a moment";
      } else if (err.code === "SQLITE_CONSTRAINT") {
        errorMessage = "Constraint violation in database";
      } else if (err.code === "SQLITE_ERROR") {
        errorMessage = "SQLite error: " + err.message;
      } else if (err.code === "ENOENT") {
        errorMessage = "Database file not found";
        statusCode = 503; // Service unavailable
      }

      return res.status(statusCode).json({
        message: errorMessage,
        error: err.message,
      });
    }
  },

  getProducts: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const products = await getProductsFromDb(ksb_id, device_id);

      return res.status(200).json({
        message: "successfully",
        count: products.length,
        products,
      });
    } catch (err) {
      console.error("Error retrieving products:", err);
      return res
        .status(500)
        .json({ message: "Failed to retrieve products", error: err.message });
    }
  },
};

module.exports = productUpdateController;
