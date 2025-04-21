import React, { useState, useEffect, useRef } from "react";
import { Layout } from "../../layout/Layout";
import { Toaster, toast } from "sonner";
import {
	FaCheckCircle,
	FaExclamationCircle,
	FaKey,
	FaWifi,
	FaTimesCircle,
} from "react-icons/fa";

import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";
import Loader from "../../common/loader";
import content from "../../localization/content";
import useLang from "../../hooks/useLang";
import { MdOutlinePortableWifiOff } from "react-icons/md";

import nodeUrl from "../../links";

function IntroPageKSB({ setVerified }) {
	const [ksbId, setKsbId] = useState("");
	const [loading, setLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [showNetworkModal, setShowNetworkModal] = useState(false);
	const navigate = useNavigate();
	const [language] = useLang("uz");
	const [countdown, setCountdown] = useState(10);
	const [canInteract, setCanInteract] = useState(false);

	const inputRef = useRef(null);

	const makeApiRequest = async (ksbId) => {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 120000);

		try {
			const response = await fetch(`${nodeUrl}/api/${ksbId}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Connection: "keep-alive",
				},
				signal: controller.signal,
				cache: "no-cache",
				keepalive: true,
			});

			return await response.json();
		} catch (error) {
			clearTimeout(timeoutId);
			throw error;
		}
	};

	const handleSignIn = async (e) => {
		e.preventDefault();

		if (!canInteract) {
			return;
		}

		if (!navigator.onLine) {
			setShowNetworkModal(true);
			return;
		}

		if (!ksbId) {
			toast.error(content[language].intro.pleaseEnterKsb, {
				icon: <FaExclamationCircle />,
				style: { backgroundColor: "#ef4444", color: "white" },
			});
			return;
		}

		if (ksbId.length < 8) {
			toast.error(
				content[language].intro.pleaseEnter8 || {
					icon: <FaExclamationCircle />,
					style: { backgroundColor: "#ef4444", color: "white" },
				},
			);
			return;
		}

		setIsSubmitting(true);

		try {
			const apiResponse = await makeApiRequest(ksbId);

			console.log(apiResponse);

			const getMessage = () => {
				if (apiResponse.response?.status === "successfully") {
					return content[language].intro.success;
				}
				return (
					apiResponse.message?.[language] ||
					content[language].intro.error
				);
			};

			if (apiResponse.response?.status === "successfully") {
				const deviceId = apiResponse.storage?.[
					Object.keys(apiResponse.storage)[0]
				]?.find(
					(item) => item.ksb_id === apiResponse.response.ksb_id,
				)?.device_id;

				const matchedDevice = apiResponse.storage?.[deviceId]?.find(
					(item) => item.ksb_id === apiResponse.response.ksb_id,
				);

				if (matchedDevice) {
					localStorage.setItem("isVerified", "true");
					setVerified("true");
					localStorage.setItem(
						"ksbIdNumber",
						apiResponse.response.ksb_id,
					);
					localStorage.setItem("device_id", matchedDevice.device_id);
					localStorage.setItem(
						"device_info",
						matchedDevice.device_info,
					);
					localStorage.setItem(
						"entered_date_time",
						matchedDevice.entered_date,
					);
					localStorage.setItem(
						"devicePermission",
						matchedDevice.permission,
					);
					const dateOnly = apiResponse.response.its.split("T")[0]; // get "2025-04-05"
					const endOfDay = `${dateOnly}T09:59:59`;

					localStorage.setItem("its_deadline", endOfDay);
					localStorage.setItem(
						"mainUsername",
						apiResponse.response.user,
					);
					localStorage.setItem(
						"mainPassword",
						apiResponse.response.password,
					);
					localStorage.setItem(
						"mainDatabase",
						apiResponse.response.info_base,
					);
					localStorage.setItem(
						"ipaddress:port",
						`${apiResponse.response.ip}:${apiResponse.response.port}`,
					);

					toast.success(getMessage(), {
						icon: <FaCheckCircle />,
						style: { backgroundColor: "#22c55e", color: "white" },
					});

					navigate("/login");
				} else {
					toast.error("Device information not found!", {
						icon: <FaExclamationCircle />,
						style: { backgroundColor: "#ef4444", color: "white" },
					});
				}
			} else {
				toast.error(getMessage(), {
					icon: <FaExclamationCircle />,
					style: { backgroundColor: "#ef4444", color: "white" },
				});
			}
		} catch (error) {
			console.error("Error:", error);
			if (error.name === "AbortError") {
				toast.error(content[language].intro.requestTimeOut, {
					icon: <FaExclamationCircle />,
					style: { backgroundColor: "#ef4444", color: "white" },
				});
			} else {
				toast.error(content[language].intro.serverError, {
					icon: <FaExclamationCircle />,
					style: { backgroundColor: "#ef4444", color: "white" },
				});
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	useEffect(() => {
		if (!loading && isOnline && inputRef.current) {
			inputRef.current.focus();
		}
	}, [loading, isOnline]);

	useEffect(() => {
		if (countdown > 0) {
			const timer = setTimeout(() => {
				setCountdown(countdown - 1);
			}, 1000);

			return () => clearTimeout(timer);
		} else {
			setCanInteract(true);
		}
	}, [countdown]);

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && isOnline && canInteract) {
			handleSignIn(e);
		}
	};

	const NetworkModal = () => {
		return (
			<div className="fixed inset-0 z-[40] flex items-center justify-center">
				<div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fadeIn" />
				<div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 transform animate-slideIn">
					<div className="p-6">
						<div className="flex items-start space-x-4">
							<div className="flex-shrink-0">
								<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center animate-pulse">
									<MdOutlinePortableWifiOff className="text-red-600 w-7 h-7" />
								</div>
							</div>
							<div className="flex-1">
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									{content[language].intro.network}
								</h3>
								<div className="flex items-center space-x-2 text-sm text-gray-500">
									<div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full" />
									<span>{content[language].intro.try}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	};

	useEffect(() => {
		const loadingTimer = setTimeout(() => setLoading(false), 555);

		const handleOnline = () => {
			setIsOnline(true);
			setShowNetworkModal(false);
			toast.success(content[language].intro.networkRestored, {
				icon: <FaWifi />,
				style: { backgroundColor: "#22c55e", color: "white" },
			});
		};

		const handleOffline = () => {
			setIsOnline(false);
			setShowNetworkModal(true);
			toast.error(content[language].intro.networkLost, {
				icon: <FaTimesCircle />,
				style: { backgroundColor: "#ef4444", color: "white" },
			});
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			clearTimeout(loadingTimer);
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, [language]);

	return (
		<Layout>
			{loading ? (
				<Loader />
			) : (
				<div className="flex fixed w-full h-screen items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-600">
					<div className="bg-white p-10 rounded-2xl shadow-xl transform hover:scale-105 transition-transform duration-300 space-y-8 max-w-md">
						<div className="text-center space-y-4">
							<img
								src={logo}
								alt="logo"
								className="w-48 mx-auto"
							/>
							<h1 className="text-3xl font-bold text-gray-800">
								{content[language].intro.welcome}
							</h1>
							<p className="text-gray-600">
								{content[language].intro.please}
							</p>
						</div>
						<div className="relative">
							<input
								ref={inputRef}
								type="text"
								placeholder={content[language].intro.enter}
								value={ksbId}
								onChange={(e) =>
									setKsbId(e.target.value.slice(0, 8))
								}
								onKeyDown={handleKeyDown}
								maxLength={8}
								disabled={!isOnline || !canInteract}
								className={`w-full px-5 py-3 pl-10 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition duration-200 ${
									!isOnline || !canInteract
										? "bg-gray-200 cursor-not-allowed"
										: ""
								}`}
							/>
							<FaKey
								className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
								size={20}
							/>
						</div>
						{!canInteract && (
							<div className="text-center text-gray-600 animate-pulse">
								{/* Please wait {countdown} seconds... */}
								Илтимос {countdown} секунд кутинг...
							</div>
						)}
						<div>
							<button
								onClick={handleSignIn}
								disabled={
									!isOnline || isSubmitting || !canInteract
								}
								className={`w-full py-3 text-white font-semibold rounded-lg shadow-lg transition duration-300 text-lg ${
									isOnline && !isSubmitting && canInteract
										? "bg-blue-600 hover:bg-blue-700"
										: "bg-gray-400 cursor-not-allowed"
								}`}
							>
								{isSubmitting ? (
									<div className="flex items-center justify-center space-x-2">
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
										<span>
											{content[language].intro.checking}
										</span>
									</div>
								) : (
									content[language].intro.send
								)}
							</button>
						</div>
					</div>
				</div>
			)}
			{showNetworkModal && <NetworkModal />}
			<Toaster position="bottom-right" />
		</Layout>
	);
}

export default IntroPageKSB;

