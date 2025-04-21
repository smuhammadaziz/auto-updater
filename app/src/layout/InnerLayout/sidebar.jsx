import React, { useState, useEffect } from "react";
import {
	AiOutlineHome,
	AiOutlineUser,
	AiOutlineSetting,
	AiOutlineInfoCircle,
	AiOutlineMenu,
	AiOutlineClose,
	AiFillProduct,
} from "react-icons/ai";
import { IoTrashBinOutline } from "react-icons/io5";
import nodeUrl from "../../links";

import { SlBasket } from "react-icons/sl";

import logo from "../../assets/icon.png";
import { RiCustomerService2Fill } from "react-icons/ri";
import { NavLink } from "react-router-dom";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

function SidebarInner({ socket, onToggle }) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [count, setCount] = useState(false);

	const [language, setLanguage] = useLang();

	const toggleSidebar = () => {
		setIsExpanded(!isExpanded);
		onToggle(!isExpanded);
	};

	const ksb_id = localStorage.getItem("ksbIdNumber");

	const currentUser = localStorage.getItem("userType");
	const usersPermissionInfo =
		JSON.parse(localStorage.getItem("usersPermissionInfo")) || [];

	const currentUserData = usersPermissionInfo.find(
		(user) => user.login === currentUser,
	);
	const isAdmin = currentUserData ? currentUserData.admin : false;

	// useEffect(() => {
	// 	fetchProducts();

	// 	const updateHandler = () => fetchProducts();
	// 	socket.on("deleteOneTrashSale", updateHandler);

	// 	return () => {
	// 		socket.off("deleteOneTrashSale", updateHandler);
	// 	};
	// }, []);

	// const fetchProducts = async () => {
	// 	try {
	// 		const response = await fetch(
	// 			`${nodeUrl}/api/trash/sales/${ksb_id}`,
	// 		);
	// 		if (!response.ok) {
	// 			throw new Error("Failed to fetch products");
	// 		}
	// 		const data = await response.json();

	// 		setCount(data.length);
	// 	} catch (err) {
	// 		console.log(err);
	// 	}
	// };

	// useEffect(() => {
	// 	fetchProducts();
	// }, []);

	return (
		<div
			className={`h-full bg-gray-900 text-white fixed z-[150] flex flex-col items-center py-6 transition-all duration-300 shadow-lg ${
				isExpanded ? "w-64" : "w-20"
			}`}
		>
			<div className="flex flex-col items-center mb-8">
				<div className="text-xl font-bold mb-2 transition-opacity duration-300">
					{isExpanded ? <img src={logo} alt="" /> : "KSB"}
				</div>
			</div>
			<nav className="flex flex-col gap-6 w-full px-2 mt-4">
				<NavLink
					to="/crm"
					className={({ isActive }) =>
						`group flex items-center gap-4 px-4 py-3 hover:bg-gray-700 rounded transition-all duration-300 relative ${
							isActive ? "bg-gray-700" : ""
						}`
					}
				>
					<AiOutlineHome size={isExpanded ? 24 : 28} />
					{isExpanded && (
						<span className="text-lg">
							{content[language].innerLayout.home}
						</span>
					)}
				</NavLink>
				<NavLink
					to="/customers"
					className={({ isActive }) =>
						`group flex items-center gap-4 px-4 py-3 hover:bg-gray-700 rounded transition-all duration-300 relative ${
							isActive ? "bg-gray-700" : ""
						}`
					}
				>
					<RiCustomerService2Fill size={isExpanded ? 24 : 28} />
					{isExpanded && (
						<span className="text-lg">
							{content[language].innerLayout.customers}
						</span>
					)}
				</NavLink>
				<NavLink
					to="/products"
					className={({ isActive }) =>
						`group flex items-center gap-4 px-4 py-3 hover:bg-gray-700 rounded transition-all duration-300 relative ${
							isActive ? "bg-gray-700" : ""
						}`
					}
				>
					<SlBasket size={isExpanded ? 24 : 28} />
					{isExpanded && (
						<span className="text-lg">
							{content[language].innerLayout.products}
						</span>
					)}
				</NavLink>
				{isAdmin && (
					<NavLink
						to="/trash"
						className={({ isActive }) =>
							`group flex items-center gap-4 px-4 py-3 hover:bg-gray-700 rounded transition-all duration-300 relative ${
								isActive ? "bg-gray-700" : ""
							}`
						}
					>
						<div className="relative">
							<IoTrashBinOutline size={isExpanded ? 24 : 28} />
							{count > 0 && (
								<span className="absolute -top-4 -right-5 bg-red-500 text-white text-xs font-bold flex items-center justify-center w-6 h-6 rounded-full">
									{count}
								</span>
							)}
						</div>

						{isExpanded && <span className="text-lg">Корзина</span>}
					</NavLink>
				)}

				<NavLink
					to="/settings"
					className={({ isActive }) =>
						`group flex items-center gap-4 px-4 py-3 hover:bg-gray-700 rounded transition-all duration-300 relative ${
							isActive ? "bg-gray-700" : ""
						}`
					}
				>
					<AiOutlineSetting size={isExpanded ? 24 : 28} />
					{isExpanded && (
						<span className="text-lg">
							{content[language].innerLayout.settings}
						</span>
					)}
				</NavLink>
			</nav>
		</div>
	);
}

export default SidebarInner;

