const axios = require("axios");

const pingController = {
  checkPing: async (req, res) => {
    try {
      const { ksb_id } = req.params;
      const {
        username,
        password,
        "ipaddress:port": ipAddressPort,
        database,
      } = req.body;

      const auth = Buffer.from(
        `${username}:${password || ""}`,
        "utf-8"
      ).toString("base64");

      const externalResponse = await axios.get(
        `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/ping/ksb?text=pos&ksb_id=${ksb_id}`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        }
      );

      const data = await externalResponse.data;
      res.json(data);
    } catch (err) {
      if (err.response) {
        return res.status(err.response.status).json({
          status: "error",
          message: "External API error",
          statusCode: err.response.status,
        });
      }

      return res.status(500).json({
        status: "error",
      });
    }
  },
  recoveryData: async (req, res) => {
    try {
      const { ksb_id, device_id } = req.params;
      const { username, password, database } = req.body;
      const ipAddressPort = req.body["ipaddress:port"]; // Correcting destructuring

      // Validation: Check if required parameters exist
      if (
        !ksb_id ||
        !device_id ||
        !username ||
        !password ||
        !ipAddressPort ||
        !database
      ) {
        return res.status(400).json({
          status: "error",
          statusCode: 400,
          message:
            "Missing required fields: ksb_id, device_id, username, password, ipaddress:port, or database",
        });
      }

      const apiBody = { ksb_id, device_id };
      const authHeader =
        "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

      // Constructing the URL safely
      const apiUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/recovery/ksb?text=pos`;

      // Making the external API request with a timeout
      const externalResponse = await axios.post(apiUrl, apiBody, {
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        timeout: 120000,
      });

      // Sending back the API response
      return res.json(externalResponse.data);
    } catch (err) {
      console.error("Error in recoveryData:", err.message);

      if (err.response) {
        // API returned an error response
        return res.status(err.response.status).json({
          status: "api error",
          statusCode: err.response.status,
          message: err.response.data || "Unknown API error",
        });
      } else if (err.code === "ECONNABORTED") {
        // Handle timeout errors
        return res.status(504).json({
          status: "timeout error",
          statusCode: 504,
          message: "The request to the external API timed out",
        });
      } else if (err.code === "ECONNREFUSED") {
        // Handle connection refused errors
        return res.status(502).json({
          status: "connection error",
          statusCode: 502,
          message:
            "The server is unreachable. Check if the external API is running.",
        });
      } else if (err.code === "EHOSTUNREACH") {
        // Handle unreachable host
        return res.status(503).json({
          status: "network error",
          statusCode: 503,
          message: "The external API host is unreachable.",
        });
      }

      // Catch-all for unknown errors
      return res.status(500).json({
        status: "server error",
        statusCode: 500,
        message: err.message || "An unexpected server error occurred.",
      });
    }
  },
};

module.exports = pingController;
