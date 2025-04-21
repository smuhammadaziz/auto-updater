import React, { useEffect, useState } from "react";
import Modal from "./Modal";

const CurrencyRoundingModal = ({ isOpen, onClose, onSave }) => {
	// Initialize state for currency settings
	const [currencySettings, setCurrencySettings] = useState({
		uzs: {
			enabled: false,
			count: 0,
		},
		usd: {
			enabled: false,
			count: 0,
		},
	});

	// Load settings from localStorage on mount
	useEffect(() => {
		const uzsValue = localStorage.getItem("roundedExactNumberUZS") || "0";
		const usdValue = localStorage.getItem("roundedExactNumberUSD") || "0";

		setCurrencySettings({
			uzs: {
				enabled: uzsValue !== "0",
				count: parseInt(uzsValue) || 0,
			},
			usd: {
				enabled: usdValue !== "0",
				count: parseInt(usdValue) || 0,
			},
		});
	}, []);

	// Handle currency checkbox change
	const handleCurrencyEnabledChange = (currency, checked) => {
		setCurrencySettings((prev) => ({
			...prev,
			[currency]: {
				...prev[currency],
				enabled: checked,
				count: checked ? prev[currency].count : 0,
			},
		}));

		// Update localStorage
		localStorage.setItem(
			`roundedExactNumber${currency.toUpperCase()}`,
			checked ? currencySettings[currency].count.toString() : "0",
		);
	};

	// Handle count change for currency
	const handleCountChange = (currency, increment) => {
		const currentCount = currencySettings[currency].count;
		const newCount = Math.min(Math.max(currentCount + increment, -3), 3); // Limit between -3 and 3

		setCurrencySettings((prev) => ({
			...prev,
			[currency]: {
				...prev[currency],
				count: newCount,
			},
		}));

		// Update localStorage
		localStorage.setItem(
			`roundedExactNumber${currency.toUpperCase()}`,
			newCount.toString(),
		);
	};

	// Handle modal save
	const handleSave = () => {
		// Save current settings to localStorage
		localStorage.setItem(
			"roundedExactNumberUZS",
			currencySettings.uzs.enabled
				? currencySettings.uzs.count.toString()
				: "0",
		);

		localStorage.setItem(
			"roundedExactNumberUSD",
			currencySettings.usd.enabled
				? currencySettings.usd.count.toString()
				: "0",
		);

		// Call the provided onSave handler
		onSave && onSave(currencySettings);
		onClose();
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Нархларни яхлитлаш"
			onSave={handleSave}
		>
			<div className="space-y-6">
				<div className="grid grid-cols-2 gap-4">
					{/* UZS Column */}
					<div className="border rounded-md p-4">
						<div className="flex justify-between items-center mb-3">
							<h3 className="font-medium text-gray-700">UZS</h3>
							<input
								type="checkbox"
								checked={currencySettings.uzs.enabled}
								onChange={(e) =>
									handleCurrencyEnabledChange(
										"uzs",
										e.target.checked,
									)
								}
								className="rounded border-gray-300"
							/>
						</div>

						{currencySettings.uzs.enabled && (
							<div className="flex items-center justify-between mt-2">
								<button
									onClick={() => handleCountChange("uzs", -1)}
									disabled={currencySettings.uzs.count <= -3}
									className="w-8 h-8 flex items-center justify-center border rounded-md bg-gray-100 text-gray-700"
								>
									-
								</button>
								<span className="text-lg font-medium">
									{currencySettings.uzs.count}
								</span>
								<button
									onClick={() => handleCountChange("uzs", 1)}
									disabled={currencySettings.uzs.count >= 3}
									className="w-8 h-8 flex items-center justify-center border rounded-md bg-gray-100 text-gray-700"
								>
									+
								</button>
							</div>
						)}
					</div>

					{/* USD Column */}
					<div className="border rounded-md p-4">
						<div className="flex justify-between items-center mb-3">
							<h3 className="font-medium text-gray-700">USD</h3>
							<input
								type="checkbox"
								checked={currencySettings.usd.enabled}
								onChange={(e) =>
									handleCurrencyEnabledChange(
										"usd",
										e.target.checked,
									)
								}
								className="rounded border-gray-300"
							/>
						</div>

						{currencySettings.usd.enabled && (
							<div className="flex items-center justify-between mt-2">
								<button
									onClick={() => handleCountChange("usd", -1)}
									disabled={currencySettings.usd.count <= -3}
									className="w-8 h-8 flex items-center justify-center border rounded-md bg-gray-100 text-gray-700"
								>
									-
								</button>
								<span className="text-lg font-medium">
									{currencySettings.usd.count}
								</span>
								<button
									onClick={() => handleCountChange("usd", 1)}
									disabled={currencySettings.usd.count >= 3}
									className="w-8 h-8 flex items-center justify-center border rounded-md bg-gray-100 text-gray-700"
								>
									+
								</button>
							</div>
						)}
					</div>
				</div>
			</div>
		</Modal>
	);
};

export default CurrencyRoundingModal;

