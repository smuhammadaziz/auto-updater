const axios = require("axios");

module.exports = async (req, res) => {
  const { ksb_id, device_id } = req.params;
  const { ipaddress, database, username, password } = req.body;

  const url = `http://${ipaddress}/${database}/hs/ksbmerp_pos/permission/ksb?text=pos&ksb_id=${ksb_id}&device_id=${device_id}`;

  try {
    const response = await axios.get(url, {
      auth: {
        username: username,
        password: password,
      },
    });

    const device = await response.data;

    if (device.status === "successfully" && device.permission === true) {
      res.json({ status: "successfully" });
    } else if (
      device.status === "successfully" &&
      device.permission === false
    ) {
      res.json({ status: "error" });
    } else if (device.status === "empty") {
      res.json({ status: "empty" });
    } else {
      res.json({ status: "problem" });
    }
  } catch (e) {
    console.log(e);
    res.status(500).json({ status: "error", message: e.message });
  }
};
