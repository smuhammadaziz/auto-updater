const salesModel = require("../models/salesModel");
const { v4: uuidv4 } = require("uuid");

const salesController = {
  createSales: async (req, res) => {
    try {
      const { ksb_id, sales_id } = req.params;
      const {
        device_id,
        product_id,
        product_name,
        count,
        price,
        total_price,
        product_info,
        product_warehouse,
        product_currency,
        mainWarehouse,
        mainPriceType,
        mainRate,
        mainCurrency,
        mainComment,
        mainBelowCost,
        cash,
        currency,
        sum,
      } = req.body;

      const newProduct = {
        product_id,
        product_name,
        product_warehouse,
        product_currency,
        soni: count,
        narxi: price,
        summa: total_price,
        product_info,
      };

      const payments =
        cash && currency && sum
          ? {
              cash,
              currency,
              sum,
            }
          : null;

      const saleData = {
        ksb_id,
        device_id,
        date: new Date().toISOString(),
        product: newProduct,
        mainWarehouse,
        mainPriceType,
        mainRate,
        mainCurrency,
        mainComment,
        mainBelowCost,
        payments,
      };

      salesModel.upsertSale(sales_id, saleData, (err, sale) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to process sale", details: err.message });
        }
        res.status(201).json(sale);
      });

      const io = req.app.get("io");

      io.emit("gettingSoldProducts");
    } catch (error) {
      console.error("Error handling sale:", error);
      res.status(500).json({
        error: "Failed to process sale",
        details: error.message,
      });
    }
  },

  getSaleById: (req, res) => {
    try {
      const { sales_id } = req.params;

      salesModel.getSaleById(sales_id, (err, sale) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to fetch sale", details: err.message });
        }

        if (sale) {
          res.json({ [sales_id]: sale });
        } else {
          res.status(404).json({ error: "Sale not found" });
        }
      });
    } catch (error) {
      console.error("Error fetching sale:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch sale", details: error.message });
    }
  },

  deleteSaleById: (req, res) => {
    try {
      const { sales_id } = req.params;

      salesModel.deleteSaleById(sales_id, (err, result) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to delete sale", details: err.message });
        }

        if (result.success) {
          res.json({ message: result.message });

          const io = req.app.get("io");

          io.emit("gettingSoldProducts");
        } else {
          res.status(404).json({ error: result.message });
        }
      });
    } catch (error) {
      console.error("Error deleting sale:", error);
      res
        .status(500)
        .json({ error: "Failed to delete sale", details: error.message });
    }
  },

  deleteOneSalesContollerById: (req, res) => {
    try {
      const { sales_id } = req.params;

      salesModel.deleteOneSalesData(sales_id, (err, result) => {
        if (err) {
          return res.status(500).json({
            error: "Failed to delete single sale row",
            details: err.message,
          });
        }

        if (result.success) {
          const io = req.app.get("io");

          io.emit("gettingProcessSales");
          res.json({ message: result.message });
        } else {
          res.status(404).json({ error: result.message });
        }
      });
    } catch (error) {
      console.error("Error deleting one sale:", error);
      res
        .status(500)
        .json({ error: "Failed to delete one sale", details: error.message });
    }
  },

  deleteProductFromSale: (req, res) => {
    try {
      const { sales_id, ksb_id, product_id } = req.params;

      salesModel.deleteProductFromSale(
        sales_id,
        ksb_id,
        product_id,
        (err, result) => {
          if (err) {
            return res.status(500).json({
              error: "Failed to delete product from sale",
              details: err.message,
            });
          }

          if (result.success) {
            const io = req.app.get("io");

            io.emit("gettingSoldProducts");
            res.json({ message: result.message });
          } else {
            res.status(404).json({ error: result.message });
          }
        }
      );
    } catch (error) {
      console.error("Error deleting product from sale:", error);
      res.status(500).json({
        error: "Failed to delete product from sale",
        details: error.message,
      });
    }
  },

  createEmptySales: (req, res) => {
    try {
      const { sales_id } = req.params;

      salesModel.createNewSale(sales_id, (err, result) => {
        if (err) {
          return res.status(500).json({
            error: "Failed to create empty sales",
            details: err.message,
          });
        }

        if (result.success) {
          const io = req.app.get("io");

          io.emit("gettingSoldProducts");
          res.json({ message: result.message });
        } else {
          res.status(404).json({ error: result.message });
        }
      });
    } catch (error) {
      console.error("Error deleting one sale:", error);
      res
        .status(500)
        .json({ error: "Failed to delete one sale", details: error.message });
    }
  },
  getSalesWithNonEmptyProducts: async (req, res) => {
    try {
      const { ksb_id } = req.params;
      const sales = await salesModel.getSalesWithNonEmptyProducts(ksb_id);
      if (sales.length > 0) {
        const io = req.app.get("io");

        io.emit("gettingSoldProducts");
        res.json(sales);
      } else {
        res.status(200).json([]);
      }
    } catch (error) {
      console.error("Error fetching sales:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch sales", details: error.message });
    }
  },

  updateSaleDiscount: async (req, res) => {
    const { salesId, newDiscount } = req.body;

    try {
      const response = await salesModel.updateSaleDiscount(
        salesId,
        newDiscount
      );

      const io = req.app.get("io");

      io.emit("gettingSoldProducts");

      res.json(response);
    } catch (error) {
      console.error("Error updating discount:", error);
    }
  },

  changeOneProductCount: async (req, res) => {
    const { sales_id } = req.params;
    const { product_id, newCount } = req.body;

    try {
      // Get the sale directly by sales_id, no need for ksb_id
      const salePromise = new Promise((resolve, reject) => {
        salesModel.getSaleById(sales_id, (err, sale) => {
          if (err) return reject(err);
          if (!sale) return reject(new Error("Sale not found"));
          resolve(sale);
        });
      });

      const sale = await salePromise;

      if (!sale || !sale.products || !Array.isArray(sale.products)) {
        return res.status(400).json({ message: "Invalid sales data" });
      }

      // Update the product count and summa in the database
      const result = await salesModel.updateProductInSale(
        sales_id,
        product_id,
        newCount
      );

      // Emit socket event to notify clients
      const io = req.app.get("io");
      io.emit("gettingSoldProducts");

      res.status(200).json({
        message: "Product count updated",
        updatedData: {
          ...sale,
          products: result.updatedProducts,
          summa: result.totalSumma.toString(),
        },
      });
    } catch (err) {
      console.error("Error changing product count:", err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  },
};

module.exports = salesController;
