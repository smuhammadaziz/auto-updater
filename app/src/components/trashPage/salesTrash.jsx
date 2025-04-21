import React, { useState, useEffect, useCallback } from "react";
import nodeUrl from "../../links";
import moment from "moment";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

import { GoAlert } from "react-icons/go";

function SalesTrashComponent({ socket }) {
	const [sales, setSales] = useState([]);
	const [language] = useLang("uz");
	const [isExitModalOpen, setIsExitModalOpen] = useState(false);
	const [selectedRowId, setSelectedRowId] = useState(null);

	const ksbIdNumber = localStorage.getItem("ksbIdNumber");
	const device_id = localStorage.getItem("device_id");

	useEffect(() => {
		fetchProducts();

		const updateHandler = () => fetchProducts();
		socket.on("deleteOneTrashSale", updateHandler);

		return () => {
			socket.off("deleteOneTrashSale", updateHandler);
		};
	}, []);

	const fetchProducts = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/trash/sales/${ksbIdNumber}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch products");
			}
			const data = await response.json();
			setSales(data);

			// console.log(data);
		} catch (err) {
			console.log(err);
		}
	};

	const deleteOneSales = async (salesId) => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/delete/trash/sales/${salesId}`,
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

	const [currencyData, setCurrencyData] = useState({});

	const fetchCurrencyData = useCallback(async () => {
		for (const product of sales) {
			if (product.details && !currencyData[product.details]) {
				try {
					const response = await fetch(
						`${nodeUrl}/api/get/currency/data/${device_id}/${ksbIdNumber}/${product.details[0].currency}`,
					);
					const data = await response.json();

					setCurrencyData((prev) => ({
						...prev,
						[product.details[0].currency]: data[0]?.name || "-",
					}));
				} catch (error) {
					console.error("Failed to fetch currency data", error);
					setCurrencyData((prev) => ({
						...prev,
						[product.details[0].currency]: "-",
					}));
				}
			}
		}
	}, [sales]);

	useEffect(() => {
		fetchCurrencyData();
	}, [fetchCurrencyData]);

	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));

	return (
		<div className="h-[80vh]">
			<div className="bg-white rounded-xl shadow-lg overflow-hidden h-full flex flex-col">
				<div className="p-6 border-b">
					<h2 className="text-2xl font-semibold text-gray-800">
						{content[language].trashSales.deletedSales}
					</h2>
					<p className="text-gray-500 mt-1">
						{content[language].trashSales.deletedSalesText}
					</p>
				</div>

				<div className="flex-1 overflow-auto p-6">
					<table className="w-full table-fixed divide-y divide-gray-200">
						<thead className="bg-gray-50 sticky top-0">
							<tr>
								<th className="w-24 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{content[language].trashSales.status}
								</th>
								<th className="w-48 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{content[language].trashSales.client}
								</th>
								<th className="w-32 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{content[language].trashSales.totalPrice}
								</th>
								<th className="w-40 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{content[language].trashSales.seller}
								</th>
								<th className="w-44 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{content[language].trashSales.deletedAt}
								</th>
								<th className="w-64 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{content[language].trashSales.error}
								</th>
								<th className="w-20 px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									{content[language].trashSales.actions}
								</th>
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{sales.map((item) => (
								<tr key={item.id} className="hover:bg-gray-50">
									<td className="px-1 py-4 whitespace-nowrap">
										<span
											className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full`}
										>
											{item.status === "process" ? (
												<p
													className={` bg-orange-500 px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
												>
													Кутилмоқда
												</p>
											) : item.status === "problem" ? (
												<p
													className={`bg-red-500 px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
												>
													Хатолик
												</p>
											) : item.status === "delivered" ||
											  item.status ===
													"falseDelivered" ? (
												<p
													className={`bg-green-500 px-3 py-1 w-[100px] rounded-full text-xs font-medium text-white text-center`}
												>
													Юборилди
												</p>
											) : (
												item.status
											)}
										</span>
									</td>
									<td className="px-3 py-4">
										<div
											className="text-sm text-gray-900 truncate"
											title={item.client_name}
										>
											{item.client_name}
										</div>
									</td>
									<td className="px-3 py-4">
										<div
											className="text-sm font-medium text-gray-900 truncate"
											title={`${item.total_price}`}
										>
											{parseFloat(
												item.total_price,
											).toLocaleString("ru-RU", {
												minimumFractionDigits:
													deviceSettings.format
														.format_sum.max,
												maximumFractionDigits:
													deviceSettings.format
														.format_sum.max,
											})}{" "}
											{
												currencyData[
													item.details[0].currency
												]
											}
										</div>
									</td>
									<td className="px-3 py-4">
										<div
											className="text-sm text-gray-500 truncate"
											title={item.seller}
										>
											{item.seller}
										</div>
									</td>
									<td className="px-3 py-4">
										<div
											className="text-sm text-gray-500 truncate"
											title={moment(
												item.deleted_at,
											).format("DD.MM.YYYY HH:mm")}
										>
											{moment(item.deleted_at).format(
												"DD.MM.YYYY HH:mm",
											)}
										</div>
									</td>
									<td className="px-3 py-4">
										<div
											className="text-sm truncate"
											title={item.errorMessage || "-"}
										>
											{item.errorMessage ? (
												<span className="text-red-600">
													{item.errorMessage}
												</span>
											) : (
												<span>-</span>
											)}
										</div>
									</td>
									<td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
										<button
											onClick={() => {
												setIsExitModalOpen(true);
												setSelectedRowId(item.id);
											}}
											className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-50 transition-colors"
											aria-label="Delete item"
										>
											<svg
												className="w-5 h-5"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
												xmlns="http://www.w3.org/2000/svg"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth="2"
													d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
												></path>
											</svg>
										</button>
									</td>
								</tr>
							))}
							{isExitModalOpen && (
								<div className="fixed inset-0 z-10 bg-black bg-opacity-50 backdrop-blur-xs flex items-center justify-center p-4">
									<div className="bg-white w-full max-w-md rounded-2xl border border-gray-200 p-6 space-y-6 transform transition-all duration-300 ease-in-out">
										<div className="text-center">
											<h2 className="text-2xl font-bold text-gray-800 mb-5 flex justify-center">
												<GoAlert className="text-red-600 text-6xl" />
											</h2>
											<p className="text-black text-lg mb-6">
												Танланган савдони
												ўчирмоқчимисиз?
											</p>
										</div>

										<div className="flex space-x-4">
											<button
												onClick={() => {
													deleteOneSales(
														selectedRowId,
													);
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
						</tbody>
					</table>
				</div>

				{/* Empty state */}
				{sales.length === 0 && (
					<div className="flex-1 flex items-center justify-center p-6">
						<div className="text-center">
							<svg
								className="mx-auto h-12 w-12 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth="1"
									d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
								></path>
							</svg>
							<h3 className="mt-2 text-sm font-medium text-gray-900">
								{content[language].trashSales.noTrashSalesFound}
							</h3>
							{/* <p className="mt-1 text-sm text-gray-500">
								No items in the trash at the moment
							</p> */}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default SalesTrashComponent;

