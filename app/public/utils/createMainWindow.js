const { BrowserWindow } = require("electron");
const { join } = require("path");
const { autoUpdater } = require("electron-updater");
const remote = require("@electron/remote/main");
const config = require("./config");
const path = require("path");

exports.createMainWindow = async () => {
	const window = new BrowserWindow({
		webPreferences: {
			nodeIntegration: true,
			enableRemoteModule: false,
			devTools: true,
			contextIsolation: false,
			spellcheck: false,
			webSecurity: false,
			partition: "persist:main",
		},
		frame: false,
		icon: config.icon,
		title: config.appName,
		show: false,
		minWidth: 1000,
		minHeight: 700,
		icon: path.join(__dirname, "../../assets/ksb.ico"),
	});

	window.maximize();
	window.show();

	remote.enable(window.webContents);

	// const startUrl = config.isDev
	// 	? "http://localhost:3000"
	// 	: `file://${path.resolve(__dirname, "..", "build", "index.html")}`;

	const startUrl = config.isDev
		? "http://localhost:3000/#/"
		: `file://${path.join(__dirname, "../../build/index.html")}#/`;

	// const startUrl = config.isDev
	// 	? "http://localhost:3000/#"
	// 	: `file://${join(__dirname, "..", "../build/index.html")}#`;

	window.loadURL(startUrl).catch((error) => {
		console.error("Failed to load URL:", error);
		if (!config.isDev) {
			const fallbackPath = path.join(__dirname, "../../build/index.html");
			console.log("Trying fallback path:", fallbackPath);
			window
				.loadFile(fallbackPath)
				.catch((err) => console.error("Fallback load failed:", err));
		}
	});

	// window.webContents.on("will-navigate", (event, url) => {
	// 	event.preventDefault();
	// 	window.loadURL(url);
	// });

	// window.webContents.on(
	// 	"did-fail-load",
	// 	(event, errorCode, errorDescription) => {
	// 		console.error("Failed to load:", errorCode, errorDescription);
	// 	},
	// );

	window.webContents.on("did-finish-load", () => {
		if (!window.webContents.getURL().includes("/")) {
			window.loadURL(startUrl);
		}
	});

	window.once("ready-to-show", () => {
		autoUpdater.checkForUpdatesAndNotify();
	});

	window.on("close", (e) => {
		if (!config.isQuiting) {
			e.preventDefault();
			window.hide();
		}
	});

	return window;
};

