import React from "react";
import { FiSettings } from "react-icons/fi";

const SettingsPanel = ({ isSettingsOpen, toggleSettings, settingsOptions }) => (
	<>
		<div
			className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
				isSettingsOpen ? "opacity-100" : "opacity-0 pointer-events-none"
			}`}
			onClick={toggleSettings}
		/>
		<div
			className={`fixed z-[50] bottom-0 left-0 right-0 bg-white shadow-2xl rounded-t-2xl transform transition-transform duration-300 ease-in-out ${
				isSettingsOpen ? "translate-y-0" : "translate-y-full"
			}`}
		>
			<div className="p-4 max-h-[80vh] overflow-y-auto">
				<div className="flex justify-between items-center mb-4 sticky top-0 bg-white py-2 px-4">
					<h2 className="text-xl font-semibold text-gray-800">
						Созламалар
					</h2>
					<button
						onClick={toggleSettings}
						className="text-gray-800 hover:text-gray-900 p-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
					>
						✕
					</button>
				</div>

				<div className="p-4 flex items-center">
					{settingsOptions.map((option, index) => (
						<button
							key={index}
							className="mr-4 flex items-center py-3 px-10 text-center bg-slate-100 rounded-lg hover:bg-blue-100"
							onClick={option.onClick}
						>
							<span className="mr-2">{option.icon}</span>{" "}
							{option.label}
						</button>
					))}
				</div>
			</div>
		</div>
	</>
);

export default SettingsPanel;

