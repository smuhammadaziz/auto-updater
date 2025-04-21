import React, {
	useState,
	useEffect,
	useRef,
	useCallback,
	useMemo,
} from "react";
import SearchBar from "./SearchBar";
import ProductsTable from "./ProductsTable";
import ProductModal from "./ProductModal";
import nodeUrl from "../../../links";

function SalesMainAllProducts({ socket, selectedRowId, products }) {
	const [searchQuery, setSearchQuery] = useState("");
	const [originalData, setOriginalData] = useState([]);
	const [filteredData, setFilteredData] = useState([]);
	const [displayedData, setDisplayedData] = useState([]);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedProduct, setSelectedProduct] = useState(null);
	const [selectedRow, setSelectedRow] = useState(null);
	const [isSelectionEnabled, setIsSelectionEnabled] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [isSearching, setIsSearching] = useState(false);
	const [page, setPage] = useState(1);
	const [isLoadingMore, setIsLoadingMore] = useState(false);
	const [mouseSelectedRow, setMouseSelectedRow] = useState(null);
	const [tableClickedRow, setTableClickedRow] = useState(null);
	const [clickedRow, setClickedRow] = useState(null);
	const itemsPerPage = 50;

	const tableRef = useRef(null);
	const selectedRowRef = useRef(null);
	const searchInputRef = useRef(null);
	const fetchIntervalRef = useRef(null);
	const lastFetchTime = useRef(0);
	const currentData = useRef([]);
	const ksbId = localStorage.getItem("ksbIdNumber");
	const deviceId = localStorage.getItem("device_id");

	const [initialSortApplied, setInitialSortApplied] = useState(false);

	const [sortConfig, setSortConfig] = useState(() => {
		const saved = localStorage.getItem("tableSortConfig");
		return saved ? JSON.parse(saved) : { key: null, direction: "asc" };
	});

	const applySortConfig = (dataToSort, config) => {
		if (!config.key) return dataToSort;

		return [...dataToSort].sort((a, b) => {
			let aValue, bValue;

			if (config.key === "convertedPrice") {
				aValue = getConvertedPrice(a);
				bValue = getConvertedPrice(b);
			} else if (config.key === "actualPrice") {
				aValue = getActualPrice(a);
				bValue = getActualPrice(b);
			} else {
				aValue = config.key.includes(".")
					? config.key
						.split(".")
						.reduce((obj, i) => (obj || {})[i], a)
					: a[config.key];
				bValue = config.key.includes(".")
					? config.key
						.split(".")
						.reduce((obj, i) => (obj || {})[i], b)
					: b[config.key];
			}

			if (typeof aValue === "number" && typeof bValue === "number") {
				return config.direction === "asc"
					? aValue - bValue
					: bValue - aValue;
			}

			const aString = String(aValue || "").toLowerCase();
			const bString = String(bValue || "").toLowerCase();

			return config.direction === "asc"
				? aString.localeCompare(bString)
				: bString.localeCompare(aString);
		});
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
			if (!response.ok) {
				throw new Error("Товарлар топилмади.");
			}

			const result = await response.json();

			if (result.message === "successfully") {
				// Filter out products where stock[0].qty === 0
				const data = (result.products || []).filter(
					(item) => item?.stock?.[0]?.qty !== 0,
				);

				if (
					JSON.stringify(currentData.current) !== JSON.stringify(data)
				) {
					currentData.current = data;
					setOriginalData(data);

					// Apply sorting if sortConfig exists
					let sortedData = data;
					if (sortConfig.key) {
						sortedData = applySortConfig(data, sortConfig);
					}

					setFilteredData(sortedData);
					setDisplayedData(sortedData.slice(0, page * itemsPerPage));
				}

				setLoading(false);
				setError(null);
			} else {
				setLoading(true);
			}
		} catch (err) {
			setError(err.message);
			setOriginalData([]);
			setFilteredData([]);
			setDisplayedData([]);
			setLoading(false);
		}
	};

	useEffect(() => {
		if (searchQuery) {
			setIsSearching(true);
			const lowercasedQuery = searchQuery.toLowerCase();
			const filtered = originalData.filter(
				(product) =>
					product.name?.toLowerCase().includes(lowercasedQuery) ||
					product.article?.toLowerCase().includes(lowercasedQuery) ||
					product.barcodes?.some((barcode) =>
						barcode.includes(lowercasedQuery),
					),
			);

			// Apply sorting after filtering
			const sortedFiltered = sortConfig.key
				? applySortConfig(filtered, sortConfig)
				: filtered;

			setFilteredData(sortedFiltered);
			setPage(1);
			setDisplayedData(sortedFiltered.slice(0, itemsPerPage));
			setMouseSelectedRow(null);
			setTableClickedRow(null);
		} else {
			setIsSearching(false);

			// Apply sorting to the original data
			const sortedOriginal = sortConfig.key
				? applySortConfig(originalData, sortConfig)
				: originalData;

			setFilteredData(sortedOriginal);
			setPage(1);
			setDisplayedData(sortedOriginal.slice(0, itemsPerPage));
			setSelectedRow(null);
			setMouseSelectedRow(null);
			setTableClickedRow(null);
			setIsSelectionEnabled(false);
		}
	}, [searchQuery, originalData, sortConfig]);

	const loadMoreItems = useCallback(() => {
		if (isLoadingMore) return;
		setIsLoadingMore(true);

		const nextPage = page + 1;
		const startIndex = 0;
		const endIndex = nextPage * itemsPerPage;
		const newItems = filteredData.slice(startIndex, endIndex);

		setDisplayedData(newItems);
		setPage(nextPage);
		setIsLoadingMore(false);
	}, [filteredData, page, isLoadingMore]);

	const handleKeyDown = (e) => {
		if (
			e.key === "Enter" &&
			searchQuery &&
			filteredData.length > 0 &&
			!isSelectionEnabled
		) {
			e.preventDefault();
			setIsSelectionEnabled(true);
			setSelectedRow(0);
			setMouseSelectedRow(null);
			setTableClickedRow(null);
			return;
		}

		if (!isSelectionEnabled) return;

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setMouseSelectedRow(null);
			setClickedRow(null);
			setSelectedRow((prev) =>
				prev === null
					? 0
					: Math.min(prev + 1, displayedData.length - 1),
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setMouseSelectedRow(null);
			setClickedRow(null);
			setSelectedRow((prev) =>
				prev === null ? null : Math.max(prev - 1, 0),
			);
		} else if (e.key === "Enter" && selectedRow !== null) {
			e.preventDefault();
			const selectedProduct = displayedData[selectedRow];
			if (selectedProduct) {
				setSelectedProduct(selectedProduct);
				setIsModalOpen(true);
			}
		} else if (e.key === "Escape") {
			setIsSelectionEnabled(false);
			setSelectedRow(null);
			setMouseSelectedRow(null);
			setClickedRow(null);
			setSearchQuery("");
			searchInputRef.current?.focus();
		}
	};

	const handleAddProduct = (product) => {
		setSelectedProduct(product);
		setIsModalOpen(true);
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setSelectedProduct(null);
	};

	useEffect(() => {
		if (
			selectedRow !== null &&
			selectedRowRef.current &&
			tableRef.current
		) {
			const tableContainer = tableRef.current;
			const selectedElement = selectedRowRef.current;

			const containerRect = tableContainer.getBoundingClientRect();
			const elementRect = selectedElement.getBoundingClientRect();

			if (elementRect.bottom > containerRect.bottom) {
				selectedElement.scrollIntoView({
					block: "nearest",
					behavior: "smooth",
				});
			} else if (elementRect.top < containerRect.top) {
				selectedElement.scrollIntoView({
					block: "start",
					behavior: "smooth",
				});
			}
		}
	}, [selectedRow]);

	useEffect(() => {
		const handleKeyPress = (event) => {
			if (
				event.key === "Enter" &&
				filteredData.length === 1 &&
				searchQuery
			) {
				setSelectedProduct(filteredData[0]);
				setIsModalOpen(true);
			}
		};

		document.addEventListener("keydown", handleKeyPress);

		return () => {
			document.removeEventListener("keydown", handleKeyPress);
		};
	}, [filteredData, searchQuery]);

	const handleSort = (key) => {
		let direction = "asc";
		if (sortConfig.key === key && sortConfig.direction === "asc") {
			direction = "desc";
		}

		const newSortConfig = { key, direction };
		setSortConfig(newSortConfig);
		localStorage.setItem("tableSortConfig", JSON.stringify(newSortConfig));
		setInitialSortApplied(true);

		// Apply sorting to filteredData
		const sortedData = applySortConfig(filteredData, newSortConfig);
		setFilteredData(sortedData);
		setDisplayedData(sortedData.slice(0, page * itemsPerPage));
	};

	const getConvertedPrice = (product) => {
		const priceTypeKeyData = localStorage.getItem("priceTypeKey");
		const currencyKeyData = localStorage.getItem("currencyKey");

		const matchingPrice = product.price.find(
			(price) => price.type === priceTypeKeyData,
		);

		if (!matchingPrice) return 0;
		if (String(currencyKeyData) === product.currency) return 0;
		return matchingPrice.sale;
	};

	const getActualPrice = (product) => {
		const priceTypeKeyData = localStorage.getItem("priceTypeKey");
		const currencyKeyData = localStorage.getItem("currencyKey");
		const currencyRateDataKey = JSON.parse(
			localStorage.getItem("currency_rate") || "{}",
		);

		const matchingPrice = product.price.find(
			(price) => price.type === priceTypeKeyData,
		);

		if (!matchingPrice) return 0;

		if (currencyKeyData === product.currency) {
			return matchingPrice.sale;
		} else {
			if (currencyKeyData === "e51e4ee5-d689-11e7-b79f-00ac1948df3a") {
				return matchingPrice.sale / currencyRateDataKey.usd;
			} else if (
				currencyKeyData === "e51e4ee6-d689-11e7-b79f-00ac1948df3a"
			) {
				return matchingPrice.sale * currencyRateDataKey.usd;
			}
			return matchingPrice.sale;
		}
	};

	const sortedData = useMemo(() => {
		if (sortConfig.key && filteredData.length > 0) {
			return applySortConfig(filteredData, sortConfig);
		}
		return filteredData;
	}, [sortConfig, filteredData]);

	useEffect(() => {
		setDisplayedData(sortedData.slice(0, page * itemsPerPage));
	}, [sortedData, page]);

	if (loading) {
		return (
			<div className="py-1 h-[40vh]">
				<div className="bg-white shadow-md rounded-lg h-full flex flex-col items-center justify-center">
					<p className="text-gray-500">Loading products...</p>
				</div>
			</div>
		);
	}

	const handleProductAdded = (productId) => {
		console.log("Product added:", productId);
	};

	return (
		<div
			className="py-1 h-[50vh] focus:outline-none"
			tabIndex={0}
			onKeyDown={handleKeyDown}
			style={{ outline: "none" }}
		>
			<div className="bg-white shadow-md rounded-lg h-full flex flex-col">
				<SearchBar
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					searchInputRef={searchInputRef}
					setIsSelectionEnabled={setIsSelectionEnabled}
					setSelectedRow={setSelectedRow}
					isModalOpen={isModalOpen}
					socket={socket}
					selectedRowId={selectedRowId}
					products={products}
				/>
				<ProductsTable
					filteredData={displayedData}
					selectedRow={selectedRow}
					setSelectedRow={setSelectedRow}
					isSelectionEnabled={isSelectionEnabled}
					tableRef={tableRef}
					selectedRowRef={selectedRowRef}
					handleRowDoubleClick={handleAddProduct}
					error={error}
					onLoadMore={loadMoreItems}
					hasMore={displayedData.length < filteredData.length}
					mouseSelectedRow={mouseSelectedRow}
					setMouseSelectedRow={setMouseSelectedRow}
					tableClickedRow={tableClickedRow}
					setTableClickedRow={setTableClickedRow}
					sortConfig={sortConfig}
					onSort={handleSort}
					data-no-autofocus
				/>
			</div>
			{isModalOpen && selectedProduct && (
				<ProductModal
					product={selectedProduct}
					onClose={handleCloseModal}
					searchInputRef={searchInputRef}
					searchQuery={searchQuery}
					setSearchQuery={setSearchQuery}
					onProductAdded={handleProductAdded}
				/>
			)}
		</div>
	);
}

export default SalesMainAllProducts;

