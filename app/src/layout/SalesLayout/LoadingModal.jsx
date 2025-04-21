import React from "react";

const LoadingModalSendSales = () => {
	return (
		<div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[100]">
			<div className="bg-white w-[400px] rounded-lg shadow-2xl p-6 flex justify-center items-center">
				<div className="w-14 h-14 border-4 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
			</div>
		</div>
	);
};

export default LoadingModalSendSales;

