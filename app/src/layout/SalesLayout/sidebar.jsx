import React, { useState, useEffect, useCallback } from "react";
import { HiOutlineCreditCard, HiOutlineCash } from "react-icons/hi";
import { CiClock1 } from "react-icons/ci";
import PaymentModal from "./PaymentModal";
import PrintingModal from "./PrintModal";

import nodeUrl from "../../links";

import { FaBuilding, FaUserAlt } from "react-icons/fa";
import { BsClock } from "react-icons/bs";
import { FaMoneyBill } from "react-icons/fa";
import { FaUsersLine } from "react-icons/fa6";
import { CiDiscount1 } from "react-icons/ci";
import { MdEdit } from "react-icons/md";
import { MdDeleteForever } from "react-icons/md";
import {
	MdOutlineFormatListBulleted,
	MdCalendarToday,
	MdOutlineSignalWifiStatusbarConnectedNoInternet4,
	MdOutlineSignalWifiStatusbar4Bar,
} from "react-icons/md";
import { v4 as uuidv4 } from "uuid";
import { FiLoader } from "react-icons/fi";

import { BiSearch } from "react-icons/bi";

import {
	MdOutlineShoppingCart,
	MdAccessTime,
	MdPriceCheck,
	MdPersonOutline,
	MdOutlineInfo,
	MdClose,
	MdPayment,
	MdInventory,
	MdWarehouse,
	MdSearch,
	MdFilterList,
} from "react-icons/md";
import { BsBasket3, BsCreditCard2Back, BsBarChart } from "react-icons/bs";

import moment from "moment";
import "moment/locale/ru";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";
import SuccessModal from "./SuccessModal";
import CardPaymentModal from "./CardPaymentModal";
import ProcessSalesComponent from "./processSales";
import ErrorModal from "./ErrorModal";

moment.locale("ru");

