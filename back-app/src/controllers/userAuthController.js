const bcrypt = require("bcrypt");
const axios = require("axios");
const userAuthModel = require("../models/userAuthModel");
const geoip = require("geoip-lite");

const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

const userAuthController = {
  login: async (req, res) => {
    try {
      const { id: ksbId } = req.params;
      const {
        "ipaddress:port": ipAddressPort,
        database,
        userName,
        userPass,
        deviceId,
      } = req.body;

      if (!ipAddressPort || !database || !userName || !userPass || !deviceId) {
        return res.status(400).json({
          error: "Missing required configuration parameters",
        });
      }

      const credentials = Buffer.from(`${userName}:${userPass}`).toString(
        "base64"
      );
      const apiUrl = `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/users/ksb?text=pos&ksb_id=${ksbId}`;
      let enterpriseInfo = {};
      let usersInfo = {};
      try {
        const response = await axios.get(apiUrl, {
          headers: { Authorization: `Basic ${credentials}` },
        });

        let companyInfo = await response.data.enterprise;
        let userlistInfo = await response.data.list_users;

        enterpriseInfo = companyInfo;
        usersInfo = userlistInfo;

        for (const user of response.data.list_users) {
          const existingUser = await userAuthModel.findUser(
            deviceId,
            ksbId,
            user.login
          );

          if (!existingUser) {
            await userAuthModel.createUser({
              device_id: deviceId,
              ksb_id: ksbId,
              usertype: user.login,
              password: "",
              showSettings: 1,
              authenticateCount: 0,
            });
          }
        }
      } catch (apiError) {
        if (apiError.response?.status === 500 || !apiError.response) {
          console.error(
            "External API failed, fetching users from the database..."
          );
        } else {
          throw apiError;
        }
      }

      const users = await userAuthModel.findUsers(deviceId, ksbId);

      res.json({
        success: true,
        deviceId,
        ksbId,
        users,
        enterpriseInfo,
        usersInfo,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  checkPassword: async (req, res) => {
    try {
      const { deviceId, ksbId, userType, password } = req.body;

      if (!deviceId || !ksbId || !userType || !password) {
        return res.status(400).json({
          exists: false,
          message: "Device ID, KSB ID, user type, and password are required",
        });
      }

      const user = await userAuthModel.findUser(deviceId, ksbId, userType);

      if (!user) {
        return res.json({
          exists: false,
          message: "User not found",
        });
      }

      if (!user.password) {
        return res.json({
          exists: false,
          message: "Password not set",
        });
      }

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        const newAuthCount = (user.authenticateCount || 0) + 1;
        await userAuthModel.updateUser(deviceId, ksbId, userType, {
          authenticateCount: newAuthCount,
          showSettings: newAuthCount < 2 ? 1 : 0,
        });
      }

      res.json({
        exists: true,
        isValid: match,
        message: match ? "Success" : "Invalid password",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  setPassword: async (req, res) => {
    try {
      const { deviceId, ksbId, userType, password } = req.body;

      if (!deviceId || !ksbId || !userType || !password) {
        return res.status(400).json({
          success: false,
          message: "Device ID, KSB ID, user type, and password are required",
        });
      }

      const user = await userAuthModel.findUser(deviceId, ksbId, userType);

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User type not found",
        });
      }

      const hashedPassword = await hashPassword(password);

      await userAuthModel.updateUser(deviceId, ksbId, userType, {
        password: hashedPassword,
        date: new Date().toISOString(),
        authenticateCount: 0,
        showSettings: 1,
      });

      res.json({
        success: true,
        message: "Password set successfully",
      });
    } catch (error) {
      console.error("Error in /api/set-password:", error);
      res.status(500).json({ error: error.message });
    }
  },

  authenticate: async (req, res) => {
    try {
      const { deviceId, ksbId, userType, password, ipAddressPort, database } =
        req.body;

      const getIpAddress = (req) => {
        const forwardedFor = req.headers["x-forwarded-for"];
        if (forwardedFor) {
          const ips = forwardedFor.split(",");
          return ips[0].trim();
        }

        return (
          req.headers["cf-connecting-ip"] ||
          req.headers["x-real-ip"] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress ||
          req.ip ||
          "0.0.0.0"
        ).replace("::ffff:", "");
      };

      const clientIp = getIpAddress(req);

      const getBasicLocation = (ip) => {
        if (ip === "127.0.0.1" || ip === "::1") {
          return "Локальный/Локальный";
        }

        const ipParts = ip.split(".");
        if (ipParts.length !== 4) return "Неизвестно/Неизвестно";

        const ipNum = ipParts.reduce((total, octet, index) => {
          return total + parseInt(octet) * Math.pow(256, 3 - index);
        }, 0);

        const ranges = {
          "3.0.0.0-3.255.255.255": "Москва/Россия",
          "5.0.0.0-5.255.255.255": "Санкт-Петербург/Россия",
          "31.0.0.0-31.255.255.255": "Новосибирск/Россия",
        };

        for (const range of Object.entries(ranges)) {
          const [rangeStr, location] = range;
          const [start, end] = rangeStr.split("-");
          const startNum = start.split(".").reduce((total, octet, index) => {
            return total + parseInt(octet) * Math.pow(256, 3 - index);
          }, 0);
          const endNum = end.split(".").reduce((total, octet, index) => {
            return total + parseInt(octet) * Math.pow(256, 3 - index);
          }, 0);

          if (ipNum >= startNum && ipNum <= endNum) {
            return location;
          }
        }

        return "Неизвестно/Неизвестно";
      };

      const location = getBasicLocation(clientIp);

      const credentials = password
        ? Buffer.from(`${userType}:${password}`).toString("base64")
        : Buffer.from(`${userType}:`).toString("base64");

      try {
        const response = await axios.get(
          `http://${ipAddressPort}/${database}/hs/ksbmerp_pos/ping/ksb?text=pos&ksb_id=${ksbId}`,
          {
            headers: {
              Authorization: `Basic ${credentials}`,
            },
          }
        );

        const user = await userAuthModel.findUser(deviceId, ksbId, userType);
        const hashedPassword = password
          ? await hashPassword(password)
          : "EMPTY_PASSWORD_ALLOWED";
        const currentAuthCount = (user?.authenticateCount || 0) + 1;

        await userAuthModel.updateUser(deviceId, ksbId, userType, {
          password: hashedPassword,
          date: new Date().toISOString(),
          authenticateCount: currentAuthCount,
          showSettings: currentAuthCount < 2 ? 1 : 0,
          last_entered_time: new Date().toISOString(),
          ip_address: clientIp,
          location,
        });

        res.json({
          success: true,
          showSettings: currentAuthCount < 2,
          message: "Authentication successful",
          location,
        });
      } catch (error) {
        const user = await userAuthModel.findUser(deviceId, ksbId, userType);

        if (!user || !user.password) {
          return res.json({
            success: false,
            showSettings: true,
            message: "No offline password available",
            location,
          });
        }

        if (user.password === "EMPTY_PASSWORD_ALLOWED" && !password) {
          return res.json({
            success: true,
            showSettings: user.showSettings === 1,
            message: "Offline authentication successful",
            location,
          });
        }

        const match =
          password && (await bcrypt.compare(password, user.password));

        if (match) {
          const currentAuthCount = (user.authenticateCount || 0) + 1;
          await userAuthModel.updateUser(deviceId, ksbId, userType, {
            authenticateCount: currentAuthCount,
            showSettings: currentAuthCount < 2 ? 1 : 0,
            last_entered_time: new Date().toISOString(),
            ip_address: clientIp,
            location,
          });

          res.json({
            success: true,
            showSettings: currentAuthCount < 2,
            message: "Offline authentication successful",
            location,
          });
        } else {
          res.json({
            success: false,
            showSettings: true,
            message: "Invalid password",
            location,
          });
        }
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        showSettings: true,
        message: "Server error",
      });
    }
  },
};

module.exports = userAuthController;
