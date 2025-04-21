const axios = require("axios");
const { getClientData, deleteClient } = require("../models/clientModel");

exports.getClientByIds = async (req, res) => {
  const { ksbId, deviceId } = req.params;

  try {
    const clientData = await getClientData(ksbId, deviceId);

    if (!clientData) {
      return res.status(404).json({
        message: "Client data not found for the given ksb_id and device_id",
      });
    }

    return res.status(200).json({ data: clientData });
  } catch (error) {
    console.error("Error retrieving client data:", error);
    return res.status(500).json({
      message: "Error retrieving client data",
      error: error.message,
    });
  }
};

exports.deleteClientById = async (req, res) => {
  const { ksbId, deviceId, clientId } = req.params;

  try {
    const response = deleteClient(ksbId, deviceId, clientId, (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json(result);
    });

    const io = req.app.get("io");

    io.emit("gettingClients");
  } catch (error) {
    console.error("Error deleting client:", error);
    return res.status(500).json({
      message: "Error deleting client",
      error: error.message,
    });
  }
};
