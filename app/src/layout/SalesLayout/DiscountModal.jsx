import React, { useState, useEffect, useRef } from "react";
import { IoClose } from "react-icons/io5";
// Removed IoSearchOutline as it wasn't used
import nodeUrl from "../../links";
// Removed uuidv4 as it wasn't used

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

const safeJsonParse = (jsonString, defaultValue) => {
	if (!jsonString) return defaultValue;
	try {
		return JSON.parse(jsonString);
	} catch (e) {
		console.error("Failed to parse JSON:", e);
		return defaultValue;
	}
};

const DiscountModal = ({ isOpen, onClose, totalAmount }) => {
	const [price, setPrice] = useState(0);
	const [data, setData] = useState({});
	const settingsDeviceInfoData = JSON.parse(
		localStorage.getItem("settingsDevice"),
	);

	// --- Default settings as a fallback ---
	const DEFAULT_DEVICE_SETTINGS = {
		format: {
			format_price: {
				max: settingsDeviceInfoData.format.format_sum.max,
				symbol: settingsDeviceInfoData.format.format_sum.symbol,
			},
			format_qty: {
				max: settingsDeviceInfoData.format.format_qty.max,
				symbol: settingsDeviceInfoData.format.format_qty.symbol,
			},
		},
	};
	const [discountAmount, setDiscountAmount] = useState("0");
	const [percentageValue, setPercentageValue] = useState("0");

	const [deviceSettings, setDeviceSettings] = useState(null);

	const [directDiscountValue, setDirectDiscountValue] = useState("");

	const [language] = useLang("uz");

	const ksbIdNumber = localStorage.getItem("ksbIdNumber");
	const device_id = localStorage.getItem("device_id");
	const sales_id = localStorage.getItem("sales_id");

	const percentInputRef = useRef();
	const summaInputRef = useRef();
	const applyDiscountRef = useRef();

	// 1. Add useEffect to focus percentInputRef when modal opens
	useEffect(() => {
		if (isOpen && percentInputRef.current) {
			percentInputRef.current.focus();
		}
	}, [isOpen]);

	// 2. Fix handleKeyPress for percentInputRef
	const handleKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			if (summaInputRef.current) {
				summaInputRef.current.focus();
			}
		}
	};

	// 3. Fix handleKeyPressSumma for summaInputRef
	const handleKeyPressSumma = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();

			// Use requestAnimationFrame for more reliable DOM manipulation
			requestAnimationFrame(() => {
				// Force focus with direct DOM access
				const okButton = document.querySelector(
					'button[ref="applyDiscountButton"]',
				);
				if (okButton) {
					okButton.focus();
					console.log("Focus set via DOM selector");
				} else {
					console.log("Button not found in DOM");
				}
			});
		}
	};

	// Add this as a top-level effect in your component

	// 4. Add a keypress handler for the OK button

	useEffect(() => {
		const settingsString = localStorage.getItem("settingsDevice");
		const loadedSettings = safeJsonParse(
			settingsString,
			DEFAULT_DEVICE_SETTINGS,
		);

		const mergedSettings = {
			...DEFAULT_DEVICE_SETTINGS,
			...loadedSettings,
			format: {
				...DEFAULT_DEVICE_SETTINGS.format,
				...(loadedSettings.format || {}),
				format_price: {
					...DEFAULT_DEVICE_SETTINGS.format.format_price,
					...((loadedSettings.format &&
						loadedSettings.format.format_price) ||
						{}),
				},
				format_qty: {
					...DEFAULT_DEVICE_SETTINGS.format.format_qty,
					...((loadedSettings.format &&
						loadedSettings.format.format_qty) ||
						{}),
				},
			},
		};

		setDeviceSettings(mergedSettings);
		const initialFormattedZero = `0,${"0".repeat(
			mergedSettings.format.format_price.max,
		)}`;
		setDirectDiscountValue(initialFormattedZero);
	}, []);

	const formatPriceSettings =
		deviceSettings?.format?.format_price ??
		DEFAULT_DEVICE_SETTINGS.format.format_price;
	const maxDecimalPlaces = formatPriceSettings.max;
	const maxWholeDigits = formatPriceSettings.symbol;

	useEffect(() => {
		if (!sales_id || !nodeUrl) return;

		const fetchProducts = async () => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/sales/${sales_id}`,
				);
				if (!response.ok) {
					console.error(
						"Failed to fetch products:",
						response.statusText,
					);
					return;
				}
				const datas = await response.json();

				if (
					datas &&
					datas[sales_id] &&
					typeof datas[sales_id].summa !== "undefined"
				) {
					setPrice(parseFloat(datas[sales_id].summa) || 0);
					setData(datas[sales_id]);
				} else {
					console.error(
						"Unexpected data structure received for sales:",
						datas,
					);
					setPrice(0);
					setData({});
				}
			} catch (err) {
				console.error("Error fetching sales data:", err);
			}
		};

		fetchProducts();
		const intervalId = setInterval(fetchProducts, 1000);

		return () => clearInterval(intervalId);
	}, [sales_id, nodeUrl]);

	const updateTotalDiscount = (percentValue, directValue) => {
		const numericPercent = parseFloat(percentValue) || 0;
		const numericDirect =
			parseFloat(String(directValue).replace(",", ".")) || 0;

		const percentageDiscount = (price * numericPercent) / 100;
		const totalDiscount = percentageDiscount + numericDirect;

		setDiscountAmount(
			totalDiscount.toLocaleString("ru-RU", {
				minimumFractionDigits:
					settingsDeviceInfoData.format.format_sum.max,
				maximumFractionDigits:
					settingsDeviceInfoData.format.format_sum.max,
			}),
		);
	};

	// --- Percentage Input Handlers ---
	const handlePercentageChange = (e) => {
		let value = e.target.value.replace(/[^\d]/g, "");
		let numericValue = parseInt(value, 10);

		if (isNaN(numericValue)) {
			numericValue = 0;
		} else if (numericValue > 100) {
			numericValue = 100;
		}

		const newPercentage = numericValue.toString();
		setPercentageValue(newPercentage);
		// Use the current directDiscountValue state, parsed
		const currentDirectNumeric =
			parseFloat(
				directDiscountValue.replace(/\s/g, "").replace(",", "."),
			) || 0;
		updateTotalDiscount(newPercentage, currentDirectNumeric);
	};

	// --- Dir

	const handleDirectDiscountChange = (e) => {
		if (!deviceSettings) return; // Guard clause

		let val = e.target.value;
		val = val.replace(/[^\d.,]/g, ""); // Allow only digits, dot, comma

		const dotIndex = val.indexOf(".");
		const commaIndex = val.indexOf(",");
		let decimalSeparator = null;
		let decimalIndex = -1;

		if (dotIndex !== -1 && commaIndex !== -1) {
			decimalIndex = Math.min(dotIndex, commaIndex);
			decimalSeparator = val.charAt(decimalIndex);
			val =
				val.substring(0, decimalIndex) +
				decimalSeparator +
				val.substring(decimalIndex + 1).replace(/[.,]/g, "");
		} else if (dotIndex !== -1 || commaIndex !== -1) {
			decimalIndex = Math.max(dotIndex, commaIndex);
			decimalSeparator = val.charAt(decimalIndex);
		}

		if (decimalIndex !== -1) {
			const wholePartRaw = val
				.substring(0, decimalIndex)
				.slice(0, maxWholeDigits);
			let decimalPart = val
				.substring(decimalIndex + 1)
				.slice(0, maxDecimalPlaces);
			const wholePartFormatted = Number(wholePartRaw)
				.toLocaleString("ru-RU")
				.replace(/\u00A0/g, " ");
			val = wholePartFormatted + decimalSeparator + decimalPart;
		} else {
			val = val.slice(0, maxWholeDigits);
			const formatted = Number(val)
				.toLocaleString("ru-RU")
				.replace(/\u00A0/g, " ");
			val = formatted;
		}

		setDirectDiscountValue(val);

		const numericValue =
			parseFloat(val.replace(/\s/g, "").replace(",", ".")) || 0;
		updateTotalDiscount(percentageValue, numericValue);
	};

	const handleDirectDiscountKeyDown = (e) => {
		if (!deviceSettings) {
			e.preventDefault();
			return;
		}

		const { value, selectionStart, selectionEnd } = e.target;
		const key = e.key;

		const hasDecimalSeparator = value.includes(".") || value.includes(",");

		if (
			[
				"ArrowLeft",
				"ArrowRight",
				"ArrowUp",
				"ArrowDown",
				"Backspace",
				"Delete",
				"Tab",
				"Home",
				"End",
			].includes(key)
		) {
			if (
				(key === "Backspace" &&
					(value[selectionStart - 1] === "," ||
						value[selectionStart - 1] === ".")) ||
				(key === "Delete" &&
					(value[selectionStart] === "," ||
						value[selectionStart] === "."))
			) {
				// Allow deleting the separator
			}
			return;
		}

		if ((key === "." || key === ",") && hasDecimalSeparator) {
			e.preventDefault();
			return;
		}

		if (/^\d$/.test(key) || key === "." || key === ",") {
			const futureValue =
				value.slice(0, selectionStart) +
				key +
				value.slice(selectionEnd);

			const dotIndex = futureValue.indexOf(".");
			const commaIndex = futureValue.indexOf(",");
			let decimalIndex = -1;
			let tempValue = futureValue;

			if (dotIndex !== -1 && commaIndex !== -1) {
				decimalIndex = Math.min(dotIndex, commaIndex);
				tempValue =
					tempValue.substring(0, decimalIndex) +
					tempValue.charAt(decimalIndex) +
					tempValue.substring(decimalIndex + 1).replace(/[.,]/g, "");
			} else {
				decimalIndex = Math.max(dotIndex, commaIndex);
			}

			if (decimalIndex !== -1) {
				if (
					tempValue.substring(0, decimalIndex).length > maxWholeDigits
				) {
					e.preventDefault();
					return;
				}
				if (
					tempValue.substring(decimalIndex + 1).length >
					maxDecimalPlaces
				) {
					e.preventDefault();
					return;
				}
			} else {
				if (tempValue.replace(/\s/g, "").length > maxWholeDigits) {
					e.preventDefault();
					return;
				}
			}
		} else if (!/^\d$/.test(key)) {
			e.preventDefault();
		}
	};

	const handleDirectDiscountBlur = (e) => {
		if (!deviceSettings) return;

		let value = e.target.value;

		if (
			value.trim() === "" ||
			value.trim() === "," ||
			value.trim() === "."
		) {
			const formattedZero = `0,${"0".repeat(maxDecimalPlaces)}`;
			setDirectDiscountValue(formattedZero);
			updateTotalDiscount(percentageValue, 0);
			return;
		}

		let valueForParsing = value.replace(/\s/g, "").replace(",", ".");
		if (valueForParsing.startsWith(".")) {
			valueForParsing = "0" + valueForParsing;
		}

		const numValue = parseFloat(valueForParsing);

		if (!isNaN(numValue)) {
			const formattedValue = numValue
				.toFixed(maxDecimalPlaces)
				.replace(".", ",");
			const [whole, decimal = ""] = formattedValue.split(",");
			const wholeFormatted = Number(whole)
				.toLocaleString("ru-RU")
				.replace(/\u00A0/g, " ");
			setDirectDiscountValue(`${wholeFormatted},${decimal}`);
			updateTotalDiscount(percentageValue, numValue);
		} else {
			const formattedZero = `0,${"0".repeat(maxDecimalPlaces)}`;
			setDirectDiscountValue(formattedZero);
			updateTotalDiscount(percentageValue, 0);
		}
	};

	const handleFocus = (e) => {
		const { name, value } = e.target;
		if (name === "percentage" && value === "0") {
			setPercentageValue("");
		} else if (name === "directAmount" && deviceSettings) {
			const zeroFormatted = `0,${"0".repeat(maxDecimalPlaces)}`;
			if (value === zeroFormatted) {
				setDirectDiscountValue("");
			}
		}
		e.target.select();
	};

	const handleBlur = (e) => {
		const { name, value } = e.target;
		if (name === "percentage" && !value) {
			setPercentageValue("0");
			const currentDirectNumeric =
				parseFloat(
					directDiscountValue.replace(/\s/g, "").replace(",", "."),
				) || 0;
			updateTotalDiscount(0, currentDirectNumeric);
		}
		// handleDirectDiscountBlur will handle directAmount
	};

	// --- Submit Handler ---
	const handleSubmit = async () => {
		try {
			// Parse the final DISPLAYED discount amount (which uses ru-RU format)
			// Ensure robust parsing in case toLocaleString output varies slightly
			const numericDiscount =
				parseFloat(
					discountAmount.replace(/\s/g, "").replace(",", "."),
				) || 0;

			if (isNaN(numericDiscount)) {
				console.error(
					"Invalid discount amount calculated:",
					discountAmount,
				);
				// Maybe show an error to the user?
				return; // Prevent submitting invalid data
			}

			const response = await fetch(`${nodeUrl}/api/sales/discount`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					salesId: sales_id,
					newDiscount: numericDiscount.toFixed(2), // Send with fixed precision (e.g., 2 decimals)
				}),
			});

			if (!response.ok) {
				// Provide more context on failure
				const errorData = await response.text(); // or response.json() if API returns JSON error
				console.error(
					"Failed to update discount:",
					response.status,
					errorData,
				);
				throw new Error(
					`Failed to update discount: ${response.statusText}`,
				);
			}

			onClose(); // Close modal on success
		} catch (error) {
			console.error("Error submitting discount:", error);
			// Potentially show an error message to the user here
		}
	};

	// --- Calculated final amount ---
	// Ensure price is a number before calculation
	const numericPrice = parseFloat(price) || 0;
	const numericDiscount =
		parseFloat(discountAmount.replace(/\s/g, "").replace(",", ".")) || 0;
	// Prevent negative final amount
	const finalAmount = Math.max(0, numericPrice - numericDiscount);

	// --- Effect for Escape key ---
	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "Escape") {
				onClose();
			}
			// Add specific key handling for inputs if needed, e.g., Enter key on inputs
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

	const handleApplyKeyPress = (e) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleSubmit();
		}
	};

	useEffect(() => {
		const handleGlobalKeyDown = (e) => {
			if (e.key === "Enter") {
				// Get the active element
				const activeElement = document.activeElement;

				// Check which element is active and move focus accordingly
				if (activeElement === percentInputRef.current) {
					e.preventDefault();
					summaInputRef.current?.focus();
				} else if (activeElement === summaInputRef.current) {
					e.preventDefault();
					applyDiscountRef.current?.focus();
				} else if (activeElement === applyDiscountRef.current) {
					e.preventDefault();
					handleSubmit();
				}
			}
		};

		// Only add the listener when the modal is open
		if (isOpen) {
			window.addEventListener("keydown", handleGlobalKeyDown);
		}

		return () => {
			window.removeEventListener("keydown", handleGlobalKeyDown);
		};
	}, [isOpen, handleSubmit]); // Add any other dependencies needed

	// --- Render ---
	if (!isOpen) return null;

	// Show loading or default state until settings are loaded
	// You might want a more sophisticated loading indicator
	if (!deviceSettings) {
		return (
			<div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-6 z-[50]">
				<div className="bg-white rounded-lg p-6">
					Loading settings...
				</div>
			</div>
		);
	}

	return (
		<div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-6 z-[50]">
			{/* Added overflow-y-auto for smaller screens */}
			<div className="bg-white rounded-lg w-full max-w-3xl shadow-lg px-6 py-6 transition-all duration-300 transform scale-100 overflow-y-auto max-h-[90vh]">
				<div className="flex justify-between items-center mb-6 border-b pb-3">
					<h2 className="text-xl font-semibold text-blue-600">
						{content[language]?.salesPage?.headerDiscount ||
							"Discount"}{" "}
						{/* Fallback text */}
					</h2>
					<button
						onClick={onClose}
						className="p-2 text-gray-600 hover:text-gray-800 transition duration-200"
						aria-label="Close modal" // Accessibility
					>
						<IoClose className="w-6 h-6" />
					</button>
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{" "}
					{/* Responsive columns */}
					{/* Discount Input Section */}
					<div className="bg-gray-100 p-4 md:p-6 rounded-md border col-span-1">
						<h3 className="text-lg font-semibold text-blue-600 mb-4">
							{content[language]?.salesPage?.headerDiscount ||
								"Discount"}
						</h3>

						<div className="mb-4 relative">
							<label
								htmlFor="percentageInput"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{" "}
								{/* Added htmlFor */}%
							</label>
							<input
								ref={percentInputRef}
								id="percentageInput" // Added id
								type="text" // Keep text to allow intermediate states
								inputMode="numeric" // Hint for numeric keyboard
								name="percentage"
								value={percentageValue}
								onChange={handlePercentageChange}
								onFocus={handleFocus}
								onKeyPress={handleKeyPress}
								onBlur={handleBlur} // Use generic blur for percentage
								className="w-full px-4 py-3 text-right text-2xl font-semibold border border-gray-300 rounded-md bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
								maxLength={3} // Max 100%
							/>
						</div>

						<div className="relative">
							<label
								htmlFor="directAmountInput"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{" "}
								{/* Added htmlFor */}
								{content[language]?.salesPage
									?.headerDiscountSumma || "Amount"}
							</label>
							{/* --- MODIFIED INPUT --- */}
							<input
								ref={summaInputRef}
								id="directAmountInput" // Added id
								type="text" // Keep text to allow comma/dot entry
								name="directAmount"
								value={directDiscountValue}
								onChange={handleDirectDiscountChange}
								onFocus={handleFocus} // Use generic focus
								onBlur={handleDirectDiscountBlur} // Use specific blur for direct amount
								onKeyDown={handleDirectDiscountKeyDown} // Use specific keydown
								inputMode="decimal" // Hint for decimal keyboard
								placeholder={`0,${"0".repeat(
									maxDecimalPlaces,
								)}`} // Dynamic placeholder
								onKeyPress={handleKeyPressSumma}
								className="w-full px-4 py-3 text-right text-2xl font-semibold border border-gray-300 rounded-md bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
							/>
							{/* --- END MODIFIED INPUT --- */}
						</div>
					</div>
					{/* Calculation Display Section */}
					<div className="bg-blue-50 p-4 md:p-6 rounded-md border col-span-1 md:col-span-2">
						<h3 className="text-lg font-semibold text-blue-600 mb-4">
							{content[language]?.salesPage
								?.headerDiscountToPay || "Payment Details"}
						</h3>

						<div className="mb-4">
							<label className="text-sm font-medium text-gray-700">
								{/* Original Sum Label */}
								{content[language]?.salesPage
									?.headerDiscountSumma || "Original Amount"}
							</label>
							<div className="text-3xl font-bold text-gray-800 mt-1">
								{/* Display formatted price state */}
								{numericPrice.toLocaleString("ru-RU", {
									minimumFractionDigits:
										settingsDeviceInfoData.format.format_sum
											.max,
									maximumFractionDigits:
										settingsDeviceInfoData.format.format_sum
											.max,
								})}
							</div>
						</div>

						{/* Use grid for better alignment on smaller screens */}
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center mb-4">
							<label
								htmlFor="totalDiscountDisplay"
								className="text-base sm:text-lg font-medium text-gray-700 sm:col-span-1"
							>
								{content[language]?.salesPage?.headerDiscount ||
									"Discount"}
							</label>
							<input
								id="totalDiscountDisplay"
								type="text"
								value={discountAmount} // Display the calculated total discount
								readOnly
								className="sm:col-span-2 px-4 py-2 text-right text-xl sm:text-2xl font-bold border border-gray-300 rounded-md bg-gray-200 text-red-600" // Made bg lighter gray
								tabIndex={-1} // Prevent focusing read-only fields
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
							<label
								htmlFor="finalAmountDisplay"
								className="text-base sm:text-lg font-medium text-gray-700 sm:col-span-1"
							>
								{content[language]?.salesPage
									?.headerDiscountToPay || "Total Due"}
							</label>
							<input
								id="finalAmountDisplay"
								type="text"
								value={finalAmount.toLocaleString("ru-RU", {
									minimumFractionDigits:
										settingsDeviceInfoData.format.format_sum
											.max,
									maximumFractionDigits:
										settingsDeviceInfoData.format.format_sum
											.max,
								})}
								readOnly
								className="sm:col-span-2 px-4 py-2 text-right text-xl sm:text-2xl font-bold border border-gray-300 rounded-md bg-gray-200 text-green-700" // Made bg lighter gray
								tabIndex={-1} // Prevent focusing read-only fields
							/>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-4 mt-6 pt-4 justify-center items-center border-t">
					{" "}
					{/* Added border-t */}
					<button
						onClick={handleSubmit}
						ref={applyDiscountRef}
						onKeyPress={handleApplyKeyPress}
						data-ref="applyDiscountButton"
						// Disable if final amount is negative or exactly zero and price was non-zero?
						// Or simply disable if numericDiscount >= numericPrice? Let's keep original logic for now.
						// Changed condition: disable if discount >= price, allowing 100% discount (finalAmount = 0)
						disabled={
							numericDiscount >= numericPrice && numericPrice > 0
						}
						className={`w-[200px] py-3 px-6 rounded-md text-lg sm:text-xl transition duration-200 font-semibold
                            ${
								numericDiscount >= numericPrice &&
								numericPrice > 0
									? "bg-gray-400 cursor-not-allowed text-gray-600"
									: "bg-green-600 hover:bg-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
							}`}
					>
						OK
					</button>
					<button
						onClick={onClose}
						className="w-[200px]  bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 transition duration-200 text-lg sm:text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
					>
						{content[language]?.salesPage?.headerDiscountCancel ||
							"Cancel"}
					</button>
				</div>
			</div>
		</div>
	);
};

export default DiscountModal;

