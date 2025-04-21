import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import Modal from "./Modal";

const ThemeSettingsModal = ({
	isOpen,
	onClose,
	onSave,
	tempSettings,
	setTempSettings,
}) => (
	<Modal
		isOpen={isOpen}
		onClose={onClose}
		title="Theme Settings"
		onSave={onSave}
	>
		<div className="flex justify-center space-x-4">
			<button
				className={`p-4 rounded-lg flex flex-col items-center ${
					tempSettings.theme === "light"
						? "bg-blue-100 text-blue-600"
						: "bg-gray-100 text-gray-600"
				}`}
				onClick={() =>
					setTempSettings((prev) => ({ ...prev, theme: "light" }))
				}
			>
				<FaSun className="text-2xl mb-2" />
				<span>Light</span>
			</button>
			<button
				className={`p-4 rounded-lg flex flex-col items-center ${
					tempSettings.theme === "dark"
						? "bg-blue-100 text-blue-600"
						: "bg-gray-100 text-gray-600"
				}`}
				onClick={() =>
					setTempSettings((prev) => ({ ...prev, theme: "dark" }))
				}
			>
				<FaMoon className="text-2xl mb-2" />
				<span>Dark</span>
			</button>
		</div>
	</Modal>
);

export default ThemeSettingsModal;

