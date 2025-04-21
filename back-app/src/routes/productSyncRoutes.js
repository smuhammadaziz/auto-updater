const express = require("express");
const router = express.Router();
const productSyncController = require("../controllers/productSyncController");

router.post("/syncing/:ksb_id/:device_id", productSyncController.syncProducts);
module.exports = router;
