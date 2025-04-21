import React, { useState, useEffect } from "react";
import { FaSpinner, FaCheckCircle } from "react-icons/fa";
import nodeUrl from "../../links";
import { IoCloudDownloadOutline } from "react-icons/io5";
import { MdErrorOutline } from "react-icons/md";
import { MdOutlinePortableWifiOff } from "react-icons/md";
import { NavLink } from "react-router-dom";

import PermissionComponent from "../permissionPage/permission";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

const DownloaderModal = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [downloadStatus, setDownloadStatus] = useState("idle");
	const [error, setError] = useState(null);
	const [isNoInternetModalOpen, setIsNoInternetModalOpen] = useState(false);
	const [showPermission, setShowPermission] = useState(false);
	const [syncProgress, setSyncProgress] = useState({
		recovery: 0,
		deviceData: 0,
		products: 0,
	});

	const [language] = useLang("uz");

	const getStorageItem = (key, required = true) => {
		const value = localStorage.getItem(key);
		if (!value && required) {
			throw new Error(`Missing required value for ${key}`);
		}
		return value;
	};

	const handlePermissionComplete = () => {
		setShowPermission(false);
		setIsModalOpen(true);
	};

	useEffect(() => {
		const showSettingsModal = localStorage.getItem("showSettingsModal");
		const devicePermission = localStorage.getItem("devicePermission");

		if (devicePermission === "0") {
			setShowPermission(true);
		} else if (showSettingsModal === "true") {
			setIsModalOpen(true);
		}
	}, []);

	const checkInternetConnection = () => {
		return new Promise((resolve) => {
			fetch("https://www.google.com", {
				mode: "no-cors",
				cache: "no-store",
			})
				.then(() => resolve(true))
				.catch(() => resolve(false));
		});
	};

	useEffect(() => {
		const showSettingsModal = localStorage.getItem("showSettingsModal");

		const registerDevice = async () => {
			try {
				const requestBody = {
					ksb_id: getStorageItem("ksbIdNumber"),
					device_id: getStorageItem("device_id"),
					name: getStorageItem("device_info"),
					"ipaddress:port": getStorageItem("ipaddress:port"),
					database: getStorageItem("mainDatabase"),
					username: getStorageItem("userType"),
					password:
						localStorage.getItem("userPassword") ===
						"EMPTY_PASSWORD_ALLOWED"
							? ""
							: getStorageItem("userPassword"),
				};

				const response = await fetch(`${nodeUrl}/api/register/device`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(requestBody),
				});

				if (!response.ok) {
					const errorData = await response.json().catch(() => null);
					throw new Error(
						`Device registration failed: ${response.status} ${
							errorData?.message || response.statusText
						}`,
					);
				}

				const data = await response.json();
				console.log("Device registered successfully:", data);
				localStorage.setItem("user_id", data.user_id);
				return true;
			} catch (error) {
				console.error("Register Device Error:", error);
				setError(error.message);
				return false;
			}
		};

		if (showSettingsModal === "true") {
			registerDevice();
		} else {
			console.log("nothing");
		}
	}, []);

	const ksb_id = getStorageItem("ksbIdNumber");
	const device_id = getStorageItem("device_id");
	const ipaddressPort = getStorageItem("ipaddress:port");
	const mainDatabase = getStorageItem("mainDatabase");
	const basicUsername = getStorageItem("userType");
	const basicPassword = getStorageItem("userPassword");

	const handleRecovery = async () => {
		const apiBody = {
			"ipaddress:port": ipaddressPort,
			database: mainDatabase,
			username: basicUsername,
			password: basicPassword,
		};

		try {
			const response = await fetch(
				`${nodeUrl}/api/recovery/data/${ksb_id}/${device_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(apiBody),
				},
			);

			const data = await response.json();

			console.log(data);

			return data;
		} catch (err) {
			console.log(err);
		}
	};

	const fetchDeviceData = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/first/sync/${ksb_id}/${device_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"ipaddress:port": ipaddressPort,
						database: mainDatabase,
						userName: basicUsername,
						userPassword: basicPassword,
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(
					`Data sync failed: ${response.status} ${
						errorData?.message || response.statusText
					}`,
				);
			}

			const data = await response.json();
			if (!data) {
				throw new Error("Received empty response from sync API");
			}

			console.log("Sync completed successfully:", data);
			return data;
		} catch (error) {
			console.error("Fetch Device Data Error:", error);
			setError(error.message);
			throw error;
		}
	};

	const upsertUpdatedProducts = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/update/product_update/data/${device_id}/${ksb_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error(
					`Data sync failed: ${response.status} ${
						errorData?.message || response.statusText
					}`,
				);
			}

			const data = await response.json();

			if (!data) {
				throw new Error("Received empty response from sync API");
			}

			if (data) {
				console.log("Creating products successfully:", data);
			}
			return data;
		} catch (error) {
			console.error("Fetch Device Data Error:", error);
			setError(error.message);
			throw error;
		}
	};

	const animateProgress = (key, targetValue, duration = 3000) => {
		let start = 0;
		const steps = 100;
		const increment = targetValue / steps;
		const stepDuration = duration / steps;

		const animate = () => {
			if (start < targetValue) {
				start += increment;
				setSyncProgress((prev) => ({
					...prev,
					[key]: Math.min(Math.round(start), targetValue),
				}));
				setTimeout(animate, stepDuration);
			}
		};

		animate();
	};

	const startDownload = async () => {
		const isInternetAvailable = await checkInternetConnection();

		if (!isInternetAvailable) {
			setIsNoInternetModalOpen(true);
			return;
		}

		setDownloadStatus("downloading");
		setError(null);
		setSyncProgress({ recovery: 0, deviceData: 0, products: 0 });

		try {
			animateProgress("recovery", 100, 20000);
			const responseRecovery = await handleRecovery();

			if (responseRecovery.status === "successfully") {
				animateProgress("deviceData", 100, 40000);
				const responseDeviceData = await fetchDeviceData();

				if (
					responseDeviceData.message === "Data processed successfully"
				) {
					animateProgress("products", 100, 20000);
					await upsertUpdatedProducts();

					setDownloadStatus("completed");
					localStorage.setItem("showSettingsModal", "false");
				} else {
					throw new Error("device data failed");
				}
			} else {
				throw new Error("Recovery failed");
			}
		} catch (error) {
			console.error("Download process failed:", error);
			setDownloadStatus("error");
			setError(error.message);
		}
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setDownloadStatus("idle");
		setError(null);
	};

	const userId = localStorage.getItem("user_id");

	const handleDeleteItems = async () => {
		if (!ksb_id || !device_id) {
			console.log("Missing ksbIdNumber or device_id in localStorage.");
			return;
		}

		try {
			const response = await fetch(
				`${nodeUrl}/api/remove/items/${device_id}/${ksb_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"ipaddress:port": ipaddressPort,
						database: mainDatabase,
						userName: basicUsername,
						userPassword: basicPassword,
					}),
				},
			);

			const data = await response.json();

			console.log(data.message);
			if (data.time) {
				localStorage.setItem("lastSyncedTime", data.time);
			}
		} catch (error) {
			console.log(error);
		}
	};

	const handleUserSettings = async () => {
		if (!ksb_id || !device_id) {
			alert("Missing ksb_idNumber or device_id in localStorage.");
			return;
		}

		try {
			const responseSettings = await fetch(
				`${nodeUrl}/api/get/settings/${device_id}/${ksb_id}`,
			);

			const responseCash = await fetch(
				`${nodeUrl}/api/get/cash/${device_id}/${ksb_id}`,
			);

			const responseSettingsDevice = await fetch(
				`${nodeUrl}/api/get/settings/device/${device_id}/${ksb_id}`,
			);

			const settingsData = await responseSettings.json();
			const cashData = await responseCash.json();
			const settingsDeviceData = await responseSettingsDevice.json();

			const exactUser = settingsData.find(
				(user) => user.user_id === userId,
			);

			if (exactUser) {
				localStorage.setItem(
					"settingsWarehouse",
					JSON.stringify(exactUser.warehouse),
				);
				localStorage.setItem(
					"settingsPriceType",
					JSON.stringify(exactUser.price_types),
				);
				localStorage.setItem(
					"settingsCash",
					JSON.stringify(exactUser.cash),
				);
				localStorage.setItem("settingsCurrency", exactUser.currency);
				localStorage.setItem(
					"settingsMaxDiscount",
					exactUser.max_discount,
				);
				localStorage.setItem("userChangePrice", exactUser.change_price);
				localStorage.setItem("userViewBuy", exactUser.view_buy);
				localStorage.setItem(
					"settingsDevice",
					JSON.stringify(settingsDeviceData),
				);
			} else {
				console.log("User not found in settingsData.");
			}

			localStorage.setItem("settingsCashData", JSON.stringify(cashData));
		} catch (err) {
			console.log(err);
		}
	};

	const handleSetCurrency = async () => {
		if (!ksb_id || !device_id) {
			console.log("Missing ksb_idNumber or device_id in localStorage.");
			return;
		}

		try {
			const response = await fetch(
				`${nodeUrl}/api/get/currency/rate/${device_id}/${ksb_id}`,
			);

			const data = await response.json();

			localStorage.setItem("currency_rate", JSON.stringify(data));
		} catch (error) {
			console.log(error);
		}
	};

	if (showPermission) {
		return <PermissionComponent onComplete={handlePermissionComplete} />;
	}

	if (!isModalOpen) return null;

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[444]">
			<div className="bg-white w-100 rounded-lg shadow-xl p-8 relative">
				{downloadStatus === "idle" && (
					<div className="w-[500px] p-2 bg-white rounded-xl">
						<div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mb-6">
							<IoCloudDownloadOutline className="text-5xl text-blue-600" />
						</div>

						<h2 className="text-3xl font-bold text-gray-800 mb-4">
							{content[language].firstSync.downloadSettings}
						</h2>

						<p className="text-gray-600 text-lg mb-8 leading-relaxed">
							{content[language].firstSync.clickToBelow}.{" "}
							<span className="">
								{content[language].intro.needTime}
							</span>
						</p>

						<button
							onClick={startDownload}
							className="w-full bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 
									 transition-all duration-300 transform hover:scale-[1.02] 
									 flex items-center justify-center space-x-3 font-semibold text-lg
									 shadow-lg hover:shadow-xl"
						>
							<IoCloudDownloadOutline className="text-2xl" />
							<span>{content[language].firstSync.startSync}</span>
						</button>
					</div>
				)}

				{downloadStatus === "downloading" && (
					<div className="text-center w-[500px] p-8 bg-white rounded-lg">
						<div className="flex justify-center items-center mb-8">
							<FaSpinner className="animate-spin text-blue-600 text-5xl" />
						</div>

						<div className="space-y-6">
							{/* Recovery Status */}
							<div className="relative">
								<div className="flex justify-between mb-2">
									<span className="text-sm font-medium text-gray-700">
										{
											content[language].intro
												.recoveryYourInformation
										}
									</span>
									<span className="text-sm font-medium text-blue-600">
										{syncProgress.recovery}%
									</span>
								</div>
								<div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
									<div
										className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
										style={{
											width: `${syncProgress.recovery}%`,
											boxShadow:
												"0 0 10px rgba(37, 99, 235, 0.5)",
										}}
									></div>
								</div>
							</div>

							{/* Fetch Device Data Status */}
							<div className="relative">
								<div className="flex justify-between mb-2">
									<span className="text-sm font-medium text-gray-700">
										{content[language].intro.fetchingDevice}
									</span>
									<span className="text-sm font-medium text-blue-600">
										{syncProgress.deviceData}%
									</span>
								</div>
								<div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
									<div
										className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
										style={{
											width: `${syncProgress.deviceData}%`,
											boxShadow:
												"0 0 10px rgba(37, 99, 235, 0.5)",
										}}
									></div>
								</div>
							</div>

							{/* Upsert Products Status */}
							<div className="relative">
								<div className="flex justify-between mb-2">
									<span className="text-sm font-medium text-gray-700">
										{
											content[language].intro
												.upsertingProducts
										}
									</span>
									<span className="text-sm font-medium text-blue-600">
										{syncProgress.products}%
									</span>
								</div>
								<div className="w-full bg-gray-100 rounded-full h-3 shadow-inner">
									<div
										className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
										style={{
											width: `${syncProgress.products}%`,
											boxShadow:
												"0 0 10px rgba(37, 99, 235, 0.5)",
										}}
									></div>
								</div>
							</div>
						</div>

						<p className="text-gray-600 text-lg mt-8 font-medium">
							{content[language].firstSync.pleaseWait}
						</p>
					</div>
				)}

				{downloadStatus === "completed" && (
					<div className="w-[500px] p-2 bg-white rounded-xl">
						<div className="bg-green-50 rounded-full text-center mx-auto w-16 h-16 flex items-center justify-center mb-6">
							<FaCheckCircle className="text-5xl text-green-500" />
						</div>

						<h2 className="text-3xl font-bold text-gray-800 text-center mb-4">
							{content[language].firstSync.syncComplete}
						</h2>

						<div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-8">
							<p className="text-gray-700 text-lg">
								{
									content[language].firstSync
										.dataSuccessfullySynced
								}
							</p>
						</div>

						<button
							onClick={() => {
								closeModal();
								handleUserSettings();
								handleSetCurrency();
								handleDeleteItems();
							}}
							className="w-full bg-green-500 text-white px-8 py-4 rounded-xl 
									 hover:bg-green-600 transition-all duration-300 
									 transform hover:scale-[1.02] font-semibold text-lg
									 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
						>
							<FaCheckCircle className="text-xl" />
							<span>OK</span>
						</button>
					</div>
				)}

				{downloadStatus === "error" && (
					<div className="text-center w-[500px]">
						<MdErrorOutline className="text-red-500 text-6xl mb-6 flex justify-center mx-auto" />
						<h2 className="text-2xl font-semibold text-gray-800 mb-4">
							{content[language].firstSync.syncFailed}
						</h2>
						<p className="text-red-600 mb-6">{error}</p>
						<div className="flex items-center ">
							<button
								onClick={() => setDownloadStatus("idle")}
								className="w-full mx-3  bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
							>
								{content[language].firstSync.tryAgain}
							</button>
							<NavLink
								to="/intro"
								className="w-full mx-3 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
							>
								{content[language].firstSync.goToKSB}
							</NavLink>
						</div>
					</div>
				)}

				{isNoInternetModalOpen && (
					<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[790] p-4">
						<div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all duration-300 ease-in-out scale-100 opacity-100 p-6 text-center">
							<div className="mb-6">
								<span className="text-center mx-auto justify-center block">
									<MdOutlinePortableWifiOff
										size={70}
										className="text-center text-6xl mx-auto inline-block py-5"
									/>
								</span>
								<h2 className="text-2xl font-bold text-gray-800 mb-2">
									{content[language].firstSync.noInternet}
								</h2>
								<p className="text-gray-600 mb-4">
									{content[language].firstSync.pleaseCheck}
								</p>
							</div>
							<button
								onClick={() => {
									setIsNoInternetModalOpen(false);
									setDownloadStatus("idle");
								}}
								className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-colors duration-300 font-semibold"
							>
								{content[language].firstSync.tryAgain}
							</button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default DownloaderModal;

