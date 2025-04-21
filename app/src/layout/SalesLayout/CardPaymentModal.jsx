import React, { useState, useEffect, useRef, useMemo } from "react";
import { IoAdd, IoClose } from "react-icons/io5";
import { IoSearchOutline } from "react-icons/io5";
import nodeUrl from "../../links";
import { v4 as uuidv4 } from "uuid";
import { MdClear } from "react-icons/md";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";
import PrintingModal from "./PrintModal";
import SuccessModal from "./SuccessModal";
import ErrorModal from "./ErrorModal";
import LoadingModalSendSales from "./LoadingModal";
import { FaExclamationTriangle } from "react-icons/fa";
import { IoIosAdd } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import {
	IoPersonOutline,
	IoCallOutline,
	IoLocationOutline,
} from "react-icons/io5";

const CardPaymentModal = ({ isOpen, onClose, totalAmount, socket }) => {
	const [selectedClient, setSelectedClient] = useState(null);

	const [discountAmount, setDiscountAmount] = useState(0);
	const [isClientSearchOpen, setIsClientSearchOpen] = useState(false);
	const [customers, setCustomers] = useState([]);
	const [price, setPrice] = useState(0);
	const [discount, setDiscount] = useState(0);
	const [totalPrice, setTotalPrice] = useState(0);
	const [comment, setComment] = useState("");
	const [clientSearchTerm, setClientSearchTerm] = useState("");
	const [selectedClientIndex, setSelectedClientIndex] = useState(0);
	const [showSmallSearchModal, setShowSmallSearchModal] = useState(false);
	const clientSearchRef = useRef(null);
	const [isCardTyping, setIsCardTyping] = useState(false);
	const clientListRef = useRef(null);

	const [language] = useLang("uz");

	const [data, setData] = useState({});

	const ksbIdNumber = localStorage.getItem("ksbIdNumber");
	const device_id = localStorage.getItem("device_id");
	const ipaddress = localStorage.getItem("ipaddress:port");
	const database = localStorage.getItem("mainDatabase");
	const username = localStorage.getItem("userType");
	const password = localStorage.getItem("userPassword");
	const sales_id = localStorage.getItem("sales_id");

	const [printModal, setPrintModal] = useState(false);
	const [successModal, setSuccessModal] = useState(false);
	const [errorModal, setErrorModal] = useState(false);
	const [loadingModal, setLoadingModal] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [restSumma, setRestSumma] = useState(0);
	const [noPermit, setNoPermit] = useState(false);
	const [noPermitForNasiya, setNoPermitForNasiya] = useState(false);
	const settingsDeviceInfoData = JSON.parse(
		localStorage.getItem("settingsDevice"),
	);

	const [openCreatingModal, setOpenCreatingModal] = useState(false);
	const [nameValue, setNameValue] = useState("");
	const [phone, setPhone] = useState("+998");
	const [addressValue, setAddressValue] = useState("");
	const [newClientId, setNewClientId] = useState("");

	const clientSearchingInputRef = useRef(null);

	useEffect(() => {
		const fetchCustomers = async () => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/client/${ksbIdNumber}/${device_id}`,
				);
				const result = await response.json();

				setCustomers(Array.isArray(result.data) ? result.data : []);
			} catch (error) {
				console.error("Error fetching customers:", error);
				setCustomers([]);
			}
		};

		fetchCustomers();
	}, []);

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
			const datas = await response.json();

			setPrice(parseFloat(datas[sales_id].summa));
			setDiscount(parseFloat(datas[sales_id].discount));

			setTotalPrice(
				parseFloat(
					datas[sales_id].summa - datas[sales_id].discount,
				).toFixed(settingsDeviceInfoData.format.format_sum.max),
			);

			setData(datas[sales_id]);
		} catch (err) {
			console.log(err);
		}
	};

	const defaultClient = {
		client_id: "00000000-0000-0000-0000-000000000000",
		delete: false,
		name: "<не указан>",
		archive: false,
		phone_number: "",
		negative_balance: [],
		positive_balance: [],
	};

	const [cashAmount, setCashAmount] = useState(0);
	const [isTyping, setIsTyping] = useState(false);

	const [cardAmount, setCardAmount] = useState(totalPrice);

	const searchInputRef = useRef();
	const cardInputRef = useRef();
	const handleSubmitButton = useRef();

	const formatRussianNumber = (num) => {
		// Handle empty or zero values
		if (!num && num !== 0) return "";

		// Convert to number if it's a string
		const numValue = typeof num === "string" ? parseFloat(num) : num;

		// Format with spaces for thousands and 2 decimal places
		return numValue.toLocaleString("ru-RU", {
			minimumFractionDigits: settingsDeviceInfoData.format.format_sum.max,
			maximumFractionDigits: settingsDeviceInfoData.format.format_sum.max,
		});
	};

	useEffect(() => {
		if (isOpen && cardInputRef.current) {
			setCardAmount(totalPrice);
			cardInputRef.current.value = formatRussianNumber(totalPrice);
			cardInputRef.current.focus();
			cardInputRef.current.select();
		}
	}, [isOpen]);

	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			setIsTyping(false);

			if (cardInputRef.current) {
				cardInputRef.current.focus();
			}
		}
	};

	const handleFocus = () => {
		if (searchInputRef.current) {
			searchInputRef.current.select();
		}
	};

	const handleFocusCard = () => {
		if (cardInputRef.current) {
			cardInputRef.current.select();
		}
	};

	const parseFormattedNumber = (formattedValue) => {
		if (!formattedValue) return 0;
		const numericString = formattedValue
			.toString()
			.replace(/[^\d,\.]/g, "")
			.replace(",", ".");
		return parseFloat(numericString) || 0;
	};

	const [currencyData, setCurrencyData] = useState({});

	useEffect(() => {
		const fetchCurrencyData = async () => {
			if (!data.products || data.products.length === 0) return;

			const updatedCurrencyData = { ...currencyData };

			for (const product of data.products) {
				if (
					product.product_currency &&
					!updatedCurrencyData[product.product_currency]
				) {
					try {
						const response = await fetch(
							`${nodeUrl}/api/get/currency/data/${device_id}/${ksbIdNumber}/${product.product_currency}`,
						);
						const fetchedData = await response.json();
						updatedCurrencyData[product.product_currency] =
							fetchedData[0]?.name || "-";
					} catch (error) {
						console.error("Failed to fetch currency data", error);
						updatedCurrencyData[product.product_currency] = "-";
					}
				}
			}

			setCurrencyData(updatedCurrencyData);
		};

		fetchCurrencyData();
	}, [data.products]);

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

	const [showErrorModal, setShowErrorModal] = useState(false);
	const [showError, setShowError] = useState("");
	const currencyKeyKey = localStorage.getItem("currencyKeyKey");

	const handleSaveSalesToDatabase = async () => {
		let currentTime = new Date();

		const mainCashValue = JSON.parse(localStorage.getItem("settingsCash"));

		const mainCashCashData = mainCashValue.find(
			(e) => e.type == "Наличные",
		);

		const mainCashCardData = mainCashValue.find((e) => e.type == "Пластик");

		const userType = localStorage.getItem("userType");

		let clientId = defaultClient.client_id;
		let clientName = defaultClient.name;
		let newProcessedProduct = [];

		if (selectedClient && selectedClient.client_id) {
			clientId = selectedClient.client_id;
			clientName = selectedClient.name || "<не указан>";
		} else {
			clientId = defaultClient.client_id;
			clientName = defaultClient.name;
		}

		if (data.products) {
			newProcessedProduct = data.products.map((product) => ({
				product: product.product_id,
				product_name: product.product_name,
				warehouse: product.product_warehouse,
				currency: data.mainCurrency,
				quantity: product.soni,
				price: product.narxi,
				sum: product.summa,
			}));
		} else {
			newProcessedProduct = [];
		}

		const cashValue = searchInputRef.current
			? parseFormattedNumber(searchInputRef.current.value)
			: 0;
		const cardValue = cardInputRef.current
			? parseFormattedNumber(cardInputRef.current.value)
			: 0;

		let paymentsArray = [];

		if (cashValue > 0) {
			paymentsArray.push({
				cash: mainCashCashData.cash,
				currency: data.mainCurrency,
				sum: cashValue,
			});
		}

		if (cardValue > 0) {
			paymentsArray.push({
				cash: mainCashCardData.cash,
				currency: data.mainCurrency,
				sum: cardValue,
			});
		}

		const currentData = {
			id: sales_id,
			ksb_id: ksbIdNumber,
			device_id: device_id,
			date: currentTime,
			status: data.status,
			client_id: newClientId !== "" ? newClientId : clientId,
			client_name: nameValue !== "" ? nameValue : clientName,
			total_price: totalPrice,
			details: [
				{
					document: sales_id,
					client: clientId,
					warehouse: data.mainWarehouse,
					price_type: data.mainPriceType,
					rate: data.mainRate,
					currency: data.mainCurrency,
					discount:
						currencyKeyKey === "uzs"
							? Math.abs(restSumma) < 1000
								? Number(data.discount) + restSumma
								: data.discount
							: data.discount,
					comment: comment,
					below_cost: data.mainBelowCost,
				},
			],
			products: newProcessedProduct,
			payments: paymentsArray,
			seller: userType,
		};

		try {
			const response = await fetch(`${nodeUrl}/api/sales`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(currentData),
			});

			if (response.ok) {
				const result = await response.json();

				console.log(result);
			} else {
				console.error("Failed to submit data to the API");
			}
		} catch (error) {
			console.error("Error submitting the sell data:", error);
		}
	};

	const handleCreateEmptySalesInDatabase = async () => {
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
				console.log("Created");
			} else {
				console.log("error");
			}
		} catch (err) {
			console.log("error creating empty sales", err);
		}
	};

	const handleDeleleOneSalesFromDatabase = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/delete/one/sales/${sales_id}`,
				{
					method: "DELETE",
				},
			);

			const data = await response.json();
		} catch (error) {
			console.error("Error deleting", error);
		}
	};

	const handleSendSalesToAPI = async () => {
		const mainCashValue = JSON.parse(localStorage.getItem("settingsCash"));

		const mainCashCashData = mainCashValue.find(
			(e) => e.type == "Наличные",
		);

		const mainCashCardData = mainCashValue.find((e) => e.type == "Пластик");

		let clientId = defaultClient.client_id;
		let clientName = defaultClient.name;
		let newProcessedProductForSendAPI = [];

		if (selectedClient && selectedClient.client_id) {
			clientId = selectedClient.client_id;
			clientName = selectedClient.name || "<не указан>";
		} else {
			clientId = defaultClient.client_id;
			clientName = defaultClient.name;
		}

		const isOnline = await checkInternetConnection();
		if (isOnline) {
			if (data.products) {
				newProcessedProductForSendAPI = data.products.map(
					(product) => ({
						product: product.product_id,
						warehouse: product.product_warehouse,
						currency: data.mainCurrency,
						quantity: Number(product.soni),
						price: Number(product.narxi).toFixed(
							settingsDeviceInfoData.format.format_sum.max,
						),
						sum: Number(product.summa).toFixed(
							settingsDeviceInfoData.format.format_sum.max,
						),
					}),
				);
			} else {
				newProcessedProductForSendAPI = [];
			}

			const cashValue = searchInputRef.current
				? parseFormattedNumber(searchInputRef.current.value)
				: 0;
			const cardValue = cardInputRef.current
				? parseFormattedNumber(cardInputRef.current.value)
				: 0;

			let paymentsApiArray = [];

			if (cashValue > 0) {
				paymentsApiArray.push({
					cash: mainCashCashData.cash,
					currency: data.mainCurrency,
					sum: Number(cashValue),
				});
			}

			if (cardValue > 0) {
				paymentsApiArray.push({
					cash: mainCashCardData.cash,
					currency: data.mainCurrency,
					sum: Number(cardValue),
				});
			}

			const oneSale = {
				sales: [
					{
						details: [
							{
								document: sales_id,
								client:
									newClientId !== "" ? newClientId : clientId,
								client_details: {
									Идентификатор: newClientId,
									Имя: nameValue,
									Телефон: phone,
									Адрес: addressValue,
									ОтветственныйСотрудник: "",
								},
								warehouse: data.mainWarehouse,
								price_type: data.mainPriceType,
								rate: Number(data.mainRate),
								currency: data.mainCurrency,
								discount:
									currencyKeyKey === "uzs"
										? Math.abs(restSumma) < 1000
											? Number(data.discount + restSumma)
											: Number(data.discount)
										: Number(data.discount),
								comment: comment,
								below_cost:
									data.mainBelowCost === 1 ? true : false,
							},
						],
						products: newProcessedProductForSendAPI,
						payments: paymentsApiArray,
					},
				],
			};

			const salesBody = {
				ksb_id: ksbIdNumber,
				device_id: device_id,
				host: ipaddress,
				authUser: username,
				authPass: password,
				database: database,
				salesData: oneSale,
				id: sales_id,
			};

			try {
				const response = await fetch(`${nodeUrl}/api/send/one/sale`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(salesBody),
				});

				const data = await response.json();
				return data;
			} catch (error) {
				console.error("Error sending sales data:", error);
				throw error;
			}
		}
	};

	const handlePrintOneSales = async () => {
		const full_title = localStorage.getItem("enterpriseFullTitle");
		const short_title = localStorage.getItem("enterpriseName");

		const phone1 = localStorage.getItem("enterprisePhone1");
		const phone2 = localStorage.getItem("enterprisePhone2");
		const slogan1 = localStorage.getItem("enterpriseSlogan1");
		const slogan2 = localStorage.getItem("enterpriseSlogan2");

		const user_type = localStorage.getItem("userType");

		try {
			await fetch(`${nodeUrl}/api/print/${sales_id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					full_title:
						full_title === "null" ? short_title : full_title,
					phone1: phone1 === "null" ? "" : phone1,
					phone2: phone2 === "null" ? "" : phone2,
					slogan1: slogan1 === "null" ? "" : slogan1,
					slogan2: slogan2 === "null" ? "" : slogan2,
					user_type: user_type,
				}),
			});
		} catch (err) {
			console.log(err);
		}
	};

	const handleSendSalesRemoveData = async () => {
		const ksbId = localStorage.getItem("ksbIdNumber");
		const deviceId = localStorage.getItem("device_id");
		const ipaddressPort = localStorage.getItem("ipaddress:port");
		const mainDatabase = localStorage.getItem("mainDatabase");
		const userType = localStorage.getItem("userType");
		const userPassword = localStorage.getItem("userPassword");

		try {
			const response = await fetch(
				`${nodeUrl}/api/send/data/remove/${ksbId}/${deviceId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"ipaddress:port": ipaddressPort,
						database: mainDatabase,
						userName: userType,
						userPassword: userPassword,
					}),
				},
			);

			const data = await response.json();

			localStorage.setItem("lastSyncedTime", data.time);
		} catch (err) {
			console.log("error creating empty sales", err);
		}
	};

	const handleSaveSales = async () => {
		try {
			setLoadingModal(true);

			await handleSaveSalesToDatabase();

			const isOnline = await checkInternetConnection();
			if (isOnline) {
				try {
					const result = await handleSendSalesToAPI();
					await handleSendSalesRemoveData();
					if (result && result.status === "error") {
						setErrorMessage(
							result.message || "Failed to send sales",
						);
						setLoadingModal(false);
						setErrorModal(true);
						return;
					}
				} catch (error) {
					console.error("Error sending sales to API:", error);
					setLoadingModal(false);
					setErrorMessage("Failed to connect to server");
					setErrorModal(true);
					return;
				}
			}

			await handleCreateEmptySalesInDatabase();

			await handleDeleleOneSalesFromDatabase();

			setLoadingModal(false);
			setSuccessModal(true);

			setTimeout(() => {
				localStorage.setItem("isSaleContinue", false);
				window.location.reload();
			}, 100);
		} catch (error) {
			console.error("Error in save sales process:", error);
			setLoadingModal(false);
			setErrorMessage(
				error.message || "An error occurred during the sales process",
			);
			setErrorModal(true);
		}
	};

	const handleSaveSalesWithPrint = async () => {
		try {
			setLoadingModal(true);

			await handleSaveSalesToDatabase();
			await handlePrintOneSales();

			const isOnline = await checkInternetConnection();
			if (isOnline) {
				try {
					const result = await handleSendSalesToAPI();
					await handleSendSalesRemoveData();
					if (result && result.status === "error") {
						setErrorMessage(
							result.message || "Failed to send sales",
						);
						setLoadingModal(false);
						setErrorModal(true);
						return;
					}
				} catch (error) {
					console.error("Error sending sales to API:", error);
					setLoadingModal(false);
					setErrorMessage("Failed to connect to server");
					setErrorModal(true);
					return;
				}
			}

			await handleCreateEmptySalesInDatabase();

			await handleDeleleOneSalesFromDatabase();

			setLoadingModal(false);
			setSuccessModal(true);

			setTimeout(() => {
				localStorage.setItem("isSaleContinue", false);
				window.location.reload();
			}, 100);
		} catch (error) {
			console.error("Error in save sales process:", error);
			setLoadingModal(false);
			setErrorMessage(
				error.message || "An error occurred during the sales process",
			);
			setErrorModal(true);
		}
	};

	// Filter clients based on search term
	const filteredClients =
		clientSearchTerm.trim() === ""
			? customers
			: customers.filter(
					(client) =>
						client?.name
							?.toLowerCase()
							.includes(clientSearchTerm.toLowerCase().trim()) ||
						client?.phone_number
							?.toLowerCase()
							.includes(clientSearchTerm.toLowerCase().trim()),
			  );

	// Handle keyboard navigation in client search
	const handleClientKeyDown = (e) => {
		if (!showSmallSearchModal) return;

		switch (e.key) {
			// case "ArrowDown":
			// 	e.preventDefault();
			// 	setSelectedClientIndex((prev) =>
			// 		prev < filteredClients.length - 1 ? prev + 1 : prev,
			// 	);
			// 	break;
			// case "ArrowUp":
			// 	e.preventDefault();
			// 	setSelectedClientIndex((prev) => (prev > 0 ? prev - 1 : prev));
			// 	break;
			case "Enter":
				e.preventDefault();
				if (filteredClients.length > 0) {
					setSelectedClient(filteredClients[selectedClientIndex]);
					setShowSmallSearchModal(false);
					setClientSearchTerm("");
				}
				break;
			case "Escape":
				e.preventDefault();
				setShowSmallSearchModal(false);
				break;
			default:
				break;
		}
	};

	// Reset selected index when search term changes
	useEffect(() => {
		setSelectedClientIndex(0);
	}, [clientSearchTerm]);

	// Focus the client search input when modal opens
	useEffect(() => {
		if (showSmallSearchModal && clientSearchRef.current) {
			clientSearchRef.current.focus();
		}
	}, [showSmallSearchModal]);

	// Scroll selected item into view
	useEffect(() => {
		if (clientListRef.current && filteredClients.length > 0) {
			const selectedElement =
				clientListRef.current.children[selectedClientIndex];
			if (selectedElement) {
				selectedElement.scrollIntoView({ block: "nearest" });
			}
		}
	}, [selectedClientIndex, filteredClients.length]);

	const rawInput = searchInputRef.current?.value || "";
	const cleanedInput = rawInput.replace(/\s/g, "").replace(",", ".");
	const currentCashAmount = Number(cleanedInput);

	const rawCardInput = cardInputRef.current?.value || "";
	const cleanedCardInput = rawCardInput.replace(/\s/g, "").replace(",", ".");
	const currentCardAmount = Number(cleanedCardInput);

	useEffect(() => {
		const firstValue = totalPrice - currentCashAmount;

		setRestSumma(
			firstValue.toFixed(settingsDeviceInfoData.format.format_sum.max) -
				currentCardAmount.toFixed(
					settingsDeviceInfoData.format.format_sum.max,
				),
		);
	}, [currentCashAmount, currentCardAmount, totalPrice]);

	const errorButtonRef = useRef(null);

	useEffect(() => {
		if (noPermit && errorButtonRef.current) {
			errorButtonRef.current.focus();
		}
	}, [noPermit]);

	const errorButtonRefNasiya = useRef(null);

	useEffect(() => {
		if (noPermitForNasiya && errorButtonRefNasiya.current) {
			errorButtonRefNasiya.current.focus();
		}
	}, [noPermitForNasiya]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 text-black bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[50]">
			<div className="bg-white rounded-xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col">
				{/* Header */}
				<div className="bg-blue-600 px-6 py-3 flex justify-between items-center">
					<h2 className="text-lg font-medium text-white">
						{content[language].salesPage.sidebarCashPay}
					</h2>
					<button
						onClick={onClose}
						className="p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition duration-200 rounded-full"
					>
						<IoClose className="w-5 h-5" />
					</button>
				</div>

				{/* Content - Split Layout */}
				<div className="flex flex-row flex-1 overflow-hidden">
					{/* Left Side - Information */}
					<div className="w-1/2 p-5 bg-gray-50 border-r border-gray-200 flex flex-col space-y-4">
						{/* Summary Cards */}
						<div className="grid grid-cols-2 gap-3">
							<div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
								<label className="text-xs font-medium text-gray-500 block mb-1">
									{
										content[language].salesPage
											.headerDiscountSumma
									}
								</label>
								<div className="font-semibold text-xl text-gray-800">
									{price.toLocaleString("ru-RU", {
										minimumFractionDigits:
											settingsDeviceInfoData.format
												.format_sum.max,
										maximumFractionDigits:
											settingsDeviceInfoData.format
												.format_sum.max,
									})}
								</div>
							</div>

							<div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
								<label className="text-xs font-medium text-gray-500 block mb-1">
									{content[language].salesPage.headerDiscount}
								</label>
								<div className="font-semibold text-xl text-gray-800">
									{discount.toLocaleString("ru-RU", {
										minimumFractionDigits:
											settingsDeviceInfoData.format
												.format_sum.max,
										maximumFractionDigits:
											settingsDeviceInfoData.format
												.format_sum.max,
									})}
								</div>
							</div>
						</div>

						{/* Client Selection */}
						<div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
							<label className="text-xs font-medium text-gray-500 block mb-1">
								Клиент
							</label>
							<div className="relative group">
								<input
									type="text"
									value={
										nameValue !== ""
											? nameValue
											: clientSearchTerm ||
											  (selectedClient
													? selectedClient.name
													: "")
									}
									onChange={(e) => {
										setClientSearchTerm(e.target.value);
										if (e.target.value.length > 0) {
											setShowSmallSearchModal(true);
										} else {
											setShowSmallSearchModal(false);
										}
										if (
											e.target.value !==
											selectedClient?.name
										) {
											setSelectedClient(null);
										}
									}}
									onFocus={() => {
										if (clientSearchTerm.length > 0) {
											setShowSmallSearchModal(true);
										}
									}}
									onKeyDown={handleClientKeyDown}
									ref={clientSearchRef}
									placeholder="Клиент танланг"
									className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
								/>
								<button
									onClick={() => {
										setSelectedClient("");
										setClientSearchTerm("");
									}}
									className="absolute right-10 top-1/2 transform -translate-y-1/2 p-1 rounded-md bg-gray-100 text-gray-500 hover:bg-blue-500 hover:text-white transition-all duration-200"
								>
									<MdClear className="w-4 h-4" />
								</button>
								<button
									onClick={() => setIsClientSearchOpen(true)}
									className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-md bg-gray-100 text-gray-500 hover:bg-blue-500 hover:text-white transition-all duration-200"
								>
									<IoSearchOutline className="w-4 h-4" />
								</button>
							</div>

							{/* Small Client Search Modal */}
							{showSmallSearchModal && (
								<div
									className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto"
									style={{ width: "380px" }}
								>
									{filteredClients.length === 0 ? (
										<div className="flex items-center justify-center h-20 text-gray-500">
											Клиент топилмади
										</div>
									) : (
										<div ref={clientListRef}>
											{filteredClients.map(
												(client, index) => (
													<div
														key={client.client_id}
														onClick={() => {
															setSelectedClient(
																client,
															);
															setShowSmallSearchModal(
																false,
															);
															setClientSearchTerm(
																"",
															);
														}}
														className={`px-3 py-2 cursor-pointer ${
															index ===
															selectedClientIndex
																? "bg-blue-50 text-blue-700"
																: "hover:bg-gray-50"
														}`}
													>
														{client.name}
													</div>
												),
											)}
										</div>
									)}
								</div>
							)}
						</div>

						{/* Total to Pay */}
						<div className="bg-blue-50 rounded-lg border border-blue-100 p-3 shadow-sm">
							<label className="text-xs font-medium text-blue-700 block mb-1">
								{content[language].salesPage.sidebarCashToPay}
							</label>
							<div className="font-bold text-xl text-gray-800">
								{parseFloat(totalPrice).toLocaleString(
									"ru-RU",
									{
										minimumFractionDigits:
											settingsDeviceInfoData.format
												.format_sum.max,
										maximumFractionDigits:
											settingsDeviceInfoData.format
												.format_sum.max,
									},
								)}
							</div>
						</div>

						{/* Total Price (Final) */}
						<div className="bg-red-50 rounded-lg border border-red-100 p-3 shadow-sm mt-auto">
							<label className="text-xs font-medium text-red-700 block mb-1">
								{
									content[language].salesPage
										.sidebarCashTotalPrice
								}
							</label>
							<div className="font-bold text-xl text-gray-800">
								{restSumma.toLocaleString("ru-RU", {
									minimumFractionDigits:
										settingsDeviceInfoData.format.format_sum
											.max,
									maximumFractionDigits:
										settingsDeviceInfoData.format.format_sum
											.max,
								})}
							</div>
						</div>
					</div>

					{/* Right Side - Input Fields */}
					<div className="w-1/2 p-5 flex flex-col space-y-4">
						{/* Cash Payment */}
						<div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="currentColor"
										className="w-4 h-4 text-blue-600"
									>
										<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"></path>
									</svg>
								</div>
								<label className="text-sm font-medium text-gray-700">
									{
										content[language].salesPage
											.sidebarCashCash
									}
								</label>
							</div>
							<input
								ref={searchInputRef}
								type="text"
								value={
									isTyping
										? cashAmount
										: formatRussianNumber(cashAmount)
								}
								onChange={(e) => {
									let value = e.target.value;

									if (value.includes("-")) {
										value = value.replace("-", "");
									}
									setCashAmount(value);
									setIsTyping(true);
								}}
								onBlur={() => {
									// Format on blur
									if (isTyping) {
										const numericValue =
											parseFloat(
												cashAmount.replace(
													/[^\d,\.]/g,
													"",
												),
											) || 0;
										setCashAmount(numericValue);
										setIsTyping(false);
									}
								}}
								onFocus={handleFocus}
								onKeyPress={handleKeyPress}
								className="w-full px-3 py-2 text-right text-lg font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
							/>
						</div>

						{/* Card Payment */}
						<div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="currentColor"
										className="w-4 h-4 text-indigo-600"
									>
										<path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"></path>
									</svg>
								</div>
								<label className="text-sm font-medium text-gray-700">
									{
										content[language].salesPage
											.sidebarCashCard
									}
								</label>
							</div>

							<input
								ref={cardInputRef}
								type="text"
								value={
									isCardTyping
										? cardAmount
										: formatRussianNumber(cardAmount)
								}
								onChange={(e) => {
									let value = e.target.value;

									if (value.includes("-")) {
										value = value.replace("-", "");
									}
									setCardAmount(value);
									setIsCardTyping(true);
								}}
								onBlur={() => {
									if (isCardTyping) {
										const numericValue =
											parseFloat(
												cardAmount.replace(
													/[^\d,\.]/g,
													"",
												),
											) || 0;
										setCardAmount(numericValue);
										setIsCardTyping(false);
									}
								}}
								onFocus={handleFocusCard}
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										handleSubmitButton.current.focus();
									}
								}}
								className="w-full px-3 py-2 text-right text-lg font-medium border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
							/>
						</div>

						{/* Comment */}
						<div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
							<label className="text-sm font-medium text-gray-700 block mb-2">
								{content?.[language]?.salesPage
									?.sidebarCashComment ?? ""}
							</label>
							<textarea
								className="w-full px-3 py-2 text-gray-700 border border-gray-200 rounded-lg resize-none h-[80px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
								placeholder={`${
									content?.[language]?.salesPage
										?.sidebarCashComment ?? ""
								}...`}
								onChange={(e) => setComment(e.target.value)}
							/>
						</div>

						{/* Spacer */}
						<div className="flex-grow"></div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex justify-end gap-3">
					<button
						onClick={() => {
							if (clientSearchRef.current.value !== "") {
								setPrintModal(true);
							} else {
								setNoPermitForNasiya(true);
							}
						}}
						className="px-4 mr-[110px] w-[205px] py-2 bg-orange-600 border border-orange-600 text-white rounded-lg hover:bg-orange-800 transition duration-200 text-sm font-medium"
					>
						Насия
					</button>
					<button
						onClick={onClose}
						className="px-4 w-[205px] py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-200 text-sm font-medium"
					>
						{content[language].salesPage.headerDiscountCancel}
					</button>
					<button
						ref={handleSubmitButton}
						onClick={() => {
							if (currencyKeyKey == "uzs") {
								if (Math.abs(restSumma) > 999) {
									setNoPermit(true);
								} else {
									setPrintModal(true);
								}
							} else {
								if (restSumma !== 0) {
									setNoPermit(true);
								} else {
									setPrintModal(true);
								}
							}
						}}
						className="px-10 w-[205px] py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-200 text-sm font-medium shadow-sm"
					>
						OK
					</button>
				</div>
			</div>

			<ClientSearchModal
				isOpen={isClientSearchOpen}
				onClose={() => setIsClientSearchOpen(false)}
				onSelect={setSelectedClient}
				clients={customers}
				setOpenCreatingModal={() => setOpenCreatingModal(true)}
				setNameValue={setNameValue}
				setPhone={setPhone}
				setAddressValue={setAddressValue}
				setNewClientId={setNewClientId}
				searchInputRef={searchInputRef}
			/>

			<CreatingClientModal
				openCreatingModal={openCreatingModal}
				onCloseCreatingModal={() => setOpenCreatingModal(false)}
				nameValue={nameValue}
				setNameValue={setNameValue}
				phone={phone}
				setPhone={setPhone}
				addressValue={addressValue}
				setAddressValue={setAddressValue}
				newClientId={newClientId}
				setNewClientId={setNewClientId}
				onClose={() => setIsClientSearchOpen(false)}
				searchInputRef={searchInputRef}
			/>

			{printModal && (
				<PrintingModal
					setPrintModal={setPrintModal}
					setSuccessModal={setSuccessModal}
					setErrorModal={setErrorModal}
					handleSaveSales={handleSaveSales}
					handleSaveSalesWithPrint={handleSaveSalesWithPrint}
				/>
			)}

			{loadingModal && <LoadingModalSendSales />}

			{successModal && <SuccessModal />}

			{errorModal && (
				<ErrorModal
					searchInputRef={searchInputRef}
					errorMessage={errorMessage}
					setErrorModal={setErrorModal}
					errorModal={errorModal}
					onClose={onClose}
					handleCreateEmptySalesInDatabase={
						handleCreateEmptySalesInDatabase
					}
					handleDeleleOneSalesFromDatabase={
						handleDeleleOneSalesFromDatabase
					}
				/>
			)}

			{noPermit && (
				<div
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setNoPermit(false);
							searchInputRef.current.select();
							searchInputRef.current.focus();
						}
					}}
					className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[100]"
				>
					<div className="bg-white w-[400px] rounded-lg shadow-xl overflow-hidden">
						<div className="bg-red-500 px-4 py-3">
							<h2 className="text-base font-medium text-white">
								Ошибка
							</h2>
						</div>
						<div className="p-4">
							<div className="flex items-start mb-4">
								<FaExclamationTriangle
									className="w-6 h-6 text-lg text-red-500 mr-3"
									size={30}
								/>
								<p className="text-sm text-gray-700">
									{
										content[language].salesPage
											.sidebarCashNoPermit
									}
								</p>
							</div>
							<div className="flex justify-end">
								<button
									ref={errorButtonRef}
									onClick={() => setNoPermit(false)}
									className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-all duration-200"
								>
									OK
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{noPermitForNasiya && (
				<div
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							setNoPermitForNasiya(false);
							searchInputRef.current.select();
							searchInputRef.current.focus();
						}
					}}
					className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[100]"
				>
					<div className="bg-white w-[400px] rounded-lg shadow-xl overflow-hidden">
						<div className="bg-red-500 px-4 py-3">
							<h2 className="text-base font-medium text-white">
								Ошибка
							</h2>
						</div>
						<div className="p-4">
							<div className="flex items-start mb-4">
								<FaExclamationTriangle
									className="w-6 h-6 text-lg text-red-500 mr-3"
									size={30}
								/>
								<p className="text-sm text-gray-700">
									Оддий ҳаридорга қарздорлик бўлиши мумкин
									эмас.
								</p>
							</div>
							<div className="flex justify-end">
								<button
									ref={errorButtonRefNasiya}
									onClick={() => setNoPermitForNasiya(false)}
									className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-all duration-200"
								>
									OK
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{showErrorModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[100]">
					<div className="bg-white w-[400px] rounded-lg shadow-xl overflow-hidden">
						<div className="bg-red-500 px-4 py-3">
							<h2 className="text-base font-medium text-white">
								Ошибка
							</h2>
						</div>
						<div className="p-4">
							<p className="text-sm text-gray-700 mb-4">
								{showError}
							</p>
							<div className="flex justify-end">
								<button
									onClick={() => setShowErrorModal(false)}
									className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-all duration-200"
								>
									OK
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

const ClientSearchModal = ({
	isOpen,
	onClose,
	onSelect,
	clients = [],
	setOpenCreatingModal,
	setNameValue,
	setPhone,
	setAddressValue,
	setNewClientId,
	searchInputRef,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [showFavorites, setShowFavorites] = useState(false);
	const [favorites, setFavorites] = useState([]);

	// Load favorites from localStorage on component mount
	useEffect(() => {
		const storedFavorites = localStorage.getItem("favoriteClients");
		if (storedFavorites) {
			setFavorites(JSON.parse(storedFavorites));
		}
	}, []);

	// Save favorites to localStorage whenever they change
	useEffect(() => {
		localStorage.setItem("favoriteClients", JSON.stringify(favorites));
	}, [favorites]);

	const formatPrice = (value) => {
		return new Intl.NumberFormat("ru-RU", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).format(value);
	};

	const [currencyData, setCurrencyData] = useState([]);

	const [language] = useLang("uz");

	const clientsArray = Array.isArray(clients) ? clients : [];

	// Filter clients based on search term and favorites toggle
	const filteredClients = useMemo(() => {
		let filtered = clientsArray;

		// First apply search term filter
		if (searchTerm.trim() !== "") {
			filtered = filtered.filter(
				(client) =>
					client?.name
						?.toLowerCase()
						.includes(searchTerm.toLowerCase().trim()) ||
					client?.phone_number
						?.toLowerCase()
						.includes(searchTerm.toLowerCase().trim()),
			);
		}

		// Then apply favorites filter if enabled
		if (showFavorites) {
			filtered = filtered.filter((client) =>
				favorites.includes(client.client_id),
			);
		}

		return filtered;
	}, [clientsArray, searchTerm, showFavorites, favorites]);

	useEffect(() => {
		const fetchCurrencyData = async () => {
			if (clientsArray.length > 0) {
				const deviceId = localStorage.getItem("device_id");
				const ksbId = localStorage.getItem("ksbIdNumber");

				try {
					const response = await fetch(
						`${nodeUrl}/api/get/currency/data/${deviceId}/${ksbId}`,
					);
					const data = await response.json();
					setCurrencyData(data);
				} catch (error) {
					console.error("Failed to fetch currency data", error);
				}
			}
		};

		fetchCurrencyData();
	}, [clientsArray]);

	const foundCurrency = (id) => {
		const currency = currencyData.find((item) => item.item_id === id);
		return currency ? currency.name : null;
	};

	// Toggle favorite status for a client
	const toggleFavorite = (clientId, event) => {
		// Prevent parent click event from firing
		event.stopPropagation();

		setFavorites((prevFavorites) => {
			if (prevFavorites.includes(clientId)) {
				// Remove from favorites
				return prevFavorites.filter((id) => id !== clientId);
			} else {
				// Add to favorites
				return [...prevFavorites, clientId];
			}
		});
	};

	// Toggle showing only favorites
	const toggleShowFavorites = () => {
		setShowFavorites((prev) => !prev);
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 rounded-lg bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
			<div
				className="bg-white rounded-lg w-[70vw] shadow-xl flex flex-col"
				style={{ height: "90vh" }}
			>
				<div className="px-5 py-3 border-b flex justify-between items-center bg-white sticky top-0">
					<h2 className="text-lg font-semibold">
						{content[language].salesPage.sidebarClientSelect}
					</h2>
					<button
						onClick={onClose}
						className="p-1 rounded-full hover:bg-gray-100"
					>
						<IoClose className="w-5 h-5" />
					</button>
				</div>

				<div className="px-4 pt-4 flex items-center w-full bg-white sticky top-0 z-10 border-b-2 pb-4">
					<div className="flex items-center flex-1">
						<div className="relative">
							<input
								type="text"
								placeholder={`${content[language].salesPage.sidebarClientSearch}...`}
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="w-[500px] px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
							/>
							<IoSearchOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
						</div>
						<div className="relative ml-4">
							<button
								onClick={setOpenCreatingModal}
								className="bg-green-600 flex items-center text-white px-4 py-2 hover:bg-green-700 rounded-lg"
							>
								<span className="mr-1">
									<IoIosAdd className="font-bold text-2xl" />
								</span>
								Янги клиент
							</button>
						</div>
						<button
							className={`border-2 ml-4 flex items-center p-2.5 hover:bg-slate-100 rounded-lg ${
								showFavorites
									? "bg-yellow-50 border-yellow-300"
									: "bg-white border-grey-300"
							}`}
							onClick={toggleShowFavorites}
						>
							<span className="">
								<FaRegStar
									className={`text-base ${
										showFavorites ? "text-yellow-500" : ""
									}`}
								/>
							</span>
						</button>
					</div>
					<div className=""></div>
				</div>

				<div
					className="flex-1 overflow-y-auto px-4"
					style={{ minHeight: "300px" }}
				>
					{filteredClients.length === 0 ? (
						<div className="flex items-center justify-center h-full text-gray-500">
							{showFavorites
								? "Клиентлар топилмади"
								: "Клиентлар топилмади"}
						</div>
					) : (
						filteredClients.map((client) => (
							<div
								key={client.client_id}
								className="flex items-center justify-between gap-3 p-3 hover:bg-gray-50 cursor-pointer rounded-lg border border-transparent hover:border-gray-200 mb-2"
							>
								<div
									onClick={() => {
										onSelect(client);
										onClose();
										setSearchTerm("");
										setNameValue("");
										setPhone("+998");
										setAddressValue("");
										setNewClientId("");
										searchInputRef.current.select();
										searchInputRef.current.focus();
									}}
									className="flex items-center flex-1"
								>
									<div className="w-10 mr-3 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
										<span className="text-green-700 font-medium">
											{client.name.charAt(0)}
										</span>
									</div>
									<div className="flex flex-row items-center flex-1">
										<div className="min-w-0 flex-1">
											<div className="font-medium truncate">
												{client.name}
											</div>
											<div className="text-sm text-gray-500 truncate">
												{client.phone_number}
											</div>
										</div>
									</div>

									<div className="ml-auto text-right">
										<div className="font-medium text-green-600 truncate">
											{client.positive_balance?.length > 0
												? client.positive_balance
														.map(
															(item) =>
																`${formatPrice(
																	item.sum,
																)} ${foundCurrency(
																	item.currency,
																)}`,
														)
														.join(", ")
												: ""}
										</div>
										<div className="font-medium text-red-600 truncate">
											{client.negative_balance?.length > 0
												? client.negative_balance
														.map(
															(item) =>
																`${formatPrice(
																	item.sum,
																)} ${foundCurrency(
																	item.currency,
																)}`,
														)
														.join(", ")
												: ""}
										</div>
									</div>
								</div>

								<div>
									<button
										className={`border-2 flex items-center p-2.5 hover:bg-slate-100 rounded-lg ${
											favorites.includes(client.client_id)
												? "bg-yellow-50 border-yellow-300"
												: "bg-white border-grey-300"
										}`}
										onClick={(e) =>
											toggleFavorite(client.client_id, e)
										}
									>
										<span>
											<FaRegStar
												className={`text-base ${
													favorites.includes(
														client.client_id,
													)
														? "text-yellow-500"
														: ""
												}`}
											/>
										</span>
									</button>
								</div>
							</div>
						))
					)}
				</div>
			</div>
		</div>
	);
};

const CreatingClientModal = ({
	openCreatingModal,
	onCloseCreatingModal,
	nameValue,
	setNameValue,
	phone,
	setPhone,
	addressValue,
	setAddressValue,
	setNewClientId,
	onClose,
	searchInputRef,
}) => {
	const [language] = useLang("uz");

	const nameInputRef = useRef(null);
	const phoneInputRef = useRef(null);
	const addressInputRef = useRef(null);
	const sendButtonRef = useRef(null);

	useEffect(() => {
		if (openCreatingModal && nameInputRef.current) {
			nameInputRef.current.focus();
		}
	}, [openCreatingModal]);

	if (!openCreatingModal) return null;
	return (
		<div className="fixed inset-0 rounded-lg bg-black bg-opacity-50 flex items-center justify-center p-4 z-[63]">
			<div
				className="bg-white rounded-lg w-[600px] shadow-xl flex flex-col"
				style={{ height: "400px" }}
			>
				<div className="px-5 py-3 border-b flex justify-between items-center bg-white sticky top-0">
					<h2 className="text-lg font-semibold">Клиент қўшиш</h2>
					<button
						onClick={onCloseCreatingModal}
						className="p-1 rounded-full hover:bg-gray-100"
					>
						<IoClose className="w-5 h-5" />
					</button>
				</div>

				<div className="flex flex-col px-5 py-4 gap-4 flex-grow overflow-auto">
					{/* Имя */}
					<div className="flex flex-col">
						<label className="text-sm font-medium text-gray-700 mb-1">
							Имя
						</label>
						<div className="relative">
							<IoPersonOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
							<input
								ref={nameInputRef}
								type="text"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
								placeholder="Исм"
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										phoneInputRef.current.focus();
									}
								}}
								value={nameValue}
								onChange={(e) => {
									setNameValue(e.target.value);
								}}
							/>
						</div>
					</div>

					{/* Телефон */}
					<div className="flex flex-col">
						<label className="text-sm font-medium text-gray-700 mb-1">
							Телефон
						</label>
						<div className="relative">
							<IoCallOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
							<input
								ref={phoneInputRef}
								type="tel"
								value={phone}
								onChange={(e) => {
									let digits = e.target.value
										.replace(/\D/g, "")
										.replace(/^998/, "")
										.slice(0, 9);

									let formatted = "+998";
									if (digits.length > 0)
										formatted += " " + digits.slice(0, 2);
									if (digits.length >= 3)
										formatted += " " + digits.slice(2, 5);
									if (digits.length >= 6)
										formatted += " " + digits.slice(5, 7);
									if (digits.length >= 8)
										formatted += " " + digits.slice(7, 9);

									setPhone(formatted);
								}}
								onKeyDown={(e) => {
									if (
										e.target.selectionStart <= 5 &&
										(e.key === "Backspace" ||
											e.key === "Delete")
									) {
										e.preventDefault();
									}
								}}
								maxLength={17}
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
								placeholder="+998 90 000 11 22"
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										addressInputRef.current.focus();
									}
								}}
							/>
						</div>
					</div>

					{/* Адрес */}
					<div className="flex flex-col">
						<label className="text-sm font-medium text-gray-700 mb-1">
							Адрес
						</label>
						<div className="relative">
							<IoLocationOutline className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
							<input
								ref={addressInputRef}
								type="text"
								className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
								placeholder="Адрес"
								onKeyPress={(e) => {
									if (e.key === "Enter") {
										sendButtonRef.current.focus();
									}
								}}
								value={addressValue}
								onChange={(e) => {
									setAddressValue(e.target.value);
								}}
							/>
						</div>
					</div>

					<div className="flex items-center justify-end mt-auto">
						<button
							ref={sendButtonRef}
							className="bg-white  mr-3 text-slate-500 px-6 py-2 rounded-lg hover:bg-red-400 hover:text-white transition duration-200"
							onClick={() => {
								onCloseCreatingModal();
								setNameValue("");
								setPhone("+998 ");
								setAddressValue("");
								setNewClientId("");
							}}
						>
							Бекор қилиш
						</button>
						<button
							ref={sendButtonRef}
							className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
							onKeyPress={(e) => {
								const new_client_id = uuidv4();
								setNewClientId(new_client_id);
								onCloseCreatingModal();
								onClose();
								searchInputRef.current.select();
								searchInputRef.current.focus();
							}}
							onClick={() => {
								const new_client_id = uuidv4();
								setNewClientId(new_client_id);
								onCloseCreatingModal();
								onClose();
								searchInputRef.current.select();
								searchInputRef.current.focus();
							}}
						>
							Сақлаш
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CardPaymentModal;

