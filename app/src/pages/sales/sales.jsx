import React, { useState, useEffect } from "react";
import SalesMainAllProducts from "../../components/salesPage/SalesAllProducts/products";
import SalespageSummaSection from "../../components/salesPage/summa/summa";
import SalesSoldProducts from "../../components/salesPage/SalesSoldProducts/soldproducts";
import SalesPageLayoutMain from "../../layout/SalesLayout/saleslayout";
import nodeUrl from "../../links";

function SalesMainPage({ socket }) {
	const [lastAddedProductId, setLastAddedProductId] = useState(null);

	const handleProductAdded = (productId) => {
		setLastAddedProductId(productId);
	};

	const ksbId = localStorage.getItem("ksbIdNumber");
	const deviceId = localStorage.getItem("device_id");
	const ipaddressPort = localStorage.getItem("ipaddress:port");
	const mainDatabase = localStorage.getItem("mainDatabase");
	const userType = localStorage.getItem("userType");
	const userPassword = localStorage.getItem("userPassword");

	const sales_id = localStorage.getItem("sales_id");
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selectedRowId, setSelectedRowId] = useState(null);
	const tableRef = React.createRef();

	const [lastUpdateTime, setLastUpdateTime] = useState(0);

	const scrollToSelectedRow = (rowId) => {
		if (!tableRef.current) return;
		const selectedRow = tableRef.current.querySelector(
			`tr[data-id="${rowId}"]`,
		);
		if (selectedRow) {
			selectedRow.scrollIntoView({
				block: "nearest",
				behavior: "smooth",
			});
		}
	};

	useEffect(() => {
		fetchSoldProducts();

		const updateHandler = () => fetchSoldProducts();
		socket.on("gettingSoldProducts", updateHandler);

		return () => {
			socket.off("gettingSoldProducts", updateHandler);
		};
	}, [sales_id, lastAddedProductId]);

	const fetchSoldProducts = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/get/sales/${sales_id}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch products");
			}
			const data = await response.json();
			const newProducts = data[sales_id]?.products || [];
			setProducts(newProducts);

			setError(null);
			setLoading(false);
		} catch (err) {
			setLoading(false);
		}
	};

	const checkInternetConnection = async () => {
		try {
			const online = window.navigator.onLine;

			if (!online) {
				console.log(
					"No internet connection detected via navigator.onLine.",
				);
				return false;
			}

			const ksbId = localStorage.getItem("ksbIdNumber");
			const ipaddressPort = localStorage.getItem("ipaddress:port");
			const mainDatabase = localStorage.getItem("mainDatabase");
			const userType = localStorage.getItem("userType");
			const userPassword = localStorage.getItem("userPassword");

			const currentBody = {
				"ipaddress:port": ipaddressPort,
				database: mainDatabase,
				username: userType,
				password: userPassword,
			};

			const response = await fetch(`${nodeUrl}/api/check/ping/${ksbId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(currentBody),
			});

			return response.status === 200;
		} catch (error) {
			return false;
		}
	};

	const fetchingProductUpdateData = async () => {
		try {
			const response = await fetch(
				`${nodeUrl}/api/update/product_update/data/${deviceId}/${ksbId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
				},
			);

			if (!response.ok) {
				throw new Error(`ERROR PRODUCT_UPDATE: ${response.status}`);
			}
		} catch (error) {
			console.error("Error fetching symbol data:", error);
		}
	};

	const fetchingResponseSyncing = async () => {
		try {
			const responseSyncing = await fetch(
				`${nodeUrl}/api/syncing/${ksbId}/${deviceId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"ipaddress:port": ipaddressPort,
						database: mainDatabase,
						userName: userType,
						userPassword: userPassword,
					}),
				},
			);

			if (!responseSyncing.ok) {
				throw new Error(`ERROR SYNCING: ${responseSyncing.status}`);
			}
		} catch (error) {
			console.error("Error fetching symbol data:", error);
		}
	};

	// useEffect(() => {
	// 	const updatedProductData = async () => {
	// 		const isOnline = await checkInternetConnection();

	// 		if (isOnline) {
	// 			fetchingResponseSyncing();
	// 			fetchingProductUpdateData();
	// 		} else {
	// 			console.log("no network");
	// 		}
	// 	};
	// 	const interval = setInterval(() => {
	// 		updatedProductData();
	// 	}, 300000);

	// 	return () => clearInterval(interval);
	// }, []);

	return (
		<SalesPageLayoutMain socket={socket}>
			<div className="">
				<div className="flex gap-2 justify-between">
					<div className="w-[90vw] ">
						<SalesSoldProducts
							key={lastAddedProductId}
							socket={socket}
							products={products}
							setProducts={setProducts}
							loading={loading}
							setLoading={setLoading}
							error={error}
							setError={setError}
							selectedRowId={selectedRowId}
							setSelectedRowId={setSelectedRowId}
							scrollToSelectedRow={scrollToSelectedRow}
							tableRef={tableRef}
						/>
					</div>
					<div className="">
						<SalespageSummaSection socket={socket} />
					</div>
				</div>
				<div className="">
					<SalesMainAllProducts
						onProductAdded={handleProductAdded}
						socket={socket}
						selectedRowId={selectedRowId}
						products={products}
					/>
				</div>
			</div>
		</SalesPageLayoutMain>
	);
}

export default SalesMainPage;

