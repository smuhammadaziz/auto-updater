const express = require("express");
const router = express.Router();
const userAuthController = require("../controllers/userAuthController");

// User authentication routes
router.post("/login/:id", userAuthController.login);
router.post("/check-password", userAuthController.checkPassword);
router.post("/set-password", userAuthController.setPassword);
router.post("/authenticate", userAuthController.authenticate);

module.exports = router;
