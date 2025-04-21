const express = require("express");
const router = express.Router();
const enterpriseInfo = require("../controllers/enterpriseController");

router.post("/enterprise/:ksb_id", enterpriseInfo.getEnterpriseInfo);
router.post("/currency/:ksb_id", enterpriseInfo.currencyInfo);

module.exports = router;
