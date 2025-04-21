import React from "react";
import { HiOutlineCreditCard } from "react-icons/hi";
import { HiOutlineCash } from "react-icons/hi";

function SalesPagePaymentsSection() {
	return (
		<div className=" justify-center py-3">
			<button className="flex mb-5 items-center justify-center bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 px-14 py-3 text-xl rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-300">
				<HiOutlineCash className="mr-3 text-2xl" />
				Cash
			</button>
			<button className="flex  items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-700 px-14 py-3 text-xl rounded-lg shadow-lg transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-300">
				<HiOutlineCreditCard className="mr-3 text-2xl" />
				Card
			</button>
		</div>
	);
}

export default SalesPagePaymentsSection;

