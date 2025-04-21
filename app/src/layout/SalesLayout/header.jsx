import React, { useState, useEffect, useCallback } from "react";

import {
	MdOutlineFormatListBulleted,
	MdCalendarToday,
	MdClose,
	MdDelete,
} from "react-icons/md";
import {
	HiOutlineUserCircle,
	HiOutlineDocumentCheck,
	HiOutlineDocument,
	HiOutlineDocumentMinus,
} from "react-icons/hi2";
import { SlBasket } from "react-icons/sl";
import { FiPrinter, FiEye } from "react-icons/fi";
import { PiWarningCircleBold, PiCardsThreeFill } from "react-icons/pi";
import { RiDiscountPercentLine } from "react-icons/ri";
import { BiSearch } from "react-icons/bi";
import { GoAlert } from "react-icons/go";
import { BsThreeDots } from "react-icons/bs";
import { TbBasketExclamation } from "react-icons/tb";
import { IoBasketOutline } from "react-icons/io5";
import { IoIosOptions, IoIosSave } from "react-icons/io";
import { LuPrinter } from "react-icons/lu";

import DiscountModal from "./DiscountModal";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import nodeUrl from "../../links";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

import moment from "moment";
import "moment/locale/ru";

import CustomCalendar from "../../components/CustomCalendar";

moment.locale("ru");

