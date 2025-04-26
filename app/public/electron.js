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
const { backupDatabase, restoreDatabase } = require("./utils/backupManager");

remote.initialize();

if (config.isDev) require("electron-reloader")(module);

// Setup logs for updates
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
log.info("App starting...");

// Add this variable to store the backend process
let backendProcess = null;

function clearProductionDatabase() {
	// Remove this function completely or modify it to not delete your database
	// This function is likely causing your data loss issue
	console.log("Database preservation enabled - skipping database clear");
	return; // Don't clear the database
}

function startBackend() {
	const isProduction = !config.isDev;
	const backendPath = isProduction
		? path.join(process.resourcesPath, "back-app")
		: path.join(__dirname, "../back-app");

	// Check if the database exists and restore from backup if needed
	restoreDatabase(__dirname);

	exec("npm install", { cwd: backendPath }, (error, stdout, stderr) => {
		if (error) {
			console.error(`Error installing dependencies: ${error.message}`);
			return;
		}

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

		// Keep track of the database after backend starts
		backupDatabase(__dirname);
	});
}

function terminateApplication() {
	// Set quitting flag before anything else
	config.isQuiting = true;

	// Save any important data before quitting
	if (config.mainWindow && !config.mainWindow.isDestroyed()) {
		config.mainWindow.webContents.executeJavaScript(`
		localStorage.setItem('lastSessionTime', Date.now());
	  `);
	}

	// Force quit all windows
	BrowserWindow.getAllWindows().forEach((window) => {
		if (!window.isDestroyed()) {
			window.destroy();
		}
	});

	// Terminate backend
	terminateBackend();
}

function terminateBackend() {
	if (backendProcess) {
		try {
			if (process.platform === "win32") {
				exec(`taskkill /pid ${backendProcess.pid} /T /F`, (error) => {
					if (error) {
						console.error("Error killing backend process:", error);
					}
				});
			} else {
				backendProcess.kill("SIGTERM");
			}
		} catch (error) {
			console.error("Error terminating backend:", error);
		}
	}
}

app.on("ready", async () => {
	// Remove the clearProductionDatabase call
	// clearProductionDatabase(); <- Remove this line

	backupDatabase(__dirname);

	restoreDatabase(__dirname);

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

	// Auto-updater checks (only if packaged)
	if (app.isPackaged) {
		autoUpdater.autoDownload = false;

		// Add these configs
		autoUpdater.autoInstallOnAppQuit = true;
		autoUpdater.allowDowngrade = false;
		autoUpdater.allowPrerelease = false;

		autoUpdater.checkForUpdatesAndNotify().catch((err) => {
			log.error("Error checking for updates", err);
			config.mainWindow.webContents.send(
				"update-error",
				`Update Error: ${err.message}`,
			);
		});

		// Rest of your event handlers...
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
	terminateApplication();

	// Use a timeout to ensure app has time to clean up
	setTimeout(() => {
		autoUpdater.quitAndInstall(true, true);
	}, 1000);
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

if (process.argv.includes("--updated")) {
	// This is a fresh launch after update, clean up any old processes
	if (process.platform === "win32") {
		const appName = path.basename(app.getPath("exe"));
		exec(
			`wmic process where "name='${appName}' and not processid='${process.pid}'" delete`,
			(error) => {
				if (error)
					console.error("Error cleaning old processes:", error);
			},
		);
	}
}

