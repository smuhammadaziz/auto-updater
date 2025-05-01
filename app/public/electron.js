const { app, BrowserWindow, ipcMain } = require("electron");
const { autoUpdater } = require("electron-updater");
const { createMainWindow } = require("./utils/createMainWindow");
const { createPopupWindow } = require("./utils/createPopupWindow");
const { showNotification } = require("./utils/showNotification");
const AutoLaunch = require("auto-launch");
const remote = require("@electron/remote/main");
const config = require("./utils/config");
const path = require("path");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const log = require("electron-log");

remote.initialize();

if (config.isDev) require("electron-reloader")(module);

// Setup logs for updates
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

// Add this variable to store the backend process
let backendProcess = null;

function startBackend() {
	const isProduction = !config.isDev;
	const backendPath = isProduction
		? path.join(process.resourcesPath, "back-app")
		: path.join(__dirname, "../back-app");

	// First install dependencies
	exec("npm install", { cwd: backendPath }, (error, stdout, stderr) => {
		if (error) {
			console.error(`Error installing dependencies: ${error.message}`);
			return;
		}

		// Then start the server using spawn instead of exec to keep reference
		backendProcess = spawn("npm", ["start"], {
			cwd: backendPath,
			shell: true,
		});

		backendProcess.stdout.on("data", (data) => {
			console.log(`Backend stdout: ${data}`);
		});

		backendProcess.stderr.on("data", (data) => {
			console.error(`Backend stderr: ${data}`);
		});

		backendProcess.on("error", (error) => {
			console.error(`Error starting backend: ${error.message}`);
		});
	});
}

function terminateBackend() {
	if (backendProcess && !config.isDev) {
		// Only terminate in production mode
		// On Windows, we need to kill the entire process tree
		if (process.platform === "win32") {
			exec(`taskkill /pid ${backendProcess.pid} /T /F`, (error) => {
				if (error) {
					console.error("Error killing backend process:", error);
				}
			});
		} else {
			backendProcess.kill("SIGTERM");
		}
	}
}

app.on("ready", async () => {
	startBackend();

	config.mainWindow = await createMainWindow();

	config.mainWindow.on("close", (e) => {
		if (!config.isQuiting) {
			e.preventDefault();
			config.mainWindow.hide();
		} else {
			config.mainWindow.webContents.executeJavaScript(`
				localStorage.setItem('lastSessionTime', Date.now());
			`);
		}
	});

	showNotification(
		config.appName,
		"Application running on background! See application tray.",
	);

	// 🔥 Auto-updater checks (only if packaged)
	if (app.isPackaged) {
		autoUpdater.autoDownload = false;

		autoUpdater.checkForUpdatesAndNotify().catch((err) => {
			log.error("Error checking for updates", err);
			config.mainWindow.webContents.send(
				"update-error",
				`Update Error: ${err.message}`,
			);
		});

		autoUpdater.on("update-available", (info) => {
			log.info("Update available:", info);
			config.mainWindow.webContents.send("update-available", info);
		});

		autoUpdater.on("download-progress", (progress) => {
			config.mainWindow.webContents.send("download-progress", progress);
		});

		autoUpdater.on("update-downloaded", (info) => {
			log.info("Update downloaded:", info);
			config.mainWindow.webContents.send("update-downloaded", info);
		});

		autoUpdater.on("error", (err) => {
			log.error("AutoUpdater error:", err);
			const message = err?.message || "Unknown update error";
			config.mainWindow.webContents.send("update-error", message);
		});
	}
});

// 🧠 IPC listeners from Renderer
ipcMain.on("start-download", () => {
	log.info("Start downloading update...");
	autoUpdater.downloadUpdate().catch((err) => {
		log.error("Download update error:", err);
		config.mainWindow.webContents.send("update-error", err.message);
	});
});

ipcMain.on("quit-and-install", () => {
	log.info("Quitting and installing update...");
	// terminateApplication();
	setTimeout(() => {
		autoUpdater.quitAndInstall(false, true);
	}, 500);
});

ipcMain.on("app_version", (event) => {
	event.sender.send("app_version", { version: app.getVersion() });
});

app.on("before-quit", () => {
	config.isQuiting = true;
	terminateBackend();
	// Force close any windows that might be open
	BrowserWindow.getAllWindows().forEach((window) => {
		if (!window.isDestroyed()) {
			window.destroy();
		}
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0)
		config.mainWindow = createMainWindow();
});

