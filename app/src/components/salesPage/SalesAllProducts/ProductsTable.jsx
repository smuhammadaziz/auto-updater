import React, { useState, useEffect, useCallback, useRef } from "react";
import nodeUrl from "../../../links";
import CustomScroll from "./CustomScroll";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

function ProductsTable({
	filteredData,
	selectedRow,
	setSelectedRow,
	isSelectionEnabled,
	tableRef,
	selectedRowRef,
	handleRowDoubleClick,
	error,
	onLoadMore,
	hasMore,
	mouseSelectedRow,
	setMouseSelectedRow,
	tableClickedRow,
	setTableClickedRow,
	sortConfig,
	onSort,
	setSelectedProduct,
	setIsModalOpen,
}) {
	const [currencyData, setCurrencyData] = useState({});
	const [warehouseData, setWarehouseData] = useState({});
	const [clickedRow, setClickedRow] = useState(null);
	const [selectedCell, setSelectedCell] = useState({ row: null, col: null });
	const [currencyKey, setCurrencyKey] = useState(
		localStorage.getItem("currencyKey"),
	);
	const [priceTypeKey, setPriceKeyKey] = useState(
		localStorage.getItem("priceTypeKey"),
	);
	const loadingRef = useRef(null);

	const [currencyRateData, setCurrencyRateData] = useState("");

	const [currentCurrencyData, setCurrentCurrencyData] = useState("");

	const settingsWarehouse = JSON.parse(
		localStorage.getItem("settingsWarehouse"),
	);

	const settingsDeviceData = JSON.parse(
		localStorage.getItem("settingsDevice") || "{}",
	);

	const [language] = useLang("uz");

	const observer = useRef(null);
	const lastRowRef = useCallback(
		(node) => {
			if (observer.current) observer.current.disconnect();

			observer.current = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && hasMore) {
						onLoadMore();
					}
					if (entries[0].isIntersecting && !hasMore) {
						entries[0].target.scrollIntoView({
							block: "nearest",
							behavior: "smooth",
						});

						setSelectedCell({ row: null, col: null });
						setClickedRow(null);
						setSelectedRow(null);
					}
				},
				{
					root: tableRef.current,
					rootMargin: "100px",
					threshold: 0.1,
				},
			);

			if (node) observer.current.observe(node);
		},
		[hasMore, onLoadMore, tableRef, setSelectedRow],
	);

	const fetchCurrencyData = useCallback(async () => {
		for (const product of filteredData) {
			if (product.currency && !currencyData[product.currency]) {
				const deviceId = localStorage.getItem("device_id");
				const ksbId = localStorage.getItem("ksbIdNumber");

				try {
					const response = await fetch(
						`${nodeUrl}/api/get/currency/data/${deviceId}/${ksbId}/${product.currency}`,
					);
					const data = await response.json();

					setCurrencyData((prev) => ({
						...prev,
						[product.currency]: data[0]?.name || "-",
					}));

					if (data[0]?.key) {
						setCurrencyRateData(data[0].key);
					}
				} catch (error) {
					console.error("Failed to fetch currency data", error);
					setCurrencyData((prev) => ({
						...prev,
						[product.currency]: "-",
					}));
				}
			}
		}
	}, [filteredData]);

	useEffect(() => {
		fetchCurrencyData();
	}, [fetchCurrencyData]);

	const fetchWarehouseData = useCallback(async () => {
		if (!filteredData || filteredData.length === 0) {
			return; // No products, nothing to fetch
		}

		// 1. Collect unique warehouse IDs needed
		const uniqueWarehouseIds = [
			...new Set(
				filteredData
					.map((product) => product?.stock?.[0]?.warehouse)
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
						// Assuming data is an array like [{item_id: 'id1', name: 'Name1'}, ...]
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

			// 4. Filter out null results and combine successful ones
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
	}, [filteredData]);

	useEffect(() => {
		fetchWarehouseData();
	}, [fetchWarehouseData]);

	const [names, setNames] = useState({});

	useEffect(() => {
		const fetchAllNames = async () => {
			const nameMap = {};
			for (const product of filteredData) {
				for (const item of product.price) {
					const name = await fetchPriceName(item.type);
					if (name) {
						nameMap[item.type] = name;
					}
				}
			}
			setNames(nameMap);
		};
		fetchAllNames();
	}, [filteredData]);

	const fetchPriceName = async (item_id) => {
		const deviceId = localStorage.getItem("device_id");
		const ksbId = localStorage.getItem("ksbIdNumber");
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/price/data/${deviceId}/${ksbId}/${item_id}`,
			);
			const data = await response.json();

			return data[0]?.item_id;
		} catch (err) {
			console.error("Error fetching price name:", err);
			return null;
		}
	};

	const handleKeyDown = useCallback(
		(e) => {
			if (!selectedCell.row && selectedCell.row !== 0) return;
			if (isSelectionEnabled) return;

			const totalColumns = settingsDeviceData?.box === 1 ? 9 : 7;
			const totalRows = filteredData.length;

			switch (e.key) {
				case "ArrowUp":
					e.preventDefault();
					const newUpRow = Math.max(0, selectedCell.row - 1);
					setSelectedCell((prev) => ({
						row: newUpRow,
						col: prev.col,
					}));
					const upRowElement = document.querySelector(
						`tr[data-row-index="${newUpRow}"]`,
					);
					if (upRowElement) {
						upRowElement.scrollIntoView({
							block: "nearest",
							behavior: "smooth",
						});
					}
					break;
				case "ArrowDown":
					e.preventDefault();
					const newDownRow = Math.min(
						totalRows - 1,
						selectedCell.row + 1,
					);
					setSelectedCell((prev) => ({
						row: newDownRow,
						col: prev.col,
					}));
					const downRowElement = document.querySelector(
						`tr[data-row-index="${newDownRow}"]`,
					);
					if (downRowElement) {
						downRowElement.scrollIntoView({
							block: "nearest",
							behavior: "smooth",
						});
					}
					break;
				case "ArrowLeft":
					e.preventDefault();
					setSelectedCell((prev) => ({
						row: prev.row,
						col: Math.max(0, prev.col - 1),
					}));
					break;
				case "ArrowRight":
					e.preventDefault();
					setSelectedCell((prev) => ({
						row: prev.row,
						col: Math.min(totalColumns - 1, prev.col + 1),
					}));
					break;
				default:
					break;
			}
		},
		[
			selectedCell.row,
			filteredData.length,
			isSelectionEnabled,
			settingsDeviceData?.box,
		],
	);

	useEffect(() => {
		if (isSelectionEnabled) {
			setSelectedCell({ row: null, col: null });
			setClickedRow(null);
		}
	}, [isSelectionEnabled]);

	useEffect(() => {
		if (
			selectedRow !== null &&
			selectedRow !== undefined &&
			filteredData.length > 0
		) {
			const selectedRowElement = document.querySelector(
				`tr[data-row-index="${selectedRow}"]`,
			);

			if (selectedRowElement) {
				selectedRowElement.scrollIntoView({
					block: "center",
					behavior: "smooth",
				});
			}
		}
	}, [selectedRow, filteredData]);

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [handleKeyDown]);

	useEffect(() => {
		const handleCurrencyChange = () => {
			const newCurrencyKey = localStorage.getItem("currencyKey");
			setCurrencyKey(newCurrencyKey);
		};

		window.addEventListener("currencyChanged", handleCurrencyChange);

		return () => {
			window.removeEventListener("currencyChanged", handleCurrencyChange);
		};
	}, []);

	useEffect(() => {
		const handlePriceTypeChange = () => {
			const newPriceTypeKey = localStorage.getItem("priceTypeKey");
			setPriceKeyKey(newPriceTypeKey);
		};

		window.addEventListener("priceTypeChanged", handlePriceTypeChange);

		return () => {
			window.removeEventListener(
				"priceTypeChanged",
				handlePriceTypeChange,
			);
		};
	}, []);

	const currencyKeyData = localStorage.getItem("currencyKey");
	const priceTypeKeyData = localStorage.getItem("priceTypeKey");
	const matchingProductByCurrency = localStorage.getItem(
		"matchingProductByCurrency",
	);
	const falseCurrencyBoolean = localStorage.getItem("falseCurrencyBoolean");
	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));

	const getSortIcon = (columnKey) => {
		if (sortConfig.key !== columnKey) {
			return "";
		}
		return sortConfig.direction === "asc" ? "↑" : "↓";
	};

	const handleRowClick = (index) => {
		setSelectedRow(index);
		setMouseSelectedRow(index);
		setTableClickedRow(index);
	};

	return (
		<CustomScroll
			className="flex-1 focus:outline-none"
			ref={tableRef}
			style={{ outline: "none" }}
		>
			<table
				className="min-w-full bg-white border border-gray-200 focus:outline-none table-fixed"
				style={{ outline: "none" }}
				data-no-autofocus
			>
				<thead className="sticky top-0 bg-gray-100 shadow-sm">
					<tr className="text-gray-700 uppercase text-[10px]">
						<th
							className="py-1.5 px-5 border-b border-r text-center w-1/2 min-w-[300px] cursor-pointer hover:bg-gray-200"
							onClick={() => onSort("name")}
						>
							{content[language].salesPage.saleTableName}
							<span className="ml-2">{getSortIcon("name")}</span>
						</th>
						<th
							className="py-1.5 px-5 border-b border-r text-center w-1/10 min-w-[50px] cursor-pointer hover:bg-gray-200"
							onClick={() => onSort("currency")}
						>
							{content[language].salesPage.saleTableCurrency}
							<span className="ml-2">
								{getSortIcon("currency")}
							</span>
						</th>
						<th
							className="py-1.5 px-5 border-b border-r text-center w-1/10 min-w-[50px] cursor-pointer hover:bg-gray-200"
							onClick={() => onSort("stock.0.qty")}
						>
							{content[language].salesPage.saleTableOstatka}
							<span className="ml-2">
								{getSortIcon("stock.0.qty")}
							</span>
						</th>
						{/* {settingsDeviceData?.box === 1 && (
							<th
								className="py-1.5 px-5 border-b text-[10px] border-r text-center w-1/10 min-w-[50px] cursor-pointer hover:bg-gray-200"
								onClick={() => onSort("box")}
							>
								{content[language].salesPage.saleTableBox ||
									"упк."}
								<span className="ml-2">
									{getSortIcon("box")}
								</span>
							</th>
						)}
						{settingsDeviceData?.box === 1 ? (
							<th
								className="p-0 border-b border-r w-[250px]"
								colSpan="3"
							>
								<div className="text-center py-1.5 border-b">
									{
										content[language].salesPage
											.saleTableOstatka
									}
								</div>
								<div className="flex">
									<div className="py-1 px-2 text-center border-r w-[83px] cursor-pointer hover:bg-gray-200">
										кор
									</div>
									<div className="py-1 px-2 text-center border-r w-[83px] cursor-pointer hover:bg-gray-200">
										дона
									</div>
									<div className="py-1 px-2 text-center w-[84px] cursor-pointer hover:bg-gray-200">
										жами
									</div>
								</div>
							</th>
						) : (
							<th
								className="py-1.5 px-5 border-b border-r text-center w-1/10 min-w-[50px] cursor-pointer hover:bg-gray-200"
								onClick={() => onSort("stock.0.qty")}
							>
								{content[language].salesPage.saleTableOstatka}
								<span className="ml-2">
									{getSortIcon("stock.0.qty")}
								</span>
							</th>
						)} */}
						<th
							className="py-1.5 px-5 border-b border-r text-center w-1/10 min-w-[150px] cursor-pointer hover:bg-gray-200"
							onClick={() => onSort("convertedPrice")}
						>
							{content[language].salesPage.saleTablePriceCurrency}
							<span className="ml-2">
								{getSortIcon("convertedPrice")}
							</span>
						</th>
						<th
							className="py-1.5 px-5 border-b border-r text-center w-1/10 min-w-[150px] cursor-pointer hover:bg-gray-200"
							onClick={() => onSort("actualPrice")}
						>
							{content[language].salesPage.saleTablePrice}
							<span className="ml-2">
								{getSortIcon("actualPrice")}
							</span>
						</th>
						<th
							className="py-1.5 px-5 border-b text-center w-1/10 min-w-[120px] cursor-pointer hover:bg-gray-200"
							onClick={() => onSort("stock.0.warehouse")}
						>
							{content[language].salesPage.saleTableWarehouse}
							<span className="ml-2">
								{getSortIcon("stock.0.warehouse")}
							</span>
						</th>
					</tr>
				</thead>
				<tbody>
					{error ? (
						<tr>
							<td
								colSpan="7"
								className="py-3 text-center text-red-500"
							>
								{error}
								<p className="text-xs text-gray-500 mt-1">
									Ошибка
								</p>
							</td>
						</tr>
					) : filteredData.length > 0 ? (
						<>
							{filteredData.map((product, index) => (
								<tr
									key={product.product_id}
									data-row-index={index}
									ref={
										index === filteredData.length - 1
											? lastRowRef
											: selectedRow === index
											? selectedRowRef
											: null
									}
									onClick={() => handleRowClick(index)}
									className={`text-gray-800 font-semibold cursor-pointer text-xs transition-all duration-150 focus:outline-none ${
										selectedRow === index &&
										isSelectionEnabled &&
										!mouseSelectedRow
											? "bg-blue-500 text-white"
											: mouseSelectedRow === index
											? "bg-blue-500 text-white"
											: !isSelectionEnabled &&
											  (tableClickedRow === index
													? "bg-blue-200 text-black hover:bg-blue-200 hover:text-black"
													: selectedCell.row === index
													? "bg-blue-200 text-black hover:bg-blue-200 hover:text-black"
													: "hover:bg-slate-50")
									}`}
									style={{ outline: "none" }}
									onDoubleClick={() =>
										handleRowDoubleClick(product)
									}
								>
									<td
										className={`py-1.5 px-5 border-b border-r text-left w-1/4 min-w-[200px] ${
											selectedCell.row === index &&
											selectedCell.col === 1
												? "bg-blue-500 text-white"
												: ""
										}`}
										onClick={(e) => {
											if (!isSelectionEnabled) {
												e.stopPropagation();
												setSelectedCell({
													row: index,
													col: 1,
												});
											}
										}}
									>
										{product.name}
									</td>
									<td
										className={`py-1.5 px-5 border-b border-r text-center w-1/10 min-w-[50px] ${
											selectedCell.row === index &&
											selectedCell.col === 2
												? "bg-blue-500 text-white"
												: ""
										}`}
										onClick={(e) => {
											if (!isSelectionEnabled) {
												e.stopPropagation();
												setSelectedCell({
													row: index,
													col: 2,
												});
											}
										}}
									>
										{(() => {
											const currencyKeyValue =
												localStorage.getItem(
													"currencyKey",
												);
											const priceKeyValue =
												localStorage.getItem(
													"priceTypeKey",
												);

											const falseCurrencyBooleans =
												localStorage.getItem(
													"falseCurrencyBoolean",
												);

											const matchingProductByCurrency =
												localStorage.getItem(
													"matchingProductByCurrency",
												);

											if (
												matchingProductByCurrency ==
													"0" ||
												matchingProductByCurrency ==
													"false"
											) {
												return currencyData[
													falseCurrencyBooleans
												];
											} else if (
												matchingProductByCurrency ==
													"1" ||
												matchingProductByCurrency ==
													"true"
											) {
												return currencyData[
													product.currency
												];
											} else {
												return "-";
											}
										})()}
									</td>
									<td
										className={`py-1.5 px-5 border-b border-r text-right w-1/10 min-w-[50px] ${
											selectedCell.row === index &&
											selectedCell.col === 3
												? "bg-blue-500 text-white"
												: ""
										}`}
										onClick={(e) => {
											if (!isSelectionEnabled) {
												e.stopPropagation();
												setSelectedCell({
													row: index,
													col: 3,
												});
											}
										}}
									>
										{product.stock[0].qty.toLocaleString(
											"ru-RU",
											{
												minimumFractionDigits:
													deviceSettings.format
														.format_qty.max,
												maximumFractionDigits:
													deviceSettings.format
														.format_qty.max,
											},
										)}
									</td>
									{/* {settingsDeviceData?.box === 1 && (
										<td
											className={`py-1.5 px-5 border-b border-r text-right w-1/10 min-w-[50px] ${
												selectedCell.row === index &&
												selectedCell.col === 3
													? "bg-blue-500 text-white"
													: ""
											}`}
											onClick={(e) => {
												if (!isSelectionEnabled) {
													e.stopPropagation();
													setSelectedCell({
														row: index,
														col: 3,
													});
												}
											}}
										>
											{product.box || "-"}
										</td>
									)}
									{settingsDeviceData?.box === 1 ? (
										<>
											<td className="py-1.5 px-3 border-b border-r text-right w-[83px]">
												{product.box
													? Math.floor(
															product.stock[0]
																.qty /
																product.box,
													  ).toFixed(2)
													: "-"}
											</td>
											<td className="py-1.5 px-3 border-b border-r text-right w-[83px]">
												{product.box &&
												product.stock[0].qty %
													product.box >
													0
													? (
															product.stock[0]
																.qty %
															product.box
													  ).toFixed(2)
													: ""}
											</td>
											<td className="py-1.5 px-3 border-b border-r text-right w-[84px]">
												{product.stock[0].qty.toLocaleString(
													"ru-RU",
													{
														minimumFractionDigits: 2,
														maximumFractionDigits: 2,
													},
												)}
											</td>
										</>
									) : (
										<td
											className={`py-1.5 px-5 border-b border-r text-right w-1/10 min-w-[50px] ${
												selectedCell.row === index &&
												selectedCell.col === 3
													? "bg-blue-500 text-white"
													: ""
											}`}
											onClick={(e) => {
												if (!isSelectionEnabled) {
													e.stopPropagation();
													setSelectedCell({
														row: index,
														col: 3,
													});
												}
											}}
										>
											{product.stock[0].qty.toLocaleString(
												"ru-RU",
												{
													minimumFractionDigits:
														deviceSettings.format
															.format_qty.max,
													maximumFractionDigits:
														deviceSettings.format
															.format_qty.max,
												},
											)}
										</td>
									)} */}
									<td
										className={`py-1.5 px-5 border-b border-r text-right w-1/10 min-w-[120px] ${
											selectedCell.row === index &&
											selectedCell.col === 4
												? "bg-blue-500 text-white"
												: ""
										}`}
										onClick={(e) => {
											if (!isSelectionEnabled) {
												e.stopPropagation();
												setSelectedCell({
													row: index,
													col: 4,
												});
											}
										}}
									>
										{(() => {
											const currencyKeyValue =
												localStorage.getItem(
													"currencyKey",
												);

											const matchingPrice =
												product.price.find(
													(price) =>
														price.type ===
														priceTypeKeyData,
												);

											if (!matchingPrice) {
												return "-";
											}

											const priceKeyValue =
												localStorage.getItem(
													"priceTypeKey",
												);

											const falseCurrencyBooleans =
												localStorage.getItem(
													"falseCurrencyBoolean",
												);

											const matchingProductByCurrency =
												localStorage.getItem(
													"matchingProductByCurrency",
												);

											if (
												matchingProductByCurrency ==
													"0" ||
												matchingProductByCurrency ==
													"false"
											) {
												if (
													currencyKeyValue ==
													falseCurrencyBooleans
												) {
													return "-";
												} else {
													return matchingPrice.sale.toLocaleString(
														"ru-RU",
														{
															minimumFractionDigits:
																deviceSettings
																	.format
																	.format_sum
																	.max,
															maximumFractionDigits:
																deviceSettings
																	.format
																	.format_sum
																	.max,
														},
													);
												}
											} else if (
												matchingProductByCurrency ==
													"1" ||
												matchingProductByCurrency ==
													"true"
											) {
												if (
													currencyKeyValue ==
													product.currency
												) {
													return "-";
												} else {
													return matchingPrice.sale.toLocaleString(
														"ru-RU",
														{
															minimumFractionDigits:
																deviceSettings
																	.format
																	.format_sum
																	.max,
															maximumFractionDigits:
																deviceSettings
																	.format
																	.format_sum
																	.max,
														},
													);
												}
											} else {
												return "-";
											}
										})()}
									</td>
									<td
										className={`py-0.5 px-5 border-b border-r text-base font-bold text-right w-1/10 min-w-[120px] ${
											selectedCell.row === index &&
											selectedCell.col === 5
												? "bg-blue-500 text-white"
												: ""
										}`}
										onClick={(e) => {
											if (!isSelectionEnabled) {
												e.stopPropagation();
												setSelectedCell({
													row: index,
													col: 5,
												});
											}
										}}
									>
										{(() => {
											const currencyKeyValue =
												localStorage.getItem(
													"currencyKey",
												);

											const currencyKeyKeyValue =
												localStorage.getItem(
													"currencyKeyKey",
												);

											const matchingPrice =
												product.price.find(
													(price) =>
														price.type ===
														priceTypeKeyData,
												);

											if (!matchingPrice) {
												return "-";
											}

											const priceKeyValue =
												localStorage.getItem(
													"priceTypeKey",
												);

											const currencyRateDataKey =
												JSON.parse(
													localStorage.getItem(
														"currency_rate",
													) || "{}",
												);

											const falseCurrencyBooleans =
												localStorage.getItem(
													"falseCurrencyBoolean",
												);

											const matchingProductByCurrency =
												localStorage.getItem(
													"matchingProductByCurrency",
												);

											const roundedCountUZS = Number(
												localStorage.getItem(
													"roundedExactNumberUZS",
												),
											);

											const roundedCountUSD = Number(
												localStorage.getItem(
													"roundedExactNumberUSD",
												),
											);

											const roundingProductPrice = (
												son,
												razryad,
											) => {
												let daraja = Math.pow(
													10,
													-razryad,
												);
												return (
													Math.round(son / daraja) *
													daraja
												);
											};

											if (
												matchingProductByCurrency ==
													"0" ||
												matchingProductByCurrency ==
													"false"
											) {
												if (
													currencyKeyValue ==
													falseCurrencyBooleans
												) {
													if (
														currencyKeyKeyValue ==
														"uzs"
													) {
														return roundingProductPrice(
															matchingPrice.sale,
															roundedCountUZS,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													} else if (
														currencyKeyKeyValue ==
														"usd"
													) {
														return roundingProductPrice(
															matchingPrice.sale,
															roundedCountUSD,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													}
												} else {
													if (
														currencyKeyKeyValue ==
														"usd"
													) {
														let calculatedPrice =
															matchingPrice.sale /
															currencyRateDataKey.usd;
														return roundingProductPrice(
															calculatedPrice,
															roundedCountUSD,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													} else if (
														currencyKeyKeyValue ==
														"uzs"
													) {
														let calculatedPrice =
															matchingPrice.sale *
															currencyRateDataKey.usd;
														return roundingProductPrice(
															calculatedPrice,
															roundedCountUZS,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													}
												}
											} else if (
												matchingProductByCurrency ==
													"1" ||
												matchingProductByCurrency ==
													"true"
											) {
												if (
													currencyKeyValue ==
													product.currency
												) {
													if (
														currencyKeyKeyValue ==
														"uzs"
													) {
														return roundingProductPrice(
															matchingPrice.sale,
															roundedCountUZS,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													} else if (
														currencyKeyKeyValue ==
														"usd"
													) {
														return roundingProductPrice(
															matchingPrice.sale,
															roundedCountUSD,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													}
												} else {
													if (
														currencyKeyKeyValue ==
														"usd"
													) {
														let calculatedPrice =
															matchingPrice.sale /
															currencyRateDataKey.usd;
														return roundingProductPrice(
															calculatedPrice,
															roundedCountUSD,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													} else if (
														currencyKeyKeyValue ==
														"uzs"
													) {
														let calculatedPrice =
															matchingPrice.sale *
															currencyRateDataKey.usd;
														return roundingProductPrice(
															calculatedPrice,
															roundedCountUZS,
														).toLocaleString(
															"ru-RU",
															{
																minimumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
																maximumFractionDigits:
																	deviceSettings
																		.format
																		.format_sum
																		.max,
															},
														);
													}
												}
											} else {
												return matchingPrice.sale.toLocaleString(
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
												);
											}
										})()}
									</td>
									<td
										className={`py-0.5 px-5 border-b border-r text-right w-1/10 min-w-[120px] ${
											selectedCell.row === index &&
											selectedCell.col === 6
												? "bg-blue-500 text-white"
												: ""
										}`}
										onClick={(e) => {
											if (!isSelectionEnabled) {
												e.stopPropagation();
												setSelectedCell({
													row: index,
													col: 6,
												});
											}
										}}
									>
										<div className="truncate z-0">
											{product.stock?.[0]?.warehouse
												? warehouseData?.[
														product.stock[0]
															.warehouse
												  ] || "-"
												: "-"}
										</div>
									</td>
								</tr>
							))}
							{hasMore && (
								<tr ref={loadingRef}>
									<td
										colSpan={
											settingsDeviceData?.box === 1
												? "9"
												: "7"
										}
										className="py-2 text-center"
									>
										<div className="text-sm text-gray-500">
											Маҳсулотлар юкланмоқда...
										</div>
									</td>
								</tr>
							)}
						</>
					) : (
						<tr>
							<td
								colSpan={
									settingsDeviceData?.box === 1 ? "9" : "7"
								}
								className="py-3 text-center text-gray-500"
							>
								Маҳсулотлар топилмади.
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</CustomScroll>
	);
}

export default ProductsTable;

