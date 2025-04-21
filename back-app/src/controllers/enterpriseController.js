const axios = require("axios");

const enterpriseInfo = {
  getEnterpriseInfo: async (req, res) => {
    try {
      const { ksb_id } = req.params;
      const { userUsername, userPassword, ipaddressPort, database } = req.body;

      if (
        !userUsername ||
        !userPassword ||
        !ksb_id ||
        !ipaddressPort ||
        !database
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const apiUrl = `http://${ipaddressPort}/${database}/hs/ksbmerp_pos/users/ksb?text=pos&ksb_id=${ksb_id}`;

      const config = {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${userUsername}:${userPassword}`
          ).toString("base64")}`,
        },
      };

      const response = await axios.get(apiUrl, config);

      return res.status(200).json(response.data);
    } catch (e) {
      console.error("Error fetching enterprise info:", e.message);

      if (e.response) {
        return res.status(e.response.status).json({
          error: e.response.data || "Error from external API",
        });
      }

      return res.status(500).json({ error: "Internal server error" });
    }
  },
  currencyInfo: async (req, res) => {
    try {
      const { ksb_id } = req.params;
      const { userUsername, userPassword, ipaddressPort, database, deviceId } =
        req.body;

      if (
        !userUsername ||
        !ksb_id ||
        !ipaddressPort ||
        !database ||
        !deviceId
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const externalApi = `http://${ipaddressPort}/${database}/hs/ksbmerp_pos/currency/ksb?text=pos&ksb_id=${ksb_id}&device_id=${deviceId}`;
      const config = {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${userUsername}:${userPassword || ""}`
          ).toString("base64")}`,
        },
      };

      const response = await axios.get(externalApi, config);

      return res.status(200).json(response.data);
    } catch (e) {
      console.error("Error fetching enterprise info:", e.message);

      if (e.response) {
        return res.status(e.response.status).json({
          error: e.response.data || "Error from external API",
        });
      }

      return res.status(500).json({ error: "Internal server error" });
    }
  },
};

module.exports = enterpriseInfo;