function SalesPageLayoutSidebar({ socket }) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isCardModalOpen, setIsCardModalOpen] = useState(false);
	const [isListModalOpen, setIsListModalOpen] = useState(false);
	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [selectedSale, setSelectedSale] = useState(null);
	const [status, setStatus] = useState("checking");
	const [productData, setProductData] = useState([]);
	const [disabled, setDisabled] = useState();

	const [language] = useLang("uz");

	const openDetailModal = (sale) => {
		setSelectedSale(sale);
		setIsDetailModalOpen(true);
	};

	const basicUsername = localStorage.getItem("userType");
	const ksb_id = localStorage.getItem("ksbIdNumber");
	const ksbIdNumber = localStorage.getItem("ksbIdNumber");
	const device_id = localStorage.getItem("device_id");

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
			const isDisabled = data[sales_id].products.length === 0;
			setDisabled(isDisabled);

			socket.emit("updateSoldProductsStatus", { sales_id, isDisabled });
		} catch (err) {
			console.log(err);
			setDisabled(true);
		}
	};

	useEffect(() => {
		fetchProcessSales();

		const updateHandler = () => fetchProcessSales();
		socket.on("gettingProcessSales", updateHandler);

		return () => {
			socket.off("gettingProcessSales", updateHandler);
		};
	}, []);

	const fetchProcessSales = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/process/sales/${ksb_id}`,
			);
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
		for (const product of productData) {
			if (product && !currencyData[product]) {
				try {
					const response = await fetch(
						`${nodeUrl}/api/get/currency/data/${device_id}/${ksbIdNumber}/${product.mainCurrency}`,
					);
					const data = await response.json();

					setCurrencyData((prev) => ({
						...prev,
						[product.mainCurrency]: data[0]?.name || "-",
					}));
				} catch (error) {
					console.error("Failed to fetch currency data", error);
					setCurrencyData((prev) => ({
						...prev,
						[product.mainCurrency]: "-",
					}));
				}
			}
		}
	}, [productData]);

	useEffect(() => {
		fetchCurrencyData();
	}, [fetchCurrencyData]);

	const [cashData, setCashData] = useState("");

	const cashDataAll = JSON.parse(localStorage.getItem("settingsCashData"));

	function findObjectById(id) {
		const result = cashDataAll.find((item) => item.cash_id === id);
		return result || null;
	}

	const reversedArray = [...productData].reverse();

	const [currencyValue, setCurrencyValue] = useState([]);
	const [priceTypeValue, setPriceTypeValue] = useState([]);

	useEffect(() => {
		const fetchCurrencies = async () => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/currency/data/${device_id}/${ksb_id}`,
				);
				if (!response.ok) {
					throw new Error("Failed to fetch currency data");
				}
				const data = await response.json();
				setCurrencyValue(data);
			} catch (error) {
				console.error("Error fetching currencies:", error);
			}
		};

		fetchCurrencies();
	}, [device_id, ksb_id]);

	useEffect(() => {
		const fetchPriceType = async () => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/price/data/${device_id}/${ksb_id}`,
				);
				if (!response.ok) {
					throw new Error("Failed to fetch currency data");
				}
				const data = await response.json();
				setPriceTypeValue(data);
			} catch (error) {
				console.error("Error fetching currencies:", error);
			}
		};

		fetchPriceType();
	}, [device_id, ksb_id]);

	const handleClick = async (sales_id) => {
		localStorage.setItem("sales_id", sales_id);

		const exactSale = productData.find((item) => item.id === sales_id);

		const exactCurrency = currencyValue.find(
			(currency) => currency.item_id == exactSale.mainCurrency,
		);

		const exactPriceType = priceTypeValue.find(
			(price) => price.item_id == exactSale.mainPriceType,
		);

		if (sales_id) {
			localStorage.setItem("currencyKey", exactSale.mainCurrency);
			localStorage.setItem("currencyKeyKey", exactCurrency.key);
			localStorage.setItem("priceTypeKey", exactSale.mainPriceType);
			localStorage.setItem(
				"matchingProductByCurrency",
				exactPriceType.productByCurrency,
			);
			localStorage.setItem(
				"falseCurrencyBoolean",
				exactPriceType.currency,
			);
			window.location.reload();
		} else {
			alert("Ошибка");
		}
	};

	useEffect(() => {
		const handleSoldProductsUpdate = ({
			sales_id: updatedId,
			isDisabled,
		}) => {
			if (updatedId === sales_id) {
				setDisabled(isDisabled);
			}
		};

		socket.on("updateSoldProductsStatus", handleSoldProductsUpdate);

		return () => {
			socket.off("updateSoldProductsStatus", handleSoldProductsUpdate);
		};
	}, [sales_id, socket]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (disabled && (e.key === "F9" || e.key === "F10")) {
				e.preventDefault();
				return;
			}

			if (e.key === "F9") {
				setIsModalOpen(true);
			} else if (e.key === "Escape") {
				setIsModalOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [disabled]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (disabled && e.key === "F10") {
				e.preventDefault();
				return;
			}

			if (e.key === "F10") {
				setIsCardModalOpen(true);
			} else if (e.key === "Escape") {
				setIsCardModalOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [disabled]);
	const [isLoading, setIsLoading] = useState(false);

	const isSaleContinue = localStorage.getItem("isSaleContinue");

	const handleCreateSale = async (e) => {
		e.preventDefault();

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
				setTimeout(() => {
					window.location.reload();
				}, 500);
				localStorage.setItem("isSaleContinue", false);
			} else {
				console.log("error");
				setIsLoading(false);
			}
		} catch (err) {
			console.log("error creating empty sales", err);
			setIsLoading(false);
		}
	};

	return (
		<div className="salespage bg-slate-100 h-[87vh] px-3 py-2 text-slate-100 flex flex-col">
			<div className="flex flex-col items-center gap-5 mt-4">
				<button
					onClick={() => setIsModalOpen(true)}
					disabled={disabled}
					className={`flex items-center justify-between w-full max-w-xs bg-emerald-700 hover:bg-emerald-600 text-slate-100 px-3 py-2 text-lg rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400 
                ${disabled ? "cursor-not-allowed" : ""}
            `}
				>
					<span className="font-500 flex items-center">
						{content[language].salesPage.sidebarCash}
					</span>
					<div className="text-xs py-1 px-3 rounded-full bg-slate-100 text-black">
						F9
					</div>
				</button>

				<button
					onClick={() => setIsCardModalOpen(true)}
					disabled={disabled}
					className={`flex items-center justify-between w-full max-w-xs bg-blue-700 hover:bg-blue-600 text-slate-100 px-3 py-2 text-lg rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 
                ${disabled ? "cursor-not-allowed" : ""}
            `}
				>
					<span className="font-500 flex items-center">
						{content[language].salesPage.sidebarCard}
					</span>
					<div className="text-xs py-1 px-2 rounded-full bg-slate-100 text-black">
						F10
					</div>
				</button>
			</div>

			<div className=" mt-auto mb-10">
				{isSaleContinue == "true" && (
					<div className="mb-10">
						<button
							onClick={handleCreateSale}
							className="bg-transparent border text-sm border-red-500 w-[180px] py-2 rounded-xl mx-auto text-center flex justify-center text-red-500 hover:text-red-800 "
						>
							<span className="font-500">Чекни бекор қилиш</span>
						</button>
					</div>
				)}

				<div className="relative">
					<button
						onClick={() => setIsListModalOpen(true)}
						disabled={isSaleContinue == "true"}
						className={`flex items-center justify-center w-full max-w-xs   text-slate-100 px-5 py-2 text-base rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
							isSaleContinue == "true"
								? "cursor-not-allowed disabled  bg-gray-600 opacity-90"
								: "bg-green-600 hover:bg-green-500"
						}`}
					>
						<span className="font-500">
							{content[language].salesPage.sidebarProcess}
						</span>
					</button>
					{productData.length > 0 && (
						<div className="absolute -top-3 -right-2 flex items-center justify-center w-8 h-8 bg-red-500 text-white text-sm font-bold rounded-full shadow-lg">
							{productData.length}
						</div>
					)}
				</div>
			</div>
			{/* <div className="relative mt-auto mb-10"></div> */}

			<PaymentModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				totalAmount={50000}
				socket={socket}
			/>

			<CardPaymentModal
				isOpen={isCardModalOpen}
				onClose={() => setIsCardModalOpen(false)}
				totalAmount={50000}
				socket={socket}
			/>

			{isListModalOpen && (
				<ProcessSalesComponent
					productData={productData}
					setIsListModalOpen={setIsListModalOpen}
					socket={socket}
					handleClick={handleClick}
				/>
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
		</div>
	);
}

export default SalesPageLayoutSidebar;

