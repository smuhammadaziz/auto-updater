import React, { useState, useEffect, useCallback } from "react";
import { BiBarcode } from "react-icons/bi";

import nodeUrl from "../../../links";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

const ProductViewDetails = ({ product }) => {
	const [language] = useLang("uz");

	const menuItems = [
		{ key: "Main", label: content[language].product.main },
		{ key: "Stock", label: content[language].product.stock },
		{ key: "Price", label: content[language].product.price },
		{ key: "Barcodes", label: content[language].product.barcodes },
	];

	const [activeMenu, setActiveMenu] = useState(menuItems[0].key);
	const [currencyName, setCurrencyName] = useState("");
	const [symbolName, setSymbolName] = useState("");

	const deviceId = localStorage.getItem("device_id");
	const ksbIdNumber = localStorage.getItem("ksbIdNumber");

	const [names, setNames] = useState({});
	const [warehouseNames, setWarehouseNames] = useState({});

	const currencyKeyValue = localStorage.getItem("currencyKey");

	const priceKeyValue = localStorage.getItem("priceTypeKey");

	const falseCurrencyBooleans = localStorage.getItem("falseCurrencyBoolean");

	const matchingProductByCurrency = localStorage.getItem(
		"matchingProductByCurrency",
	);

	const convertPrice = (originalPrice) => {
		if (
			matchingProductByCurrency == "0" ||
			matchingProductByCurrency == "false"
		) {
			return falseCurrencyBooleans;
		} else if (
			matchingProductByCurrency == "1" ||
			matchingProductByCurrency == "true"
		) {
			return originalPrice;
		} else {
			return originalPrice;
		}
	};

	const fetchData = useCallback(
		async (type, id, setter, errorSetter) => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/${type}/data/${deviceId}/${ksbIdNumber}/${id}`,
				);
				const data = await response.json();
				const name = data?.[0]?.name || `-`;
				setter(name);
			} catch (error) {
				console.error(`Error fetching ${type} data`, error);
				errorSetter(`Error loading ${type}`);
			}
		},
		[deviceId, ksbIdNumber],
	);

	// ✅ Move this below hooks

	const fetchPriceName = async (item_id) => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/price/data/${deviceId}/${ksbIdNumber}/${item_id}`,
			);
			const data = await response.json();
			return data[0]?.name;
		} catch (err) {
			console.error("Error fetching price name:", err);
			return null;
		}
	};

	useEffect(() => {
		const fetchAllNames = async () => {
			const nameMap = {};
			await Promise.all(
				product.price.map(async (item) => {
					const name = await fetchPriceName(item.type);
					if (name) {
						nameMap[item.type] = name;
					}
				}),
			);
			setNames(nameMap);
		};
		fetchAllNames();
	}, []);

	const fetchStockData = async (item_id) => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/warehouse/data/${deviceId}/${ksbIdNumber}/${item_id}`,
			);
			const data = await response.json();
			return data[0]?.name;
		} catch (err) {
			console.error("Error fetching price name:", err);
			return null;
		}
	};

	useEffect(() => {
		if (!product?.stock) return;

		const fetchAllNames = async () => {
			const nameMap = {};
			for (const item of product.stock) {
				const name = await fetchStockData(item.warehouse);
				if (name) {
					nameMap[item.warehouse] = name;
				}
			}
			setWarehouseNames(nameMap);
		};

		fetchAllNames();
	}, []);

	useEffect(() => {
		if (!product.currency) return;
		fetchData(
			"currency",
			convertPrice(product.currency),
			setCurrencyName,
			setCurrencyName,
		);
	}, [product.currency, fetchData]);

	useEffect(() => {
		if (!product.symbol) return;
		fetchData("symbol", product.symbol, setSymbolName, setSymbolName);
	}, [product.symbol, fetchData]);

	const fields = [
		{ key: "name", label: content[language].product.name },
		{ key: "symbol", label: content[language].product.symbol },
		{ key: "currency", label: content[language].product.currency },
		{ key: "type", label: content[language].product.type },
		{ key: "box", label: content[language].product.box },
		{ key: "article", label: content[language].product.article },
	];

	const fieldsToShow = fields.filter((field) =>
		["name", "symbol", "currency", "type", "box"].includes(field.key),
	);

	const renderMainContent = () => {
		let displayFields = [...fieldsToShow];

		if (product.article) {
			const articleField = fields.find((f) => f.key === "article");
			displayFields.splice(3, 0, articleField);
		}
		return (
			<div className="grid grid-cols-2 gap-4">
				{displayFields.map((field) => {
					if (!product.hasOwnProperty(field.key)) return null;

					const displayValue =
						field.key === "currency"
							? currencyName
							: field.key === "symbol"
							? symbolName
							: product[field.key];

					return (
						<div key={field.key} className="relative group">
							<label
								htmlFor={field.key}
								className="block mb-1 text-sm font-medium first-letter:uppercase lowercase text-gray-600"
							>
								{field.label}
							</label>
							<input
								id={field.key}
								type="text"
								value={String(displayValue || "")}
								disabled
								className="w-full px-4 py-3 bg-gray-50 border border-gray-200 
                                rounded-md text-gray-700 cursor-text focus:outline-none 
                                focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
							/>
						</div>
					);
				})}
			</div>
		);
	};

	const renderStockContent = () => (
		<table className="min-w-full divide-y divide-gray-200">
			<thead className="bg-gray-50">
				<tr>
					<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						{content[language].product.stock}
					</th>
					<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						{content[language].product.quantity}
					</th>
				</tr>
			</thead>
			<tbody className="bg-white divide-y divide-gray-200">
				{product.stock.map((item, index) => (
					<tr key={index} className="hover:bg-gray-50">
						<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
							{warehouseNames[item.warehouse] ||
								content[language].product.loading}
						</td>
						<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
							{item.qty}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);

	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));

	const renderPriceContent = () => (
		<table className="min-w-full divide-y divide-gray-200">
			<thead className="bg-gray-50">
				<tr>
					<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						{content[language].product.price}
					</th>
					<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						{content[language].product.sale}
					</th>
					<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
						{content[language].product.currency}
					</th>
				</tr>
			</thead>
			<tbody className="bg-white divide-y divide-gray-200">
				{product.price.map((item, index) => (
					<tr key={index} className="hover:bg-gray-50">
						<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
							{names[item.type] ||
								content[language].product.loading}
						</td>
						<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
							{new Intl.NumberFormat("ru-RU", {
								minimumFractionDigits:
									deviceSettings.format.format_sum.max,
								maximumFractionDigits:
									deviceSettings.format.format_sum.max,
							}).format(Number(item.sale))}
						</td>
						<td className="px-6 py-4 whitespace-nowrap text-sm text-black">
							{currencyName}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);

	const renderBarcodesContent = () => (
		<div className="space-y-2">
			{product.barcodes && product.barcodes.length > 0 ? (
				product.barcodes.map((code, index) => (
					<div
						key={index}
						className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md"
					>
						<BiBarcode size={24} className="text-gray-500" />
						<span className="text-gray-700">{code}</span>
					</div>
				))
			) : (
				<div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-md">
					<span className="text-gray-700">
						{content[language].product.not_available}
					</span>
				</div>
			)}
		</div>
	);

	if (!product) return null;

	return (
		<div className="bg-white">
			<div className="flex border-b">
				{menuItems.map((menu) => (
					<button
						key={menu.key}
						className={`px-6 py-3 text-sm font-medium first-letter:uppercase lowercase transition-colors duration-200 ${
							activeMenu === menu.key
								? "border-b-2 border-fuchsia-600 text-fuchsia-600"
								: "text-gray-500 hover:text-fuchsia-600 hover:bg-fuchsia-50"
						}`}
						onClick={() => setActiveMenu(menu.key)}
					>
						{menu.label}
					</button>
				))}
			</div>

			<div className="p-6 overflow-y-auto max-h-[600px]">
				{activeMenu === "Main" && renderMainContent()}
				{activeMenu === "Stock" && renderStockContent()}
				{activeMenu === "Price" && renderPriceContent()}
				{activeMenu === "Barcodes" && renderBarcodesContent()}
			</div>
		</div>
	);
};

export default ProductViewDetails;

