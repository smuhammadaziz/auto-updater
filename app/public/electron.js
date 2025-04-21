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

if (config.isDev) require("electron-reloader")(module);

remote.initialize();

// Add this variable to store the backend process
let backendProcess = null;

function clearProductionDatabase() {
	// Only clear database if we're building for production
	if (process.env.NODE_ENV === "production") {
		const backendPath = path.join(process.resourcesPath, "back-app");
		const dbPath = path.join(backendPath, "src", "storage.db");

		try {
			// Clear the database by writing an empty file
			fs.writeFileSync(dbPath, "");
			console.log("Production database cleared successfully");
		} catch (error) {
			console.error("Error clearing production database:", error);
		}
	}
}

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

// Update the terminateBackend function
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
	clearProductionDatabase();
	startBackend();

	config.mainWindow = await createMainWindow();

	// Add this handler for the close event
	config.mainWindow.on("close", (e) => {
		if (!config.isQuiting) {
			e.preventDefault();
			config.mainWindow.hide(); // Hide instead of close
		} else {
			// Save any pending localStorage data
			config.mainWindow.webContents.executeJavaScript(`
				localStorage.setItem('lastSessionTime', Date.now());
			`);
		}
	});

	showNotification(
		config.appName,
		"Application running on background! See application tray.",
	);
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0)
		config.mainWindow = createMainWindow();
});

ipcMain.on("app_version", (event) => {
	event.sender.send("app_version", { version: app.getVersion() });
});

autoUpdater.on("update-available", () => {
	config.mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
	config.mainWindow.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", () => {
	autoUpdater.quitAndInstall();
});

// Add this to handle the quit event properly
app.on("before-quit", () => {
	config.isQuiting = true;
	terminateBackend();
});

