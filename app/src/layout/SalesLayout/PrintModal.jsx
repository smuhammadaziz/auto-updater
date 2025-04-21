import React, { useEffect, useRef, useState } from "react";
import { IoClose, IoPrint } from "react-icons/io5";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

const PrintingModal = ({
	setPrintModal,
	handleSaveSales,
	handleSaveSalesWithPrint,
}) => {
	const [language] = useLang("uz");
	const deviceSettings = JSON.parse(localStorage.getItem("settingsDevice"));

	const [focusedButton, setFocusedButton] = useState("yes");
	const [timerCount, setTimerCount] = useState(deviceSettings.time_print);
	const yesButtonRef = useRef(null);
	const noButtonRef = useRef(null);

	useEffect(() => {
		if (yesButtonRef.current) {
			yesButtonRef.current.focus();
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (e) => {
			if (e.key === "ArrowLeft") {
				setFocusedButton("no");
				noButtonRef.current?.focus();
			} else if (e.key === "ArrowRight") {
				setFocusedButton("yes");
				yesButtonRef.current?.focus();
			} else if (e.key === "Enter") {
				if (focusedButton === "yes") {
					setPrintModal(false);
					handleSaveSalesWithPrint();
				} else {
					setPrintModal(false);
					handleSaveSales();
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [focusedButton]);

	// Countdown timer effect
	useEffect(() => {
		if (timerCount <= 0) {
			setPrintModal(false);
			handleSaveSalesWithPrint();
			return;
		}

		const interval = setInterval(() => {
			setTimerCount((prev) => prev - 1);
		}, 1000);

		return () => clearInterval(interval);
	}, [timerCount]);

	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[100]">
			<div className="bg-white w-[450px] py-8 px-6 rounded-lg shadow-2xl flex flex-col items-center relative">
				<button
					onClick={() => setPrintModal(false)}
					className="absolute top-5 right-5 text-gray-500 hover:text-gray-700"
				>
					<IoClose className="w-6 h-6" />
				</button>
				<IoPrint className="w-16 h-16 text-blue-600 mb-4" />
				<h2 className="text-lg font-medium text-gray-800 text-center mb-6">
					{content[language].paymentModal.printCheck}
				</h2>
				<div className="flex w-full justify-between">
					<button
						ref={noButtonRef}
						onClick={() => {
							setPrintModal(false);
							handleSaveSales();
						}}
						className="w-1/2 py-3 bg-gray-200 text-gray-800 text-md font-medium rounded-lg hover:bg-gray-300 transition-all duration-200 mr-2"
					>
						{content[language].paymentModal.no}
					</button>
					<button
						ref={yesButtonRef}
						onClick={() => {
							setPrintModal(false);
							handleSaveSalesWithPrint();
						}}
						className="w-1/2 py-3 bg-blue-600 text-white text-md font-medium rounded-lg hover:bg-blue-700 transition-all duration-200 ml-2"
					>
						{`${content[language].paymentModal.yes} (${timerCount})`}
					</button>
				</div>
			</div>
		</div>
	);
};

export default PrintingModal;

