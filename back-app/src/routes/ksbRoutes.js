const express = require("express");
const router = express.Router();
const ksbIdController = require("../controllers/ksbIdController");

router.get("/:id", ksbIdController);

module.exports = router;
