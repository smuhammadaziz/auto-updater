const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");

router.post("/create/sales/:ksb_id/:sales_id", salesController.createSales);
router.get("/get/sales/:sales_id", salesController.getSaleById);
router.delete("/delete/sales/:sales_id", salesController.deleteSaleById);
router.delete(
  "/delete/sales/product/:sales_id/:ksb_id/:product_id",
  salesController.deleteProductFromSale
);
router.delete(
  "/delete/one/sales/:sales_id",
  salesController.deleteOneSalesContollerById
);
router.post("/create/sales/:sales_id", salesController.createEmptySales);
router.get(
  "/get/process/sales/:ksb_id",
  salesController.getSalesWithNonEmptyProducts
);
router.put("/sales/discount", salesController.updateSaleDiscount);
router.put("/change/count/:sales_id", salesController.changeOneProductCount);

module.exports = router;
