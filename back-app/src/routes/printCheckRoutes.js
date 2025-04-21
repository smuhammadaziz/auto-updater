const express = require("express");
const router = express.Router();
const printCheckSalesController = require("../controllers/printCheck");

router.post("/print/:sales_id", printCheckSalesController.getSale);

module.exports = router;
