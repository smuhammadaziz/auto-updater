import React, { useState, useEffect, useCallback } from "react";
import { FaBuilding, FaUserAlt, FaRegEdit } from "react-icons/fa";
import { BsClock } from "react-icons/bs";
import { FaUsersLine } from "react-icons/fa6";
import { CiDiscount1 } from "react-icons/ci";
import {
	MdOutlineFormatListBulleted,
	MdCalendarToday,
	MdDelete,
	MdClose,
	MdFilterList,
	MdOutlineMoreVert,
} from "react-icons/md";
import { HiOutlineUserCircle } from "react-icons/hi2";
import { MdPendingActions } from "react-icons/md";
import { MdOutlineDoneAll } from "react-icons/md";
import { IoBasketOutline } from "react-icons/io5";
import { MdOutlineRestore } from "react-icons/md";
import {
	HiOutlineClipboardDocumentCheck,
	HiOutlineDocumentMinus,
	HiOutlineDocumentCheck,
	HiOutlineDocument,
} from "react-icons/hi2";
import { LuClock4, LuClockAlert } from "react-icons/lu";
import { IoInformation } from "react-icons/io5";
import { FiPrinter, FiChevronDown, FiEye } from "react-icons/fi";
import { TbBasketExclamation } from "react-icons/tb";
import { RiDiscountPercentLine } from "react-icons/ri";
import { BiSearch } from "react-icons/bi";
import { GoAlert } from "react-icons/go";
import { ImExit } from "react-icons/im";
import { FaTimes } from "react-icons/fa";
import {
	BsBasket3,
	BsCreditCard2Back,
	BsBarChart,
	BsThreeDots,
} from "react-icons/bs";

import nodeUrl from "../../links";
import {
	MdOutlineShoppingCart,
	MdAccessTime,
	MdPriceCheck,
	MdPersonOutline,
	MdOutlineInfo,
	MdPayment,
	MdInventory,
	MdWarehouse,
	MdSearch,
} from "react-icons/md";

import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

import moment from "moment";
import "moment/locale/ru";
import { ImInfo } from "react-icons/im";

moment.locale("ru");

