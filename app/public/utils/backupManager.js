// utils/backupManager.js
const fs = require("fs");
const path = require("path");

function backupDatabase(appPath) {
	const isProduction = process.env.NODE_ENV === "production";
	const backendPath = isProduction
		? path.join(process.resourcesPath, "back-app")
		: path.join(appPath, "../back-app");

	const dbPath = path.join(backendPath, "src", "storage.db");
	const backupPath = path.join(backendPath, "src", "storage.db.backup");

	try {
		// Check if the database exists
		if (fs.existsSync(dbPath)) {
			// Create a backup
			fs.copyFileSync(dbPath, backupPath);
			console.log("Database backed up successfully");
			return true;
		}
	} catch (error) {
		console.error("Error backing up database:", error);
	}
	return false;
}

function restoreDatabase(appPath) {
	const isProduction = process.env.NODE_ENV === "production";
	const backendPath = isProduction
		? path.join(process.resourcesPath, "back-app")
		: path.join(appPath, "../back-app");

	const dbPath = path.join(backendPath, "src", "storage.db");
	const backupPath = path.join(backendPath, "src", "storage.db.backup");

	try {
		// Check if backup exists
		if (fs.existsSync(backupPath)) {
			// Check if database is missing or empty
			if (!fs.existsSync(dbPath) || fs.statSync(dbPath).size === 0) {
				// Restore from backup
				fs.copyFileSync(backupPath, dbPath);
				console.log("Database restored from backup");
				return true;
			}
		}
	} catch (error) {
		console.error("Error restoring database:", error);
	}
	return false;
}

module.exports = {
	backupDatabase,
	restoreDatabase,
};
