const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");

router.get("/get/client/:ksbId/:deviceId", clientController.getClientByIds);
router.delete(
  "/delete/client/:ksbId/:deviceId/:clientId",
  clientController.deleteClientById
);

module.exports = router;
