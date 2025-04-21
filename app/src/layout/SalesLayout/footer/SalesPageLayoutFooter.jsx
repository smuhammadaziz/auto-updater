import React, { useState, useEffect, useRef } from "react";
import { FiSettings, FiAlertTriangle } from "react-icons/fi";
import { BsCurrencyDollar } from "react-icons/bs";
import { FiLoader } from "react-icons/fi";
import {
	FaPlus,
	FaTable,
	FaPalette,
	FaLanguage,
	FaTimes,
	FaMoneyBill,
} from "react-icons/fa";
import { IoSync } from "react-icons/io5";
import { ImExit } from "react-icons/im";
import SettingsPanel from "./SettingsPanel";
import TableLayoutModal from "./TableLayoutModal";
import ThemeSettingsModal from "./ThemeSettingsModal";
import LanguageSettingsModal from "./LanguageSettingsModal";
import { NavLink, useNavigate } from "react-router-dom";
import nodeUrl from "../../../links";
import ChangePrice from "./ChangePrice";
import { MdOutlinePortableWifiOff } from "react-icons/md";
import { IoCloudDone } from "react-icons/io5";
import PermissionComponent from "../../../components/permissionPage/permission";
import { HiOutlineCog6Tooth } from "react-icons/hi2";
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import { AiFillCalculator } from "react-icons/ai";

import { v4 as uuidv4 } from "uuid";
import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

import useNetworkStatus from "../../../hooks/useNetworkStatus";

