const axios = require("axios");
const productModel = require("../models/productModel");
const clientModel = require("../models/clientModel");
const userSettingsModel = require("../models/userSettingsModel");
const userAuthModel = require("../models/userSettingsModel");
const userCashModel = require("../models/cashModel");

const userSettingsContoller = {
  getAllCashData: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await userCashModel.findAllCashInfo(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Cash info not found",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getAllUserSettings: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await userAuthModel.findAllUserSettings(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Cash info not found",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = userSettingsContoller;
