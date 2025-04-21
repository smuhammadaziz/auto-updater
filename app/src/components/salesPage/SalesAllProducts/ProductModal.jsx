import React, { useEffect, useState, useCallback, useRef } from "react";
import { MdClear } from "react-icons/md";
import nodeUrl from "../../../links";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

function ProductModal({
	product,
	onClose,
	searchInputRef,
	searchQuery,
	setSearchQuery,
	onProductAdded,
}) {
	const [quantity, setQuantity] = useState(0);
	const [customPrice, setCustomPrice] = useState(null);
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [showEmpty, setShowEmpty] = useState(false);
	const [warehouseData, setWarehouseData] = useState({});
	const [isPriceInputFocused, setIsPriceInputFocused] = useState(false);
	const [rawPriceInput, setRawPriceInput] = useState("");

	const ksb_id = localStorage.getItem("ksbIdNumber");
	const sales_id = localStorage.getItem("sales_id");
	const device_id = localStorage.getItem("device_id");
	const priceTypeKey = localStorage.getItem("priceTypeKey");

	const quantityInputRef = useRef(null);
	const priceInputRef = useRef(null);
	const okButtonRef = useRef(null);

	// Parse safely with fallback
	const settingsDevice = JSON.parse(
		localStorage.getItem("settingsDevice") || "{}",
	);
	const userChangePriceSetting = localStorage.getItem("userChangePrice");

	const isPriceChangeGloballyAllowed = settingsDevice?.change_price === 1; // Check global setting (must be number 1)
	const isPriceChangeUserAllowed = userChangePriceSetting === "1";

	const canChangePrice =
		isPriceChangeGloballyAllowed && isPriceChangeUserAllowed;
	const isPriceReadOnly = !canChangePrice; // Input is readOnly if user *cannot* change the price
	// --- END: Added/Modified Code ---

	const [language] = useLang("uz");

	useEffect(() => {
		quantityInputRef.current?.focus();
	}, []);

	const settingsWarehouse = JSON.parse(
		localStorage.getItem("settingsWarehouse"),
	);

	const fetchWarehouseData = useCallback(async () => {
		const warehouseId = product?.stock?.[0]?.warehouse;

		// Check if warehouseId is valid and not already fetched
		if (warehouseId && !(warehouseId in warehouseData)) {
			const deviceId = localStorage.getItem("device_id");
			const ksbId = localStorage.getItem("ksbIdNumber");

			try {
				const response = await fetch(
					`${nodeUrl}/api/get/warehouse/data/${deviceId}/${ksbId}/${warehouseId}`,
				);

				if (!response.ok) {
					console.error(
						`Failed to fetch warehouse data for ${warehouseId}: ${response.statusText}`,
					);
					return; // Stop if fetch failed
				}

				const apiData = await response.json();

				if (apiData && apiData.length > 0) {
					// Assuming data is an array like [{item_id: 'id1', name: 'Name1'}, ...]
					const newWarehouseEntry = {
						[apiData[0].item_id]: apiData[0].name,
					};
					setWarehouseData((prev) => ({
						...prev,
						...newWarehouseEntry,
					}));
				} else {
					console.warn(
						`No data returned for warehouse ID: ${warehouseId}`,
					);
				}
			} catch (error) {
				console.error(
					"Error fetching or processing warehouse data",
					error,
				);
			}
		}
	}, [product, device_id, ksb_id]);

	useEffect(() => {
		fetchWarehouseData();
	}, [fetchWarehouseData]);

	const currencyKeyData = localStorage.getItem("currencyKey");
	const priceTypeKeyData = localStorage.getItem("priceTypeKey");
	const currencyKeyKeyValue = localStorage.getItem("currencyKeyKey");
	const falseCurrencyBooleans = localStorage.getItem("falseCurrencyBoolean");

	const matchingProductByCurrency = localStorage.getItem(
		"matchingProductByCurrency",
	);

	const currencyRateDataKey = JSON.parse(
		localStorage.getItem("currency_rate") || "{}",
	);

	const matchingPrice = product.price.find(
		(price) => price.type === priceTypeKeyData,
	);

	const roundedCountUZS = Number(
		localStorage.getItem("roundedExactNumberUZS"),
	);

	const roundedCountUSD = Number(
		localStorage.getItem("roundedExactNumberUSD"),
	);

	const roundingProductPrice = (son, razryad) => {
		let daraja = Math.pow(10, -razryad);
		return Math.round(son / daraja) * daraja;
	};

	const convertPrice = (originalPrice) => {
		if (
			matchingProductByCurrency == "0" ||
			matchingProductByCurrency == "false"
		) {
			if (currencyKeyData == falseCurrencyBooleans) {
				if (currencyKeyKeyValue == "uzs") {
					return roundingProductPrice(originalPrice, roundedCountUZS);
				} else if (currencyKeyKeyValue == "usd") {
					return roundingProductPrice(originalPrice, roundedCountUSD);
				}
			} else {
				if (currencyKeyKeyValue == "usd") {
					let calculatedPrice =
						originalPrice / currencyRateDataKey.usd;

					return roundingProductPrice(
						calculatedPrice,
						roundedCountUSD,
					);
				} else if (currencyKeyKeyValue == "uzs") {
					let calculatedPrice =
						originalPrice * currencyRateDataKey.usd;
					return roundingProductPrice(
						calculatedPrice,
						roundedCountUZS,
					);
				}
			}
		} else if (
			matchingProductByCurrency == "1" ||
			matchingProductByCurrency == "true"
		) {
			if (currencyKeyData == product.currency) {
				if (currencyKeyKeyValue == "uzs") {
					return roundingProductPrice(originalPrice, roundedCountUZS);
				} else if (currencyKeyKeyValue == "usd") {
					return roundingProductPrice(originalPrice, roundedCountUSD);
				}
			} else {
				if (currencyKeyKeyValue == "usd") {
					let calculatedPrice =
						originalPrice / currencyRateDataKey.usd;
					return roundingProductPrice(
						calculatedPrice,
						roundedCountUSD,
					);
				} else if (currencyKeyKeyValue == "uzs") {
					let calculatedPrice =
						originalPrice * currencyRateDataKey.usd;
					return roundingProductPrice(
						calculatedPrice,
						roundedCountUZS,
					);
				}
			}
		} else {
			return originalPrice;
		}
	};

	const convertedPrice =
		customPrice !== null ? customPrice : convertPrice(matchingPrice?.sale);

	const totalPrice =
		Number(String(quantity).replace(",", ".")) * Number(convertedPrice);

	const handleClose = () => {
		if (searchInputRef.current) {
			searchInputRef.current.focus();
			searchInputRef.current.select();
		}
		onClose();
	};

	const handlePriceFocus = (e) => {
		e.target.select();
	};

	const handleSubmit = async (e) => {
		if (e) {
			e.preventDefault();
		}

		if (quantity > product.stock[0].qty) {
			setShowErrorModal(true);
			return;
		}

		if (totalPrice === 0) {
			setShowEmpty(true);
			return;
		}

		let productPriceType = 0;

		const matchedPrice = product.price.find(
			(item) => item.type === priceTypeKey,
		);

		if (matchedPrice) {
			productPriceType = matchedPrice?.sale;
		} else {
			productPriceType = 0;
		}

		const data = {
			device_id: device_id,
			product_id: product.product_id,
			product_name: product.name,
			count: quantity,
			price: convertedPrice,
			total_price: totalPrice,
			product_info: [product],
			product_warehouse: product.stock[0].warehouse,
			product_currency: product.currency,

			mainWarehouse: product.stock[0].warehouse,
			mainPriceType: priceTypeKeyData,
			mainRate: currencyRateDataKey.usd,
			mainCurrency: currencyKeyData,
			mainComment: "",
			mainBelowCost: false,

			cash: null,
			currency: null,
			sum: null,
		};

		try {
			const response = await fetch(
				`${nodeUrl}/api/create/sales/${ksb_id}/${sales_id}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(data),
				},
			);

			if (response.ok) {
				const result = await response.json();
				if (result.id) {
					onProductAdded(result.id);
				}
				if (searchInputRef.current) {
					searchInputRef.current.focus();
					searchInputRef.current.select();
				}
				onClose();
			} else {
				console.error("Failed to submit data to the API");
			}
		} catch (error) {
			console.error("Error submitting the sell data:", error);
		}
	};

	const handleKeyDown = (e, currentField) => {
		if (e.ctrlKey && e.key === "Enter") {
			e.preventDefault();
			handleSubmit(e);
			return;
		}

		if (e.key === "Escape") {
			handleClose();
		}

		if (e.key === "Enter" && !e.ctrlKey) {
			e.preventDefault();
			switch (currentField) {
				case "quantity":
					priceInputRef.current?.focus();
					break;
				case "price":
					okButtonRef.current?.focus();
					break;
				case "okButton":
					handleSubmit(e);
					break;
				default:
					break;
			}
		}
	};

	const handlePriceChange = (e) => {
		if (canChangePrice) {
			let value = e.target.value;

			// Cleaning Logic
			value = value.replace(/[^0-9.,]/g, ""); // Remove disallowed chars
			const firstSeparator =
				value.indexOf(".") !== -1
					? value.indexOf(".")
					: value.indexOf(",");
			if (firstSeparator !== -1) {
				value =
					value.substring(0, firstSeparator + 1) +
					value.substring(firstSeparator + 1).replace(/[.,]/g, "");
			}
			value = value.replace(",", "."); // Standardize separator to '.'

			// Update the raw input state directly with the cleaned string
			setRawPriceInput(value);

			// Update the numeric customPrice state
			if (value === "" || value === ".") {
				setCustomPrice(null);
			} else {
				if (/^\d*\.?\d*$/.test(value)) {
					const numericValue = parseFloat(value);
					setCustomPrice(!isNaN(numericValue) ? numericValue : null);
				} else {
					// If regex fails after cleaning, set customPrice to null
					setCustomPrice(null);
				}
			}
		}
	};

	const handleFocus = (e) => {
		if (e.target.value === "0") {
			setQuantity("");
		}
	};

	const handleBlur = (e) => {
		if (e.target.value === "") {
			setQuantity(0);
		}
	};

	const [changePriceValue, setChangePriceValue] = useState(() => {
		const savedValue = localStorage.getItem("changePriceValue");
		return savedValue === "true";
	});

	useEffect(() => {
		localStorage.setItem("changePriceValue", changePriceValue);
	}, [changePriceValue]);

	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));
	const userSettingsInfo = JSON.parse(
		localStorage.getItem("userChangePrice"),
	);

	const errorButtonRef = useRef(null);

	useEffect(() => {
		if (showErrorModal && errorButtonRef.current) {
			errorButtonRef.current.focus();
		}
	}, [showErrorModal]);

	// --- New handlers for price input focus/blur ---
	const handlePriceInputFocus = (e) => {
		setIsPriceInputFocused(true);
		// Initialize raw input state with current numeric value as string
		const currentNumericValue =
			customPrice !== null ? customPrice : convertedPrice;
		setRawPriceInput(
			currentNumericValue !== null && currentNumericValue !== undefined
				? String(currentNumericValue)
				: "",
		);

		// Use setTimeout to ensure selection happens after potential re-render
		setTimeout(() => {
			if (priceInputRef.current) {
				priceInputRef.current.select();
			}
		}, 0);
	};

	const handlePriceInputBlur = () => {
		setIsPriceInputFocused(false); // Update state on blur
	};
	// --- End new handlers ---

	return (
		<>
			<div
				className="fixed inset-0 flex items-center justify-center bg-black/70 z-50"
				data-no-autofocus
			>
				<div className="bg-white w-[760px] rounded-lg shadow-xl relative transform transition-all">
					{/* Header */}
					<div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
						<h2 className="text-xl font-semibold text-gray-800">
							Маҳсулот қўшиш
						</h2>
						<button
							onClick={handleClose}
							className="rounded-full p-1 hover:bg-gray-100 transition-colors"
						>
							<MdClear size={22} className="text-gray-500" />
						</button>
					</div>

					<div className="p-6">
						<form onSubmit={handleSubmit}>
							<div className="mb-6">
								<div className="grid grid-cols-12 gap-4 items-start">
									<div className="col-span-12">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											{
												content[language].salesPage
													.saleTableName
											}
										</label>
										<input
											type="text"
											value={product.name ?? ""}
											readOnly
											className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none"
										/>
									</div>

									<div className="col-span-8">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											{
												content[language].salesPage
													.saleTableWarehouse
											}
										</label>
										<input
											type="text"
											value={
												warehouseData[
													product.stock[0].warehouse
												] ?? ""
											}
											readOnly
											className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none"
										/>
									</div>

									<div className="col-span-4">
										<label className="block text-sm font-medium text-gray-700 mb-1">
											{
												content[language].salesPage
													.saleTableOstatka
											}
										</label>
										<input
											type="text"
											value={
												product.stock[0].qty?.toLocaleString(
													"ru-RU",
													{
														minimumFractionDigits:
															deviceSettings
																.format
																.format_qty.max,
														maximumFractionDigits:
															deviceSettings
																.format
																.format_qty.max,
													},
												) ?? ""
											}
											readOnly
											className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-md text-gray-700 focus:outline-none"
										/>
									</div>
								</div>
							</div>

							<div className="border-t border-gray-200 my-5"></div>

							<div className="grid grid-cols-12 gap-6">
								<div className="col-span-5 ">
									<label className="block text-sm font-medium text-gray-700 mb-1">
										{
											content[language].salesPage
												.saleModalCount
										}
									</label>
									<input
										ref={quantityInputRef}
										type="text"
										value={quantity ?? ""}
										onFocus={handleFocus}
										onBlur={(e) => {
											const value =
												e.target.value.replace(
													",",
													".",
												);
											if (value) {
												const numValue =
													parseFloat(value);
												if (!isNaN(numValue)) {
													const formattedValue =
														numValue.toFixed(
															deviceSettings
																.format
																.format_qty.max,
														);
													setQuantity(formattedValue);
												}
											}
											handleBlur(e);
										}}
										onKeyDown={(e) => {
											const value = e.target.value;
											const decimalIndex = Math.max(
												value.indexOf("."),
												value.indexOf(","),
											);
											const caretPos =
												e.currentTarget
													.selectionStart ??
												value.length;

											// Handle Enter to focus the next input
											if (e.key === "Enter") {
												e.preventDefault();
												if (priceInputRef?.current) {
													priceInputRef.current.focus();
												}
												return;
											}

											if (
												(e.key === "." ||
													e.key === ",") &&
												decimalIndex !== -1
											) {
												e.preventDefault();
												return;
											}

											const allowedKeys = [
												"Backspace",
												"Delete",
												"ArrowLeft",
												"ArrowRight",
												".",
												",",
											];

											const isDigit = /^\d$/.test(e.key);

											if (
												!isDigit &&
												!allowedKeys.includes(e.key)
											) {
												e.preventDefault();
												return;
											}

											const beforeDecimal =
												decimalIndex === -1
													? value
													: value.substring(
															0,
															decimalIndex,
													  );
											const afterDecimal =
												decimalIndex === -1
													? ""
													: value.substring(
															decimalIndex + 1,
													  );

											const isBeforeDecimal =
												decimalIndex === -1 ||
												caretPos <= decimalIndex;

											if (
												isDigit &&
												((isBeforeDecimal &&
													beforeDecimal.length >=
														deviceSettings.format
															.format_qty
															.symbol) ||
													(!isBeforeDecimal &&
														afterDecimal.length >=
															deviceSettings
																.format
																.format_qty
																.max))
											) {
												e.preventDefault();
												return;
											}

											handleKeyDown(e, "quantity");
										}}
										onChange={(e) => {
											let val = e.target.value;

											const dotIndex = val.indexOf(".");
											const commaIndex = val.indexOf(",");
											let decimalIndex = -1;

											if (
												dotIndex !== -1 &&
												commaIndex !== -1
											) {
												decimalIndex = Math.min(
													dotIndex,
													commaIndex,
												);
												val =
													val.substring(
														0,
														decimalIndex,
													) +
													val.charAt(decimalIndex) +
													val
														.substring(
															decimalIndex + 1,
														)
														.replace(/[.,]/g, "");
											} else {
												decimalIndex = Math.max(
													dotIndex,
													commaIndex,
												);
											}

											if (decimalIndex !== -1) {
												const wholePart = val
													.substring(0, decimalIndex)
													.slice(
														0,
														deviceSettings.format
															.format_qty.symbol,
													);
												let decimalPart = val
													.substring(decimalIndex + 1)
													.slice(
														0,
														deviceSettings.format
															.format_qty.max,
													);

												const separator =
													val.charAt(decimalIndex);
												val =
													wholePart +
													separator +
													decimalPart;
											} else {
												val = val.slice(
													0,
													deviceSettings.format
														.format_qty.symbol,
												);
											}

											val = val.replace(/[^\d.,]/g, "");

											setQuantity(val);
										}}
										inputMode="decimal"
										placeholder={`0.${"0".repeat(
											deviceSettings.format.format_qty
												.max,
										)}`}
										className="w-full px-12 py-3.5 h-[130px] bg-white border border-gray-300 rounded-md text-2xl text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
									/>
								</div>

								<div className="col-span-7">
									<div className="mb-4">
										<label className="block  text-sm font-medium text-gray-700 mb-1">
											{
												content[language].salesPage
													.saleTablePrice
											}
										</label>
										<input
											ref={priceInputRef}
											type="text"
											value={(() => {
												// Determine the base numeric value
												const numericValueToShow =
													customPrice !== null
														? customPrice
														: convertedPrice;

												// Format options reused
												const formatOptions = {
													minimumFractionDigits:
														deviceSettings.format
															.format_sum.max,
													maximumFractionDigits:
														deviceSettings.format
															.format_sum.max,
												};

												// Determine the displayed value string
												let displayValueString;
												if (
													isPriceInputFocused &&
													canChangePrice
												) {
													// When focused and editable, show the raw input state string.
													displayValueString =
														rawPriceInput;
												} else {
													// When blurred or not editable, show the formatted string based on numeric state.
													const numericValueToShow =
														customPrice !== null
															? customPrice
															: convertedPrice;
													const valueToFormat =
														numericValueToShow ?? 0; // Default to 0 if null/undefined
													displayValueString =
														valueToFormat?.toLocaleString(
															"ru-RU",
															formatOptions,
														);
												}
												return displayValueString;
											})()}
											onKeyDown={(e) =>
												handleKeyDown(e, "price")
											}
											onChange={handlePriceChange} // Updated handler
											onFocus={handlePriceInputFocus} // Use new focus handler
											onBlur={handlePriceInputBlur} // Use new blur handler
											readOnly={isPriceReadOnly} // Use the calculated readOnly state
											inputMode={
												canChangePrice
													? "decimal"
													: "none"
											} // Hint for mobile keyboards
											className={`w-full px-4 py-3.5 rounded-md text-2xl focus:ring-1 text-right transition-all ${
												isPriceReadOnly // Apply styles based on readOnly status
													? "bg-gray-50 border border-gray-200 text-gray-500 cursor-not-allowed" // Style for readOnly
													: "bg-white border border-gray-300 text-gray-700 focus:border-indigo-500 focus:ring-indigo-500" // Style for editable
											}`}
										/>
									</div>

									{/* Total */}
									<div>
										<div className="bg-indigo-50 border border-indigo-100 rounded-md p-3">
											<div className="text-2xl font-semibold text-indigo-800 text-right">
												{totalPrice?.toLocaleString(
													"ru-RU",
													{
														minimumFractionDigits:
															deviceSettings
																.format
																.format_sum.max,
														maximumFractionDigits:
															deviceSettings
																.format
																.format_sum.max,
													},
												)}
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex justify-end space-x-3 mt-6 pt-5 border-t border-gray-200">
								<button
									onClick={handleClose}
									className="px-5 w-[197px] py-2.5 border border-gray-300 bg-white text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-all"
								>
									{
										content[language].salesPage
											.headerDiscountCancel
									}
								</button>
								<button
									ref={okButtonRef}
									type="submit"
									onKeyDown={(e) =>
										handleKeyDown(e, "okButton")
									}
									className="px-8 w-[197px] py-2.5 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-all"
								>
									OK
								</button>
							</div>
						</form>
					</div>
				</div>

				{/* Error Modal */}
				{showErrorModal && (
					<div
						className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-[100]"
						// tabIndex={-1}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setShowErrorModal(false);
							}
						}}
					>
						<div className="bg-white w-[400px] rounded-lg shadow-xl overflow-hidden">
							<div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center">
								<svg
									className="w-5 h-5 text-red-500 mr-2"
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
										clipRule="evenodd"
									/>
								</svg>
								<h3 className="text-lg font-medium text-gray-800">
									Ошибка
								</h3>
							</div>
							<div className="p-4">
								<p className="text-gray-700">
									{
										content[language].salesPage
											.saleModalNotEnough
									}
								</p>
								<div className="mt-4 flex justify-end">
									<button
										ref={errorButtonRef}
										onClick={() => setShowErrorModal(false)}
										className="px-4 py-2 bg-red-600 text-white font-medium rounded-md hover:bg-red-700 transition-all"
									>
										OK
									</button>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export default ProductModal;