const SalesPageLayoutFooter = ({ socket }) => {
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [activeModal, setActiveModal] = useState(null);
	const [currencies, setCurrencies] = useState([]);
	const [prices, setPrices] = useState([]);
	const [isExitModalOpen, setIsExitModalOpen] = useState(false);
	const navigate = useNavigate();
	const { isOnline, networkStatus, checkNetworkConnection } =
		useNetworkStatus();
	const [isSyncing, setIsSyncing] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isNoInternetModalOpen, setIsNoInternetModalOpen] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	const [isLoading, setIsLoading] = useState(false);

	const [currencyKey, setCurrencyKey] = useState("");
	const [priceTypeKeyData, setPriceTypeKeyData] = useState("");
	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));

	const basicUsername = localStorage.getItem("userType");
	let basicPassword = localStorage.getItem("userPassword");
	const ipaddressPort = localStorage.getItem("ipaddress:port");
	const mainDatabase = localStorage.getItem("mainDatabase");
	const userId = localStorage.getItem("user_id");

	const [language] = useLang("uz");

	const handleChange = (e) => {
		const selectedCurrency = e.target.value;
		const selectedOption = e.target.options[e.target.selectedIndex];

		const matchingCurrencyKey = selectedOption.getAttribute("data-key");

		setCurrencyKey(selectedCurrency);
		localStorage.setItem("currencyKeyKey", matchingCurrencyKey);
		localStorage.setItem("currencyKey", selectedCurrency);
		window.dispatchEvent(new Event("currencyChanged"));
	};

	const handleChangePriceType = (e) => {
		const selectedPriceTypeKey = e.target.value;
		const selectedOption = e.target.options[e.target.selectedIndex];

		const matchingProductByCurrencyRaw = selectedOption.getAttribute(
			"data-product-by-currency",
		);
		const matchingFalseCurrencyValue = selectedOption.getAttribute(
			"data-false-currency",
		);

		const matchingProductByCurrency = matchingProductByCurrencyRaw === "1";

		localStorage.setItem("priceTypeKey", selectedPriceTypeKey);
		localStorage.setItem(
			"matchingProductByCurrency",
			matchingProductByCurrency,
		);
		localStorage.setItem(
			"falseCurrencyBoolean",
			matchingFalseCurrencyValue,
		);

		window.dispatchEvent(new Event("priceTypeChanged"));

		setPriceTypeKeyData(selectedPriceTypeKey);
	};

	const deviceId = localStorage.getItem("device_id");
	const ksbId = localStorage.getItem("ksbIdNumber");

	const [currentSettings, setCurrentSettings] = useState({
		language: "en",
		theme: "light",
		table: { density: "comfortable", fontSize: "medium" },
	});

	const [tempSettings, setTempSettings] = useState(currentSettings);

	const toggleSettings = () => setIsSettingsOpen(!isSettingsOpen);
	const openModal = (modalName) => {
		setActiveModal(modalName);
		setTempSettings(currentSettings);
	};
	const closeModal = () => setActiveModal(null);
	const saveSettings = (key) => {
		setCurrentSettings((prev) => ({ ...prev, [key]: tempSettings[key] }));
		window.location.reload();
		closeModal();
	};

	const settingsOptions = [
		{
			icon: <AiFillCalculator />,
			label: "Нархларни яхлитлаш",
			description: "Configure table appearance",
			onClick: () => openModal("tableLayout"),
		},
	];

	useEffect(() => {
		const fetchCurrencies = async () => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/currency/data/${deviceId}/${ksbId}`,
				);
				if (!response.ok) {
					throw new Error("Failed to fetch currency data");
				}
				const data = await response.json();
				setCurrencies(data);

				const savedCurrencyKey = localStorage.getItem("currencyKey");
				const settingsCurrency =
					localStorage.getItem("settingsCurrency");

				const mainCurrency = data.find(
					(item) => item.item_id === settingsCurrency,
				);

				if (
					savedCurrencyKey &&
					data.some((curr) => curr.item_id === savedCurrencyKey)
				) {
					setCurrencyKey(savedCurrencyKey);
				} else if (data.length > 0) {
					setCurrencyKey(settingsCurrency);
					localStorage.setItem("currencyKey", settingsCurrency);
					localStorage.setItem("currencyKeyKey", mainCurrency.key);
				}
			} catch (error) {
				console.error("Error fetching currencies:", error);
			}
		};

		fetchCurrencies();
	}, [deviceId, ksbId]);

	useEffect(() => {
		const fetchPrices = async () => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/price/data/${deviceId}/${ksbId}`,
				);
				if (!response.ok) {
					throw new Error("Failed to fetch price data");
				}
				const data = await response.json();
				const unarchivedPrice = data.filter(
					(item) => item.archive !== 1,
				);

				setPrices(unarchivedPrice);

				const savedPriceTypeKey = localStorage.getItem("priceTypeKey");

				const priceType = JSON.parse(
					localStorage.getItem("settingsPriceType"),
				);

				const mainPriceType = priceType.find((item) => item.main);

				if (
					savedPriceTypeKey &&
					data.some((price) => price.item_id === savedPriceTypeKey)
				) {
					const savedPrice = data.find(
						(price) => price.item_id === savedPriceTypeKey,
					);
					setPriceTypeKeyData(savedPriceTypeKey);

					localStorage.setItem("priceTypeKey", savedPriceTypeKey);

					localStorage.setItem(
						"matchingProductByCurrency",
						savedPrice.productByCurrency,
					);
					localStorage.setItem(
						"falseCurrencyBoolean",
						savedPrice.currency,
					);
				} else if (data.length > 0) {
					const lastPrice = data[data.length - 1];
					localStorage.setItem(
						"priceTypeKey",
						mainPriceType.price_type,
					);
					localStorage.setItem(
						"matchingProductByCurrency",
						lastPrice.productByCurrency,
					);
					localStorage.setItem(
						"falseCurrencyBoolean",
						lastPrice.currency,
					);
					setPriceTypeKeyData(lastPrice.item_id);
				}
			} catch (error) {
				console.error("Error fetching prices:", error);
			}
		};

		fetchPrices();
	}, [deviceId, ksbId]);

	const reorderedCurrencies =
		currencies.length > 0
			? [
					currencies.find(
						(currency) => currency.item_id === currencyKey,
					),
					...currencies.filter(
						(currency) => currency.item_id !== currencyKey,
					),
			  ].filter(Boolean)
			: [];

	const reorderedPrices =
		prices.length > 0
			? [
					prices.find((price) => price.item_id === priceTypeKeyData),
					...prices.filter(
						(price) => price.item_id !== priceTypeKeyData,
					),
			  ].filter(Boolean)
			: [];

	useEffect(() => {
		const initialCurrencyKey = localStorage.getItem("currencyKey");
		const initialCurrencyKeyKey = localStorage.getItem("currencyKeyKey");
		const matchingCurrency = currencies.find(
			(currency) => currency.key === initialCurrencyKeyKey,
		);

		if (
			matchingCurrency &&
			matchingCurrency.key !== initialCurrencyKeyKey
		) {
			localStorage.setItem("currencyKey", matchingCurrency.item_id);
			localStorage.setItem("currencyKeyKey", matchingCurrency.key);
		}
	}, [currencies]);

	useEffect(() => {
		const priceTypeKey = localStorage.getItem("priceTypeKey");
		const productByCurrencyBoolean = localStorage.getItem(
			"matchingProductByCurrency",
		);
		const falseCurrencyBoolean = localStorage.getItem(
			"falseCurrencyBoolean",
		);
		const matchingCurrency = prices.find(
			(price) => price.item_id === priceTypeKey,
		);

		const matchingProductByCurrency = prices.find(
			(byCurrency) =>
				byCurrency.productByCurrency === productByCurrencyBoolean,
		);

		const matchingFalseCurrencyBoolean = prices.find(
			(falseCurrency) => falseCurrency.currency === falseCurrencyBoolean,
		);

		if (
			matchingCurrency &&
			matchingCurrency.item_id !== priceTypeKey &&
			matchingProductByCurrency &&
			matchingProductByCurrency.item_id !== productByCurrencyBoolean &&
			matchingFalseCurrencyBoolean &&
			matchingFalseCurrencyBoolean.currency !== falseCurrencyBoolean
		) {
			localStorage.setItem("priceTypeKey", matchingCurrency.item_id);
			localStorage.setItem(
				"matchingProductByCurrency",
				matchingCurrency.productByCurrency,
			);
			localStorage.setItem(
				"falseCurrencyBoolean",
				matchingFalseCurrencyBoolean.currency,
			);
		}
	}, [prices]);

	const handleClick = async (e) => {
		e.preventDefault();

		// Show loader
		setIsLoading(true);

		const newSalesId = uuidv4();
		localStorage.setItem("sales_id", newSalesId);

		try {
			const response = await fetch(
				`${nodeUrl}/api/create/sales/${newSalesId}`,
				{
					method: "POST",
				},
			);
			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("isSaleContinue", false);
				setTimeout(() => {
					window.location.reload();
				}, 500);
			} else {
				console.log("error");
				setIsLoading(false); // Hide loader if there's an error
			}
		} catch (err) {
			console.log("error creating empty sales", err);
			setIsLoading(false); // Hide loader if there's an error
		}
	};

	const [disabled, setDisabled] = useState();

	const sales_id = localStorage.getItem("sales_id");

	useEffect(() => {
		fetchSoldProducts();

		const updateHandler = () => fetchSoldProducts();
		socket.on("gettingSoldProducts", updateHandler);

		return () => {
			socket.off("gettingSoldProducts", updateHandler);
		};
	}, [nodeUrl, sales_id]);

	const fetchSoldProducts = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/sales/${sales_id}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch products");
			}
			const data = await response.json();
			const isDisabled = data[sales_id].products.length >= 1;
			setDisabled(isDisabled);
		} catch (err) {
			console.log(err);
			setDisabled(true);
		}
	};

	const [focusedButton, setFocusedButton] = useState("ok");
	const okButtonRef = useRef(null);
	const cancelButtonRef = useRef(null);

	useEffect(() => {
		if (isExitModalOpen) {
			okButtonRef.current?.focus();
		}
	}, [isExitModalOpen]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (!isExitModalOpen) return;

			if (e.key === "ArrowLeft") {
				setFocusedButton("cancel");
				cancelButtonRef.current?.focus();
			} else if (e.key === "ArrowRight") {
				setFocusedButton("ok");
				okButtonRef.current?.focus();
			} else if (e.key === "Enter") {
				if (focusedButton === "ok") {
					okButtonRef.current?.click();
				} else {
					setIsExitModalOpen(false);
				}
			} else if (e.key === "Escape") {
				setIsExitModalOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isExitModalOpen, focusedButton]);

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
					minimumFractionDigits: deviceSettings.format.format_sum.max,
					maximumFractionDigits: deviceSettings.format.format_sum.max,
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

	const errorButtonRef = useRef(null);

	useEffect(() => {
		if (isModalOpen && errorButtonRef.current) {
			errorButtonRef.current.focus();
		}
	}, [isModalOpen]);
	return (
		<>
			<div className="salesfooter z-0  bg-slate-100 px-4 py-1 shadow-lg border-t border-gray-300 flex items-center justify-between relative ">
				<div className="flex items-center justify-start">
					<div className="flex items-center gap-4">
						<button
							onClick={toggleSettings}
							className="text-white bg-slate-700 p-2 rounded-md text-lg flex items-center gap-2  transition-colors duration-200"
						>
							<FiSettings className="text-xl" />
						</button>
						<div className="flex items-center bg-slate-200 px-2 py-1 rounded-md text-gray-800 font-semibold">
							{/* <BsCurrencyDollar className="text-lg text-green-500" /> */}
							{displayMessage}
						</div>
					</div>
					<div className="flex items-center gap-4 mx-2">
						<select
							className={`px-4 py-2 border border-gray-300 rounded-lg text-gray-700 ${
								disabled ? "cursor-not-allowed" : ""
							}`}
							value={priceTypeKeyData}
							onChange={handleChangePriceType}
							disabled={disabled}
						>
							{reorderedPrices.map((price) => (
								<option
									key={price.item_id}
									value={price.item_id}
									data-product-by-currency={
										price.productByCurrency
									}
									data-false-currency={price.currency}
								>
									{price.name}
								</option>
							))}
						</select>

						<select
							className={`px-4 py-2 border border-gray-300 rounded-lg text-gray-700 ${
								disabled ? "cursor-not-allowed" : ""
							}`}
							value={currencyKey}
							onChange={handleChange}
							disabled={disabled}
						>
							{reorderedCurrencies.map((currency) => (
								<option
									key={currency.item_id}
									value={currency.item_id}
									data-key={currency.key}
								>
									{currency.name}
								</option>
							))}
						</select>
					</div>
					<div className="mx-2">
						<button
							onClick={handleClick}
							className="bg-gradient-to-r from-green-500 to-green-700 text-white flex items-center py-2 px-6 rounded-lg shadow hover:from-green-600 hover:to-green-800 transition"
						>
							<span className="mr-3 inline-block">
								<FaPlus />
							</span>
							{content[language].salesPage.footerNewSales}
						</button>
					</div>
				</div>

				<div className="-mr-1 flex items-center">
					<button
						className={`text-white mr-5 px-6 py-2 rounded-xl flex items-center transition-all duration-300 ${
							isSyncing
								? "bg-blue-700"
								: "bg-blue-500 hover:bg-blue-600"
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
									className="animate-spin text-white mr-2"
								/>
								<span className="font-medium">
									Синхронизация...
								</span>
							</>
						) : (
							<>
								<IoSync size={20} className="text-white mr-2" />
								<span className="font-medium">
									Синхронизация
								</span>
							</>
						)}
					</button>
					<button
						onClick={() => setIsExitModalOpen(true)}
						className="flex w-[180px] items-center justify-center w-45 bg-red-700 hover:bg-red-600 text-slate-100 px-9 py-2 text-md rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400"
					>
						<ImExit className="mr-3 text-xl" />
						<span className="font-semibold">
							{content[language].salesPage.footerExit}
						</span>
					</button>
				</div>
			</div>
			<SettingsPanel
				isSettingsOpen={isSettingsOpen}
				toggleSettings={toggleSettings}
				settingsOptions={settingsOptions}
			/>
			<TableLayoutModal
				isOpen={activeModal === "tableLayout"}
				onClose={closeModal}
				onSave={() => saveSettings("table")}
				tempSettings={tempSettings}
				setTempSettings={setTempSettings}
			/>
			<ThemeSettingsModal
				isOpen={activeModal === "themeSettings"}
				onClose={closeModal}
				onSave={() => saveSettings("theme")}
				tempSettings={tempSettings}
				setTempSettings={setTempSettings}
			/>
			<LanguageSettingsModal
				isOpen={activeModal === "language"}
				onClose={closeModal}
				onSave={() => saveSettings("language")}
				tempSettings={tempSettings}
				setTempSettings={setTempSettings}
			/>
			<ChangePrice
				isOpen={activeModal === "changePrice"}
				onClose={closeModal}
				onSave={() => saveSettings("changePrice")}
				tempSettings={tempSettings}
				setTempSettings={setTempSettings}
			/>
			{isExitModalOpen && (
				<div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center p-4">
					<div className="bg-gray-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl">
						<div className="px-6 py-8 text-center">
							<h2 className="text-2xl font-bold text-black mb-2">
								{content[language].salesPage.footerExit}
							</h2>
							<p className="text-black text-lg mb-6">
								{content[language].salesPage.footerExitConfirm}
							</p>
						</div>

						<div className="flex divide-x divide-gray-300 border-t border-gray-300">
							<button
								ref={cancelButtonRef}
								onClick={() => setIsExitModalOpen(false)}
								className={`flex-1 py-4 text-lg font-medium flex items-center justify-center transition-all duration-200 ${
									focusedButton === "cancel"
										? "bg-gray-300 text-blue-600 font-bold"
										: "text-blue-500 hover:bg-gray-300"
								} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset`}
							>
								{
									content[language].salesPage
										.headerDiscountCancel
								}
							</button>

							<NavLink
								ref={okButtonRef}
								to="/crm"
								className={`flex-1 py-4 text-lg font-medium flex items-center justify-center transition-all duration-200 ${
									focusedButton === "ok"
										? "bg-gray-300 text-blue-600 font-bold"
										: "text-blue-500 hover:bg-gray-300"
								} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset`}
							>
								{content[language].salesPage.footerExitYes}
							</NavLink>
						</div>
					</div>
				</div>
			)}

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

			{isLoading && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
					<div className="flex items-center bg-transparent justify-center h-screen">
						<div className="text-white text-4xl font-bold animate-spin">
							<FiLoader />
						</div>
					</div>
				</div>
			)}
		</>
	);
};

export default SalesPageLayoutFooter;

