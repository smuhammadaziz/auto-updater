import React, { useState, useEffect, useRef, useCallback } from "react";
import { FiTrash2 } from "react-icons/fi";
import nodeUrl from "../../../links";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

function SalesSoldProducts({
	lastAddedProductId,
	socket,
	products,
	setProducts,
	loading,
	setLoading,
	error,
	setError,
	selectedRowId,
	setSelectedRowId,
	scrollToSelectedRow,
	tableRef,
}) {
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [manualSelection, setManualSelection] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const selectedRowRef = useRef(null);
	const prevProductsRef = useRef([]);

	const [language] = useLang("uz");

	const handleRowClick = (productId) => {
		setSelectedRowId(productId);
		scrollToSelectedRow(productId);
	};

	const deleteAllProducts = async (product_id) => {
		const salesId = localStorage.getItem("sales_id");
		const ksbId = localStorage.getItem("ksbIdNumber");
		if (!salesId) {
			alert("Sales ID not found in local storage!");
			return;
		}

		try {
			const response = await fetch(
				`${nodeUrl}/api/delete/sales/product/${salesId}/${ksbId}/${product_id}`,
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

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedProduct(null);
	};

	const [warehouseData, setWarehouseData] = useState({});

	const settingsWarehouse = JSON.parse(
		localStorage.getItem("settingsWarehouse"),
	);

	const fetchWarehouseData = useCallback(async () => {
		if (!products || products.length === 0) {
			return; // No products, nothing to fetch
		}

		// 1. Collect unique warehouse IDs needed
		const uniqueWarehouseIds = [
			...new Set(
				products
					.map(
						(product) =>
							product?.product_info?.[0]?.stock?.[0]?.warehouse,
					)
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
	}, [products]); // Assuming device_id and ksbId don't change within component lifecycle

	useEffect(() => {
		fetchWarehouseData();
	}, [fetchWarehouseData]); // Depend on the memoized callback

	useEffect(() => {
		if (selectedRowId) {
			scrollToSelectedRow(selectedRowId);
			localStorage.setItem("selectedSoldProductId", selectedRowId);
		}
	}, [selectedRowId]);

	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));

	return (
		<>
			<div className="py-1 h-[34vh] relative z-0">
				<div className="bg-white shadow-md rounded-lg h-full flex flex-col">
					<div className="overflow-x-auto overflow-y-auto flex-grow">
						<table
							ref={tableRef}
							className="min-w-full bg-white border border-gray-200"
						>
							<thead className="sticky top-0 bg-gray-100 shadow-sm z-10">
								<tr className="text-gray-700 uppercase text-[10px] ">
									<th className="py-2 px-5 border-b border-r border-gray-200 text-center w-[500px]">
										{content[language].salesPage.soldName}
									</th>
									<th className="py-2 px-5 border-b border-r border-gray-200 text-center w-[50px]">
										{content[language].salesPage.soldCount}
									</th>
									<th className="py-2 px-5 border-b border-r border-gray-200 text-center w-[120px]">
										{content[language].salesPage.soldPrice}
									</th>
									<th className="py-2 px-5 border-b border-gray-200 text-center w-[120px]">
										{content[language].salesPage.soldSumma}
									</th>
								</tr>
							</thead>
							<tbody>
								{error ? (
									<tr>
										<td
											colSpan="4"
											className="py-3 text-center text-red-500"
										>
											Error: {error}
										</td>
									</tr>
								) : loading ? (
									<tr>
										<td
											colSpan="4"
											className="py-3 text-center text-gray-500"
										>
											Loading...
										</td>
									</tr>
								) : products.length > 0 ? (
									products.map((product) => (
										<tr
											key={product.id}
											ref={
												product.id === selectedRowId
													? selectedRowRef
													: null
											}
											data-id={product.id}
											className={`text-gray-800 text-sm group z-[1] relative cursor-pointer active:bg-gray-200 
												${
													selectedRowId === product.id
														? "bg-blue-500 text-white hover:bg-blue-600"
														: "hover:bg-gray-50"
												}`}
											onClick={() => {
												setSelectedRowId(product.id);
												scrollToSelectedRow(product.id);

												localStorage.setItem(
													"selectedSoldProductId",
													product.id,
												);
											}}
											onDoubleClick={() => {
												setSelectedProduct(product);
												setIsModalOpen(true);
											}}
										>
											<td
												className="py-1 px-5 border-b border-r border-gray-200 w-[60%]"
												title={product.product_name}
											>
												<div className="flex justify-between w-full">
													<span className="text-left">
														{product.product_name}
													</span>
													<span className="text-right text-sm">
														{
															warehouseData[
																product
																	.product_info[0]
																	.stock[0]
																	.warehouse
															]
														}
													</span>
												</div>
											</td>

											<td
												className="py-1 px-5 border-b border-r border-gray-200 text-center w-[10%]"
												title={product.soni}
											>
												{parseFloat(
													product.soni ?? 0,
												).toLocaleString("ru-RU", {
													minimumFractionDigits:
														deviceSettings.format
															.format_qty.max,
													maximumFractionDigits:
														deviceSettings.format
															.format_qty.max,
												})}
											</td>
											<td
												className="py-1 px-5 border-b border-r border-gray-200 text-center w-[120px]"
												title={product.narxi}
											>
												{(
													product.narxi ?? 0
												).toLocaleString("ru-RU", {
													minimumFractionDigits:
														deviceSettings.format
															.format_sum.max,
													maximumFractionDigits:
														deviceSettings.format
															.format_sum.max,
												})}
											</td>
											<td
												className="py-1 px-5 border-b border-gray-200 text-center w-[120px] relative"
												title={product.summa}
											>
												<span>
													{(
														product.summa ?? 0
													).toLocaleString("ru-RU", {
														minimumFractionDigits:
															deviceSettings
																.format
																.format_sum.max,
														maximumFractionDigits:
															deviceSettings
																.format
																.format_sum.max,
													})}
												</span>
												<div className="absolute right-0 top-0 h-full flex items-center opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
													<button
														onClick={(e) => {
															e.stopPropagation();
															deleteAllProducts(
																product.id,
															);
														}}
														className="flex items-center justify-center bg-red-500 text-white p-1 rounded-md px-2 hover:bg-red-700 focus:outline-none mr-2"
													>
														<FiTrash2 />
													</button>
												</div>
											</td>
										</tr>
									))
								) : (
									<tr>
										<td
											colSpan="4"
											className="py-3 text-center text-gray-500"
										>
											{
												content[language].salesPage
													.soldNoProduct
											}
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</>
	);
}

export default SalesSoldProducts;

