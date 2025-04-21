import React from "react";
import { FaCheckCircle } from "react-icons/fa";

const SuccessModal = () => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[100]">
			<div className="bg-white w-[400px] rounded-lg shadow-2xl p-6 flex justify-center items-center">
				<FaCheckCircle className="w-14 h-14 text-green-500" />
			</div>
		</div>
	);
};

export default SuccessModal;

