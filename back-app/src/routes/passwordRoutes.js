const express = require("express");
const router = express.Router();
const passwordController = require("../controllers/passwordController");

router.post("/change", passwordController.changePassword);

module.exports = router;
