const express = require("express");
const router = express.Router();
const saveSalesController = require("../controllers/saveSalesController");

router.post("/sales", saveSalesController.createOrUpdateSale);
router.get("/sales/:id", saveSalesController.getSale);
router.get("/all/sales/:ksb_id", saveSalesController.getAllSavedSalesFunc);
router.post("/send/sales/:ksb_id", saveSalesController.sendSalesToAPI);
router.post("/send/one/sale", saveSalesController.sendOneSaleToAPI);
router.delete(
  "/delete/saved/sales/:sales_id",
  saveSalesController.deleteSaleFromTable
);
router.get("/trash/sales/:ksb_id", saveSalesController.getAllTrashedSales);
router.delete(
  "/delete/trash/sales/:sales_id",
  saveSalesController.deleteOneTrashSalesContollerById
);

module.exports = router;
