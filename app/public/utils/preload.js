const { ipcRenderer } = require("electron");

// Since context isolation is false and nodeIntegration is true,
// we can directly expose ipcRenderer to the window object
window.ipcRenderer = ipcRenderer;

// Alternatively, we can create our own API similar to what you had before
// but without using contextBridge
window.electronAPI = {
	// Renderer to Main
	startDownload: () => ipcRenderer.send("start-download"),
	quitAndInstall: () => ipcRenderer.send("quit-and-install"),

	// Main to Renderer - handling events
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
};

// This is just for debugging purposes - to confirm preload.js is loaded
console.log("Preload script loaded successfully!");

