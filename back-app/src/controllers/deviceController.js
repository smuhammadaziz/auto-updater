const axios = require("axios");
const deviceModel = require("../models/deviceModel");

const deviceController = {
  registerDevice: async (req, res) => {
    try {
      const {
        username,
        password,
        ksb_id,
        device_id,
        name,
        "ipaddress:port": ipAddressPort,
        database,
      } = req.body;

      if (
        !username ||
        ksb_id === undefined ||
        device_id === undefined ||
        name === undefined ||
        ipAddressPort === undefined ||
        database === undefined
      ) {
        return res.status(400).json({
          error: "Missing required fields",
          details: {
            username: !!username,
            password: password !== undefined,
            ksb_id: !!ksb_id,
            device_id: !!device_id,
            name: !!name,
            "ipaddress:port": !!ipAddressPort,
            database: !!database,
          },
        });
      }

      try {
        const existingDevice = await deviceModel.getDevice(
          device_id,
          ksb_id,
          username
        );

        if (existingDevice) {
          return res.status(200).json(existingDevice);
        }

        const auth = Buffer.from(
          `${username}:${password || ""}`,
          "utf-8"
        ).toString("base64");

        const externalResponse = await axios.post(
          `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/register_pos/ksb?text=pos`,
          { ksb_id, device_id, name, username, password },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${auth}`,
            },
            timeout: 60000,
          }
        );

        if (externalResponse.data.status === "error") {
          return res.status(400).json({ error: externalResponse.data.message });
        }

        if (externalResponse.data.status === "successfully") {
          const deviceData = {
            device_name: name,
            ksb_id,
            device_id,
            user_type: username,
            device_registered_time: new Date().toISOString(),
            user_id: externalResponse.data.user,
          };

          await deviceModel.registerDevice(deviceData);
          return res.status(200).json(deviceData);
        }

        return res.status(500).json({
          error: "Unexpected response from external API",
          details: externalResponse.data,
        });
      } catch (dbError) {
        console.error("Database operation failed:", dbError);
        return res.status(500).json({
          error: "Database error occurred",
          details: dbError.message,
        });
      }
    } catch (error) {
      console.error("Device registration error:", error);
      if (error.response) {
        return res.status(error.response.status).json({
          error: "External API registration failed",
          details: error.response.data,
        });
      } else if (error.request) {
        return res.status(503).json({
          error: "No response from external service",
          details: "The external API did not respond",
        });
      } else {
        return res.status(500).json({
          error: "Internal server error",
          details: error.message,
        });
      }
    }
  },

  gettingAllRegisteredDevices: async (req, res) => {
    try {
      const { device_id, ksb_id } = req.params;
      const response = await deviceModel.getAllDevices(device_id, ksb_id);

      if (response) {
        res.json(response);
      } else {
        res.json("not found registered devices");
      }
    } catch (err) {
      console.log("error getting all registered device from table");
    }
  },
};

module.exports = deviceController;
