const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");

router.post("/permission/:ksb_id/:device_id", permissionController);

module.exports = router;
