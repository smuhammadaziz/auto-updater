const axios = require("axios");
const passwordModel = require("../models/passwordModel");

const passwordController = {
  changePassword: async (req, res) => {
    try {
      const {
        surname,
        old,
        news,
        ipAddressPort,
        database,
        username,
        password,
      } = req.body;

      if (!surname || !old || !news || !ipAddressPort || !database) {
        return res.status(400).json({
          status: "error",
          message: "Missing required fields",
        });
      }

      const user = await passwordModel.findUserByUsertype(surname);
      if (!user) {
        return res.status(404).json({
          status: "error",
          message: "User not found",
        });
      }

      const isPasswordValid = await passwordModel.comparePassword(
        password,
        user.password
      );

      if (!isPasswordValid) {
        return res.status(401).json({
          status: "error",
          message: "Invalid current password",
        });
      }

      try {
        const externalApiUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/update_password/ksb?text=pos`;
        // console.log(`Attempting external API call to: ${externalApiUrl}`);

        const response = await axios.post(
          externalApiUrl,
          {
            user_name: surname,
            old: old,
            new: news,
          },
          {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${username}:${password}`
              ).toString("base64")}`,
              "Content-Type": "application/json",
            },
            timeout: 120000,
          }
        );

        if (response.data && response.data.status === "successfully") {
          const hashedPassword = await passwordModel.hashPassword(news);

          const updateResult = await passwordModel.updateUserPassword(
            surname,
            hashedPassword
          );

          if (!updateResult) {
            return res.status(500).json({
              status: "error 500",
              message: "Failed to update password in local database",
            });
          }

          return res.json({
            status: "successfully",
            message: "Password updated successfully",
          });
        } else {
          console.error("External API Error Response:", response.data);
          return res.status(400).json({
            status: "error 400",
            message:
              response.data?.message ||
              "Password update failed in external system",
            details: response.data,
          });
        }
      } catch (error) {
        console.error("External API Communication Error:", {
          message: error.message,
          code: error.code,
          config: error.config
            ? {
                url: error.config.url,
                method: error.config.method,
                headers: error.config.headers,
              }
            : null,
          response: error.response
            ? {
                status: error.response.status,
                data: error.response.data,
              }
            : null,
        });
        let errorMessage = "Failed to communicate with external system";

        if (error.code === "ECONNABORTED") {
          errorMessage = "Connection to external system timed out";
        } else if (error.response) {
          errorMessage =
            error.response.data?.message ||
            `External system returned ${error.response.status} status`;
        } else if (error.request) {
          errorMessage = "No response received from external system";
        }

        return res.status(500).json({
          status: "error 500",
          message: errorMessage,
          details: error.message,
        });
      }
    } catch (error) {
      console.error("Unexpected Password Change Error:", error);
      res.status(500).json({
        status: "error",
        message: "Unexpected internal error during password change",
        details: error.message,
      });
    }
  },
};

module.exports = passwordController;
