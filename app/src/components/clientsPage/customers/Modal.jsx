import React from "react";
import { FaTimes as FaClose } from "react-icons/fa";

const Modal = ({ isOpen, onClose, children, title }) => {
	if (!isOpen) return null;

	const handleOverlayClick = (e) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[777]"
			onClick={handleOverlayClick} // Close modal when clicking on overlay
		>
			<div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg overflow-hidden">
				<div className="flex justify-between items-center mb-4 border-b pb-2">
					<h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
						<span>{title}</span>
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700"
					>
						<FaClose />
					</button>
				</div>
				<div className="space-y-4">{children}</div>
			</div>
		</div>
	);
};

export default Modal;

