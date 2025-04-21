const axios = require("axios");
const productModel = require("../models/productModel");
const clientModel = require("../models/clientModel");
const userSettingsModel = require("../models/userSettingsModel");
const userAuthModel = require("../models/userSettingsModel");
const userCashModel = require("../models/cashModel");
const settingsDeviceModel = require("../models/userSettingsDeviceModel");

const settingsDeviceController = {
  getAllUserSettingsDevice: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await settingsDeviceModel.findAllUserSettings(
        device_id,
        ksb_id
      );

      if (!result) {
        return res.status(404).json({
          error: "settings devie info not found",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = settingsDeviceController;