function ProcessSalesComponent({
	productData,
	setIsListModalOpen,
	socket,
	handleClick,
}) {
	const [language] = useLang("uz");

	const [selectedRowId, setSelectedRowId] = useState(null);
	const [searchTerm, setSearchTerm] = useState("");
	const [showCalendar, setShowCalendar] = useState(false);
	const [selectedDate, setSelectedDate] = useState(null);
	const [statusFilters, setStatusFilters] = useState({
		process: false,
		delivered: false,
		falseDelivered: false,
	});
	const [showFilters, setShowFilters] = useState(false);
	const [viewMode, setViewMode] = useState("table");
	const [showActionsMenu, setShowActionsMenu] = useState(null);

	const [currencyData, setCurrencyData] = useState({});

	const device_id = localStorage.getItem("device_id");
	const ksbIdNumber = localStorage.getItem("ksbIdNumber");

	const settingsDeviceInfoData = JSON.parse(
		localStorage.getItem("settingsDevice"),
	);

	useEffect(() => {
		const savedViewMode = localStorage.getItem("viewModeProcess");
		if (savedViewMode) {
			setViewMode(savedViewMode);
		}
	}, []);

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

	const fetchCurrencyData = useCallback(async () => {
		if (!productData || productData.length === 0) {
			return; // No products, nothing to fetch
		}

		// 1. Collect unique currency IDs needed
		const uniqueCurrencyIds = [
			...new Set(
				productData
					.map((product) => product?.mainCurrency)
					.filter((id) => id != null), // Filter out null/undefined IDs
			),
		];

		if (uniqueCurrencyIds.length === 0) {
			return; // No valid currency IDs found
		}

		// 2. Identify IDs that haven't been fetched yet
		const currenciesToFetch = uniqueCurrencyIds.filter(
			(id) => !(id in currencyData), // Check against existing currencyData state
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
						// Assuming data is an array like [{id: 'USD', name: 'US Dollar'}] even for a single ID
						if (data && data.length > 0) {
							// Assuming the API returns the ID used in the fetch as part of the response,
							// or we use the currencyId from the map scope. Let's use currencyId.
							return { [currencyId]: data[0]?.name || "-" };
						}
						console.warn(
							`No data returned for currency ID: ${currencyId}`,
						);
						return { [currencyId]: "-" }; // Store placeholder even if fetch fails or returns no data
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

			// 4. Filter out null results (if any) and combine successful/placeholder ones
			const newCurrencyData = results.reduce((acc, result) => {
				if (result) {
					return { ...acc, ...result };
				}
				return acc;
			}, {});

			// 5. Update state ONCE with all new data found
			if (Object.keys(newCurrencyData).length > 0) {
				setCurrencyData((prev) => ({ ...prev, ...newCurrencyData }));
			}
		} catch (error) {
			console.error(
				"Error fetching currency data with Promise.all",
				error,
			);
		}
	}, [productData, device_id, ksbIdNumber]);

	useEffect(() => {
		fetchCurrencyData();
	}, [fetchCurrencyData]);

	const [warehouseData, setWarehouseData] = useState({});

	const fetchWarehouseData = useCallback(async () => {
		if (!productData || productData.length === 0) {
			return; // No products, nothing to fetch
		}

		// 1. Collect unique warehouse IDs needed
		const uniqueWarehouseIds = [
			...new Set(
				productData
					.map((product) => product?.mainWarehouse) // Use mainWarehouse
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
		// device_id and ksbIdNumber are already defined outside useCallback
		try {
			const promises = warehousesToFetch.map((warehouseId) =>
				fetch(
					`${nodeUrl}/api/get/warehouse/data/${device_id}/${ksbIdNumber}/${warehouseId}`,
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
	}, [productData, device_id, ksbIdNumber]);

	useEffect(() => {
		fetchWarehouseData();
	}, [fetchWarehouseData]);

	const getFilteredData = () => {
		return productData.filter((sale) => {
			const searchMatch =
				sale.client_name
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				warehouseData[sale.mainWarehouse]
					?.toLowerCase()
					.includes(searchTerm.toLowerCase()) ||
				sale.summa?.toString().includes(searchTerm);

			const dateMatch = selectedDate
				? moment(sale.date).isSame(moment(selectedDate), "day")
				: true;

			const statusMatch =
				(!statusFilters.process &&
					!statusFilters.delivered &&
					!statusFilters.falseDelivered) ||
				(statusFilters.process && sale.status === "process") ||
				(statusFilters.delivered && sale.status === "delivered") ||
				(statusFilters.falseDelivered &&
					sale.status === "falseDelivered");

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

	const getStatusBadge = (status) => {
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
					<div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
						<HiOutlineDocumentMinus className="text-sm" />
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
		const handleClickOutside = () => {
			setShowActionsMenu(null);
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const [isExitModalOpen, setIsExitModalOpen] = useState(false);
	const [isContinueModalOpen, setIsContinueModalOpen] = useState(false);

	const deleteOneSales = async (salesId) => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/delete/one/sales/${salesId}`,
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

	return (
		<div className="fixed inset-0 bg-black/70 flex items-center text-black justify-center z-40 backdrop-blur-sm">
			<div className="bg-white rounded-xl w-full max-w-[75vw] h-[90vh] overflow-hidden flex flex-col shadow-2xl">
				{/* Header */}
				<div className="px-6 py-4 border-b flex justify-between items-center bg-white">
					<div className="flex items-center gap-3">
						<div className="bg-indigo-50 p-2 rounded-lg">
							<TbBasketExclamation className="text-2xl text-indigo-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold text-gray-800">
								{content[language].salesPage.sidebarProcess}
							</h2>
							<p className="text-sm text-gray-500">
								{content[language].salesPage.headerListSubText}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3">
						<button
							className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
							onClick={() => {
								const newViewMode =
									viewMode === "table" ? "card" : "table";
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
								<MdOutlineFormatListBulleted className="text-xl" />
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

				<div className="p-5 bg-white border-b">
					<div className="flex flex-wrap items-center gap-3">
						<div className="relative flex-grow max-w-md">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<BiSearch className="text-gray-400" />
							</div>
							<input
								type="text"
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								placeholder={
									content[language].salesPage.headerListSearch
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
									<Calendar
										onChange={handleDateSelect}
										value={selectedDate}
										className="border border-gray-200 rounded-lg shadow-xl"
									/>
								</div>
							)}
						</div>

						{(searchTerm ||
							selectedDate ||
							Object.values(statusFilters).some(Boolean)) && (
							<button
								onClick={clearAllFilters}
								className="px-4 py-2.5 rounded-lg text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all"
							>
								Сбросить фильтры
							</button>
						)}

						<div className="ml-auto text-sm text-gray-500 font-medium">
							{content[language].salesPage.headerListFound}{" "}
							<span className="text-gray-900 font-semibold">
								{filteredData.length}
							</span>
						</div>
					</div>
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
												Дата
											</th>
											<th
												scope="col"
												className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
											>
												Склад
											</th>
											<th
												scope="col"
												className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
											>
												Сумма
											</th>
											{/* <th
												scope="col"
												className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[200px]"
											>
												Автор
											</th> */}
											<th
												scope="col"
												className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-[100px]"
											>
												Действия
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
													// 	openDetailModal(sale)
													// }
												>
													<td className="px-6 py-4">
														<div className="flex items-center">
															{getStatusBadge(
																sale.status,
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
																			"HH:mm",
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
																	{!(
																		sale.mainWarehouse in
																		warehouseData
																	) ? (
																		<div className="h-4 bg-gray-200 rounded-md animate-pulse w-24"></div>
																	) : (
																		warehouseData[
																			sale
																				.mainWarehouse
																		] || "-"
																	)}
																</div>
																{/* <div className="text-xs text-gray-500">
																	Основной
																</div> */}
															</div>
														</div>
													</td>
													<td className="px-6 py-4">
														<div className="text-sm font-medium text-gray-900">
															{new Intl.NumberFormat(
																"ru-RU",
																{
																	style: "decimal",
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
															).format(
																sale.summa,
															)}
														</div>
														<div className="text-xs text-gray-500">
															{!(
																sale.mainCurrency in
																currencyData
															) ? (
																<div className="h-3 bg-gray-200 rounded-md animate-pulse w-8 inline-block ml-1"></div>
															) : (
																currencyData[
																	sale
																		.mainCurrency
																] ?? "-"
															)}
														</div>
													</td>
													{/* <td className="px-6 py-4">
														<div className="flex items-center">
															<div className="">
																<div className="text-sm font-medium text-gray-900">
																	Menedger
																</div>
															</div>
														</div>
													</td> */}
													<td className="px-6 py-4">
														<div className="flex items-center justify-center space-x-1">
															<button
																className="p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors"
																// onClick={(
																// 	e,
																// ) => {
																// 	handleClick(
																// 		sale.id,
																// 	);
																// }}
																onClick={() =>
																	setIsContinueModalOpen(
																		true,
																	)
																}
															>
																<FaRegEdit />
															</button>
															<div>
																<button
																	className="p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
																	onClick={() =>
																		setIsExitModalOpen(
																			true,
																		)
																	}
																>
																	<MdDelete />
																</button>
															</div>
															<div className="">
																{/* <button
																	className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
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
																		<button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2">
																			<FiEye className="text-gray-500" />
																			Просмотреть
																			детали
																		</button>
																		<button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2">
																			<FiPrinter className="text-gray-500" />
																			Печать
																		</button>
																		<button className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2">
																			<FaRegEdit className="text-gray-500" />
																			Давом
																			эттириш
																		</button>
																		<button
																			onClick={(
																				e,
																			) => {
																				e.preventDefault(); // Prevent default behavior
																				e.stopPropagation(); // Stop event propagation
																				console.log(
																					"Delete button clicked",
																				);
																				setIsExitModalOpen(
																					true,
																				);
																			}}
																			className="w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
																		>
																			<MdDelete className="text-gray-500 text-lg" />
																			Ўчириш
																		</button>
																	</div>
																)} */}
															</div>
														</div>
													</td>
												</tr>
											))}
									</tbody>
								</table>
							</div>
						) : (
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{[...filteredData].reverse().map((sale) => (
									<div
										key={sale.id}
										className={`bg-white rounded-xl border ${
											selectedRowId === sale.id
												? "border-indigo-300 ring-2 ring-indigo-100"
												: "border-gray-200 hover:border-indigo-200"
										} shadow-sm overflow-hidden transition-all cursor-pointer group`}
										onClick={() =>
											setSelectedRowId(sale.id)
										}
									>
										<div className="p-4 flex justify-between border-b border-gray-100">
											<div className="flex items-center gap-2">
												<div className="flex-shrink-0 h-10 w-10 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
													<IoBasketOutline />
												</div>
												<div>
													<div className="font-medium text-gray-900">
														{!(
															sale.mainWarehouse in
															warehouseData
														) ? (
															<div className="h-4 bg-gray-200 rounded-md animate-pulse w-20"></div>
														) : (
															warehouseData[
																sale
																	.mainWarehouse
															] || "-"
														)}
													</div>
													<div className="text-xs text-gray-500">
														Основной
													</div>
												</div>
											</div>
											<div className="flex items-center">
												{getStatusBadge(sale.status)}
											</div>
										</div>

										<div className="p-4">
											<div className="flex justify-between mb-3">
												<div className="text-xs text-gray-500">
													Дата:
												</div>
												<div className="text-sm">
													{moment(sale.date).isSame(
														moment(),
														"day",
													)
														? moment(
																sale.date,
														  ).format("HH:mm")
														: moment(
																sale.date,
														  ).format(
																"DD.MM.YYYY HH:mm",
														  )}
												</div>
											</div>

											<div className="flex justify-between mb-3">
												<div className="text-xs text-gray-500">
													Сумма:
												</div>
												<div className="text-sm font-medium">
													{new Intl.NumberFormat(
														"ru-RU",
														{
															style: "decimal",
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
													).format(sale.summa)}{" "}
													{!(
														sale.mainCurrency in
														currencyData
													) ? (
														<div className="h-3 bg-gray-200 rounded-md animate-pulse w-8 inline-block ml-1"></div>
													) : (
														currencyData[
															sale.mainCurrency
														] ?? "-"
													)}
												</div>
											</div>

											{/* <div className="flex justify-between">
												<div className="text-xs text-gray-500">
													Автор:
												</div>
												<div className="text-sm">
													Menedger
												</div>
											</div> */}
										</div>

										<div className="bg-gray-50 p-3 flex justify-end gap-2 border-t border-gray-100">
											<button
												onClick={() =>
													setIsContinueModalOpen(true)
												}
												className="p-1.5 bg-indigo-100 text-indigo-600 hover:bg-indigo-200 rounded-lg transition-colors"
											>
												<FaRegEdit />
											</button>
											<button
												onClick={() =>
													setIsExitModalOpen(true)
												}
												className="p-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 rounded-lg transition-colors"
											>
												<MdDelete />
											</button>
											{/* <button className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">
												<BsThreeDots />
											</button> */}
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

			{isContinueModalOpen && (
				<div className="fixed inset-0 z-10 bg-black bg-opacity-50 backdrop-blur-xs flex items-center justify-center p-4">
					<div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 p-6 space-y-6 transform transition-all duration-300 ease-in-out">
						<div className="text-center">
							<h2 className="text-2xl font-bold text-gray-800 mb-5 flex justify-center">
								<MdOutlineRestore className="text-blue-600 text-6xl" />
							</h2>
							<p className="text-black text-lg mb-6">
								Танланган савдони давом эттирмоқчимисиз?
							</p>
						</div>

						<div className="flex space-x-4">
							<button
								onClick={() => {
									handleClick(selectedRowId);
									setIsContinueModalOpen(false);
									localStorage.setItem(
										"isSaleContinue",
										true,
									);
								}}
								className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
							>
								Ҳа
							</button>
							<button
								onClick={() => setIsContinueModalOpen(false)}
								className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
							>
								Йўқ
							</button>
						</div>
					</div>
				</div>
			)}

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
								onClick={() => setIsExitModalOpen(false)}
								className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 flex items-center justify-center py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-gray-400"
							>
								Йўқ
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default ProcessSalesComponent;

