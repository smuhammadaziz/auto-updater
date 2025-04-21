const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");

router.post("/register/device", deviceController.registerDevice);
router.get(
  "/get/registered/devices/:device_id/:ksb_id",
  deviceController.gettingAllRegisteredDevices
);

module.exports = router;
