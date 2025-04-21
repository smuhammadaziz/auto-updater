import React, { useRef, useEffect } from "react";
import { FaSearch } from "react-icons/fa";

const SearchBar = ({ value, onChange, content, language }) => {
	const searchInputRef = useRef(null);

	useEffect(() => {
		const handleKeyDown = (event) => {
			if (event.ctrlKey && event.key === "f") {
				event.preventDefault();
				if (searchInputRef.current) {
					searchInputRef.current.focus();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<div className="relative flex-grow">
			<input
				type="text"
				ref={searchInputRef}
				placeholder={content[language].client.search}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
			/>
			<FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
		</div>
	);
};

export default SearchBar;

