const axios = require("axios");
const productModel = require("../models/productModel");
const clientModel = require("../models/clientModel");
const userSettingsModel = require("../models/userSettingsModel");
const userAuthModel = require("../models/userSettingsModel");
const userCashModel = require("../models/cashModel");
const currencyModel = require("../models/currencyModel");
const settingsDeviceModel = require("../models/userSettingsDeviceModel");

function safeExtract(data, keys, defaultValue = "Unknown") {
  try {
    let result = data;
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) return defaultValue;
    }
    return result || defaultValue;
  } catch (error) {
    console.error(`Error extracting data for keys: ${keys.join(".")}`, error);
    return defaultValue;
  }
}

async function makeRequestWithRetry(url, config, maxRetries = 1) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await axios({
        ...config,
        url,
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        httpAgent: new require("http").Agent({ keepAlive: true }),
        httpsAgent: new require("https").Agent({ keepAlive: true }),
      });
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));

      console.log(
        `Retrying request to ${url}, attempt ${attempt + 1}/${maxRetries}`
      );
    }
  }
}

const productSyncController = {
  syncProducts: async (req, res) => {
    const { ksb_id, device_id } = req.params;
    const {
      "ipaddress:port": ipAddressPort,
      database,
      userName,
      userPassword,
    } = req.body;

    const baseUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos`;
    const removeUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/remove/ksb?text=pos`;

    try {
      const endpoints = {
        productUpdate: `${baseUrl}/product_update/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        client: `${baseUrl}/client/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        userSettingsUrl: `${baseUrl}/user_settings/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        userSettingsDeviceUrl: `${baseUrl}/settings/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        userCashUrl: `${baseUrl}/cash/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        currency: `${baseUrl}/currency/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        symbol: `${baseUrl}/symbol/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        warehouse: `${baseUrl}/warehouse/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        priceType: `${baseUrl}/price_type/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
      };

      const axiosConfig = {
        method: "get",
        auth: {
          username: userName,
          password: userPassword,
        },
        headers: {
          Connection: "keep-alive",
          "Keep-Alive": "timeout=60, max=100",
        },
      };

      const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

      let responses = {};
      let processingErrors = {};

      // try {
      //   responses.client = await makeRequestWithRetry(
      //     endpoints.client,
      //     axiosConfig
      //   );
      // } catch (error) {
      //   console.error("Failed to fetch client data:", error.message);
      //   processingErrors.client = error.message;
      // }

      for (const [key, url] of Object.entries(endpoints)) {
        // if (key === "client") continue;

        try {
          await delay(500);
          const response = await makeRequestWithRetry(url, axiosConfig);
          responses[key] = response;
        } catch (error) {
          console.error(`Failed to fetch ${key} data:`, error.message);
          processingErrors[key] = error.message;
          responses[key] = { data: null };
        }
      }

      // let clientData = null;
      // if (
      //   responses.client?.data?.status === "successfully" &&
      //   responses.client?.data?.item &&
      //   responses.client?.data?.detail
      // ) {
      //   const processedClients = responses.client.data.detail.map(
      //     (client, index) => ({
      //       client_id: responses.client.data.item[index],
      //       ...client,
      //     })
      //   );

      //   const clientDataForDb = {
      //     data: JSON.stringify(processedClients),
      //     total: processedClients.length,
      //   };

      //   try {
      //     await clientModel.insertOrUpdateClientData(
      //       ksb_id,
      //       device_id,
      //       clientDataForDb
      //     );
      //   } catch (error) {
      //     processingErrors.clientDatabase = error.message;
      //   }

      //   clientData = responses.client.data;
      // } else if (!processingErrors.client) {
      //   processingErrors.client = "Invalid client data";
      // }

      const userCashData = responses.userCashUrl?.data;
      if (
        userCashData?.item &&
        userCashData?.detail &&
        Array.isArray(userCashData.item) &&
        Array.isArray(userCashData.detail)
      ) {
        const cashDataToInsert = userCashData.item.map((cash_id, index) => ({
          device_id,
          ksb_id,
          cash_id,
          deletable: userCashData.detail[index]?.delete || false,
          name: userCashData.detail[index]?.name || "",
          archive: userCashData.detail[index]?.archive || false,
        }));

        try {
          for (const cashData of cashDataToInsert) {
            await userCashModel.createCash(cashData);
          }
        } catch (error) {
          processingErrors.userCash = error.message;
        }
      } else if (!processingErrors.userCashUrl) {
        processingErrors.userCash = "Invalid user cash data";
      }

      const userSettingsData = responses.userSettingsUrl?.data;
      const userSettingsDeviceData = responses.userSettingsDeviceUrl?.data;
      if (userSettingsData?.users && Array.isArray(userSettingsData.users)) {
        try {
          await userAuthModel.upsertUserSettings(
            device_id,
            ksb_id,
            userSettingsData
          );

          await settingsDeviceModel.upsertUserSettings(
            device_id,
            ksb_id,
            userSettingsDeviceData
          );
        } catch (error) {
          processingErrors.userSettings = error.message;
        }
      } else if (!processingErrors.userSettingsUrl) {
        processingErrors.userSettings = "Invalid user settings data";
      }

      const currencyData = responses.currency?.data;
      const transformedCurrencyData = currencyData?.detail
        ? currencyData.detail.map((item) => ({
            id: null,
            item_id: null,
            name: item.name,
            archive: item.archive ? 1 : 0,
            key: item.key,
            rate: item.rate,
            device_id,
            ksb_id,
          }))
        : null;

      if (transformedCurrencyData) {
        try {
          await currencyModel.createCurrency(
            device_id,
            ksb_id,
            transformedCurrencyData
          );
        } catch (error) {
          console.error("Error updating currency:", error.message);
          processingErrors.currency = error.message;
        }
      } else if (!processingErrors.currency) {
        processingErrors.currency = "Invalid currency data";
      }

      const productData = responses.productUpdate?.data;
      if (productData?.detail && Array.isArray(productData.detail)) {
        const processedProducts = productData.detail.map((product, index) => {
          const symbolId = productData.symbol[product.symbol];
          const currencyId = productData.currency[product.currency];

          const processedStock = (product.stock || []).map((stockItem) => {
            const warehouseId = productData.warehouse[stockItem.warehouse];
            return {
              ...stockItem,
              warehouse: warehouseId || "-",
            };
          });

          const processedPrice = (product.price || []).map((priceItem) => {
            const priceTypeId = productData.price_type[priceItem.type];
            return {
              ...priceItem,
              type: priceTypeId || "-",
            };
          });

          return {
            ...product,
            product_id: productData.item[index],
            symbol: symbolId || "-",
            currency: currencyId || "-",
            stock: processedStock,
            price: processedPrice,
          };
        });

        try {
          await productModel.upsertProducts(
            device_id,
            ksb_id,
            processedProducts,
            processedProducts.length
          );
        } catch (error) {
          processingErrors.products = error.message;
        }
      } else if (!processingErrors.productUpdate) {
        processingErrors.products = "Invalid product data";
      }

      const supplementaryDataProcessors = [
        {
          data: responses.symbol?.data,
          processor: productModel.upsertSymbols,
          errorKey: "symbol",
        },
        {
          data: responses.warehouse?.data,
          processor: productModel.upsertWarehouses,
          errorKey: "warehouse",
        },
        {
          data: responses.priceType?.data,
          processor: productModel.upsertPriceTypes,
          errorKey: "priceType",
        },
      ];

      for (const { data, processor, errorKey } of supplementaryDataProcessors) {
        if (data?.detail && Array.isArray(data.detail)) {
          try {
            await processor(device_id, ksb_id, data);
          } catch (error) {
            processingErrors[errorKey] = error.message;
          }
        } else if (!processingErrors[errorKey]) {
          processingErrors[errorKey] = `Invalid ${errorKey} data`;
        }
      }

      let removedElements = [];
      const dataKeys = [
        "client",
        "userCashUrl",
        "productUpdate",
        "currency",
        "symbol",
        "warehouse",
        "priceType",
      ];

      dataKeys.forEach((key) => {
        const dataResponse = responses[key]?.data;
        if (dataResponse?.item && dataResponse?.object) {
          removedElements.push({
            id: dataResponse.item,
            object: dataResponse.object,
          });
        }
      });

      if (removedElements.length > 0) {
        try {
          await productModel.upsertRemovedItems(
            device_id,
            ksb_id,
            removedElements
          );
        } catch (error) {
          processingErrors.removedItems = error.message;
        }
      }

      const io = req.app.get("io");

      io.emit("fetchUpdatedProductsData");

      res.status(200).json({
        message: "Data processed",
        processingErrors,
        status:
          Object.keys(processingErrors).length > 0 ? "partial" : "success",
      });
    } catch (error) {
      console.error("Unexpected error in syncProducts:", error);
      res.status(500).json({
        message: "Unexpected error during data synchronization",
        error: error.toString(),
        stack: error.stack,
      });
    }
  },
};

module.exports = productSyncController;
