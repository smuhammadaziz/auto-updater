import React, {
	useState,
	useRef,
	useEffect,
	useCallback,
	useMemo,
} from "react";
import { FaEye } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import ProductModal from "./ProductModal";
import ProductViewDetails from "./ProductViewDetails";
import nodeUrl from "../../../links";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

const LoadingSpinner = () => {
	const [language] = useLang("uz");

	return (
		<div className="flex items-center justify-center py-4">
			<div className="flex flex-col items-center space-y-2">
				<div className="text-purple-600 text-4xl animate-spin">
					<FiLoader />
				</div>
				<p className="text-gray-500">
					{content[language].product.loading}
				</p>
			</div>
		</div>
	);
};

const ProductTable = React.memo(
	({ products, isLoading, hasMore, onLoadMore }) => {
		const [selectedProduct, setSelectedProduct] = useState(null);
		const [isModalOpen, setIsModalOpen] = useState(false);
		const [isLoadingMore, setIsLoadingMore] = useState(false);
		const [currencyData, setCurrencyData] = useState({});
		const [symbolData, setSymbolData] = useState({});

		const observer = useRef();
		const lastProductRef = useRef();

		const [language] = useLang("uz");

		const columns = useMemo(
			() => [
				{ key: "name", label: content[language].product.name },
				{ key: "type", label: content[language].product.type },
				{ key: "symbol", label: content[language].product.symbol },
				{ key: "currency", label: content[language].product.currency },
				{ key: "article", label: content[language].product.article },
			],
			[language],
		);

		useEffect(() => {
			const options = {
				root: null,
				rootMargin: "20px",
				threshold: 0.1,
			};

			const handleObserver = async (entries) => {
				const [target] = entries;
				if (
					target.isIntersecting &&
					hasMore &&
					!isLoadingMore &&
					!isLoading
				) {
					setIsLoadingMore(true);
					try {
						await onLoadMore();
					} finally {
						setIsLoadingMore(false);
					}
				}
			};

			observer.current = new IntersectionObserver(
				handleObserver,
				options,
			);

			if (lastProductRef.current) {
				observer.current.observe(lastProductRef.current);
			}

			return () => {
				if (observer.current) {
					observer.current.disconnect();
				}
			};
		}, [hasMore, isLoadingMore, onLoadMore, isLoading]);

		const fetchSymbolData = useCallback(async () => {
			for (const product of products) {
				if (product.symbol && !symbolData[product.symbol]) {
					const deviceId = localStorage.getItem("device_id");
					const ksbId = localStorage.getItem("ksbIdNumber");

					try {
						const response = await fetch(
							`${nodeUrl}/api/get/symbol/data/${deviceId}/${ksbId}/${product.symbol}`,
						);
						const data = await response.json();
						setSymbolData((prev) => ({
							...prev,
							[product.symbol]: data[0]?.name || "-",
						}));
					} catch (error) {
						console.error("Failed to fetch symbol data", error);
						setSymbolData((prev) => ({
							...prev,
							[product.symbol]: "-",
						}));
					}
				}
			}
		}, [products, symbolData]);

		const fetchCurrencyData = useCallback(async () => {
			for (const product of products) {
				if (product.currency && !currencyData[product.currency]) {
					const deviceId = localStorage.getItem("device_id");
					const ksbId = localStorage.getItem("ksbIdNumber");

					try {
						const response = await fetch(
							`${nodeUrl}/api/get/currency/data/${deviceId}/${ksbId}/${product.currency}`,
						);
						const data = await response.json();
						setCurrencyData((prev) => ({
							...prev,
							[product.currency]: data[0]?.name || "-",
						}));
					} catch (error) {
						console.error("Failed to fetch currency data", error);
						setCurrencyData((prev) => ({
							...prev,
							[product.currency]: "-",
						}));
					}
				}
			}
		}, [products, currencyData]);

		useEffect(() => {
			fetchSymbolData();
		}, [fetchSymbolData]);

		useEffect(() => {
			fetchCurrencyData();
		}, [fetchCurrencyData]);

		const handleRowDoubleClick = useCallback((product) => {
			setSelectedProduct(product);
			setIsModalOpen(true);
		}, []);

		const handleCloseModal = useCallback(() => {
			setIsModalOpen(false);
			setSelectedProduct(null);
		}, []);

		if (isLoading && products.length === 0) {
			return (
				<div className="flex-grow flex items-center justify-center">
					<LoadingSpinner />
				</div>
			);
		}

		return (
			<div className="flex-grow overflow-auto relative">
				<table className="w-full">
					<thead className="bg-gray-50 sticky top-0 z-10">
						<tr>
							<th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
								#
							</th>
							{columns.map((column, index) => (
								<th
									key={column.key}
									className={`px-4 py-3 ${
										index === 0
											? "text-left"
											: "text-center"
									} text-xs font-semibold text-black uppercase tracking-wider`}
								>
									{column.label}
								</th>
							))}
							{/* <th className="px-4 py-3 text-center text-xs font-medium text-black uppercase tracking-wider">
								{content[language].product.extra}
							</th> */}
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{products.map((product, index) => (
							<tr
								key={product.product_id}
								ref={
									index === products.length - 1
										? lastProductRef
										: null
								}
								className="hover:bg-gray-50 transition-colors duration-200 active:bg-slate-200 cursor-pointer"
								onDoubleClick={() =>
									handleRowDoubleClick(product)
								}
							>
								<td className="px-4 py-3 whitespace-nowrap text-center text-base text-black">
									{index + 1}
								</td>
								{columns.map((column, colIndex) => (
									<td
										key={`${column}:${colIndex}`}
										className={`px-4 py-3 whitespace-nowrap text-base text-black ${
											colIndex === 0
												? "text-left"
												: "text-center"
										}`}
									>
										{column.key === "symbol"
											? symbolData[product.symbol] ||
											  "N/A"
											: column.key === "currency"
											? currencyData[product.currency] ||
											  "N/A"
											: product[column.key] !== undefined
											? String(product[column.key])
											: "N/A"}
									</td>
								))}
								{/* <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium">
									<div className="flex justify-center space-x-4">
										<button
											onClick={() =>
												handleRowDoubleClick(product)
											}
											className="bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors rounded px-3 py-1 flex items-center space-x-2"
											title="View Product"
										>
											<FaEye />
											<span>
												{content[language].product.view}
											</span>
										</button>
									</div>
								</td> */}
							</tr>
						))}
					</tbody>
				</table>

				{isLoadingMore && hasMore && <LoadingSpinner />}

				<ProductModal
					isOpen={isModalOpen}
					onClose={handleCloseModal}
					title={content[language].product.name}
				>
					<ProductViewDetails product={selectedProduct} />
				</ProductModal>
			</div>
		);
	},
);

export default ProductTable;

