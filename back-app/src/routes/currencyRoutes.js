const express = require("express");
const router = express.Router();
const currencyController = require("../controllers/currencyController");

router.get(
  "/get/currency/rate/:device_id/:ksb_id",
  currencyController.getAllCurrency
);

module.exports = router;
