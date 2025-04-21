import React, { useState, useEffect } from "react";
import { BiErrorCircle } from "react-icons/bi";
import { IoRefreshOutline } from "react-icons/io5";
import { FiLogOut } from "react-icons/fi";
import { MdFirstPage } from "react-icons/md";
import { ImExit } from "react-icons/im";
import { FaTimes } from "react-icons/fa";
import { IoExitOutline } from "react-icons/io5";
import { NavLink } from "react-router-dom";

import content from "../localization/content";
import useLang from "../hooks/useLang";
import nodeUrl from "../links";

const { getCurrentWindow, app } = window.require("@electron/remote");

const DeadlineOverlay = () => {
	const [showOverlay, setShowOverlay] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const [timer, setTimer] = useState(60);
	const [isUpdating, setIsUpdating] = useState(false);
	const [language] = useLang("uz");
	const [isExitModalOpen, setIsExitModalOpen] = useState(false);

	const ksb_id = localStorage.getItem("ksbIdNumber");
	const [data, setData] = useState();

	const makeApiRequest = async () => {
		try {
			const response = await fetch(`${nodeUrl}/api/${ksb_id}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Connection: "keep-alive",
				},
				keepalive: true,
			});

			const data = await response.json();
			setData(data);

			if (data && data.response && data.response.its) {
				const itsDate = new Date(data.response.its);
				const year = itsDate.getFullYear();
				const month = String(itsDate.getMonth() + 1).padStart(2, "0");
				const day = String(itsDate.getDate()).padStart(2, "0");

				const deadlineString = `${year}-${month}-${day}T09:59:59`;

				localStorage.setItem("its_deadline", deadlineString);

				if (new Date() < new Date(`${deadlineString}`)) {
					window.location.reload();
				}
			}

			return data;
		} catch (error) {
			console.log("API request error:", error);
			return null;
		}
	};

	const checkDeadline = () => {
		const deadline = localStorage.getItem("its_deadline");
		if (!deadline) return false;
		const deadlineDate = new Date(deadline);
		return new Date() > deadlineDate;
	};

	useEffect(() => {
		const isExpired = checkDeadline();
		if (isExpired) {
			setShowOverlay(true);
			setTimeout(() => {
				setIsVisible(true);
			}, 50);
		}

		const interval = setInterval(() => {
			const isExpired = checkDeadline();
			if (isExpired && !showOverlay) {
				setShowOverlay(true);
				setTimeout(() => {
					setIsVisible(true);
				}, 50);
			}
		}, 60000);

		return () => clearInterval(interval);
	}, [showOverlay]);

	useEffect(() => {
		let countdown;
		if (showOverlay && isVisible) {
			countdown = setInterval(() => {
				setTimer((prev) => prev - 1);
			}, 1000);
		}

		return () => clearInterval(countdown);
	}, [showOverlay, isVisible]);

	useEffect(() => {
		if (timer <= 1 && timer > 0 && showOverlay) {
			makeApiRequest();
		} else if (timer <= 0) {
			setTimer(60);
			if (showOverlay) {
				makeApiRequest();
			}
		}
	}, [timer, showOverlay]);

	const handleManualUpdate = () => {
		setIsUpdating(true);
		makeApiRequest().finally(() => {
			setIsUpdating(false);
		});
	};

	const handleExit = () => {
		setIsVisible(false);
		setTimeout(() => {
			setShowOverlay(false);
			window.close();
		}, 300);
	};
	const onQuit = () => app.quit();

	if (!showOverlay) return null;

	return (
		<div
			className={`fixed inset-0 z-[790] transition-opacity duration-300 ${
				isVisible ? "opacity-100" : "opacity-0"
			}`}
		>
			<div
				className={`absolute inset-0 backdrop-blur-sm bg-black/80 transition-all duration-300 ${
					isVisible ? "scale-100" : "scale-95"
				}`}
			/>

			<div className="relative h-full flex flex-col items-center justify-center px-6 py-12">
				<div
					className={`w-full max-w-4xl flex flex-col items-center transition-all duration-300 ${
						isVisible
							? "scale-100 translate-y-0"
							: "scale-95 translate-y-4"
					}`}
				>
					<div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-12 w-full">
						<div className="text-center mb-12">
							<BiErrorCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
							<h2 className="text-3xl font-medium text-gray-900 mb-4">
								{content[language].itsDeadlineModal.yourITS}
							</h2>
							<p className="text-gray-600 text-xl max-w-lg mx-auto">
								{content[language].itsDeadlineModal.updateITS}
							</p>
						</div>

						<div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
							<button
								onClick={handleManualUpdate}
								disabled={isUpdating}
								className={`w-full flex items-center justify-center ${
									isUpdating
										? "bg-green-500"
										: "bg-green-700 hover:bg-green-600"
								} text-white py-4 px-6 rounded-lg font-medium text-lg transition-all`}
							>
								<IoRefreshOutline className="w-5 h-5 mr-3" />
								<span>
									{content[language].enterpriseInfo.update} (
									{timer})
								</span>
							</button>
							{/* <NavLink
								to="/intro"
								className="w-full flex items-center justify-center border border-gray-300 bg-white text-black py-4 px-6 rounded-lg font-medium text-lg transition-all hover:bg-gray-100"
							>
								<MdFirstPage className="w-5 h-5 mr-3" />
								<span>
									{content[language].enterpriseInfo.signout}
								</span>
							</NavLink> */}
							<button
								onClick={() => setIsExitModalOpen(true)}
								className="w-full flex items-center justify-center bg-white border border-gray-300 text-black py-4 px-6 rounded-lg font-medium text-lg transition-all hover:bg-gray-100"
							>
								<FiLogOut className="w-5 h-5 mr-3" />
								<span>
									{
										content[language].itsDeadlineModal
											.exitProgram
									}
								</span>
							</button>
						</div>
					</div>
				</div>
			</div>

			{isExitModalOpen && (
				<div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-8">
					<div className="bg-gray-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl">
						<div className="px-6 py-8 text-center">
							<h2 className="text-2xl font-bold text-black mb-2">
								{content[language].exit.exit}
							</h2>
							<p className="text-black text-lg mb-6">
								{content[language].exit.exitTest}
							</p>
						</div>

						<div className="flex divide-x divide-gray-300 border-t border-gray-300">
							<button
								ref={cancelButtonRef}
								onClick={() => setIsExitModalOpen(false)}
								className={`flex-1 py-4 text-lg font-medium flex items-center justify-center transition-all duration-200 ${
									focusedButton === "cancel"
										? "bg-gray-300 text-blue-600 font-bold"
										: "text-blue-500 hover:bg-gray-300"
								} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset`}
							>
								{
									content[language].salesPage
										.headerDiscountCancel
								}
							</button>

							<button
								ref={okButtonRef}
								onClick={onQuit}
								className={`flex-1 py-4 text-lg font-medium flex items-center justify-center transition-all duration-200 ${
									focusedButton === "ok"
										? "bg-gray-300 text-blue-600 font-bold"
										: "text-blue-500 hover:bg-gray-300"
								} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset`}
							>
								OK
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default DeadlineOverlay;

