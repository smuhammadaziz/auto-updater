import React, { useRef, useEffect } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import content from "../../localization/content";
import useLang from "../../hooks/useLang";

const ErrorModal = ({
	errorMessage,
	setErrorModal,
	errorModal,
	searchInputRef,
	onClose,
	handleCreateEmptySalesInDatabase,
	handleDeleleOneSalesFromDatabase,
}) => {
	const [language] = useLang("uz");
	const errorButtonRef = useRef(null);

	useEffect(() => {
		if (errorModal && errorButtonRef.current) {
			errorButtonRef.current.focus();
		}
	}, [errorModal]);

	return (
		<div
			onKeyDown={(e) => {
				if (e.key === "Enter") {
					setErrorModal(false);
					handleCreateEmptySalesInDatabase();
					handleDeleleOneSalesFromDatabase();
					onClose();

					searchInputRef.current.focus();
					searchInputRef.current.select();
					window.location.reload();
				}
			}}
			className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-[100]"
		>
			<div className="bg-white w-[400px] rounded-lg shadow-xl overflow-hidden">
				<div className="bg-red-500 px-4 py-3">
					<h2 className="text-base font-medium text-white">
						{content[language].paymentModal.problemToSendSales}
					</h2>
				</div>
				<div className="p-4">
					<div className="flex items-start mb-4">
						<FaExclamationTriangle
							className="w-6 h-6 text-lg text-red-500 mr-3"
							size={30}
						/>
						<p className="text-sm text-gray-700">
							{errorMessage ||
								"An error occurred during the transaction."}
						</p>
					</div>
					<div className="flex justify-end">
						<button
							ref={errorButtonRef}
							onClick={() => setErrorModal(false)}
							className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-all duration-200"
						>
							OK
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ErrorModal;

