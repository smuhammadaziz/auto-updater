import React, { useEffect } from "react";

function PasswordModal({
	isFirstTimePassword,
	userType,
	passwordError,
	handleSetPassword,
	onClose,
}) {
	useEffect(() => {
		const handleKeyPress = (e) => {
			if (e.key === "Enter" && isFirstTimePassword) {
				handleSetPassword();
			} else if (e.key === "Escape") {
				onClose();
			}
		};

		window.addEventListener("keydown", handleKeyPress);
		return () => window.removeEventListener("keydown", handleKeyPress);
	}, [isFirstTimePassword, handleSetPassword, onClose]);

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white p-6 rounded-lg shadow-xl w-96">
				<h2 className="text-xl font-bold mb-4">
					{isFirstTimePassword ? "Set Password" : "Password Error"}
				</h2>
				{isFirstTimePassword ? (
					<>
						<p className="mb-4">
							Please set a password for {userType}
						</p>
						<button
							onClick={handleSetPassword}
							className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
						>
							Set Password
						</button>
					</>
				) : (
					<>
						<p className="text-red-500 mb-4">{passwordError}</p>
						<p className="mb-4">Please try again</p>
					</>
				)}
				<button
					onClick={onClose}
					className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
				>
					Close
				</button>
			</div>
		</div>
	);
}

export default PasswordModal;

