const express = require("express");
const router = express.Router();
const pingController = require("../controllers/pingController");

router.post("/check/ping/:ksb_id", pingController.checkPing);
router.post("/recovery/data/:ksb_id/:device_id", pingController.recoveryData);

module.exports = router;
