const express = require("express");
const router = express.Router();
const activeUserController = require("../controllers/activeUserController");

router.post(
  "/get/active/users/:device_name/:ksb_id",
  activeUserController.getActiveUsers
);

module.exports = router;
