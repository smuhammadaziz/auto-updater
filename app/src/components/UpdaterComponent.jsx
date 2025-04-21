import React, { useState, useEffect } from "react";

function UpdateNotification() {
	const [isVisible, setIsVisible] = useState(false);
	const [updateInfo, setUpdateInfo] = useState(null);
	const [progressInfo, setProgressInfo] = useState(null);
	const [isDownloaded, setIsDownloaded] = useState(false);
	const [errorMessage, setErrorMessage] = useState(null);

	useEffect(() => {
		if (!window.electronAPI) {
			console.warn("window.electronAPI is not available");
			return;
		}

		const handleUpdateAvailable = (info) => {
			console.log("Update available:", info);
			setUpdateInfo(info);
			setIsVisible(true);
			setIsDownloaded(false);
			setProgressInfo(null);
			setErrorMessage(null);
		};

		const handleDownloadProgress = (progress) => {
			console.log("Download progress:", progress);
			setProgressInfo(progress);
		};

		const handleUpdateDownloaded = (info) => {
			console.log("Update downloaded:", info);
			setIsDownloaded(true);
			setProgressInfo(null);
		};

		const handleUpdateError = (message) => {
			console.error("Update error:", message);
			setErrorMessage(
				`Update Error: ${message}. Please try again later or restart the app.`,
			);
			setIsVisible(true);
			setIsDownloaded(false);
			setProgressInfo(null);
		};

		window.electronAPI.onUpdateAvailable(handleUpdateAvailable);
		window.electronAPI.onDownloadProgress(handleDownloadProgress);
		window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded);
		window.electronAPI.onUpdateError(handleUpdateError);

		return () => {
			window.electronAPI.removeAllListeners("update-available");
			window.electronAPI.removeAllListeners("download-progress");
			window.electronAPI.removeAllListeners("update-downloaded");
			window.electronAPI.removeAllListeners("update-error");
		};
	}, []);

	const startDownload = () => {
		setErrorMessage(null);
		setProgressInfo({ percent: 0 });
		window.electronAPI.startDownload();
	};

	const restartApp = () => {
		window.electronAPI.quitAndInstall();
	};

	const closeNotification = () => {
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
			<div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-sm w-full">
				<h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
					{isDownloaded
						? "Update Ready to Install"
						: "Update Available"}
				</h2>

				{errorMessage && (
					<p className="text-red-500 text-sm mb-3">{errorMessage}</p>
				)}

				{updateInfo &&
					!isDownloaded &&
					!progressInfo &&
					!errorMessage && (
						<p className="text-gray-700 dark:text-gray-300 mb-4">
							Version {updateInfo.version} is available. Do you
							want to download it now?
						</p>
					)}

				{progressInfo && !isDownloaded && (
					<div className="mb-4">
						<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
							Downloading... {Math.round(progressInfo.percent)}%
						</p>
						<div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
							<div
								className="bg-blue-600 h-2.5 rounded-full transition-width duration-150 ease-linear"
								style={{ width: `${progressInfo.percent}%` }}
							></div>
						</div>
					</div>
				)}

				{isDownloaded && (
					<p className="text-gray-700 dark:text-gray-300 mb-4">
						The update has been downloaded. Restart the application
						to apply the changes.
					</p>
				)}

				<div className="flex justify-end space-x-3">
					{!isDownloaded && !progressInfo && !errorMessage && (
						<>
							<button
								onClick={closeNotification}
								className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 text-sm font-medium"
							>
								Later
							</button>
							<button
								onClick={startDownload}
								className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
							>
								Download Now
							</button>
						</>
					)}
					{progressInfo && !isDownloaded && (
						<span className="text-sm text-gray-500">
							Downloading...
						</span>
					)}
					{isDownloaded && (
						<button
							onClick={restartApp}
							className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
						>
							Restart & Apply Update
						</button>
					)}
					{errorMessage && (
						<button
							onClick={closeNotification}
							className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500 text-sm font-medium"
						>
							Close
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

export default UpdateNotification;

