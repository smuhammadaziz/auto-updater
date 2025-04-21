const { join } = require("path");
const isDev = require("electron-is-dev");

let config = {
	appName: "KSB-POS",
	icon: join(__dirname, "..", "/ksb.ico"),
	tray: null,
	isQuiting: false,
	mainWindow: null,
	popupWindow: null,
	isDev,
};

module.exports = config;

