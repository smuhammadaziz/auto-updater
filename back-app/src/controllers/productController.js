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

const productController = {
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

      try {
        responses.client = await makeRequestWithRetry(
          endpoints.client,
          axiosConfig
        );
      } catch (error) {
        console.error("Failed to fetch client data:", error.message);
        return res
          .status(200)
          .json({ status: "empty", reason: "Failed to fetch client data" });
      }

      const clientData = responses.client?.data;
      if (
        clientData?.status === "successfully" &&
        clientData.item &&
        clientData.detail
      ) {
        const processedClients = clientData.detail.map((client, index) => ({
          client_id: clientData.item[index],
          ...client,
        }));

        const clientDataForDb = {
          data: JSON.stringify(processedClients),
          total: processedClients.length,
        };

        const io = req.app.get("io");

        io.emit("gettingClients");

        await clientModel.insertOrUpdateClientData(
          ksb_id,
          device_id,
          clientDataForDb
        );
      } else {
        return res
          .status(200)
          .json({ status: "empty", reason: "Invalid client data" });
      }

      for (const [key, url] of Object.entries(endpoints)) {
        if (key === "client") continue;

        try {
          await delay(500);
          const response = await makeRequestWithRetry(url, axiosConfig);
          responses[key] = response;
        } catch (error) {
          console.error(`Failed to fetch ${key} data:`, error.message);
          responses[key] = { data: null };
        }
      }

      const productData = responses.productUpdate?.data;
      const currencyData = responses.currency?.data;
      const userSettingsData = responses.userSettingsUrl?.data;
      const userSettingsDeviceData = responses.userSettingsDeviceUrl?.data;
      const userCashData = responses.userCashUrl?.data;
      const symbolData = responses.symbol?.data;
      const warehouseData = responses.warehouse?.data;
      const priceTypeData = responses.priceType?.data;

      if (!productData?.detail || !Array.isArray(productData.detail)) {
        return res
          .status(200)
          .json({ status: "empty", reason: "Invalid product data" });
      }

      if (!userSettingsData?.users || !Array.isArray(userSettingsData.users)) {
        return res
          .status(200)
          .json({ status: "empty", reason: "Invalid user settings data" });
      }

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

        for (const cashData of cashDataToInsert) {
          await userCashModel.createCash(cashData);
        }
      }

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

      const dataValidation = [
        currencyData?.detail,
        symbolData?.detail,
        warehouseData?.detail,
        priceTypeData?.detail,
      ];

      if (dataValidation.some((data) => !data)) {
        return res.status(200).json({
          status: "empty",
          reason: "One or more data sources are incomplete",
          details: {
            currency: !!currencyData?.detail,
            symbol: !!symbolData?.detail,
            warehouse: !!warehouseData?.detail,
            priceType: !!priceTypeData?.detail,
          },
        });
      }

      let removedElements = [];

      let clientObject = clientData?.object;
      let productObject = productData?.object;
      let symbolObject = symbolData?.object;
      let currencyObject = currencyData?.object;
      let warehouseObject = warehouseData?.object;
      let priceTypeObject = priceTypeData?.object;
      let cashObject = userCashData?.object;

      if (clientData?.item) {
        removedElements.push({
          id: clientData.item,
          object: clientObject,
        });
      }

      if (userCashData?.item) {
        removedElements.push({
          id: userCashData.item,
          object: cashObject,
        });
      }

      if (productData?.item) {
        removedElements.push({
          id: productData.item,
          object: productObject,
        });
      }

      if (currencyData?.item) {
        removedElements.push({
          id: currencyData.item,
          object: currencyObject,
        });
      }

      if (symbolData?.item) {
        removedElements.push({
          id: symbolData.item,
          object: symbolObject,
        });
      }

      if (warehouseData?.item) {
        removedElements.push({
          id: warehouseData.item,
          object: warehouseObject,
        });
      }

      if (priceTypeData?.item) {
        removedElements.push({
          id: priceTypeData.item,
          object: priceTypeObject,
        });
      }

      await productModel.upsertSymbols(device_id, ksb_id, symbolData);
      await productModel.upsertWarehouses(device_id, ksb_id, warehouseData);
      await productModel.upsertPriceTypes(device_id, ksb_id, priceTypeData);
      await productModel.upsertCurrencies(device_id, ksb_id, currencyData);
      await productModel.upsertRemovedItems(device_id, ksb_id, removedElements);

      const transformedCurrencyData = currencyData.detail.map((item) => ({
        id: null,
        item_id: null,
        name: item.name,
        archive: item.archive ? 1 : 0,
        key: item.key,
        rate: item.rate,
        device_id,
        ksb_id,
      }));

      if (!Array.isArray(transformedCurrencyData)) {
        console.error(
          "transformedCurrencyData is not an array:",
          transformedCurrencyData
        );
        return;
      }

      await currencyModel.createCurrency(
        device_id,
        ksb_id,
        transformedCurrencyData
      );

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

      await productModel.upsertProducts(
        device_id,
        ksb_id,
        processedProducts,
        processedProducts.length
      );

      res.status(200).json({
        message: "Data processed successfully",
        updatedProducts: processedProducts,
        totalProducts: processedProducts.length,
      });
    } catch (error) {
      console.error("Error fetching or processing data:", error);
      if (error.response) {
        console.error("Response error data:", error.response.data);
      }
      res.status(500).json({
        message: "Failed to process data",
        error: error.toString(),
        stack: error.stack,
      });
    }
  },

  getProducts: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await productModel.getProducts(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json({
        products: result.product_data,
      });
    } catch (error) {
      console.error("Error retrieving products:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getSymbolData: async (req, res) => {
    const { device_id, ksb_id, item_id } = req.params;

    try {
      const result = await productModel.getSymbols(device_id, ksb_id, item_id);

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getAllSymbolData: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await productModel.getAllSymbols(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getCurrencyData: async (req, res) => {
    const { device_id, ksb_id, item_id } = req.params;

    try {
      const result = await productModel.getCurrencies(
        device_id,
        ksb_id,
        item_id
      );

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getAllCurrencyData: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await productModel.getCurrencyData(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getWarehouseData: async (req, res) => {
    const { device_id, ksb_id, item_id } = req.params;

    try {
      const result = await productModel.getWarehouses(
        device_id,
        ksb_id,
        item_id
      );

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getAllWarehourseData: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await productModel.getAllWarehouses(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  getPriceTypeData: async (req, res) => {
    const { device_id, ksb_id, item_id } = req.params;

    try {
      const result = await productModel.getPriceTypes(
        device_id,
        ksb_id,
        item_id
      );

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAllPriceTypeData: async (req, res) => {
    const { device_id, ksb_id } = req.params;

    try {
      const result = await productModel.getAllPriceTypes(device_id, ksb_id);

      if (!result) {
        return res.status(404).json({
          error: "Products not found for the specified device_id and ksb_id",
        });
      }

      res.json(result);
    } catch (e) {
      console.log(e);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getOneProduct: async (req, res) => {
    const { ksb_id, device_id } = req.params;
    const {
      "ipaddress:port": ipAddressPort,
      database,
      userName,
      userPassword,
    } = req.body;
    const baseUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos`;
    const removeUrl = `${baseUrl}/remove/ksb?text=pos`;

    try {
      const endpoints = {
        productUpdate: `${baseUrl}/product_update/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
        symbol: `${baseUrl}/symbol/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`,
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

      const [productResponse, symbolResponse] = await Promise.all([
        makeRequestWithRetry(endpoints.productUpdate, axiosConfig),
        makeRequestWithRetry(endpoints.symbol, axiosConfig),
      ]);

      const productData = productResponse?.data;
      const symbolData = symbolResponse?.data;

      if (!productData?.detail || !Array.isArray(productData.detail)) {
        return res
          .status(200)
          .json({ status: "empty", reason: "Invalid product data" });
      }

      if (!symbolData?.detail || !symbolData?.item) {
        return res.status(200).json({
          status: "empty",
          reason: "Symbol data is incomplete",
        });
      }

      const temporaryList = [
        ...(productData.item || []),
        ...(symbolData.item || []),
      ];
      console.log("Temporary List of IDs:", temporaryList.length);

      const removePayload = {
        ksb_id,
        device_id,
        removed_items: temporaryList,
      };

      const removeResponse = await axios({
        ...axiosConfig,
        method: "post",
        url: removeUrl,
        data: removePayload,
      });

      if (removeResponse.status === 200) {
        console.log("successfully");
      }

      await productModel.upsertSymbols(device_id, ksb_id, symbolData);

      const processedProducts = productData.detail.map((product, index) => {
        const symbolId = productData.symbol[product.symbol];
        return {
          ...product,
          product_id: productData.item[index],
          symbol: symbolId || "-",
        };
      });

      res.status(200).json({
        status: "success",
        products: processedProducts,
        totalProducts: processedProducts.length,
      });
    } catch (error) {
      console.error("Error fetching or processing data:", error);
      if (error.response) {
        console.error("Response error data:", error.response.data);
      }
      res.status(500).json({
        message: "Failed to process data",
        error: error.toString(),
      });
    }
  },
};

module.exports = productController;
