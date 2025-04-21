const express = require("express");
const router = express.Router();
const removeController = require("../controllers/removeController");

router.get("/get/removed/:device_id/:ksb_id", removeController.getRemovedItem);
router.post("/remove/items/:device_id/:ksb_id", removeController.removeItems);
router.post(
  "/send/data/remove/:ksb_id/:device_id",
  removeController.sendDataToRemoveAPI
);

module.exports = router;
