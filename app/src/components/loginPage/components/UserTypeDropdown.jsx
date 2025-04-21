import React, { useState, useEffect, useRef } from "react";
import { FaChevronDown } from "react-icons/fa";

function UserTypeDropdown({
	userType,
	isDropdownOpen,
	toggleDropdown,
	handleSelect,
	users,
	content,
	language,
	passwordInputRef,
}) {
	const [selectedUserType, setSelectedUserType] = useState(userType || "");
	const [filteredUsers, setFilteredUsers] = useState(users);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const inputRef = useRef(null);

	useEffect(() => {
		const storedUserType = localStorage.getItem("userType");
		if (storedUserType) {
			setSelectedUserType(storedUserType);
			handleSelect(storedUserType);
		} else {
			setSelectedUserType("");
			setTimeout(() => {
				inputRef.current?.focus();
				inputRef.current?.select();
			}, 0);
			// toggleDropdown(false);
		}
	}, []);

	useEffect(() => {
		if (isDropdownOpen) {
			if (highlightedIndex === -1) {
				setHighlightedIndex(0);
			}
		}
	}, [selectedUserType, isDropdownOpen, users, highlightedIndex]);

	const handleSelection = (usertype) => {
		setSelectedUserType(usertype);
		localStorage.setItem("userType", usertype);
		handleSelect(usertype);
		toggleDropdown();
	};

	const handleInputFocus = (e) => {
		e.target.select();
		if (!isDropdownOpen) {
			toggleDropdown(true);
		}
	};

	const handleInputChange = (e) => {
		const value = e.target.value;
		setSelectedUserType(value);
		setHighlightedIndex(-1);
	};

	const handleKeyDown = (e) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlightedIndex((prev) =>
				prev < filteredUsers.length - 1 ? prev + 1 : prev,
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
		} else if (e.key === "Enter") {
			e.preventDefault();
			toggleDropdown(false);
			if (highlightedIndex >= 0 && filteredUsers[highlightedIndex]) {
				handleSelection(filteredUsers[highlightedIndex].usertype);
			} else {
				handleSelection(selectedUserType);
			}
			if (passwordInputRef?.current) {
				passwordInputRef.current.focus();
			}
		}
	};

	const handleChevronClick = () => {
		setFilteredUsers(users);
		toggleDropdown(!isDropdownOpen);
		setHighlightedIndex(0);
	};

	return (
		<div className="mb-6">
			<label className="block text-xl text-gray-700 mb-2">
				{content[language].login.select}
			</label>
			<div className="relative">
				<input
					ref={inputRef}
					type="text"
					value={selectedUserType}
					onFocus={handleInputFocus}
					onChange={(e) => {
						const value = e.target.value;
						setSelectedUserType(value);
						setHighlightedIndex(-1);
						setFilteredUsers(
							users.filter((user) =>
								user.usertype
									.toLowerCase()
									.includes(value.toLowerCase()),
							),
						);
					}}
					onKeyDown={handleKeyDown}
					className="w-full px-4 py-4 bg-white border font-semibold text-xl  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					placeholder=""
				/>
				<div
					className={`absolute p-3 rounded-lg hover:bg-slate-200 top-1/2 right-4 cursor-pointer transform -translate-y-1/2 transition-transform duration-200 ${
						isDropdownOpen ? "rotate-180" : ""
					}`}
					onClick={handleChevronClick}
				>
					<FaChevronDown />
				</div>
				{isDropdownOpen && (
					<div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
						{filteredUsers.map((user, index) => (
							<button
								key={index}
								onClick={() => handleSelection(user.usertype)}
								className={`block w-full px-4 py-2 text-left hover:bg-slate-100 focus:outline-none ${
									index === highlightedIndex
										? "bg-blue-300"
										: ""
								}`}
							>
								{user.usertype}
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

export default UserTypeDropdown;

