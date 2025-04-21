const express = require("express");
const router = express.Router();
const settingsDeviceController = require("../controllers/userSettingsDeviceController");

router.get(
  "/get/settings/device/:device_id/:ksb_id",
  settingsDeviceController.getAllUserSettingsDevice
);

module.exports = router;
