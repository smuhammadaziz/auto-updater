import React from "react";
import { FaTimes, FaSave } from "react-icons/fa";

const Modal = ({ isOpen, onClose, title, children, onSave }) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-100 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
			<div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-xl z-60">
				<div className="flex justify-between items-center p-4 border-b">
					<h2 className="text-xl font-semibold text-gray-800">
						{title}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 transition-colors"
					>
						<FaTimes className="text-xl" />
					</button>
				</div>
				<div className="p-4">
					{children}
					<div className="mt-6 flex justify-end space-x-3 border-t pt-4">
						<button
							onClick={onClose}
							className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
						>
							Бекор қилиш
						</button>
						<button
							onClick={onSave}
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
						>
							<FaSave className="mr-2" />
							Сақлаш
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Modal;

