import { FC, useState, useEffect } from "react";
import { Layout } from "../layout/HomeLayout/layout";
import InnerLayoutSection from "../layout/InnerLayout/innerlayout";
import { NavLink } from "react-router-dom";
import {
	RiMoneyDollarCircleLine,
	RiCustomerService2Line,
	RiStore3Line,
} from "react-icons/ri";
import { BiTrendingUp, BiDotsHorizontalRounded } from "react-icons/bi";
import { SlBasket } from "react-icons/sl";
import { FaCartShopping } from "react-icons/fa6";
import { HiOutlineShoppingCart } from "react-icons/hi2";
import { AiFillProduct } from "react-icons/ai";
import { FiLoader } from "react-icons/fi";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

import content from "../localization/content";
import useLang from "../hooks/useLang";
import InitialUserSettingsForHome from "../components/homePage/UserSettings";

import { v4 as uuidv4 } from "uuid";
import { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import DeadlineModal from "./itsModal";

import { Socket } from "socket.io-client";

import nodeUrl from "../links";

ChartJS.register(
	CategoryScale,
	LinearScale,
	LineElement,
	PointElement,
	Title,
	Tooltip,
	Legend,
);

interface IndexPageProps {
	socket: Socket;
}

const IndexPage: React.FC<IndexPageProps> = ({ socket }) => {
	const [language, setLanguage] = useLang();
	const [filter, setFilter] = useState<string>(
		content[language as string].home.time.month,
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isVisible, setIsVisible] = useState(false);
	const [allProducts, setAllProducts] = useState(0);
	const [allClient, setAllClient] = useState(0);
	const [allSales, setAllSales] = useState(0);

	const deviceId = localStorage.getItem("device_id");
	const ksbId = localStorage.getItem("ksbIdNumber");

	const navigate = useNavigate();

	useEffect(() => {
		setTimeout(() => {
			setIsLoading(false);
			setIsVisible(true);
		}, 300);
	}, []);

	useEffect(() => {
		const showSettingsModal = localStorage.getItem("showSettingsModal");
		if (showSettingsModal === "true") {
			localStorage.setItem("showSettingsModal", "true");
		}
	}, []);

	const generateChartData = () => {
		let labels: string[] = [];
		let data: number[] = [];

		switch (filter) {
			case content[language as string].home.time.day:
				labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
				data = [10, 15, 12, 8, 20, 25, 18];
				break;
			case content[language as string].home.time.week:
				labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
				data = [50, 60, 40, 80];
				break;
			case content[language as string].home.time.month:
				labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
				data = [200, 250, 300, 150, 400, 350];
				break;
			case content[language as string].home.time.year:
				labels = ["2020", "2021", "2022", "2023"];
				data = [1200, 1350, 1100, 1500];
				break;
			default:
				labels = [];
				data = [];
		}

		return {
			labels,
			datasets: [
				{
					label: "Performance Data",
					data: data,
					fill: true,
					backgroundColor: "rgba(99, 102, 241, 0.1)",
					borderColor: "rgba(99, 102, 241, 1)",
					pointBackgroundColor: "rgba(99, 102, 241, 1)",
					pointBorderColor: "#fff",
					pointHoverBackgroundColor: "#fff",
					pointHoverBorderColor: "rgba(99, 102, 241, 1)",
					tension: 0.4,
				},
			],
		};
	};

	useEffect(() => {
		fetchSalesData();

		const updateHandler = () => fetchSalesData();
		socket.on("gettingsSalesData", updateHandler);

		return () => {
			socket.off("gettingsSalesData", updateHandler);
		};
	}, []);

	const fetchSalesData = async () => {
		try {
			const response = await fetch(`${nodeUrl}/api/all/sales/${ksbId}`, {
				method: "GET",
			});
			const data = await response.json();

			const totalSalesAmount = data.reduce(
				(sum: any, sale: any) => sum + Number(sale.total_price),
				0,
			);

			setAllSales(totalSalesAmount);
		} catch (error) {
			console.error("Error fetching sales data:", error);
		}
	};

	useEffect(() => {
		fetchProductsData();

		const updateHandler = () => fetchProductsData();
		socket.on("gettingAllUpdatedProductData", updateHandler);

		return () => {
			socket.off("gettingAllUpdatedProductData", updateHandler);
		};
	}, []);

	const fetchProductsData = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/product_update/data/${deviceId}/${ksbId}`,
				{
					method: "GET",
				},
			);
			const data = await response.json();

			setAllProducts(data.products.length);
		} catch (error) {
			console.error("Error fetching products:", error);
		}
	};

	useEffect(() => {
		fetchClientsData();

		const updateHandler = () => fetchClientsData();
		socket.on("gettingClients", updateHandler);

		return () => {
			socket.off("gettingClients", updateHandler);
		};
	}, []);

	const fetchClientsData = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/client/${ksbId}/${deviceId}`,
			);
			const data = await response.json();
			setAllClient(data.data.length);
		} catch (error) {
			console.error("Error fetching products:", error);
		}
	};

	const handleClick = async (e: MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();

		const newSalesId = uuidv4();
		localStorage.setItem("sales_id", newSalesId);

		try {
			const response = await fetch(
				`${nodeUrl}/api/create/sales/${newSalesId}`,
				{
					method: "POST",
				},
			);
			const data = await response.json();

			if (response.ok) {
				console.log("Created");
				navigate("/sales");
			} else {
				console.log("error");
			}
		} catch (err) {
			console.log("error creating empty sales", err);
		}
	};

	const cards = [
		{
			title: content[language as string].home.totalSales,
			// value: (() => {
			// 	try {
			// 		return allSales
			// 			? allSales
			// 					.toString()
			// 					.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
			// 			: "0";
			// 	} catch (error) {
			// 		return "0";
			// 	}
			// })(),
			value: "0",
			change: "+12.5%",
			icon: <HiOutlineShoppingCart className="text-4xl" />,
			bgColor:
				"bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700",
			link: "/sales",
			linkText: content[language as string].home.salesDashboard,
			borderColor: "border-purple-300",
			hoverBg: "hover:bg-purple-50",
			onClick: (e: MouseEvent<HTMLAnchorElement>) => {
				localStorage.setItem("isSaleContinue", "false");
				handleClick(e);
			},
		},
		{
			title: content[language as string].home.activeClient,
			value: (() => {
				try {
					return allClient
						? allClient
								.toString()
								.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
						: "0";
				} catch (error) {
					return "0";
				}
			})(),
			change: "+8.1%",
			icon: <RiCustomerService2Line className="text-4xl" />,
			bgColor: "bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700",
			link: "/customers",
			linkText: content[language as string].home.clientManagement,
			borderColor: "border-pink-300",
			hoverBg: "hover:bg-pink-50",
		},
		{
			title: content[language as string].home.products,
			value: (() => {
				try {
					return allProducts
						? allProducts
								.toString()
								.replace(/\B(?=(\d{3})+(?!\d))/g, " ")
						: "0";
				} catch (error) {
					return "0";
				}
			})(),
			change: "+5.3%",
			icon: <AiFillProduct className="text-4xl" />,
			bgColor: "bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700",
			link: "/products",
			linkText: content[language as string].home.productCatalog,
			borderColor: "border-cyan-300",
			hoverBg: "hover:bg-cyan-50",
		},
	];

	return (
		<Layout>
			<InnerLayoutSection socket={socket}>
				{isLoading ? (
					<div className="flex items-center justify-center h-screen">
						<div className="text-purple-600 text-4xl animate-spin">
							<FiLoader />
						</div>
					</div>
				) : (
					<div className="h-[80vh] bg-slate-100 space-y-6">
						<div className="space-y-6">
							<div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
									{cards.map((card, index) => (
										<div
											key={card.title}
											style={{
												animationDelay: `${
													index * 150
												}ms`,
											}}
											className="animate-slideIn relative overflow-hidden rounded-3xl border bg-white shadow-xl transition-all duration-500 group"
										>
											<div className="p-8 relative z-10">
												<div className="flex justify-between items-start mb-8">
													<div>
														<h3 className="text-4xl font-bold text-gray-800 mb-2">
															{card.value}
														</h3>
														<p className="text-black font-medium">
															{card.title}
														</p>
													</div>
													<div
														className={`${card.bgColor} p-4 rounded-2xl text-white shadow-lg transition-transform duration-500`}
													>
														{card.icon}
													</div>
												</div>

												<div className="flex items-center justify-end">
													{/* <p className="text-green-500 text-sm flex items-center font-semibold bg-green-50 px-3 py-1 rounded-full">
														<BiTrendingUp className="mr-1" />
														{card.change}
													</p> */}
													<NavLink
														to={card.link}
														onClick={card.onClick}
														className={`${card.bgColor} text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-500 hover:shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 relative after:absolute after:inset-0 after:rounded-xl after:opacity-0 after:transition-opacity after:duration-500 hover:after:opacity-100 after:shadow-[inset_0_0_0_2px_rgba(255,255,255,0.2)]`}
													>
														<span className="relative z-10">
															{card.linkText}
														</span>
													</NavLink>
												</div>
											</div>
											<div
												className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ${card.hoverBg} backdrop-blur-sm`}
											/>
										</div>
									))}
								</div>
								<div className="bg-white rounded-3xl border shadow-xl p-8 mb-6 relative">
									{/* Overlay with blurred background and centered text */}
									<div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl z-10">
										<span className="text-2xl font-bold text-gray-800">
											{
												content[language as string].home
													.soon
											}{" "}
											. . .
										</span>
									</div>

									{/* Existing content */}
									<div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
										<h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
											<BiTrendingUp className="text-purple-600" />
											{
												content[language as string].home
													.salesChart
											}
										</h3>
										<div className="flex flex-wrap gap-2">
											{[
												content[language as string].home
													.time.day,
												content[language as string].home
													.time.week,
												content[language as string].home
													.time.month,
												content[language as string].home
													.time.year,
											].map((type) => (
												<button
													key={type}
													onClick={() =>
														setFilter(type)
													}
													className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
														filter === type
															? "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg"
															: "bg-purple-50 text-purple-700 hover:bg-purple-100"
													}`}
												>
													{type
														.charAt(0)
														.toUpperCase() +
														type.slice(1)}
												</button>
											))}
										</div>
									</div>
									<div className="h-[35vh] w-full transition-all duration-300">
										<Line
											data={generateChartData()}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												plugins: {
													legend: {
														display: false,
													},
												},
												scales: {
													y: {
														beginAtZero: true,
														grid: {
															color: "rgba(107, 114, 128, 0.1)",
														},
													},
													x: {
														grid: {
															display: false,
														},
													},
												},
											}}
										/>
									</div>
								</div>
							</div>
						</div>
						{/* <PermissionComponent /> */}
						<InitialUserSettingsForHome />
					</div>
				)}
				<DeadlineModal />
			</InnerLayoutSection>
		</Layout>
	);
};

export default IndexPage;

