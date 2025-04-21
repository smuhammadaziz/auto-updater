const salesModel = require("../models/salesModel");
const saveSalesModel = require("../models/saveSalesModel");
const axios = require("axios");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dbPath = path.join(__dirname, "../storage.db");
const db = new sqlite3.Database(dbPath);

const saveSalesController = {
  createOrUpdateSale: async (req, res) => {
    try {
      const sales_id = req.body.id;
      if (!sales_id) {
        return res.status(400).json({ error: "Sales ID is required" });
      }

      const result = await saveSalesModel.createNewSales(sales_id, req.body);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error in createOrUpdateSale:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getSale: async (req, res) => {
    try {
      const sales_id = req.params.id;
      const sale = await saveSalesModel.getSaleById(sales_id);

      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }

      res.status(200).json(sale);
    } catch (error) {
      console.error("Error in getSale:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  getAllSavedSalesFunc: async (req, res) => {
    try {
      const { ksb_id } = req.params;

      const sales = await saveSalesModel.getAllSavedSales(ksb_id);

      if (sales && sales.length > 0) {
        const io = req.app.get("io");

        io.emit("gettingAllSavedSales");
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

  sendSalesToAPI: async (req, res) => {
    try {
      const { ksb_id } = req.params;
      const { ip, project, username, password, device_id } = req.body;
      const sales = await saveSalesModel.getAllSavedSales(ksb_id);

      if (!sales || sales.length === 0) {
        return res
          .status(404)
          .json({ error: "No sales found for the given ksb_id" });
      }

      for (const sale of sales) {
        if (sale.status !== "process") {
          continue;
        }

        const formattedSale = {
          sales: [
            {
              details: sale.details.map((detail) => ({
                ...detail,
                rate: Number(detail.rate),
                discount: Number(detail.discount),
                below_cost: detail.below_cost === 1 ? true : false,
              })),
              products: sale.products.map(
                ({ product, warehouse, currency, quantity, price, sum }) => ({
                  product,
                  warehouse,
                  currency,
                  quantity: Number(quantity),
                  price: Number(price),
                  sum: Number(sum),
                })
              ),
              payments: sale.payments,
            },
          ],
        };

        const apiUrl = `http://${ip}/${project}/hs/ksbmerp_pos/create_sales/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`;
        const config = {
          auth: { username, password },
          headers: { "Content-Type": "application/json" },
        };

        try {
          const currentSale = await saveSalesModel.getSaleById(sale.id);
          const currentDeliverCount = currentSale.deliverCount || 0;

          const newDeliverCount = currentDeliverCount + 1;
          const newShowError = newDeliverCount >= 2 ? 1 : 0;

          const response = await axios.post(apiUrl, formattedSale, config);

          if (response.data.answer[0].status === "successfully") {
            console.log(`Sale ${sale.id} sent successfully`);
            await new Promise((resolve, reject) => {
              db.run(
                `UPDATE savedSales SET status = 'delivered', deliverCount = ?, showError = ?, errorMessage = NULL WHERE id = ?`,
                [newDeliverCount, newShowError, sale.id],
                (updateErr) => {
                  if (updateErr) {
                    console.error(
                      `Error updating status for sale ${sale.id}:`,
                      updateErr.message
                    );
                    reject(updateErr);
                  } else {
                    resolve();
                  }
                }
              );
            });
          } else {
            console.log(
              `Sale ${sale.id} send attempt failed: Not successful response`
            );

            let errorMessage = null;
            if (
              response.data &&
              response.data.answer &&
              response.data.answer[0] &&
              response.data.answer[0].message
            ) {
              errorMessage = response.data.answer[0].message;
            }

            const newStatus = newShowError === 1 ? "problem" : "process";

            await new Promise((resolve, reject) => {
              db.run(
                `UPDATE savedSales SET status = ?, deliverCount = ?, showError = ?, errorMessage = ? WHERE id = ?`,
                [
                  newStatus,
                  newDeliverCount,
                  newShowError,
                  errorMessage,
                  sale.id,
                ],
                (updateErr) => {
                  if (updateErr) {
                    console.error(
                      `Error updating status for sale ${sale.id}:`,
                      updateErr.message
                    );
                    reject(updateErr);
                  } else {
                    resolve();
                  }
                }
              );
            });
          }
        } catch (apiError) {
          const currentSale = await saveSalesModel.getSaleById(sale.id);
          const currentDeliverCount = currentSale.deliverCount || 0;

          const newDeliverCount = currentDeliverCount + 1;
          const newShowError = newDeliverCount >= 2 ? 1 : 0;

          const newStatus = newShowError === 1 ? "problem" : "process";

          let errorMessage = null;
          if (
            apiError.response &&
            apiError.response.data &&
            apiError.response.data.answer &&
            apiError.response.data.answer[0] &&
            apiError.response.data.answer[0].message
          ) {
            errorMessage = apiError.response.data.answer[0].message;
          } else {
            errorMessage = apiError.message || "Unknown API error";
          }

          console.error(`Failed to send sale ${sale.id}:`, apiError.message);
          if (apiError.response) {
            console.error(
              "API Response Data:",
              JSON.stringify(apiError.response.data, null, 2)
            );
          } else {
            console.error("No response data from API.");
          }

          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE savedSales SET status = ?, deliverCount = ?, showError = ?, errorMessage = ? WHERE id = ?`,
              [newStatus, newDeliverCount, newShowError, errorMessage, sale.id],
              (updateErr) => {
                if (updateErr) {
                  console.error(
                    `Error updating sale ${sale.id}:`,
                    updateErr.message
                  );
                  reject(updateErr);
                } else {
                  resolve();
                }
              }
            );
          });
        }
      }

      res.json({ message: "Sales processing completed" });
    } catch (err) {
      console.error("Error in sendSalesToAPI:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  sendOneSaleToAPI: async (req, res) => {
    const {
      ksb_id,
      device_id,
      host,
      authUser,
      authPass,
      database,
      salesData,
      id,
    } = req.body;
    try {
      if (!host || !authUser || !authPass || !database || !salesData) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const apiUrl = `http://${host}/${database}/hs/ksbmerp_pos/create_sales/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`;

      const response = await axios.post(apiUrl, salesData, {
        auth: {
          username: authUser,
          password: authPass,
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      const apiResponse = response.data;
      const answer = apiResponse?.answer?.[0];

      if (!answer) {
        return res
          .status(500)
          .json({ error: "Invalid response from external API" });
      }

      const { status, document, processed, message } = answer;

      if (status === "successfully") {
        const newStatus = processed ? "delivered" : "falseDelivered";

        db.run(
          `UPDATE savedSales SET status = ? WHERE id = ?`,
          [newStatus, id],
          (err) => {
            if (err) {
              console.error("Error updating database:", err.message);
              return res.status(500).json({ error: "Failed to update status" });
            }
            res.json({
              message: `Sale ${newStatus} successfully`,
              status,
              document,
              ...apiResponse,
            });
          }
        );
      } else if (status == "error") {
        const newStatus = "problem";
        db.run(
          `UPDATE savedSales SET status = ?, errorMessage = ? WHERE id = ?`,
          [newStatus, message, id],
          (err) => {
            if (err) {
              console.error("Error updating database:", err.message);
              return res.status(500).json({ error: "Failed to update status" });
            }
            res.json({
              message: message,
              status,
              document,
              ...apiResponse,
            });
          }
        );
      } else {
        res.status(200).json({ status: "error 404", details: message });
      }
    } catch (err) {
      console.error("Failed to send one sale to the external API");
      res.status(500).json({ error: "Internal server error" });
    }
  },
  deleteSaleFromTable: async (req, res) => {
    try {
      const { sales_id } = req.params;

      if (!sales_id) {
        return res.status(400).json({ error: "Invalid sales ID" });
      }

      // First, get the exact sale data using a Promise
      const sale = await new Promise((resolve, reject) => {
        db.get(
          "SELECT * FROM savedSales WHERE id = ?",
          [sales_id],
          (err, row) => {
            if (err) reject(err);
            resolve(row);
          }
        );
      });

      if (!sale) {
        return res.status(404).json({ error: "Sale not found" });
      }

      // Insert into salesTrash using a Promise
      await new Promise((resolve, reject) => {
        const insertQuery = `
          INSERT INTO salesTrash (
            id, ksb_id, device_id, date, status, client_id, client_name,
            total_price, details, products, payments, seller,
            deliverCount, showError, errorMessage
          ) SELECT 
            id, ksb_id, device_id, date, status, client_id, client_name,
            total_price, details, products, payments, seller,
            deliverCount, showError, errorMessage
          FROM savedSales WHERE id = ?`;

        db.run(insertQuery, [sales_id], (err) => {
          if (err) {
            console.error("Error copying to salesTrash:", err);
            reject(err);
          }
          resolve();
        });
      });

      // Delete from savedSales using a Promise
      await new Promise((resolve, reject) => {
        db.run(
          "DELETE FROM savedSales WHERE id = ?",
          [sales_id],
          function (err) {
            if (err) reject(err);
            if (this.changes === 0) {
              reject(new Error("No sale was deleted"));
            }
            resolve();
          }
        );
      });

      res.status(200).json({
        message: "Sale deleted successfully and moved to trash", // Return the deleted sale data for confirmation
      });
    } catch (error) {
      console.error("Error in deleteSaleFromTable:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: error.message });
    }
  },
  getAllTrashedSales: async (req, res) => {
    try {
      const { ksb_id } = req.params;

      if (!ksb_id) {
        return res.status(400).json({ error: "KSB ID is required" });
      }

      // Get all trashed sales for the specific ksb_id using a Promise
      const trashedSales = await new Promise((resolve, reject) => {
        db.all(
          "SELECT * FROM salesTrash WHERE ksb_id = ? ORDER BY deleted_at DESC",
          [ksb_id],
          (err, rows) => {
            if (err) {
              console.error("Error fetching trashed sales:", err);
              reject(err);
            }

            if (rows && rows.length > 0) {
              const sales = rows.map((row) => {
                let details = [];
                let products = [];
                let payments = [];
                try {
                  details = JSON.parse(row.details || "[]");
                  products = JSON.parse(row.products || "[]");
                  payments = JSON.parse(row.payments || "[]");
                } catch (parseErr) {
                  console.error("Failed to parse JSON data:", parseErr);
                  return row;
                }
                return {
                  ...row,
                  details,
                  products,
                  payments,
                  deliverCount: row.deliverCount || 0,
                  showError: row.showError === 1,
                  errorMessage: row.errorMessage || "",
                };
              });
              resolve(sales);
            } else {
              resolve([]);
            }
          }
        );
      });

      res.status(200).json(trashedSales);
    } catch (error) {
      console.error("Error in getAllTrashedSales:", error);
      res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  },
  deleteOneTrashSalesContollerById: (req, res) => {
    try {
      const { sales_id } = req.params;

      saveSalesModel.deleteOneTrashSale(sales_id, (err, result) => {
        if (err) {
          return res.status(500).json({
            error: "Failed to delete single sale row",
            details: err.message,
          });
        }

        if (result.success) {
          const io = req.app.get("io");

          io.emit("deleteOneTrashSale");
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
};

module.exports = saveSalesController;
