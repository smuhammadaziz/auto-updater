const express = require("express");
const cors = require("cors");
const fs = require("fs-extra");
const path = require("path");

const ksbRoutes = require("./routes/ksbRoutes");
const authRoutes = require("./routes/userAuthRoutes");
const productRoutes = require("./routes/productRoutes");
const registerRoutes = require("./routes/deviceRoutes");
const activeUsersRoutes = require("./routes/activeUserRoutes");
const passwordRoutes = require("./routes/passwordRoutes");
const enterpriseRoutes = require("./routes/enterPriseRoutes");
const clientRoutes = require("./routes/clientRoutes");
const removeRoutes = require("./routes/removeRoutes");
const userSettingsRoutes = require("./routes/userSettingsRoutes");
const currencyRoutes = require("./routes/currencyRoutes");
const salesRoutes = require("./routes/salesRoutes");
const saveSalesRoutes = require("./routes/saveSalesRoutes");
const settingsDeviceRoutes = require("./routes/userSettingsDeviceRoutes");
const productUpdateRoutes = require("./routes/productUpdateRoutes");
const printCheck = require("./routes/printCheckRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const productSyncRoutes = require("./routes/productSyncRoutes");
const pingController = require("./routes/pingRoutes");


const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", ksbRoutes);
app.use("/api", authRoutes);
app.use("/api", productRoutes);
app.use("/api", registerRoutes);
app.use("/api", activeUsersRoutes);
app.use("/api", passwordRoutes);
app.use("/api", enterpriseRoutes);
app.use("/api", clientRoutes);
app.use("/api", removeRoutes);
app.use("/api", userSettingsRoutes);
app.use("/api", currencyRoutes);
app.use("/api", salesRoutes);
app.use("/api", saveSalesRoutes);
app.use("/api", settingsDeviceRoutes);
app.use("/api", productUpdateRoutes);
app.use("/api", printCheck);
app.use("/api", permissionRoutes);
app.use("/api", productSyncRoutes);
app.use("/api", pingController);

module.exports = app;
