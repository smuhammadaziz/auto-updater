import React, { useEffect } from "react";

const ProductModal = ({ isOpen, onClose, title, children }) => {
	useEffect(() => {
		const handleOutsideClick = (e) => {
			if (e.target === e.currentTarget) {
				onClose();
			}
		};

		if (isOpen) {
			document.body.addEventListener("click", handleOutsideClick);
		}

		return () => {
			document.body.removeEventListener("click", handleOutsideClick);
		};
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[555] flex items-center justify-center bg-black bg-opacity-50"
			onClick={onClose}
		>
			<div
				className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-[600px] overflow-hidden"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="p-6 flex justify-between items-center border-b border-gray-300">
					<h2 className="text-3xl font-semibold text-gray-800">
						{title}
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 transition-colors"
					>
						✕
					</button>
				</div>

				<div className=" h-[calc(100%-72px)] overflow-y-auto">
					{children}
				</div>
			</div>
		</div>
	);
};

export default ProductModal;

