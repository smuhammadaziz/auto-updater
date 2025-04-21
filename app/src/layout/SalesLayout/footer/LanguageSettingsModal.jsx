import React from "react";
import { FaLanguage } from "react-icons/fa";
import Modal from "./Modal";

const LanguageSettingsModal = ({
	isOpen,
	onClose,
	onSave,
	tempSettings,
	setTempSettings,
}) => (
	<Modal
		isOpen={isOpen}
		onClose={onClose}
		title="Language Settings"
		onSave={onSave}
	>
		<div className="space-y-2">
			{[
				{ code: "en", name: "English" },
				{ code: "uz", name: "O'zbekcha" },
				{ code: "ru", name: "Русский" },
			].map((lang) => (
				<button
					key={lang.code}
					className={`w-full p-3 text-left rounded-lg flex items-center ${
						tempSettings.language === lang.code
							? "bg-blue-100 text-blue-600"
							: "hover:bg-gray-100"
					}`}
					onClick={() =>
						setTempSettings((prev) => ({
							...prev,
							language: lang.code,
						}))
					}
				>
					<FaLanguage className="mr-2" />
					{lang.name}
				</button>
			))}
		</div>
	</Modal>
);

export default LanguageSettingsModal;

