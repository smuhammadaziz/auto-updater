import React, { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FaUnlockAlt } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import SectionContainer from "./SectionContainer";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";
import SendSales from "./SendSales";
import TimeoutSettings from "./Timeout";
import nodeUrl from "../../../links";

const MessageNotifications = () => {
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	// const [loading, setLoading] = useState(false);
	const [status, setStatus] = useState(null);
	const [currentModal, setCurrentModal] = useState(null);

	const [language] = useLang("uz");

	const userPassword = localStorage.getItem("userPassword");
	const ksbId = localStorage.getItem("ksbIdNumber");
	const deviceId = localStorage.getItem("device_id");
	const userType = localStorage.getItem("userType");
	const ipaddressPort = localStorage.getItem("ipaddress:port");
	const mainDatabase = localStorage.getItem("mainDatabase");

	const handleRecovery = async () => {
		if (password !== userPassword) {
			setError("Incorrect password. Please try again.");
			return;
		}

		setError("");
		// setLoading(true);
		setStatus(null);
		setCurrentModal("loading");

		const authHeader =
			"Basic " +
			Buffer.from(`${userType}:${userPassword}`).toString("base64");

		const apiBody = {
			"ipaddress:port": ipaddressPort,
			database: mainDatabase,
			username: userType,
			password: userPassword,
		};

		try {
			const response = await fetch(
				`${nodeUrl}/api/recovery/data/${ksbId}/${deviceId}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(apiBody),
				},
			);

			const result = await response.json();
			setStatus(
				result.status === "successfully"
					? content[language].settingsUsers.recoveryDataSuccess
					: content[language].firstSync.tryAgain,
			);
			setCurrentModal("result");
		} catch (err) {
			// setLoading(false);
			setStatus("An error occurred while processing your request.");
			setCurrentModal("result");
		}
	};

	return (
		<div>
			<SectionContainer title={content[language].settingsUsers.recovery}>
				<div className="flex flex-col">
					<button
						onClick={() => setCurrentModal("password")}
						className="px-4 py-2 bg-red-600 uppercase font-semibold w-[300px] hover:bg-red-700 text-white rounded-lg shadow-md transition-all duration-300 text-sm"
					>
						{content[language].settingsUsers.recoveryNow}
					</button>

					{currentModal === "password" && (
						<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[500]">
							<div className="relative w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
								<button
									className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
									onClick={() => setCurrentModal(null)}
								>
									<IoClose className="text-2xl" />
								</button>
								<h2 className="text-2xl font-semibold text-center text-black mb-6">
									{
										content[language].settingsUsers
											.recoveryNow
									}
								</h2>
								<p className="text-base text-gray-700 text-center mb-6">
									{
										content[language].settingsUsers
											.recoveryEnterYourPassword
									}
								</p>
								<div className="flex flex-col space-y-4">
									<input
										type="password"
										placeholder=""
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										className="w-full px-4 py-2 rounded-lg bg-gray-100 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									{error && (
										<p className="text-red-600 text-center text-sm">
											{error}
										</p>
									)}
									<button
										onClick={handleRecovery}
										className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white shadow-lg transition-all duration-300"
									>
										<FaUnlockAlt className="inline mr-2" />
										{
											content[language].settingsUsers
												.recoveryNow
										}
									</button>
								</div>
							</div>
						</div>
					)}

					{currentModal === "loading" && (
						<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[500]">
							<div className="relative w-full max-w-md p-8 bg-white rounded-2xl shadow-lg flex flex-col items-center">
								<AiOutlineLoading3Quarters className="animate-spin text-blue-500 text-4xl mb-4" />
								<p className="text-black text-center text-lg">
									{
										content[language].settingsUsers
											.recoveryProcessingRequest
									}
								</p>
							</div>
						</div>
					)}

					{currentModal === "result" && (
						<div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[500]">
							<div className="relative w-full max-w-md p-8 bg-white rounded-2xl shadow-lg flex flex-col items-center">
								<button
									className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
									onClick={() => setCurrentModal(null)}
								>
									<IoClose className="text-2xl" />
								</button>
								<h2 className="text-2xl font-semibold text-center text-black mb-6">
									{content[language].settingsUsers.recovery}
								</h2>
								<p
									className={`text-center text-base font-semibold mb-6 text-green-600`}
								>
									{status}
								</p>
								<button
									onClick={() => setCurrentModal(null)}
									className="px-10 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white shadow-lg transition-all duration-300"
								>
									OK
								</button>
							</div>
						</div>
					)}
				</div>
			</SectionContainer>

			<div className="mt-6">
				<SendSales />
			</div>

			<div className="mt-6">
				<TimeoutSettings />
			</div>
		</div>
	);
};

export default MessageNotifications;

