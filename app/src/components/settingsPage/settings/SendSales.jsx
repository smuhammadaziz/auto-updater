import React, { useState, useEffect } from "react";
import { toast, Toaster } from "sonner";
import { BiTime } from "react-icons/bi";
import SectionContainer from "./SectionContainer";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

const timeOptions = [
	{ label: "1 минут", value: 1 },
	{ label: "2 минут", value: 2 },
	{ label: "5 минут", value: 5 },
	{ label: "10 минут", value: 10 },
	{ label: "15 минут", value: 15 },
	{ label: "30 минут", value: 30 },
];

function SendSales() {
	const STORAGE_KEY = "selectedTimeInMs";
	const DEFAULT_TIME = 300000;

	const [selectedTime, setSelectedTime] = useState(() => {
		const saved = localStorage.getItem(STORAGE_KEY);
		return saved ? parseInt(saved) : DEFAULT_TIME;
	});

	useEffect(() => {
		if (!localStorage.getItem(STORAGE_KEY)) {
			localStorage.setItem(STORAGE_KEY, DEFAULT_TIME.toString());
		}
	}, []);

	const [language] = useLang("uz");

	const handleTimeSelect = (minutes) => {
		const milliseconds = minutes * 60 * 1000;
		setSelectedTime(milliseconds);
		localStorage.setItem(STORAGE_KEY, milliseconds.toString());
		toast.success(
			`${content[language].settingsDevice.newSendTime} ${minutes} минут`,
		);
	};

	return (
		<SectionContainer
			title={content[language].settingsDevice.autoSendSales}
		>
			<div className="flex flex-col space-y-4">
				<div className="text-sm text-gray-500 flex items-center gap-2">
					<BiTime className="w-4 h-4" />
					<span>
						{content[language].settingsDevice.setTimeToSend}
					</span>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{timeOptions.map(({ label, value }) => (
						<button
							key={value}
							onClick={() => handleTimeSelect(value)}
							className={`
                px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${
					selectedTime === value * 60 * 1000
						? "bg-blue-100 text-blue-700 border-2 border-blue-500"
						: "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
				}
              `}
						>
							{label}
						</button>
					))}
				</div>

				<p className="text-sm text-gray-600">
					{content[language].settingsDevice.currentSendTime}:{" "}
					{selectedTime / (60 * 1000)} минут
				</p>
			</div>

			<Toaster position="bottom-right" />
		</SectionContainer>
	);
}

export default SendSales;

