const express = require("express");
const router = express.Router();
const userSettingsController = require("../controllers/getSettingsController");

// User authentication routes
router.get(
  "/get/cash/:device_id/:ksb_id",
  userSettingsController.getAllCashData
);
router.get(
  "/get/settings/:device_id/:ksb_id",
  userSettingsController.getAllUserSettings
);

module.exports = router;
