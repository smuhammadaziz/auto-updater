import React, { useEffect, useState } from "react";
import { FaLanguage } from "react-icons/fa";
import Modal from "./Modal";

const ChangePrice = ({
	isOpen,
	onClose,
	onSave,
	tempSettings,
	setTempSettings,
}) => {
	const [changePriceValue, setChangePriceValue] = useState(() => {
		const savedValue = localStorage.getItem("changePriceValue");
		return savedValue === "true";
	});

	useEffect(() => {
		localStorage.setItem("changePriceValue", changePriceValue);
	}, [changePriceValue]);

	const handleCheckboxChange = (e) => {
		const newValue = e.target.checked;
		setChangePriceValue(newValue);
		setTempSettings({
			...tempSettings,
			changePriceValue: newValue,
		});
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Нарх" onSave={onSave}>
			<div className="space-y-2">
				<div className="flex items-center space-x-2">
					<label htmlFor="changePriceCheckbox">Нарх</label>
					<input
						id="changePriceCheckbox"
						type="checkbox"
						checked={changePriceValue}
						onChange={handleCheckboxChange}
						className="form-checkbox h-5 w-5 text-blue-600"
					/>
				</div>
			</div>
		</Modal>
	);
};

export default ChangePrice;

