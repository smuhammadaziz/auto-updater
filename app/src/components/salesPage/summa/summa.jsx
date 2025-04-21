import React, { useState, useEffect } from "react";
import { BiBasket } from "react-icons/bi";
import { RiDiscountPercentLine } from "react-icons/ri";
import { PiCashRegisterFill } from "react-icons/pi";
import nodeUrl from "../../../links";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

function SalespageSummaSection({ socket }) {
	const [price, setPrice] = useState(0);
	const [discount, setDiscount] = useState(null);
	const [finalPrice, setFinalPrice] = useState(0);
	const settingsDeviceInfoData = JSON.parse(
		localStorage.getItem("settingsDevice"),
	);

	const sales_id = localStorage.getItem("sales_id");
	const [language] = useLang("uz");

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

			setPrice(parseFloat(data[sales_id].summa));
			setDiscount(parseFloat(data[sales_id].discount));

			setFinalPrice(data[sales_id].summa - data[sales_id].discount);
		} catch (err) {
			console.log(err);
		}
	};

	return (
		<div className="items-center py-1 mt-2">
			<p
				className={`flex relative items-center w-[200px] text-green-800 bg-gray-100 font-bold px-3 py-3 rounded-md border-0 border-gray-300  focus:outline-none focus:ring-2 focus:ring-blue-300 transition mb-4`}
			>
				<span className="absolute text-xs  -top-2 font-normal text-[#4d4d4d]">
					{content[language].summaSection.summa}
				</span>
				<BiBasket className="mr-2 text-2xl" />
				<span
					className={`${
						price.toString().length > 10
							? "text-lg"
							: price.toString().length > 10
							? "text-lg"
							: price.toString().length > 10
							? "text-lg"
							: "text-lg"
					}`}
				>
					{price.toLocaleString("ru-RU", {
						minimumFractionDigits:
							settingsDeviceInfoData.format.format_sum.max,
						maximumFractionDigits:
							settingsDeviceInfoData.format.format_sum.max,
					})}
				</span>
			</p>

			<p className="flex items-center w-[200px] relative text-red-500 bg-gray-100 font-bold px-3 py-3 text-lg rounded-md border-0 border-gray-300  focus:outline-none focus:ring-2 focus:ring-blue-300 transition mb-4">
				<span className="absolute text-xs  -top-2 font-normal text-[#4d4d4d]">
					{content[language].summaSection.discount}
				</span>
				<RiDiscountPercentLine className="mr-2 text-red-500 text-2xl" />{" "}
				{discount?.toLocaleString("ru-RU", {
					minimumFractionDigits:
						settingsDeviceInfoData.format.format_sum.max,
					maximumFractionDigits:
						settingsDeviceInfoData.format.format_sum.max,
				}) || "0,00"}
			</p>

			<p className="flex items-center font-bold relative bg-gray-100 w-[200px] px-3 py-3 text-lg rounded-md border-0 border-gray-300  focus:outline-none focus:ring-2 focus:ring-blue-300 transition">
				<span className="absolute text-xs  -top-2 font-normal text-[#4d4d4d]">
					{content[language].summaSection.toPay}
				</span>
				<PiCashRegisterFill className="mr-2 text-2xl" />{" "}
				{finalPrice?.toLocaleString("ru-RU", {
					minimumFractionDigits:
						settingsDeviceInfoData.format.format_sum.max,
					maximumFractionDigits:
						settingsDeviceInfoData.format.format_sum.max,
				}) || "0,00"}
			</p>
		</div>
	);
}

export default SalespageSummaSection;

