import React, { useState, useEffect, useRef } from "react";
import content from "../../localization/content";
import useLang from "../../hooks/useLang";
import { IoSync } from "react-icons/io5";
import { FiLoader } from "react-icons/fi";
import { MdOutlinePortableWifiOff } from "react-icons/md";
import { IoCloudDone } from "react-icons/io5";

import {
	HiOutlineCog6Tooth,
	HiChevronDown,
	HiOutlineArrowRightOnRectangle,
	HiOutlineUserCircle,
} from "react-icons/hi2";
import moment from "moment";

import { MdOutlineCurrencyExchange } from "react-icons/md";

import nodeUrl from "../../links";
import useNetworkStatus from "../../hooks/useNetworkStatus";
import { NavLink } from "react-router-dom";
import PermissionComponent from "../../components/permissionPage/permission";

function HeaderInner({ onRefresh, socket }) {
	const { isOnline, networkStatus, checkNetworkConnection } =
		useNetworkStatus();

	const [language, setLanguage] = useLang("uz");
	const [isSyncing, setIsSyncing] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [rate, setRate] = useState([]);
	const [isNoInternetModalOpen, setIsNoInternetModalOpen] = useState(false);

	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));

	const ksbId = localStorage.getItem("ksbIdNumber");
	const deviceId = localStorage.getItem("device_id");
	const basicUsername = localStorage.getItem("userType");
	let basicPassword = localStorage.getItem("userPassword");
	const ipaddressPort = localStorage.getItem("ipaddress:port");
	const mainDatabase = localStorage.getItem("mainDatabase");
	const userId = localStorage.getItem("user_id");

	const [isOpen, setIsOpen] = useState(false);

	if (basicPassword === "EMPTY_PASSWORD_ALLOWED") {
		basicPassword = "";
	}

	const handleLanguageChange = (e) => {
		setLanguage(e.target.value);
	};

	const checkInternetConnection = async () => {
		try {
			const online = window.navigator.onLine;
			console.log("Navigator online status:", online);

			if (!online) {
				console.log(
					"No internet connection detected via navigator.onLine.",
				);
				return false;
			}

			const ksbId = localStorage.getItem("ksbIdNumber");
			const ipaddressPort = localStorage.getItem("ipaddress:port");
			const mainDatabase = localStorage.getItem("mainDatabase");
			const userType = localStorage.getItem("userType");
			const userPassword = localStorage.getItem("userPassword");

			const currentBody = {
				"ipaddress:port": ipaddressPort,
				database: mainDatabase,
				username: userType,
				password: userPassword,
			};

			const response = await fetch(`${nodeUrl}/api/check/ping/${ksbId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(currentBody),
			});

			console.log("Response status:", response.status);

			return response.status === 200;
		} catch (error) {
			console.error("Error during internet connection check:", error);
			return false;
		}
	};

	const handleSync = async () => {
		const hasInternet = await checkInternetConnection();

		if (!hasInternet) {
			setIsNoInternetModalOpen(true);
			return;
		}

		if (!ksbId || !deviceId) {
			alert("Missing ksbIdNumber or device_id in localStorage.");
			return;
		}

		setIsSyncing(true);

		try {
			const syncResponse = await fetch(
				`${nodeUrl}/api/syncing/${ksbId}/${deviceId}`,
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

			setIsModalOpen(true);
			if (onRefresh) onRefresh();
		} catch (error) {
			console.error("Sync error:", error);
			setIsNoInternetModalOpen(true);
		} finally {
			setIsSyncing(false);
		}
	};

	const upsertUpdatedProducts = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/update/product_update/data/${deviceId}/${ksbId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				const errorData = await response.json().catch(() => null);
				throw new Error("Upserting products");
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
		}
	};

	const handleDeleteItems = async () => {
		if (!ksbId || !deviceId) {
			console.log("Missing ksbIdNumber or device_id in localStorage.");
			return;
		}

		try {
			const response = await fetch(
				`${nodeUrl}/api/remove/items/${deviceId}/${ksbId}`,
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
		if (!ksbId || !deviceId) {
			alert("Missing ksbIdNumber or device_id in localStorage.");
			return;
		}

		try {
			const responseSettings = await fetch(
				`${nodeUrl}/api/get/settings/${deviceId}/${ksbId}`,
			);

			const responseCash = await fetch(
				`${nodeUrl}/api/get/cash/${deviceId}/${ksbId}`,
			);

			const responseSettingsDevice = await fetch(
				`${nodeUrl}/api/get/settings/device/${deviceId}/${ksbId}`,
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
		if (!ksbId || !deviceId) {
			console.log("Missing ksbIdNumber or device_id in localStorage.");
			return;
		}

		try {
			const response = await fetch(
				`${nodeUrl}/api/get/currency/rate/${deviceId}/${ksbId}`,
			);

			const data = await response.json();
			console.log("currency", data);

			localStorage.setItem("currency_rate", JSON.stringify(data));
		} catch (error) {
			console.log(error);
		}
	};

	const [displayMessage, setDisplayMessage] = useState(`-`);

	useEffect(() => {
		const updateCurrencyRate = () => {
			const currencyRateDataStr = localStorage.getItem("currency_rate");

			if (!currencyRateDataStr) {
				setDisplayMessage(`-`);
				return;
			}

			let currencyRateData;
			try {
				currencyRateData = JSON.parse(currencyRateDataStr);
			} catch (err) {
				console.error("Error parsing currency data:", err);
				setDisplayMessage(`-`);
				return;
			}

			if (
				currencyRateData &&
				currencyRateData.ksb_id === ksbId &&
				currencyRateData.uzs &&
				currencyRateData.usd &&
				currencyRateData.uzsName &&
				currencyRateData.usdName
			) {
				let usdNum = parseFloat(currencyRateData.usd);
				let formattedUsd = usdNum.toLocaleString("ru-RU", {
					minimumFractionDigits: 2,
					maximumFractionDigits: 2,
				});

				setDisplayMessage(
					`${currencyRateData.uzs} ${currencyRateData.usdName} = ${formattedUsd} ${currencyRateData.uzsName}`,
				);
			} else {
				setDisplayMessage(`-`);
			}
		};

		updateCurrencyRate();

		const intervalId = setInterval(updateCurrencyRate, 1000);

		return () => clearInterval(intervalId);
	}, []);

	const ksb_id = localStorage.getItem("ksbIdNumber");

	const makeApiRequest = async () => {
		try {
			const response = await fetch(`${nodeUrl}/api/${ksb_id}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Connection: "keep-alive",
				},
				keepalive: true,
			});

			const data = await response.json();
			if (data.response?.its) {
				const deadlineDate = new Date(data.response.its);
				const year = deadlineDate.getFullYear();
				const month = String(deadlineDate.getMonth() + 1).padStart(
					2,
					"0",
				);
				const day = String(deadlineDate.getDate()).padStart(2, "0");

				const formattedDeadline = `${year}-${month}-${day}T09:59:59`;

				localStorage.setItem("its_deadline", formattedDeadline);

				// Optional: reload if still before the deadline
				if (new Date() < new Date(formattedDeadline)) {
					window.location.reload();
				}
			} else {
				console.log("No ITS date found in response");
			}
		} catch (error) {
			console.log("API request error:", error);
			return null;
		}
	};

	const [isPermissionModalOpen, setisPermissionModalOpen] = useState(false);

	const handleFetchData = async () => {
		const ipaddress = localStorage.getItem("ipaddress:port");
		const database = localStorage.getItem("mainDatabase");
		const username = localStorage.getItem("userType");
		const userpassword = localStorage.getItem("userPassword");

		const ksb_id = localStorage.getItem("ksbIdNumber");
		const device_id = localStorage.getItem("device_id");

		try {
			const response = await fetch(
				`${nodeUrl}/api/permission/${ksb_id}/${device_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						ipaddress: ipaddress,
						database: database,
						username: username,
						password: userpassword,
					}),
				},
			);

			const data = await response.json();

			console.log(data);

			if (data.status === "successfully") {
				localStorage.setItem("devicePermission", "1");
			} else if (data.status === "error") {
				localStorage.setItem("devicePermission", "0");
				setisPermissionModalOpen(true);
			} else if (data.status === "empty") {
				localStorage.setItem("devicePermission", "0");
				setisPermissionModalOpen(true);
			} else {
				localStorage.setItem("devicePermission", "0");
				setisPermissionModalOpen(true);
			}
		} catch (err) {
			console.log("error getting permission");
		}
	};

	const getLastSyncedTime = () => {
		const raw = localStorage.getItem("lastSyncedTime");

		if (raw && moment(raw).isValid()) {
			return moment(raw);
		} else {
			return moment("2025-01-01T10:00:00");
		}
	};

	const lastSyncedTime = getLastSyncedTime();

	const errorButtonRef = useRef(null);

	useEffect(() => {
		if (isModalOpen && errorButtonRef.current) {
			errorButtonRef.current.focus();
		}
	}, [isModalOpen]);

	return (
		<>
			<header className="flex justify-between items-center px-4 py-3 bg-gray-900 shadow-xl border-b border-gray-800 transition-all duration-500">
				<div
					className={`h-2 w-2 rounded-full absolute top-2 left-2 ${
						isOnline ? "bg-green-500" : "bg-red-500"
					}`}
					title={`Network: ${isOnline ? "Online" : "Offline"}`}
				/>

				<button
					className={`text-white px-6 py-2.5 rounded-xl flex items-center transition-all duration-300 ${
						isSyncing
							? "bg-gray-700"
							: "bg-gray-500/50 hover:bg-gray-700/50"
					}`}
					onClick={() => {
						handleSync();

						upsertUpdatedProducts();
					}}
					disabled={isSyncing}
				>
					{isSyncing ? (
						<>
							<FiLoader
								size={20}
								className="animate-spin text-blue-400 mr-2"
							/>
							<span className="font-medium">
								Синхронизация...
							</span>
						</>
					) : (
						<>
							<IoSync size={20} className="text-blue-400 mr-2" />
							<span className="font-medium">Синхронизация</span>
						</>
					)}
				</button>

				<div className="flex">
					<p className="text-white text-base mr-2">
						{content[language].headerProfile.lastSync}{" "}
					</p>
					<p className="text-white text-base">
						{lastSyncedTime
							? lastSyncedTime.format("LLL")
							: "2025-01-01T10:00:00"}
					</p>
				</div>

				<div className="flex items-center gap-x-6 relative">
					<div className="relative group">
						<select
							value={language}
							onChange={handleLanguageChange}
							className="appearance-none z-[50] bg-gray-700/50 text-white text-lg font-medium px-6 py-2 rounded-lg shadow-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-600/50 transition-all duration-300 ease-in-out w-40 backdrop-blur-sm"
						>
							<option
								value="ru"
								className="py-4 text-xl bg-gray-800 text-white"
							>
								{content[language].innerLayout.rus}
							</option>
							<option
								value="uz"
								className="py-4 text-xl bg-gray-800 text-white"
							>
								{content[language].innerLayout.uz}
							</option>
						</select>
						<span className="absolute top-1/2 transform -translate-y-1/2 right-4 text-white pointer-events-none transition-transform duration-300 group-hover:translate-y-[-45%]">
							&#x25BC;
						</span>
					</div>

					<div className="text-white text-lg font-medium flex items-center gap-2 bg-gray-800/40 px-4 py-2 rounded-lg hover:bg-gray-700/40 transition-colors duration-300">
						{/* <MdOutlineCurrencyExchange className="text-xl text-green-400" /> */}
						{displayMessage}
					</div>
					<div
						onClick={() => setIsOpen(!isOpen)}
						className="text-white text-md font-medium flex items-center gap-2 bg-gray-400/40 px-6 py-2 rounded-lg hover:bg-gray-600/40 transition-colors duration-300 cursor-pointer"
					>
						<HiOutlineUserCircle className="text-xl" />
						<span>{basicUsername || "Loading..."}</span>
						<HiChevronDown
							className={`text-base transition-transform duration-200 ${
								isOpen ? "rotate-180" : ""
							}`}
						/>
					</div>
				</div>
			</header>

			{isPermissionModalOpen && <PermissionComponent />}

			{isOpen && (
				<div className="absolute right-3 w-56 bg-white rounded-lg shadow-xl py-2 z-[50] border border-gray-200">
					<NavLink
						to="/settings"
						className="w-full px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
					>
						<HiOutlineCog6Tooth className="text-xl text-gray-600" />
						<div className="flex flex-col items-start">
							<span className="font-medium">
								{content[language].headerProfile.settings}
							</span>
							<span className="text-xs text-gray-500">
								{content[language].headerProfile.configure}
							</span>
						</div>
					</NavLink>
					<div className="h-[1px] bg-gray-200 my-1"></div>
					<NavLink
						to="/login"
						className="w-full px-6 py-3 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-3 transition-colors duration-200"
					>
						<HiOutlineArrowRightOnRectangle className="text-xl text-red-500" />
						<div className="flex flex-col items-start">
							<span className="font-medium">
								{content[language].headerProfile.logout}
							</span>
							<span className="text-xs text-gray-500">
								{content[language].headerProfile.logtext}
							</span>
						</div>
					</NavLink>
				</div>
			)}

			{isSyncing && (
				<div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[790]">
					<div className="relative w-full max-w-md p-8 bg-white rounded-2xl shadow-lg flex flex-col items-center">
						<IoSync className="animate-spin text-blue-500 text-5xl mb-4" />
						<p className="text-black text-center text-md">
							Синхронизация...
						</p>
					</div>
				</div>
			)}

			{isModalOpen && (
				<div
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setIsModalOpen(false);
							handleDeleteItems();
							handleUserSettings();
							handleSetCurrency();
							makeApiRequest();
							handleFetchData();
						}
					}}
					className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[790]"
				>
					<div className="bg-white rounded-lg px-4 py-8 max-w-md w-full text-center">
						<h2 className="text-5xl text-center flex justify-center mx-auto font-semibold text-gray-800 mb-4">
							<IoCloudDone />
						</h2>
						<h2 className="text-2xl font-semibold text-gray-800 mb-4">
							{content[language].syncing.complete}
						</h2>
						<p className="text-gray-600 mb-6">
							{content[language].syncing.data}
						</p>
						<button
							ref={errorButtonRef}
							className="bg-blue-500 text-white px-12 uppercase py-2 rounded-lg hover:bg-blue-600 transition-all duration-300"
							onClick={() => {
								setIsModalOpen(false);
								handleDeleteItems();
								handleUserSettings();
								handleSetCurrency();
								makeApiRequest();
								handleFetchData();
							}}
						>
							{content[language].syncing.close}
						</button>
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
									className="text-center mx-auto inline-block py-5"
								/>
							</span>
							<h2 className="text-2xl font-bold text-gray-800 mb-2">
								{content[language].noInternet?.title ||
									"No Internet Connection"}
							</h2>
							<p className="text-gray-600 mb-4">
								{content[language].noInternet?.message ||
									"Please check your network connection and try again."}
							</p>
						</div>
						<button
							onClick={() => setIsNoInternetModalOpen(false)}
							className="w-full bg-blue-500 text-white py-3 rounded-xl hover:bg-blue-600 transition-colors duration-300 font-semibold"
						>
							{content[language].noInternet?.close || "Close"}
						</button>
					</div>
				</div>
			)}
		</>
	);
}

export default HeaderInner;

