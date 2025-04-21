import React, { useState, useEffect, useCallback, useRef } from "react";
import { MdClear } from "react-icons/md";
import nodeUrl from "../../../links";

function ProductModal({ product, onClose }) {
	const [quantity, setQuantity] = useState(product?.soni || 0);
	const [customPrice, setCustomPrice] = useState(product?.narxi || null);
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [showEmpty, setShowEmpty] = useState(false);
	const [warehouseData, setWarehouseData] = useState({});

	const ksb_id = localStorage.getItem("ksbIdNumber");
	const sales_id = localStorage.getItem("sales_id");
	const device_id = localStorage.getItem("device_id");
	const priceTypeKey = localStorage.getItem("priceTypeKey");

	const settingsWarehouse = JSON.parse(
		localStorage.getItem("settingsWarehouse"),
	);

	const fetchWarehouseData = useCallback(async () => {
		if (product.product_info[0].stock[0].warehouse) {
			const deviceId = localStorage.getItem("device_id");
			const ksbId = localStorage.getItem("ksbIdNumber");

			try {
				if (
					!Array.isArray(settingsWarehouse) ||
					settingsWarehouse.length === 0
				) {
					throw new Error("Invalid settingsWarehouse data");
				}

				const response = await fetch(
					`${nodeUrl}/api/get/warehouse/data/${deviceId}/${ksbId}/${product.product_info[0].stock[0].warehouse}`,
				);

				const apiData = await response.json();

				const warehouseData = settingsWarehouse.reduce(
					(acc, warehouseId) => {
						const matchedWarehouse = apiData.find(
							(item) => item.item_id === warehouseId,
						);

						acc[warehouseId] = matchedWarehouse
							? matchedWarehouse.name
							: "-";
						return acc;
					},
					{},
				);

				setWarehouseData((prev) => ({ ...prev, ...warehouseData }));
			} catch (error) {
				console.error(
					"Error fetching or processing warehouse data",
					error,
				);
			}
		}
	}, [warehouseData]);

	useEffect(() => {
		fetchWarehouseData();
	}, [fetchWarehouseData]);

	const currencyKeyData = localStorage.getItem("currencyKey");
	const priceTypeKeyData = localStorage.getItem("priceTypeKey");

	const currencyRateDataKey = JSON.parse(
		localStorage.getItem("currency_rate") || "{}",
	);

	const matchingPrice = product.product_info[0].price.find(
		(price) => price.type === priceTypeKeyData,
	);

	if (!matchingPrice) {
		return "-";
	}

	const convertPrice = (originalPrice) => {
		if (currencyKeyData == product.product_info[0].currency) {
			return originalPrice;
		} else {
			if (currencyKeyData == "e51e4ee5-d689-11e7-b79f-00ac1948df3a") {
				return originalPrice / currencyRateDataKey.usd;
			} else if (
				currencyKeyData == "e51e4ee6-d689-11e7-b79f-00ac1948df3a"
			) {
				return originalPrice * currencyRateDataKey.usd;
			} else {
				return originalPrice;
			}
		}
	};

	const convertedPrice =
		customPrice !== null ? customPrice : convertPrice(matchingPrice.sale);

	const totalPrice = Number(quantity) * Number(convertedPrice);

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (quantity > product.product_info[0].stock[0].qty) {
			setShowErrorModal(true);
			return;
		}

		if (totalPrice === 0) {
			setShowEmpty(true);
			return;
		}

		let productPriceType = 0;

		const matchedPrice = product.product_info[0].price.find(
			(item) => item.type === priceTypeKey,
		);

		if (matchedPrice) {
			productPriceType = matchedPrice.sale;
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
				onClose();
			} else {
				console.error("Failed to submit data to the API");
			}
		} catch (error) {
			console.error("Error submitting the sell data:", error);
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

	const handlePriceFocus = (e) => {
		e.target.value = "";
		setCustomPrice(null);
	};

	const handleQuantityChange = (e) => {
		const value = e.target.value;
		if (!isNaN(value)) {
			setQuantity(value);
		}
	};

	const handlePriceChange = (e) => {
		const value = e.target.value;
		if (!isNaN(value)) {
			setCustomPrice(Number(value));
		}
	};

	const [changePriceValue, setChangePriceValue] = useState(() => {
		const savedValue = localStorage.getItem("changePriceValue");
		return savedValue === "true";
	});

	useEffect(() => {
		localStorage.setItem("changePriceValue", changePriceValue);
	}, [changePriceValue]);

	return (
		<>
			<div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
				<div className="bg-white w-[730px] rounded-xl shadow-2xl relative transform transition-all">
					<div className="p-6">
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="grid grid-cols-1 gap-2">
								<div className="bg-gray-50 px-4 py-2 rounded-lg">
									<label className="block text-sm font-medium text-gray-700 mb-0.5">
										Товар
									</label>
									<input
										type="text"
										value={product.product_name}
										readOnly
										className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
									/>
								</div>

								<div className="grid grid-cols-12 gap-2">
									<div className="bg-gray-50 px-4 py-2 col-span-9 rounded-lg">
										<label className="block text-sm font-medium text-gray-700 mb-0.5">
											Склад
										</label>
										<input
											type="text"
											value={
												warehouseData[
													product.product_info[0]
														.stock[0].warehouse
												]
											}
											readOnly
											className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
										/>
									</div>
									<div className="bg-gray-50 px-4 col-span-3 py-2 rounded-lg">
										<label className="block text-sm font-medium text-gray-700 mb-0.5">
											Остатка
										</label>
										<input
											type="text"
											value={
												product.product_info[0].stock[0]
													?.qty
											}
											readOnly
											className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
										/>
									</div>
								</div>

								<div className="flex justify-between ">
									<div className="">
										<div className="bg-gray-50 px-4 py-2 rounded-lg">
											<label className="block text-sm font-medium text-gray-700 mb-0.5">
												Сони
											</label>
											<input
												type="number"
												value={quantity}
												onFocus={handleFocus}
												onBlur={handleBlur}
												onChange={handleQuantityChange}
												className="w-full px-3 py-4 bg-white text-xl border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
											/>
										</div>
									</div>

									<div>
										<div className="bg-gray-50 px-4 py-2 rounded-lg">
											<label className="block text-sm font-medium text-gray-700 mb-0.5">
												Цена
											</label>
											<input
												type="text"
												value={
													customPrice !== null
														? customPrice
														: convertedPrice
												}
												onFocus={handlePriceFocus}
												onChange={handlePriceChange}
												className="w-full px-3 py-4 bg-white text-xl border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
											/>
										</div>
										<div className="bg-gray-50 px-4 py-2 mt-3 rounded-lg">
											<input
												type="text"
												value={product.summa}
												readOnly
												className="w-full px-3 py-4 bg-white text-2xl font-semibold border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
											/>
										</div>
									</div>
								</div>
							</div>

							<div className="flex justify-end pt-4">
								<button
									type="submit"
									className="px-12 py-2.5 bg-green-600 text-white text-lg font-medium rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200"
								>
									OK
								</button>
								<button
									onClick={onClose}
									className="px-6 py-2 ml-5 bg-red-600 text-white text-lg font-medium rounded-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
								>
									Отмена
								</button>
							</div>
						</form>
					</div>
				</div>
			</div>

			{showErrorModal && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-[100]">
					<div className="bg-white w-[400px] rounded-xl shadow-2xl relative">
						<div className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-bold text-gray-800">
									Хатолик
								</h2>
								<button
									onClick={() => setShowErrorModal(false)}
									className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
								>
									<MdClear
										size={24}
										className="text-gray-500"
									/>
								</button>
							</div>
							<p className="text-base text-red-500 mb-4">
								Сиз мавжуд захирадан каттароқ миқдорни
								киритдингиз.
							</p>
							<div className="flex justify-end">
								<button
									onClick={() => setShowErrorModal(false)}
									className="px-5 py-2 bg-red-600 text-white text-lg font-medium rounded-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
								>
									OK
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			{showEmpty && (
				<div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-[100]">
					<div className="bg-white w-[400px] rounded-xl shadow-2xl relative">
						<div className="p-6">
							<div className="flex justify-between items-center mb-4">
								<h2 className="text-xl font-bold text-gray-800">
									Хатолик
								</h2>
								<button
									onClick={() => setShowEmpty(false)}
									className="p-1.5 hover:bg-gray-100 rounded-full transition-colors duration-200"
								>
									<MdClear
										size={24}
										className="text-gray-500"
									/>
								</button>
							</div>
							<p className="text-base text-red-500 mb-4">
								Маҳсулот сонини киритишингиз керак
							</p>
							<div className="flex justify-end">
								<button
									onClick={() => setShowEmpty(false)}
									className="px-5 py-2 bg-red-600 text-white text-lg font-medium rounded-lg hover:bg-red-700 transform hover:scale-105 transition-all duration-200"
								>
									OK
								</button>
							</div>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default ProductModal;

