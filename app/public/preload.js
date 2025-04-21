const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	// Renderer to Main
	startDownload: () => ipcRenderer.send("start-download"),
	quitAndInstall: () => ipcRenderer.send("quit-and-install"),

	// Main to Renderer
	onUpdateAvailable: (callback) => {
		ipcRenderer.on("update-available", (_event, value) => callback(value));
	},
	onDownloadProgress: (callback) => {
		ipcRenderer.on("download-progress", (_event, value) => callback(value));
	},
	onUpdateDownloaded: (callback) => {
		ipcRenderer.on("update-downloaded", (_event, value) => callback(value));
	},
	onUpdateError: (callback) => {
		ipcRenderer.on("update-error", (_event, value) => callback(value));
	},

	// Cleanup
	removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});

