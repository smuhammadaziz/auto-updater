const express = require("express");
const router = express.Router();
const productUpdateController = require("../controllers/productUpdateController");

router.post(
  "/update/symbol/data/:device_id/:ksb_id",
  productUpdateController.updatingSymbols
);

router.post(
  "/update/currency/data/:device_id/:ksb_id",
  productUpdateController.updatingCurrency
);

router.post(
  "/update/price_type/data/:device_id/:ksb_id",
  productUpdateController.updatingPriceTypes
);

router.post(
  "/update/warehouse/data/:device_id/:ksb_id",
  productUpdateController.updatingWarehouse
);

router.post(
  "/update/product_update/data/:device_id/:ksb_id",
  productUpdateController.updateProductUpdate
);

router.get(
  "/get/product_update/data/:device_id/:ksb_id",
  productUpdateController.getProducts
);
module.exports = router;
