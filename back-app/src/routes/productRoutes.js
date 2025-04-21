const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");

router.post("/first/sync/:ksb_id/:device_id", productController.syncProducts);
router.post("/get/sync/:device_id/:ksb_id", productController.getProducts);

router.get(
  "/get/symbol/data/:device_id/:ksb_id/:item_id",
  productController.getSymbolData
);
router.get(
  "/get/symbol/data/:device_id/:ksb_id",
  productController.getAllSymbolData
);
router.get(
  "/get/currency/data/:device_id/:ksb_id/:item_id",
  productController.getCurrencyData
);
router.get(
  "/get/currency/data/:device_id/:ksb_id",
  productController.getAllCurrencyData
);
router.get(
  "/get/warehouse/data/:device_id/:ksb_id/:item_id",
  productController.getWarehouseData
);
router.get(
  "/get/warehouse/data/:device_id/:ksb_id",
  productController.getAllWarehourseData
);
router.get(
  "/get/price/data/:device_id/:ksb_id/:item_id",
  productController.getPriceTypeData
);
router.get(
  "/get/price/data/:device_id/:ksb_id",
  productController.getAllPriceTypeData
);

router.post("/get/one/:ksb_id/:device_id", productController.getOneProduct);

module.exports = router;
