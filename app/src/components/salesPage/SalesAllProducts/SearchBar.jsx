import React, { useRef, useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import { MdClear } from "react-icons/md";
import { FaTrash } from "react-icons/fa";
import { GrClearOption } from "react-icons/gr";
import nodeUrl from "../../../links";

import { FaTimes } from "react-icons/fa";
import { ImExit } from "react-icons/im";

import { MdDelete } from "react-icons/md";
import { MdOutlineRemoveCircleOutline } from "react-icons/md";

import { PiEmptyLight } from "react-icons/pi";
import { GoAlert } from "react-icons/go";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

function SearchBar({
	products,
	searchQuery,
	setSearchQuery,
	setIsSelectionEnabled,
	setSelectedRow,
	isModalOpen,
	socket,
	selectedRowId,
}) {
	const searchInputRef = useRef(null);
	const [lastChangeTime, setLastChangeTime] = useState(0);
	const [isQrInput, setIsQrInput] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const [isFirstKeyPress, setIsFirstKeyPress] = useState(true);

	const [isExitModalOpen, setIsExitModalOpen] = useState(false);

	const typingSpeedThreshold = 3;

	const [language] = useLang("uz");

	useEffect(() => {
		if (searchInputRef.current && !isModalOpen) {
			searchInputRef.current.focus();
		}
	}, [isModalOpen]);

	useEffect(() => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
		}

		const handleKeyPress = (e) => {
			if (
				document.activeElement.tagName === "INPUT" ||
				document.activeElement.tagName === "TEXTAREA" ||
				document.activeElement.isContentEditable
			) {
				if (document.activeElement !== searchInputRef.current) {
					return;
				}
			}

			if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
				searchInputRef.current?.focus();
			}
		};

		const handleMouseClick = (e) => {
			const shouldSkipFocus = e.target.closest("[data-no-autofocus]");
			const isInteractive = e.target.matches(
				'input, select, textarea, button, a, [role="button"], [contenteditable="true"]',
			);
			const isModalOpen = document.querySelector(".fixed.inset-0");

			if (!shouldSkipFocus && !isInteractive && !isModalOpen) {
				searchInputRef.current?.focus();
			}
		};

		const handleKeyDown = (e) => {
			if (e.ctrlKey && e.key === "f") {
				e.preventDefault();
				searchInputRef.current?.focus();
			}
		};

		document.addEventListener("keypress", handleKeyPress);
		document.addEventListener("click", handleMouseClick);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keypress", handleKeyPress);
			document.removeEventListener("click", handleMouseClick);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const handleSearchChange = (e) => {
		const newValue = e.target.value;
		const currentTime = Date.now();
		const timeDiff = currentTime - lastChangeTime;
		const isQrScan = timeDiff < typingSpeedThreshold && newValue.length > 3;

		if (isModalOpen) {
			setSearchQuery("");
			return;
		}

		if (isFirstKeyPress) {
			setSearchQuery(newValue);
			setIsFirstKeyPress(false);
		} else {
			setSearchQuery(newValue);
		}

		setIsSelectionEnabled(false);
		setSelectedRow(null);

		if (!isQrScan || newValue.length > 8) {
			setSearchQuery(newValue);
		}
		setIsQrInput(isQrScan);
		setLastChangeTime(currentTime);
		if (isQrScan) {
			setTimeout(() => {
				if (searchInputRef.current) {
					searchInputRef.current.select();
				}
			}, 50);
		}
	};

	const clearSearch = () => {
		setSearchQuery("");
		setIsSelectionEnabled(false);
		setSelectedRow(null);
		setLastChangeTime(0);
		setIsQrInput(false);
		searchInputRef.current?.focus();
	};

	const handleFocus = () => {
		if (searchQuery) {
			searchInputRef.current?.select();
			setIsFirstKeyPress(true);
		}
	};

	const handlePaste = () => {
		setIsQrInput(true);
		setTimeout(() => {
			searchInputRef.current?.select();
		}, 50);
	};

	const deleteAllProducts = async () => {
		const salesId = localStorage.getItem("sales_id");
		if (!salesId) {
			alert("Sales ID not found in local storage!");
			return;
		}

		setIsDeleting(true);

		try {
			const response = await fetch(
				`${nodeUrl}/api/delete/sales/${salesId}`,
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
		} finally {
			setIsDeleting(false);
		}
	};

	const [disabled, setDisabled] = useState();
	const [productCount, setProductCount] = useState(0);

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
			const isDisabled = data[sales_id].products.length < 1;
			setDisabled(isDisabled);
			setProductCount(data[sales_id].products.length);
		} catch (err) {
			console.log(err);
			setDisabled(true);
		}
	};

	const selectedSoldProductId = localStorage.getItem("selectedSoldProductId");

	const changeProductCount = async (direction) => {
		if (!selectedRowId) {
			console.log("No product selected to change count.");
			return;
		}

		const selectedProduct = products.find((p) => p.id === selectedRowId);

		if (!selectedProduct) {
			console.error("Selected product not found in the list.");
			return;
		}

		const currentCount = parseFloat(selectedProduct.soni || 0);
		let newCount;

		if (direction === "increment") {
			newCount = currentCount + 1;
		} else if (direction === "decrement") {
			newCount = Math.max(0, currentCount - 1);
		} else {
			console.error("Invalid direction specified");
			return;
		}

		try {
			await fetch(`${nodeUrl}/api/change/count/${sales_id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					product_id: selectedRowId,
					newCount: String(newCount),
				}),
			});
		} catch (err) {
			console.error("Error changing product count:", err);
		}
	};

	const selectedProductForDisplay = selectedRowId
		? products.find((p) => p.id === selectedRowId)
		: null;

	const displayCount = selectedProductForDisplay
		? parseFloat(selectedProductForDisplay.soni || 0)
		: 0;

	return (
		<div className="flex items-center py-1 bg-gray-100 border-b border-gray-200">
			<div className="relative w-[50vw] mr-5">
				<input
					ref={searchInputRef}
					type="text"
					placeholder={`${content[language].salesPage.saleSearch} ...`}
					value={searchQuery}
					onChange={handleSearchChange}
					onFocus={handleFocus}
					onPaste={handlePaste}
					className="w-full px-10 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
				/>
				<FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg" />
				{searchQuery && (
					<button
						onClick={clearSearch}
						className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
					>
						<MdClear size={16} />
					</button>
				)}
			</div>
			<div>
				<button
					className={`${
						isDeleting
							? "bg-gray-400 cursor-not-allowed"
							: "bg-red-600 hover:bg-red-700"
					} ${
						disabled
							? "cursor-not-allowed opacity-50"
							: "text-white"
					} text-white p-2 rounded-lg transition duration-300`}
					disabled={disabled || isDeleting}
					onClick={() => {
						if (!disabled && !isDeleting) {
							setIsExitModalOpen(true);
						}
					}}
				>
					<FaTrash size={15} />
				</button>
			</div>
			<div className="ml-10">
				<span className="font-bold text-lg">( {productCount} )</span>
			</div>

			<div className="flex space-x-4 ml-10 justify-center items-center">
				<button
					className={`w-8 h-8 rounded-lg bg-white text-2xl font-light text-blue-500 
			flex items-center justify-center shadow-md 
			active:bg-gray-200 active:shadow-inner
			border border-gray-200 ${
				!selectedRowId || displayCount <= 1
					? "opacity-50 cursor-not-allowed pointer-events-none"
					: "focus:outline-none"
			}`}
					disabled={!selectedRowId || displayCount <= 1}
					onClick={() => changeProductCount("decrement")}
				>
					-
				</button>

				<p className="text-lg font-bold w-15 mx-2 text-center">
					{selectedRowId ? displayCount.toFixed(2) : "0"}
				</p>

				<button
					onClick={() => changeProductCount("increment")}
					disabled={!selectedRowId}
					className={`w-8 h-8 rounded-lg bg-white text-2xl font-light text-blue-500 
			flex items-center justify-center shadow-md 
			active:bg-gray-200 active:shadow-inner
			border border-gray-200 ${
				!selectedRowId
					? "opacity-50 cursor-not-allowed pointer-events-none"
					: "focus:outline-none"
			}`}
				>
					+
				</button>
			</div>

			{isExitModalOpen && (
				<div className="fixed inset-0 z-10  bg-black bg-opacity-50 flex items-center justify-center p-4">
					<div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 p-6 space-y-6 transform transition-all duration-300 ease-in-out">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-gray-800 mb-5 flex justify-center">
								<GoAlert className="text-red-600 text-6xl" />
							</h2>
							<p className="text-black text-lg mb-6">
								{content[language].salesPage.saleDeleteConfirm}
							</p>
						</div>

						<div className="flex space-x-4">
							<button
								onClick={() => {
									deleteAllProducts();
									setIsExitModalOpen(false);
								}}
								className="flex-1 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-red-400"
							>
								<ImExit className="mr-2 text-xl" />
								{content[language].salesPage.saleDeleteYes}
							</button>
							<button
								onClick={() => setIsExitModalOpen(false)}
								className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
							>
								<FaTimes className="mr-2 text-xl" />
								{
									content[language].salesPage
										.headerDiscountCancel
								}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default SearchBar;

