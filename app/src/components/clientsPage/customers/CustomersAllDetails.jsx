import React, { useState, useEffect } from "react";
import Modal from "./Modal";
import SearchBar from "./SearchBar";
import CustomerTable from "./CustomerTable";
import { TbUserSearch } from "react-icons/tb";
import { BiUser, BiPhone } from "react-icons/bi";
import nodeUrl from "../../../links";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

const CustomersAllDetails = () => {
	const [customers, setCustomers] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [showViewModal, setShowViewModal] = useState(false);
	const [selectedCustomer, setSelectedCustomer] = useState(null);
	const [language] = useLang("uz");

	useEffect(() => {
		const fetchCustomers = async () => {
			try {
				const ksbIdNumber = localStorage.getItem("ksbIdNumber");
				const device_id = localStorage.getItem("device_id");

				const response = await fetch(
					`${nodeUrl}/api/get/client/${ksbIdNumber}/${device_id}`,
				);
				const result = await response.json();

				setCustomers(result.data);
			} catch (error) {
				console.error("Error fetching customers:", error);
			}
		};

		fetchCustomers();
	}, []);

	const filteredCustomers = (() => {
		try {
			return customers.filter((customer) =>
				Object.values(customer)
					.join(" ")
					.toLowerCase()
					.includes(searchTerm.toLowerCase()),
			);
		} catch (error) {
			console.error("Error filtering customers");
			return [];
		}
	})();

	const handleDeleteCustomer = (id) => {
		try {
			const updatedCustomers = customers.filter(
				(customer) => customer.id !== id,
			);
			setCustomers(updatedCustomers);
		} catch (error) {
			console.error("Error deleting customer:");
		}
	};

	return (
		<div className="h-[80vh]">
			<div className="h-[80vh] mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
				<div className="p-6 border-b border-gray-200">
					<div className="flex flex-col space-y-4">
						<div className="flex items-center space-x-3">
							<div className="p-2 px-3 bg-blue-50 rounded-lg">
								<TbUserSearch className="text-blue-600 text-2xl" />
							</div>
							<h1 className="text-2xl font-bold text-gray-800">
								{content[language].client.detail}
							</h1>
						</div>
						<div className="flex flex-col sm:flex-row gap-4">
							<SearchBar
								value={searchTerm}
								onChange={setSearchTerm}
								content={content}
								language={language}
							/>
						</div>
					</div>
				</div>

				<CustomerTable
					customers={
						Array.isArray(filteredCustomers)
							? filteredCustomers
							: []
					}
					onView={(customer) => {
						if (customer) {
							setSelectedCustomer(customer);
							setShowViewModal(true);
						} else {
							console.error("Invalid customer data");
						}
					}}
					onDelete={(customerId) => {
						if (customerId) {
							handleDeleteCustomer(customerId);
						} else {
							console.error("Invalid customer ID for deletion");
						}
					}}
					content={content}
					language={language}
				/>
				<Modal
					isOpen={showViewModal}
					onClose={() => setShowViewModal(false)}
					title={content[language].client.detail}
					className="p-0 bg-white shadow-2xl rounded-2xl max-w-xl mx-auto overflow-hidden"
				>
					{selectedCustomer && (
						<div>
							<div className="bg-gradient-to-r from-blue-500 rounded-lg to-purple-600 p-8 text-white">
								<div className="flex items-center gap-4">
									<div className="bg-white/20 p-4 rounded-2xl">
										<BiUser className="w-7 h-7" />
									</div>
									<div>
										<h2 className="text-xl font-bold">
											{selectedCustomer.name}
										</h2>
									</div>
								</div>
							</div>

							<div className="py-6 space-y-6">
								<div className="bg-gray-50 rounded-xl p-4">
									<div className="flex items-center gap-3 mb-4">
										<div className="bg-blue-100 p-2 rounded-lg">
											<BiPhone className="w-5 h-5 text-blue-600" />
										</div>
										<h3 className="font-semibold text-gray-700">
											{content[language].client.contact}
										</h3>
									</div>
									<div className="pl-12">
										<p className="text-gray-600">
											{selectedCustomer.phone_number ||
												content[language].client
													.no_phone}
										</p>
									</div>
								</div>
							</div>
						</div>
					)}
				</Modal>
			</div>
		</div>
	);
};

export default CustomersAllDetails;

