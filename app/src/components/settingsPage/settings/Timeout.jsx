import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { BiTime, BiSave } from "react-icons/bi";
import SectionContainer from "./SectionContainer";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

const TIMEOUT_STORAGE_KEY = "timeoutSeconds";
const DEFAULT_TIMEOUT = 180;

function TimeoutSettings() {
	const [savedTimeout, setSavedTimeout] = useState(() => {
		const saved = localStorage.getItem(TIMEOUT_STORAGE_KEY);
		return saved ? parseInt(saved) : DEFAULT_TIMEOUT;
	});

	const [inputValue, setInputValue] = useState(savedTimeout);

	const [language] = useLang("uz");

	useEffect(() => {
		if (!localStorage.getItem(TIMEOUT_STORAGE_KEY)) {
			localStorage.setItem(
				TIMEOUT_STORAGE_KEY,
				DEFAULT_TIMEOUT.toString(),
			);
		}
	}, []);

	const handleSave = () => {
		if (inputValue && inputValue > 0 && inputValue <= 3600) {
			setSavedTimeout(inputValue);
			localStorage.setItem(TIMEOUT_STORAGE_KEY, inputValue.toString());
			toast.success(
				`${content[language].settingsDevice.timeoutSaved} ${inputValue}`,
			);
		} else {
			toast.error("1-3600");
		}
	};

	const handleFocus = (e) => {
		e.target.select();
	};

	return (
		<SectionContainer
			title={content[language].settingsDevice.timeoutSettings}
		>
			<style>
				{`
          input[type="number"]::-webkit-outer-spin-button,
          input[type="number"]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
          
          input[type="number"] {
            -moz-appearance: textfield; /* For Firefox */
          }
        `}
			</style>
			<div className="flex flex-col space-y-4 w-[500px]">
				<div className="text-sm text-gray-500 flex items-center gap-2">
					<BiTime className="w-4 h-4" />
					<span>
						{content[language].settingsDevice.setTimeoutForYou}
					</span>
				</div>

				<div className="flex gap-3">
					<div className="flex-1 flex items-center gap-2">
						<input
							type="number"
							value={inputValue}
							onChange={(e) =>
								setInputValue(parseInt(e.target.value) || "")
							}
							style={{
								WebkitAppearance: "none",
								MozAppearance: "textfield",
								margin: 0,
							}}
							onFocus={handleFocus}
							className="w-full px-4 py-2 border border-gray-200 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 
                       focus:border-transparent text-gray-800"
							min="1"
							max="3600"
							placeholder=""
						/>
					</div>
					<button
						onClick={handleSave}
						className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                     transition-colors duration-200 flex items-center gap-2 whitespace-nowrap"
					>
						<BiSave className="w-5 h-5" />
						{content[language].settingsDevice.saveTimeout}
					</button>
				</div>
			</div>
		</SectionContainer>
	);
}

export default TimeoutSettings;