function SalesPageLayoutHeader({ socket }) {
	const [isListModalOpen, setIsListModalOpen] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [selectedSale, setSelectedSale] = useState(null);
	const [productData, setProductData] = useState([]);
	const [selectedRowId, setSelectedRowId] = useState(null);

	const [isModalOpenDis, setIsModalOpenDis] = useState(false);

	const [showPopup, setShowPopup] = useState(false);
	const [activePopupId, setActivePopupId] = useState(null);
	const [language] = useLang("uz");
	const settingsDeviceInfoData = JSON.parse(
		localStorage.getItem("settingsDevice"),
	);

	const [searchTerm, setSearchTerm] = useState("");
	const [showCalendar, setShowCalendar] = useState(false);
	const [selectedDate, setSelectedDate] = useState(null);
	const [statusFilters, setStatusFilters] = useState({
		process: false,
		delivered: false,
		falseDelivered: false,
		problem: false,
	});
	const [showFilters, setShowFilters] = useState(false);
	const [viewMode, setViewMode] = useState("table");
	const [showActionsMenu, setShowActionsMenu] = useState(null);

	const openDetailModal = (sale) => {
		setSelectedSale(sale);
		setIsDetailModalOpen(true);
	};

	const basicUsername = localStorage.getItem("userType");
	const ksb_id = localStorage.getItem("ksbIdNumber");
	const ksbIdNumber = localStorage.getItem("ksbIdNumber");
	const device_id = localStorage.getItem("device_id");

	useEffect(() => {
		fetchProducts();

		const updateHandler = () => fetchProducts();
		socket.on("gettingAllSavedSales", updateHandler);

		return () => {
			socket.off("gettingAllSavedSales", updateHandler);
		};
	}, []);

	const fetchProducts = async () => {
		try {
			const response = await fetch(`${nodeUrl}/api/all/sales/${ksb_id}`);
			if (!response.ok) {
				throw new Error("Failed to fetch products");
			}
			const data = await response.json();
			setProductData(data);
		} catch (err) {
			console.log(err);
		}
	};

	const [currencyData, setCurrencyData] = useState({});

	const fetchCurrencyData = useCallback(async () => {
		if (!productData || productData.length === 0) {
			return; // No products, nothing to fetch
		}

		// 1. Collect unique currency IDs needed from product details
		const uniqueCurrencyIds = [
			...new Set(
				productData
					.map((product) => product?.details?.[0]?.currency) // Safely access currency
					.filter((id) => id != null), // Filter out null/undefined IDs
			),
		];

		if (uniqueCurrencyIds.length === 0) {
			return; // No valid currency IDs found
		}

		// 2. Identify IDs that haven't been fetched yet
		const currenciesToFetch = uniqueCurrencyIds.filter(
			(id) => !(id in currencyData), // Check against existing currencyData state keys
		);

		if (currenciesToFetch.length === 0) {
			return; // All needed data already present
		}

		// 3. Fetch data for missing IDs concurrently
		try {
			const promises = currenciesToFetch.map((currencyId) =>
				fetch(
					`${nodeUrl}/api/get/currency/data/${device_id}/${ksbIdNumber}/${currencyId}`,
				)
					.then((response) => {
						if (!response.ok) {
							console.error(
								`Failed to fetch currency data for ${currencyId}: ${response.statusText}`,
							);
							return null; // Mark as failed
						}
						return response.json();
					})
					.then((data) => {
						if (data && data.length > 0) {
							return { [currencyId]: data[0]?.name || "-" };
						}
						console.warn(
							`No data returned for currency ID: ${currencyId}`,
						);
						return { [currencyId]: "-" }; // Store placeholder
					})
					.catch((error) => {
						console.error(
							`Error processing currency data for ${currencyId}`,
							error,
						);
						return { [currencyId]: "-" }; // Store placeholder on error
					}),
			);

			const results = await Promise.all(promises);

			// 4. Combine successful/placeholder results
			const newCurrencyData = results.reduce((acc, result) => {
				if (result) {
					return { ...acc, ...result };
				}
				return acc;
			}, {});

			// 5. Update state ONCE
			if (Object.keys(newCurrencyData).length > 0) {
				setCurrencyData((prev) => ({ ...prev, ...newCurrencyData }));
			}
		} catch (error) {
			console.error(
				"Error fetching currency data with Promise.all",
				error,
			);
		}
	}, [productData, device_id, ksbIdNumber]); // Correct dependencies

	useEffect(() => {
		fetchCurrencyData();
	}, [fetchCurrencyData]);

	const cashDataAll = JSON.parse(localStorage.getItem("settingsCashData"));

	function findObjectById(id) {
		const result = cashDataAll.find((item) => item.cash_id === id);
		return result || null;
	}

	const today = new Date().toLocaleDateString("ru-RU", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const [warehouseData, setWarehouseData] = useState({});

	const settingsWarehouse = JSON.parse(
		localStorage.getItem("settingsWarehouse"),
	);

	const fetchWarehouseData = useCallback(async () => {
		if (!productData || productData.length === 0) {
			return; // No products, nothing to fetch
		}

		// 1. Collect unique warehouse IDs needed
		const uniqueWarehouseIds = [
			...new Set(
				productData
					.map((product) => product?.details?.[0]?.warehouse)
					.filter((id) => id != null), // Filter out null/undefined IDs
			),
		];

		if (uniqueWarehouseIds.length === 0) {
			return; // No valid warehouse IDs found
		}

		// 2. Identify IDs that haven't been fetched yet
		const warehousesToFetch = uniqueWarehouseIds.filter(
			(id) => !(id in warehouseData),
		);

		if (warehousesToFetch.length === 0) {
			return; // All needed data already present
		}

		// 3. Fetch data for missing IDs concurrently
		const deviceId = localStorage.getItem("device_id");
		const ksbId = localStorage.getItem("ksbIdNumber");

		try {
			const promises = warehousesToFetch.map((warehouseId) =>
				fetch(
					`${nodeUrl}/api/get/warehouse/data/${deviceId}/${ksbId}/${warehouseId}`,
				)
					.then((response) => {
						if (!response.ok) {
							console.error(
								`Failed to fetch warehouse data for ${warehouseId}: ${response.statusText}`,
							);
							return null; // Mark as failed
						}
						return response.json();
					})
					.then((data) => {
						// Assuming data is an array like [{item_id: 'id1', name: 'Name1'}, ...] even for a single ID
						if (data && data.length > 0) {
							return { [data[0].item_id]: data[0].name };
						}
						console.warn(
							`No data returned for warehouse ID: ${warehouseId}`,
						);
						return null;
					})
					.catch((error) => {
						console.error(
							`Error processing warehouse data for ${warehouseId}`,
							error,
						);
						return null; // Handle individual fetch errors
					}),
			);

			const results = await Promise.all(promises);

			// 4. Filter out null results (failed requests) and combine successful ones
			const newWarehouseData = results.reduce((acc, result) => {
				if (result) {
					return { ...acc, ...result };
				}
				return acc;
			}, {});

			// 5. Update state ONCE with all new data found
			if (Object.keys(newWarehouseData).length > 0) {
				setWarehouseData((prev) => ({ ...prev, ...newWarehouseData }));
			}
		} catch (error) {
			console.error(
				"Error fetching warehouse data with Promise.all",
				error,
			);
		}

		// Remove warehouseData from dependencies, add device_id and ksbIdNumber as they are used inside
	}, [productData, device_id, ksbIdNumber]);

	useEffect(() => {
		fetchWarehouseData();
	}, [fetchWarehouseData]);

	useEffect(() => {
		if (!selectedDate) {
			setShowCalendar(false);
		}
	}, [selectedDate]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (!event.target.closest(".popup-container")) {
				setActivePopupId(null);
			}
		};
		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, []);

	// ==================== new code ====================

	useEffect(() => {
		const savedViewMode = localStorage.getItem("viewModeProcess");
		if (savedViewMode) {
			setViewMode(savedViewMode);
		}
	}, []);

	const getFilteredData = () => {
		return productData.filter((sale) => {
			const searchMatch =
				sale.client_name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				warehouseData[sale.mainWarehouse]
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				sale.total_price?.toString().includes(searchTerm);

			const dateMatch = selectedDate
				? moment(sale.date).isSame(moment(selectedDate), "day")
				: true;

			const statusMatch =
				(!statusFilters.process &&
					!statusFilters.delivered &&
					!statusFilters.falseDelivered &&
					!statusFilters.problem) ||
				(statusFilters.process && sale.status === "process") ||
				(statusFilters.delivered && sale.status === "delivered") ||
				(statusFilters.falseDelivered &&
					sale.status === "falseDelivered") ||
				(statusFilters.problem && sale.status === "problem");

			return searchMatch && dateMatch && statusMatch;
		});
	};

	const handleStatusFilterChange = (status) => {
		setStatusFilters((prev) => ({
			...prev,
			[status]: !prev[status],
		}));
	};

	const handleDateSelect = (date) => {
		setSelectedDate(date);
		setShowCalendar(false);
	};

	const filteredData = getFilteredData();

	useEffect(() => {
		if (!selectedDate) {
			setShowCalendar(false);
		}
	}, [selectedDate]);

	const getStatusBadge = (status, error, row_id) => {
		switch (status) {
			case "process":
				return (
					<div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
						<HiOutlineDocument className="text-sm" />
					</div>
				);
			case "delivered":
				return (
					<div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
						<HiOutlineDocumentCheck className="text-sm" />
					</div>
				);
			case "falseDelivered":
				return (
					<div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-ingido-200">
						<HiOutlineDocumentMinus className="text-sm" />
					</div>
				);
			case "problem":
				return (
					<div className="relative z-200 inline-block popup-container">
						<div
							className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer relative animate-pulse hover:scale-110 transition-transform duration-300"
							onClick={(e) => {
								e.stopPropagation();
								setShowPopup(!showPopup);
								setActivePopupId(
									activePopupId === row_id ? null : row_id,
								);
							}}
						>
							<span className="absolute inset-0 bg-rose-400 opacity-50 rounded-md blur-md animate-[pulse_1.5s_infinite]"></span>
							<PiWarningCircleBold className="text-sm relative" />
						</div>

						{activePopupId === row_id &&
							(viewMode === "table" ? (
								<div className="absolute left-[100%] top-[70%] z-[200] w-[300px] -translate-y-2/2 rounded-lg bg-white p-3 text-sm shadow-lg border border-gray-300">
									<p className="text-red-600">{error}</p>
								</div>
							) : (
								<div className="absolute right-[100%] top-[250%] w-[300px] -translate-y-1/2 rounded-lg bg-white p-3 text-sm shadow-lg border border-gray-300">
									<p className="text-red-600">{error}</p>
								</div>
							))}
					</div>
				);
			default:
				return status;
		}
	};

	const clearAllFilters = () => {
		setSearchTerm("");
		setSelectedDate(null);
		setStatusFilters({
			process: false,
			delivered: false,
			falseDelivered: false,
		});
	};

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (!event.target.closest(".active-buttons")) {
				setShowActionsMenu(null);
			}
		};

		document.addEventListener("click", handleClickOutside);
		return () => {
			document.removeEventListener("click", handleClickOutside);
		};
	}, []);

	const [isExitModalOpen, setIsExitModalOpen] = useState(false);

	const deleteOneSales = async (salesId) => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/delete/saved/sales/${salesId}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				console.log("removed");
			} else {
				console.log("no item to remove");
			}
		} catch (error) {
			console.error("Error:", error);
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
			await fetch(`${nodeUrl}/api/print/${selectedRowId}`, {
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

	const handlePrintOneSalesToDetails = async (sales_id) => {
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

	const checkInternetConnection = async () => {
		try {
			const online = window.navigator.onLine;

			if (!online) {
				return false;
			}

			const ksbId = localStorage.getItem("ksbIdNumber");
			const ipaddressPort = localStorage.getItem("ipaddress:port");
			const mainDatabase = localStorage.getItem("mainDatabase");
			const userType = localStorage.getItem("userType");
			const userPassword = localStorage.getItem("userPassword");

			const credentials = Buffer.from(
				`${userType}:${userPassword}`,
			).toString("base64");

			const response = await fetch(
				`http://${ipaddressPort}/${mainDatabase}/hs/ksbmerp_pos/ping/ksb?text=pos&ksb_id=${ksbId}`,
				{
					headers: { Authorization: `Basic ${credentials}` },
				},
			);

			return response.status === 200;
		} catch (error) {
			console.error("Error during internet connection check:", error);
			return false;
		}
	};

	const handleSaveSalesToAPI = async (sales_id) => {
		const isOnline = await checkInternetConnection();

		const ksbId = localStorage.getItem("ksbIdNumber");
		const ipaddressPort = localStorage.getItem("ipaddress:port");
		const mainDatabase = localStorage.getItem("mainDatabase");
		const userType = localStorage.getItem("userType");
		const userPassword = localStorage.getItem("userPassword");

		if (isOnline) {
			const product = filteredData.find((item) => item.id === sales_id);

			const oneSale = {
				sales: [
					{
						details: [
							{
								document: product.id,
								client: product.client_id,
								warehouse: product.details[0]?.warehouse,
								price_type: product.details[0]?.price_type,
								rate: Number(product.details[0]?.rate),
								currency: product.details[0]?.currency,
								discount: Number(product.details[0]?.discount),
								comment: product.details[0]?.comment,
								below_cost:
									product.details[0]?.below_cost === 1
										? true
										: false,
								save: true,
							},
						],
						products: product.products,
						payments: product.payments,
					},
				],
			};

			const salesBody = {
				ksb_id: ksbId,
				device_id: device_id,
				host: ipaddressPort,
				authUser: userType,
				authPass: userPassword,
				database: mainDatabase,
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

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				setIsListModalOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<div className="salesfooter px-4 py-1 bg-slate-100 shadow-lg border-t border-gray-300 flex items-center justify-between">
			<div className="flex items-center justify-start">
				<div className="flex items-center gap-4 pr-5">
					<span className="text-black text-lg flex items-center gap-2">
						<HiOutlineUserCircle className="text-2xl" />
						<span className="font-medium">{basicUsername}</span>
					</span>
				</div>
			</div>
			<div className="flex items-center">
				<button
					onClick={() => setIsModalOpenDis(true)}
					className="flex w-[150px]  items-center mr-2 cursor-pointer justify-center bg-red-500 hover:bg-red-600 text-slate-100 px-7 py-2 text-md rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600"
				>
					<RiDiscountPercentLine className="mr-3 text-2xl " />
					<span className="font-500">
						{content[language].salesPage.headerDiscount}
					</span>
				</button>
				<button
					onClick={() => setIsListModalOpen(true)}
					className="flex relative w-[200px] items-center mr-4 justify-center bg-green-600 hover:bg-green-500 text-slate-100 px-6 py-2 text-md rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600"
				>
					{filteredData?.filter(
						(item) =>
							item.status === "process" ||
							item.status === "problem",
					).length > 0 ? (
						<div className="mr-2 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
							{
								filteredData.filter(
									(item) =>
										item.status === "process" ||
										item.status === "problem",
								).length
							}
						</div>
					) : (
						<MdOutlineFormatListBulleted className="mr-3 text-xl" />
					)}

					<span className="font-500">
						{content[language].salesPage.headerList}
					</span>
				</button>

				<p className="flex items-center w-[180px] justify-center bg-slate-100 border-2 border-black  text-black px-7 py-1.5 text-lg rounded-lg transition duration-300 ease-in-out ">
					<span className="font-semibold">{today}</span>
				</p>
			</div>
			{isListModalOpen && (
				<div className="fixed inset-0 bg-black/70 flex items-center text-black justify-center z-40 backdrop-blur-sm">
					<div className="bg-white rounded-xl w-full max-w-[90vw] h-[90vh] overflow-hidden flex flex-col shadow-2xl">
						<div className="px-6 py-4 border-b flex justify-between items-center bg-white">
							<div className="flex items-center gap-3">
								<div className="bg-indigo-50 p-2 rounded-lg">
									<SlBasket className="text-2xl text-indigo-600" />
								</div>
								<div>
									<h2 className="text-xl font-semibold text-gray-800">
										{content[language].salesPage.headerList}
									</h2>
									<p className="text-sm text-gray-500">
										{
											content[language].salesPage
												.headerListSubText
										}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3">
								<button
									className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
									onClick={() => {
										const newViewMode =
											viewMode === "table"
												? "card"
												: "table";
										setViewMode(newViewMode); // Update state
										localStorage.setItem(
											"viewModeProcess",
											newViewMode,
										);
									}}
								>
									{viewMode === "table" ? (
										<MdOutlineFormatListBulleted className="text-xl" />
									) : (
										<PiCardsThreeFill className="text-xl" />
									)}
								</button>
								<button
									onClick={() => setIsListModalOpen(false)}
									className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
								>
									<MdClose className="text-xl" />
								</button>
							</div>
						</div>

						{/* === filters === */}
						<div className="p-5 bg-white border-b">
							<div className="flex flex-wrap items-center gap-3">
								<div className="relative flex-grow max-w-md">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<BiSearch className="text-gray-400" />
									</div>
									<input
										type="text"
										value={searchTerm}
										onChange={(e) =>
											setSearchTerm(e.target.value)
										}
										placeholder={
											content[language].salesPage
												.headerListSearch
										}
										className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all"
									/>
									{searchTerm && (
										<button
											onClick={() => setSearchTerm("")}
											className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
										>
											<MdClose />
										</button>
									)}
								</div>

								<div className="relative">
									<button
										onClick={() => {
											if (selectedDate) {
												setSelectedDate(null);
											} else {
												setShowCalendar(!showCalendar);
											}
										}}
										className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
											selectedDate
												? "bg-indigo-500 text-white hover:bg-indigo-600"
												: "bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100"
										}`}
									>
										<MdCalendarToday />
										{selectedDate
											? `${moment(selectedDate).format(
													"DD.MM.YYYY",
											  )}`
											: content[language].salesPage
													.headerListDateSelect}
										{selectedDate && (
											<MdClose className="text-sm hover:text-gray-100" />
										)}
									</button>
									{showCalendar && (
										<div className="absolute top-full mt-2 z-50">
											<CustomCalendar
												value={selectedDate}
												onChange={handleDateSelect}
											/>
										</div>
									)}
								</div>

								<button
									onClick={() => setShowFilters(!showFilters)}
									className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all ${
										Object.values(statusFilters).some(
											Boolean,
										)
											? "bg-indigo-50 text-indigo-700 border border-indigo-200"
											: "bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100"
									}`}
								>
									{showFilters ? (
										<MdClose />
									) : (
										<IoIosOptions />
									)}
									{
										content[language].salesPage
											.headerListFilter
									}
									{Object.values(statusFilters).some(
										Boolean,
									) && (
										<span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">
											{
												Object.values(
													statusFilters,
												).filter(Boolean).length
											}
										</span>
									)}
								</button>

								<button
									onClick={handlePrintOneSales}
									className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-all bg-gray-50 border border-gray-300 text-gray-700 hover:bg-gray-100`}
								>
									<LuPrinter />
									Печать
								</button>

								{(searchTerm ||
									selectedDate ||
									Object.values(statusFilters).some(
										Boolean,
									)) && (
									<button
										onClick={clearAllFilters}
										className="px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
									>
										{
											content[language].salesPage
												.headerListFilterClear
										}
									</button>
								)}

								<div className="ml-auto text-sm text-gray-500 font-medium">
									{
										content[language].salesPage
											.headerListFound
									}{" "}
									<span className="text-gray-900 font-semibold">
										{filteredData.length}
									</span>
								</div>
							</div>

							{showFilters && (
								<div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
									<h4 className="text-sm font-medium text-gray-700 mb-3">
										{
											content[language].salesPage
												.headerListFilterStatus
										}
									</h4>
									<div className="flex flex-wrap gap-3">
										<button
											onClick={() =>
												handleStatusFilterChange(
													"process",
												)
											}
											className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
												statusFilters.process
													? "bg-indigo-100 text-indigo-800 border border-indigo-300"
													: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
											}`}
										>
											<HiOutlineDocument
												className={
													statusFilters.process
														? "text-indigo-600"
														: "text-gray-500"
												}
											/>
											{
												content[language].salesPage
													.headerListFilterStatusPending
											}
										</button>
										<button
											onClick={() =>
												handleStatusFilterChange(
													"delivered",
												)
											}
											className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
												statusFilters.delivered
													? "bg-emerald-100 text-emerald-800 border border-emerald-300"
													: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
											}`}
										>
											<HiOutlineDocumentCheck
												className={
													statusFilters.delivered
														? "text-emerald-600"
														: "text-gray-500"
												}
											/>
											{
												content[language].salesPage
													.headerListFilterStatusSucess
											}
										</button>
										<button
											onClick={() =>
												handleStatusFilterChange(
													"falseDelivered",
												)
											}
											className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
												statusFilters.falseDelivered
													? "bg-rose-100 text-orange-800 border border-orange-300"
													: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
											}`}
										>
											<HiOutlineDocumentMinus
												className={
													statusFilters.falseDelivered
														? "text-orange-600"
														: "text-gray-500"
												}
											/>
											{
												content[language].salesPage
													.headerListFilterStatusNotSuccess
											}
										</button>
										<button
											onClick={() =>
												handleStatusFilterChange(
													"problem",
												)
											}
											className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-all ${
												statusFilters.problem
													? "bg-rose-100 text-rose-800 border border-rose-300"
													: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
											}`}
										>
											<HiOutlineDocument
												className={
													statusFilters.problem
														? "text-rose-600"
														: "text-gray-500"
												}
											/>
											{
												content[language].salesPage
													.headerListFilterStatusError
											}
										</button>
									</div>
								</div>
							)}
						</div>

						<div className="overflow-y-auto flex-grow p-5 bg-gray-50 z-100 relative">
							{filteredData.length > 0 ? (
								viewMode === "table" ? (
									<div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
										<table className="min-w-full divide-y divide-gray-200 table-fixed">
											<thead className="bg-gray-50">
												<tr>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
													>
														{
															content[language]
																.salesPage
																.headerListTableDate
														}
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
													>
														{
															content[language]
																.salesPage
																.headerListTableWarehouse
														}
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
													>
														{
															content[language]
																.salesPage
																.headerListTableClient
														}
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
													>
														{
															content[language]
																.salesPage
																.headerListTableSumma
														}
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
													>
														{
															content[language]
																.salesPage
																.headerListTableStatus
														}
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
													>
														{
															content[language]
																.salesPage
																.headerListTableAvtor
														}
													</th>
													<th
														scope="col"
														className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px]"
													>
														{
															content[language]
																.salesPage
																.headerListTableActions
														}
													</th>
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{[...filteredData]
													.reverse()
													.map((sale) => (
														<tr
															key={sale.id}
															className={`group transition-all ${
																selectedRowId ===
																sale.id
																	? "bg-indigo-50"
																	: "hover:bg-gray-50"
															}`}
															onClick={() =>
																setSelectedRowId(
																	sale.id,
																)
															}
															// onDoubleClick={() =>
															// 	openDetailModal &&
															// 	openDetailModal(
															// 		sale,
															// 	)
															// }
														>
															<td className="px-6 py-4">
																<div className="flex items-center">
																	{getStatusBadge(
																		sale.status,
																		sale.errorMessage,
																		sale.id,
																	)}
																	<div className="ml-3 text-sm text-gray-500">
																		{moment(
																			sale.date,
																		).isSame(
																			moment(),
																			"day",
																		)
																			? moment(
																					sale.date,
																			  ).format(
																					"DD.MM.YYYY HH:mm",
																			  )
																			: moment(
																					sale.date,
																			  ).format(
																					"DD.MM.YYYY HH:mm",
																			  )}
																	</div>
																</div>
															</td>
															<td className="px-6 py-4">
																<div className="flex items-center">
																	{/* <div className="flex-shrink-0 h-8 w-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
																									<MdWarehouse />
																								</div> */}
																	<div className="">
																		<div className="text-sm font-medium text-gray-900">
																			{
																				warehouseData[
																					sale
																						.details[0]
																						.warehouse
																				]
																			}
																		</div>
																		<div className="text-xs text-gray-500">
																			{
																				content[
																					language
																				]
																					.salesPage
																					.headerListTableMain
																			}
																		</div>
																	</div>
																</div>
															</td>
															<td className="px-6 py-4">
																<div className="flex items-center">
																	<div>
																		<div
																			className={`text-sm font-medium text-gray-900 ${
																				sale.client_name ===
																				"<не указан>"
																					? "text-slate-300"
																					: ""
																			}`}
																		>
																			{(() => {
																				const words =
																					sale.client_name.split(
																						" ",
																					);
																				return words.length >
																					5
																					? words
																							.slice(
																								0,
																								3,
																							)
																							.join(
																								" ",
																							) +
																							"..."
																					: sale.client_name;
																			})()}
																		</div>
																	</div>
																</div>
															</td>

															<td className="px-6 py-4">
																<div className="text-sm font-medium text-gray-900">
																	{parseFloat(
																		sale.total_price,
																	).toLocaleString(
																		"ru-RU",
																		{
																			minimumFractionDigits:
																				settingsDeviceInfoData
																					.format
																					.format_sum
																					.max,
																			maximumFractionDigits:
																				settingsDeviceInfoData
																					.format
																					.format_sum
																					.max,
																		},
																	)}{" "}
																</div>
																<div className="text-xs text-gray-500">
																	{
																		currencyData[
																			sale
																				.details[0]
																				.currency
																		]
																	}
																</div>
															</td>
															<td className="px-6 py-4">
																<div className="flex items-center">
																	<div className="">
																		<div className="text-sm font-medium text-gray-900">
																			{sale.status ===
																			"process" ? (
																				<p
																					className={`${
																						selectedRowId ===
																						sale.id
																							? "bg-orange-600"
																							: "bg-orange-500"
																					} px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
																				>
																					Кутилмоқда
																				</p>
																			) : sale.status ===
																			  "problem" ? (
																				<p
																					className={`${
																						selectedRowId ===
																						sale.id
																							? "bg-red-600"
																							: "bg-red-500"
																					} px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
																				>
																					Хатолик
																				</p>
																			) : sale.status ===
																					"delivered" ||
																			  sale.status ===
																					"falseDelivered" ? (
																				<p
																					className={`${
																						selectedRowId ===
																						sale.id
																							? "bg-green-600"
																							: "bg-green-500"
																					} px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
																				>
																					Юборилди
																				</p>
																			) : (
																				sale.status
																			)}
																		</div>
																	</div>
																</div>
															</td>

															<td className="px-6 py-4">
																<div className="flex items-center">
																	<div className="">
																		<div className="text-sm font-medium text-gray-900">
																			{
																				sale.seller
																			}
																		</div>
																	</div>
																</div>
															</td>
															<td className="px-6 py-4">
																<div className="flex items-center justify-center space-x-1">
																	<button
																		className="p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
																		onClick={(
																			e,
																		) => {
																			openDetailModal(
																				sale,
																			);
																		}}
																	>
																		<FiEye />
																	</button>
																	<div>
																		<button
																			className="p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
																			onClick={() => {
																				handlePrintOneSalesToDetails(
																					sale.id,
																				);
																			}}
																		>
																			<FiPrinter />
																		</button>
																	</div>
																	<div className="">
																		<button
																			className="p-1.5 active-buttons text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
																			onClick={(
																				e,
																			) => {
																				setShowActionsMenu(
																					showActionsMenu ===
																						sale.id
																						? null
																						: sale.id,
																				);
																			}}
																		>
																			<BsThreeDots />
																		</button>
																		{showActionsMenu ===
																			sale.id && (
																			<div className="absolute right-10 mt-1 w-48 bg-white z-60 rounded-lg shadow-lg border border-gray-200 py-1">
																				<button
																					onClick={
																						handlePrintOneSales
																					}
																					className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																				>
																					<FiPrinter className="text-gray-500" />
																					Печать
																				</button>
																				<button
																					onClick={(
																						e,
																					) => {
																						openDetailModal(
																							sale,
																						);
																					}}
																					className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																				>
																					<FiEye className="text-gray-500" />
																					Батафсил
																				</button>

																				{(sale.status ===
																					"process" ||
																					sale.status ===
																						"problem") && (
																					<>
																						{/* <button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2">
																							<LuSend className="text-gray-500" />
																							Қайта
																							юбориш
																						</button> */}
																						<button
																							onClick={(
																								e,
																							) => {
																								e.preventDefault();
																								e.stopPropagation();
																								handleSaveSalesToAPI(
																									sale.id,
																								);
																							}}
																							className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																						>
																							<IoIosSave className="text-gray-500" />
																							Сохранить
																						</button>
																						<button
																							onClick={() =>
																								setIsExitModalOpen(
																									true,
																								)
																							}
																							className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																						>
																							<MdDelete className="text-gray-500 text-lg" />
																							Ўчириш
																						</button>
																					</>
																				)}
																			</div>
																		)}
																	</div>
																</div>
															</td>
														</tr>
													))}
											</tbody>
										</table>
									</div>
								) : (
									<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 relative">
										{[...filteredData]
											.reverse()
											.map((sale) => (
												<div
													key={sale.id}
													className={`bg-white rounded-xl border relative ${
														selectedRowId ===
														sale.id
															? "border-indigo-300 ring-2 ring-indigo-100"
															: "border-gray-200 hover:border-indigo-200"
													} shadow-sm transition-all cursor-pointer group`}
													onClick={() =>
														setSelectedRowId(
															sale.id,
														)
													}
												>
													<div className="p-4 flex justify-between border-b border-gray-100">
														<div className="flex items-center gap-2">
															<div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
																<IoBasketOutline />
															</div>
															<div>
																<div className="font-medium text-gray-900">
																	{
																		warehouseData[
																			sale
																				.details[0]
																				.warehouse
																		]
																	}
																</div>
																<div className="text-xs text-gray-500">
																	Основной
																</div>
															</div>
														</div>
														<div className="flex items-center">
															{getStatusBadge(
																sale.status,
																sale.errorMessage,
																sale.id,
															)}
														</div>
													</div>

													<div className="p-4">
														<div className="flex justify-between mb-3">
															<div className="text-xs text-gray-500">
																Дата:
															</div>
															<div className="text-sm">
																{moment(
																	sale.date,
																).isSame(
																	moment(),
																	"day",
																)
																	? moment(
																			sale.date,
																	  ).format(
																			"HH:mm",
																	  )
																	: moment(
																			sale.date,
																	  ).format(
																			"DD.MM.YYYY HH:mm",
																	  )}
															</div>
														</div>

														<div className="flex justify-between mb-3">
															<div className="text-xs text-gray-500">
																Клиент:
															</div>
															<div
																className={`text-sm font-medium ${
																	sale.client_name ===
																	"<не указан>"
																		? "text-slate-300"
																		: ""
																}`}
															>
																{sale.client_name.split(
																	" ",
																).length > 5
																	? sale.client_name
																			.split(
																				" ",
																			)
																			.slice(
																				0,
																				4,
																			)
																			.join(
																				" ",
																			) +
																	  " ..."
																	: sale.client_name}
															</div>
														</div>

														<div className="flex justify-between mb-3">
															<div className="text-xs text-gray-500">
																Сумма:
															</div>
															<div className="text-sm font-medium">
																{parseFloat(
																	sale.total_price,
																).toLocaleString(
																	"ru-RU",
																	{
																		minimumFractionDigits:
																			settingsDeviceInfoData
																				.format
																				.format_sum
																				.max,
																		maximumFractionDigits:
																			settingsDeviceInfoData
																				.format
																				.format_sum
																				.max,
																	},
																)}{" "}
																{
																	currencyData[
																		sale
																			.details[0]
																			.currency
																	]
																}
															</div>
														</div>
														<div className="flex justify-between mb-3">
															<div className="text-xs text-gray-500">
																Статус:
															</div>
															<div className="text-sm font-medium">
																{sale.status ===
																"process" ? (
																	<p
																		className={`${
																			selectedRowId ===
																			sale.id
																				? "bg-orange-600"
																				: "bg-orange-500"
																		} px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
																	>
																		Кутилмоқда
																	</p>
																) : sale.status ===
																  "problem" ? (
																	<p
																		className={`${
																			selectedRowId ===
																			sale.id
																				? "bg-red-600"
																				: "bg-red-500"
																		} px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
																	>
																		Хатолик
																	</p>
																) : sale.status ===
																		"delivered" ||
																  sale.status ===
																		"falseDelivered" ? (
																	<p
																		className={`${
																			selectedRowId ===
																			sale.id
																				? "bg-green-600"
																				: "bg-green-500"
																		} px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
																	>
																		Юборилди
																	</p>
																) : (
																	sale.status
																)}
															</div>
														</div>

														<div className="flex justify-between">
															<div className="text-xs text-gray-500">
																Автор:
															</div>
															<div className="text-sm">
																{sale.seller}
															</div>
														</div>
													</div>

													<div className="bg-gray-50 p-3 flex justify-end gap-2 border-t border-gray-100">
														<button
															onClick={(e) => {
																openDetailModal(
																	sale,
																);
															}}
															className="p-1.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg transition-colors"
														>
															<FiEye />
														</button>
														<button
															onClick={() => {
																handlePrintOneSalesToDetails(
																	sale.id,
																);
															}}
															className="p-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg transition-colors"
														>
															<FiPrinter />
														</button>
														<div className="relative">
															<button
																onClick={(
																	e,
																) => {
																	e.stopPropagation();
																	setShowActionsMenu(
																		showActionsMenu ===
																			sale.id
																			? null
																			: sale.id,
																	);
																}}
																className="p-1.5 active-buttons bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
															>
																<BsThreeDots />
															</button>

															{showActionsMenu ===
																sale.id && (
																<div
																	className="absolute right-0 mt-1 w-48 bg-white z-[999] rounded-lg shadow-lg border border-gray-200 py-1"
																	onClick={(
																		e,
																	) =>
																		e.stopPropagation()
																	}
																>
																	<button
																		onClick={
																			handlePrintOneSales
																		}
																		className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																	>
																		<FiPrinter className="text-gray-500" />
																		Печать
																	</button>
																	<button
																		onClick={() =>
																			openDetailModal(
																				sale,
																			)
																		}
																		className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																	>
																		<FiEye className="text-gray-500" />
																		Батафсил
																	</button>

																	{(sale.status ===
																		"process" ||
																		sale.status ===
																			"problem") && (
																		<>
																			<button
																				onClick={(
																					e,
																				) => {
																					e.preventDefault();
																					e.stopPropagation();
																					handleSaveSalesToAPI(
																						sale.id,
																					);
																				}}
																				className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																			>
																				<IoIosSave className="text-gray-500" />
																				Сохранить
																			</button>
																			<button
																				onClick={() =>
																					setShowActionsMenu(
																						null,
																					)
																				}
																				className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																			>
																				<MdDelete className="text-gray-500 text-lg" />
																				Ўчириш
																			</button>
																		</>
																	)}
																</div>
															)}
														</div>
													</div>
												</div>
											))}
									</div>
								)
							) : (
								<div className="flex flex-col items-center justify-center h-64 rounded-xl border border-gray-200 bg-white shadow-sm">
									<div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
										<TbBasketExclamation className="text-3xl text-gray-400" />
									</div>
									<h3 className="text-lg font-medium text-gray-700 mb-1">
										Ҳозирча савдолар йўқ
									</h3>
								</div>
							)}
						</div>
					</div>
					{isExitModalOpen && (
						<div className="fixed inset-0 z-10 bg-black bg-opacity-50 backdrop-blur-xs flex items-center justify-center p-4">
							<div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 p-6 space-y-6 transform transition-all duration-300 ease-in-out">
								<div className="text-center">
									<h2 className="text-2xl font-bold text-gray-800 mb-5 flex justify-center">
										<GoAlert className="text-red-600 text-6xl" />
									</h2>
									<p className="text-black text-lg mb-6">
										Танланган савдони ўчирмоқчимисиз?
									</p>
								</div>

								<div className="flex space-x-4">
									<button
										onClick={() => {
											deleteOneSales(selectedRowId);
											setIsExitModalOpen(false);
										}}
										className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-400"
									>
										Ҳа
									</button>
									<button
										onClick={() =>
											setIsExitModalOpen(false)
										}
										className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
									>
										Йўқ
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
			{/* Detail Modal */}
			{isDetailModalOpen && selectedSale && (
				<div className="fixed inset-0 bg-gray-700/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
					<div className="bg-white rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh]">
						{/* Sidebar with summary */}
						<div className="w-full md:w-80 bg-blue-700 text-white p-6 flex flex-col">
							<div className="flex justify-between items-center mb-8">
								<h2 className="text-xl font-bold">Сотув</h2>
							</div>

							{/* Summary Info */}
							<div className="space-y-6 flex-1">
								<div>
									<span className="text-blue-200 text-xs uppercase tracking-wider font-medium block mb-1">
										Клиент
									</span>
									<h3
										className={`text-lg font-semibold ${
											selectedSale.client_name ===
											"<не указан>"
												? "text-blue-300 italic"
												: "text-white"
										}`}
									>
										{selectedSale.client_name}
									</h3>
								</div>

								<div>
									<span className="text-blue-200 text-xs uppercase tracking-wider font-medium block mb-1">
										Сана
									</span>
									<h3 className="text-lg font-semibold text-white flex items-center gap-2">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											className="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
												d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
											/>
										</svg>
										{moment(selectedSale.date).isSame(
											moment(),
											"day",
										)
											? moment(selectedSale.date).format(
													"HH:mm",
											  )
											: moment(selectedSale.date).format(
													"DD.MM.YYYY HH:mm",
											  )}
									</h3>
								</div>

								<div>
									<span className="text-blue-200 text-xs uppercase tracking-wider font-medium block mb-1">
										Статус
									</span>
									{selectedSale.status === "process" ? (
										<span className="bg-amber-500 text-white px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-1.5">
											<span className="w-2 h-2 bg-white rounded-full inline-block animate-pulse"></span>
											Кутилмоқда
										</span>
									) : selectedSale.status === "problem" ? (
										<div className="flex flex-col">
											<span className="bg-rose-500 w-[100px] inline-block text-white px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-1.5">
												<span className="w-2 h-2 bg-white rounded-full inline-block animate-pulse"></span>
												Хатолик
											</span>
											<span className="bg-slate-300 text-black px-3 py-1 rounded-md mt-4  text-xs">
												{selectedSale.errorMessage}
											</span>
										</div>
									) : selectedSale.status === "delivered" ||
									  selectedSale.status ===
											"falseDelivered" ? (
										<span className="bg-emerald-500 text-white px-3 py-1 rounded-md text-sm font-medium inline-flex items-center gap-1.5">
											<span className="w-2 h-2 bg-white rounded-full inline-block"></span>
											Юборилди
										</span>
									) : (
										selectedSale.status
									)}
								</div>

								<div>
									<span className="text-blue-200 text-xs uppercase tracking-wider font-medium block mb-1">
										Сумма
									</span>
									<h3 className="text-2xl font-bold text-white">
										{parseFloat(
											selectedSale.total_price,
										).toLocaleString("ru-RU", {
											minimumFractionDigits:
												settingsDeviceInfoData.format
													.format_sum.max,
											maximumFractionDigits:
												settingsDeviceInfoData.format
													.format_sum.max,
										})}{" "}
										<span className="text-blue-200 text-lg">
											{
												currencyData[
													selectedSale.details[0]
														.currency
												]
											}
										</span>
									</h3>
								</div>

								<div>
									<span className="text-blue-200 text-xs uppercase tracking-wider font-medium block mb-1">
										Скидка
									</span>
									<h3 className="text-lg font-semibold text-white">
										{parseFloat(
											selectedSale.details[0].discount,
										).toLocaleString("ru-RU", {
											minimumFractionDigits:
												settingsDeviceInfoData.format
													.format_sum.max,
											maximumFractionDigits:
												settingsDeviceInfoData.format
													.format_sum.max,
										})}{" "}
										<span className="text-blue-200">
											{
												currencyData[
													selectedSale.details[0]
														.currency
												]
											}
										</span>
									</h3>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="pt-4 mt-auto border-t border-blue-600">
								<button
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
										handlePrintOneSalesToDetails(
											selectedSale.id,
										);
									}}
									className="bg-white text-blue-700 hover:bg-blue-50 w-full py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
										/>
									</svg>
									Печать
								</button>
							</div>
						</div>

						{/* Main content area */}
						<div className="flex-1 overflow-y-auto flex flex-col">
							{/* Tabs */}
							<div className="bg-white flex items-center justify-between border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
								<div className="flex space-x-6">
									<button className="text-blue-700 border-b-2 border-blue-700 pb-3 px-1 font-medium">
										Товарлар
									</button>
									{/* <button className="text-gray-500 hover:text-gray-700 pb-3 px-1">
										Платежи
									</button> */}
								</div>
								<button
									onClick={() => setIsDetailModalOpen(false)}
									className="p-2 hover:bg-blue-800/50 rounded-full transition-colors"
								>
									<MdClose className="text-xl" />
								</button>
							</div>

							{/* Products List */}
							<div className="flex-1 overflow-y-auto p-6">
								<div className="mb-4 flex items-center justify-between">
									<h3 className="text-lg font-semibold text-gray-800">
										Товарлар рўйҳати
									</h3>
									{/* <span className="text-sm text-gray-500">
										{selectedSale.products.length} хил
									</span> */}
								</div>

								{/* Products Cards */}
								<div className="space-y-3">
									{selectedSale.products.map(
										(product, index) => (
											<div
												key={index}
												className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200"
											>
												<div className="flex justify-between">
													<div className="flex-1">
														<h4
															className="font-medium text-gray-900 mb-1"
															title={
																product.product_name
															}
														>
															{
																product.product_name
															}
														</h4>
														<span className="text-sm text-gray-500">
															Сони:{" "}
															{product.quantity.toLocaleString(
																"ru-RU",
																{
																	minimumFractionDigits:
																		settingsDeviceInfoData
																			.format
																			.format_qty
																			.max,
																	maximumFractionDigits:
																		settingsDeviceInfoData
																			.format
																			.format_qty
																			.max,
																},
															)}
														</span>
													</div>
													<div className="text-right">
														<div className="font-semibold text-gray-900">
															{parseFloat(
																product.sum,
															).toLocaleString(
																"ru-RU",
																{
																	minimumFractionDigits:
																		settingsDeviceInfoData
																			.format
																			.format_sum
																			.max,
																	maximumFractionDigits:
																		settingsDeviceInfoData
																			.format
																			.format_sum
																			.max,
																},
															)}{" "}
															{
																currencyData[
																	selectedSale
																		.details[0]
																		.currency
																]
															}
														</div>
													</div>
												</div>
											</div>
										),
									)}
								</div>
							</div>

							{/* Payment Info Footer */}
							<div className="border-t border-gray-200 bg-gray-50 p-6">
								<h3 className="text-base font-semibold mb-4 text-gray-800">
									Тўловлар
								</h3>

								{selectedSale.payments.length > 0 ? (
									<div className="space-y-3">
										{selectedSale.payments.map(
											(payment, index) => (
												<div
													key={index}
													className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100"
												>
													<div className="flex items-center gap-3">
														{payment.cash ===
														"cash" ? (
															<div className="bg-green-100 p-2 rounded-lg">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	className="h-5 w-5 text-green-600"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"
																	/>
																</svg>
															</div>
														) : (
															<div className="bg-blue-100 p-2 rounded-lg">
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	className="h-5 w-5 text-blue-600"
																	fill="none"
																	viewBox="0 0 24 24"
																	stroke="currentColor"
																>
																	<path
																		strokeLinecap="round"
																		strokeLinejoin="round"
																		strokeWidth={
																			2
																		}
																		d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
																	/>
																</svg>
															</div>
														)}
														<div>
															<div className="font-medium text-gray-900">
																{
																	findObjectById(
																		payment.cash,
																	)?.name
																}
															</div>
															<div className="text-xs text-gray-500">
																{moment(
																	selectedSale.date,
																).format(
																	"DD MMM YYYY",
																)}
															</div>
														</div>
													</div>
													<div className="font-medium text-gray-900">
														{parseFloat(
															payment.sum,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	settingsDeviceInfoData
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	settingsDeviceInfoData
																		.format
																		.format_sum
																		.max,
															},
														)}{" "}
														<span className="text-gray-500">
															{
																currencyData[
																	payment
																		.currency
																]
															}
														</span>
													</div>
												</div>
											),
										)}
									</div>
								) : (
									<div className="text-center text-gray-500 text-sm">
										Ҳеч қандай тўлов топилмади
									</div>
								)}
							</div>

							{(() => {
								const totalPaid = selectedSale.payments.reduce(
									(acc, payment) =>
										acc + parseFloat(payment.sum),
									0,
								);

								const remainingDebt =
									selectedSale.total_price -
									selectedSale.details[0].discount -
									totalPaid;

								if (remainingDebt <= 0) return null; // Debt paid fully — don't show the block

								return (
									<div className="border-t border-gray-200 bg-gray-50 p-6">
										<h3 className="text-base font-semibold mb-4 text-gray-800">
											Насия
										</h3>

										<div className="space-y-3">
											<div className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-100">
												<div className="flex items-center gap-3">
													<div className="bg-yellow-100 p-2 rounded-lg">
														<svg
															xmlns="http://www.w3.org/2000/svg"
															className="h-5 w-5 text-yellow-600"
															fill="none"
															viewBox="0 0 24 24"
															stroke="currentColor"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																strokeWidth={2}
																d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 0v.01M12 14h.01"
															/>
														</svg>
													</div>
													<div>
														<div className="font-medium text-gray-900">
															Қолган қарз миқдори
														</div>
														<div className="text-xs text-gray-500">
															{moment(
																selectedSale.date,
															).format(
																"DD MMM YYYY",
															)}
														</div>
													</div>
												</div>
												<div className="font-medium text-gray-900">
													{remainingDebt.toLocaleString(
														"ru-RU",
														{
															minimumFractionDigits:
																settingsDeviceInfoData
																	.format
																	.format_sum
																	.max,
															maximumFractionDigits:
																settingsDeviceInfoData
																	.format
																	.format_sum
																	.max,
														},
													)}{" "}
													<span className="text-gray-500">
														{
															currencyData[
																selectedSale
																	.details[0]
																	.currency
															]
														}
													</span>
												</div>
											</div>
										</div>
									</div>
								);
							})()}
						</div>
					</div>
				</div>
			)}

			<DiscountModal
				isOpen={isModalOpenDis}
				onClose={() => setIsModalOpenDis(false)}
				total_price={5000}
			/>
		</div>
	);
}

export default SalesPageLayoutHeader;

