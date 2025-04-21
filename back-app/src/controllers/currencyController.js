const currencyModel = require("../models/currencyModel");

const getCurrencyData = {
  getAllCurrency: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const activeUsers = await currencyModel.findAllCurrencyInfo(
        device_id,
        ksb_id
      );

      res.status(200).json(...activeUsers);
    } catch (error) {
      console.error("Error retrieving active users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = getCurrencyData;
