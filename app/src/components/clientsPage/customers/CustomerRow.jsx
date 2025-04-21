import React, { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import nodeUrl from "../../../links";

const formatPrice = (value) => {
	return new Intl.NumberFormat("ru-RU", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(value);
};

const CustomerRow = ({ customer, onView, index, content, language }) => {
	const [currencyData, setCurrencyData] = useState([]);

	useEffect(() => {
		const fetchCurrencyData = async () => {
			if (customer) {
				const deviceId = localStorage.getItem("device_id");
				const ksbId = localStorage.getItem("ksbIdNumber");

				try {
					const response = await fetch(
						`${nodeUrl}/api/get/currency/data/${deviceId}/${ksbId}`,
					);
					const data = await response.json();
					setCurrencyData(data);
				} catch (error) {
					console.error("Failed to fetch currency data", error);
				}
			}
		};

		fetchCurrencyData();
	}, [customer]);

	const foundCurrency = (id) => {
		const currency = currencyData.find((item) => item.item_id === id);
		return currency ? currency.name : null;
	};

	const positiveBalance =
		customer.positive_balance.length > 0
			? customer.positive_balance
					.map(
						(item) =>
							`${formatPrice(item.sum)} ${foundCurrency(
								item.currency,
							)}`,
					)
					.join(", ")
			: "0";

	const negativeBalance =
		customer.negative_balance.length > 0
			? customer.negative_balance
					.map(
						(item) =>
							`${formatPrice(item.sum)} ${foundCurrency(
								item.currency,
							)}`,
					)
					.join(", ")
			: "0";

	return (
		<tr
			className="hover:bg-gray-50 transition-colors duration-200 active:bg-gray-300 cursor-pointer"
			// onDoubleClick={() => onView(customer)}
		>
			<td className="px-6 whitespace-nowrap text-sm font-medium text-gray-900">
				{index}
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				<div className="flex items-center">
					<div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
						<FaUser className="text-blue-600" />
					</div>
					<div className="ml-4">
						<div className="text-base font-semibold text-black">
							{customer.name}
						</div>
					</div>
				</div>
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				<div className="flex items-center text-base text-black font-semibold">
					{customer.phone_number || content[language].client.no_phone}
				</div>
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				<div className="flex items-center text-base text-black font-semibold">
					{negativeBalance}
				</div>
			</td>
			<td className="px-6 py-4 whitespace-nowrap">
				<div className="flex items-center text-base text-black font-semibold">
					{positiveBalance}
				</div>
			</td>
		</tr>
	);
};

export default CustomerRow;

