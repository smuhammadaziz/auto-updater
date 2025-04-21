const activeUserModel = require("../models/activeUserModel");

const activeUserController = {
  getActiveUsers: async (req, res) => {
    const { device_name, ksb_id } = req.params;

    try {
      const activeUsers = await activeUserModel.getActiveUsers(
        device_name,
        ksb_id
      );

      const filteredActiveUsers = activeUsers.filter(
        (user) => user.password !== "" && user.authenticateCount > 0
      );

      res.status(200).json(filteredActiveUsers);
    } catch (error) {
      console.error("Error retrieving active users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = activeUserController;
