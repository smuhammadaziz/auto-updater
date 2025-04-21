import { FC, useEffect, useState, useRef } from "react";
import { IoCloseOutline, IoRemove } from "react-icons/io5";
import { TbArrowsDiagonalMinimize2, TbMaximize } from "react-icons/tb";
import { RiInformation2Fill } from "react-icons/ri";
import { ImExit } from "react-icons/im";
import { FaTimes } from "react-icons/fa";
import { FaWifi } from "react-icons/fa6";
import { MdWifiOff } from "react-icons/md";
import { IoExitOutline } from "react-icons/io5";
import { MdSignalWifiStatusbarConnectedNoInternet4 } from "react-icons/md";

import logo from "../../assets/icon.png";
import { EnterpriseInfoModal } from "./EnterpriseInfoModal";
import content from "../../localization/content";
import useLang from "../../hooks/useLang";
import nodeUrl from "../../links";
import { NavLink } from "react-router-dom";

const { getCurrentWindow, app } = window.require("@electron/remote");

export const Titlebar: FC = () => {
	const currentWindow = getCurrentWindow();
	const [maximized, setMaximized] = useState<boolean>(
		currentWindow.isMaximized(),
	);
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [isNetworkAvailable, setIsNetworkAvailable] = useState(true);
	const [apiStatus, setApiStatus] = useState<"ok" | "error" | "checking">(
		"checking",
	);

	const [language] = useLang();

	const [isExitModalOpen, setIsExitModalOpen] = useState(false);
	const [focusedButton, setFocusedButton] = useState<"ok" | "cancel">("ok");
	const okButtonRef = useRef<HTMLAnchorElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	const checkNetworkStatus = () => {
		if (navigator.onLine) {
			setIsNetworkAvailable(true);
			checkApiConnection();
		} else {
			setIsNetworkAvailable(false);
			setApiStatus("checking");
		}
	};

	const checkApiConnection = async () => {
		const ksbId = localStorage.getItem("ksbIdNumber");
		const ipaddressPort = localStorage.getItem("ipaddress:port");
		const mainDatabase = localStorage.getItem("mainDatabase");
		const userType = localStorage.getItem("userType");
		const userPassword = localStorage.getItem("userPassword");

		try {
			const currentBody = {
				"ipaddress:port": ipaddressPort,
				database: mainDatabase,
				username: userType,
				password: userPassword,
			};

			const response = await fetch(`${nodeUrl}/api/check/ping/${ksbId}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(currentBody),
			});
			setApiStatus(response.ok ? "ok" : "error");
		} catch (err) {
			setApiStatus("error");
			console.error(err);
		}
	};

	useEffect(() => {
		checkNetworkStatus();

		window.addEventListener("online", checkNetworkStatus);
		window.addEventListener("offline", checkNetworkStatus);

		let apiCheckInterval: NodeJS.Timeout;
		if (isNetworkAvailable) {
			apiCheckInterval = setInterval(checkApiConnection, 3 * 60 * 1000);
		}

		return () => {
			window.removeEventListener("online", checkNetworkStatus);
			window.removeEventListener("offline", checkNetworkStatus);
			if (apiCheckInterval) {
				clearInterval(apiCheckInterval);
			}
		};
	}, [isNetworkAvailable]);

	useEffect(() => {
		const icon = document.getElementById("icon") as HTMLElement;
		if (icon) {
			icon.ondragstart = () => false;
		}
	}, []);

	useEffect(() => {
		if (isExitModalOpen) {
			okButtonRef.current?.focus();
		}
	}, [isExitModalOpen]);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (!isExitModalOpen) return;

			if (e.key === "ArrowLeft") {
				setFocusedButton("cancel");
				cancelButtonRef.current?.focus();
			} else if (e.key === "ArrowRight") {
				setFocusedButton("ok");
				okButtonRef.current?.focus();
			} else if (e.key === "Enter") {
				if (focusedButton === "ok") {
					okButtonRef.current?.click();
				} else {
					setIsExitModalOpen(false);
				}
			} else if (e.key === "Escape") {
				setIsExitModalOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isExitModalOpen, focusedButton]);

	const onMinimize = () => currentWindow.minimize();
	const onMaximize = () => {
		const isMaximized = currentWindow.isMaximized();
		setMaximized(!isMaximized);
		isMaximized ? currentWindow.unmaximize() : currentWindow.maximize();
	};
	const onQuit = () => app.quit();

	const enterpriseTitle = localStorage.getItem("enterpriseName");
	const ksbId = localStorage.getItem("ksbIdNumber");

	const getNetworkStatusIcon = () => {
		if (!isNetworkAvailable) {
			return {
				icon: MdWifiOff,
				title: "Интернет мавжуд эмас",
				className: "text-red-600 font-bold hover:text-red-600",
			};
		}
		if (apiStatus === "ok") {
			return {
				icon: FaWifi,
				title: "Интернет мавжуд",
				className: "text-green-600 font-bold hover:text-green-600",
			};
		}
		return {
			icon: MdSignalWifiStatusbarConnectedNoInternet4,
			title: "Сервер билан алоқа йўқ",
			className: "text-yellow-600 font-bold hover:text-yellow-600",
		};
	};

	const NetworkStatus = () => {
		const { icon: Icon, title, className } = getNetworkStatusIcon();

		return (
			<div className="network-status-indicator transition-all duration-300 ease-in-out mr-5">
				<button
					title={title}
					className="cursor-pointer focus:outline-none hover:bg-gray-700 p-1 transition-colors duration-200 rounded-sm -webkit-app-region-no-drag"
					style={
						{ WebkitAppRegion: "no-drag" } as React.CSSProperties
					}
				>
					<Icon className={className} />
				</button>
			</div>
		);
	};

	return (
		<div className="title-bar sticky top-0 select-none justify-between z-[999]">
			<div className="menu-button-container flex items-center">
				<img
					id="icon"
					src={logo}
					className="menu-icon select-none"
					alt="amethyst"
				/>
				<span className="text-white flex items-center ml-1">
					<p className="text-slate-400 font-bold">KSB-MERP</p>
				</span>
			</div>
			<div className="mx-auto text-white items-center mt-1">
				<span>
					{ksbId ? (
						<p className="uppercase ">
							<span className="font-bold text-md mr-3">
								{enterpriseTitle}
							</span>
							<span className="font-bold text-md">
								(<span>KSB-ID </span>
								<span className="underline ml-1">{ksbId}</span>)
							</span>
						</p>
					) : (
						<p className="mr-2 uppercase">-</p>
					)}
				</span>
			</div>
			<div className="window-controls-container flex items-center">
				<NetworkStatus />
				<button
					title="informations"
					className="cursor-pointer focus:outline-none hover:bg-gray-700 p-1 mr-5 transition-colors duration-200 rounded-sm -webkit-app-region-no-drag"
					onClick={() => setShowInfoModal(true)}
					style={
						{ WebkitAppRegion: "no-drag" } as React.CSSProperties
					}
				>
					<RiInformation2Fill className="text-gray-200 hover:text-white transition-colors duration-200" />
				</button>
				<button
					title="Minimize"
					className="minimize-button focus:outline-none hover:bg-gray-700 p-1 -webkit-app-region-no-drag"
					onClick={onMinimize}
					style={
						{ WebkitAppRegion: "no-drag" } as React.CSSProperties
					}
				>
					<IoRemove />
				</button>
				<button
					title="Maximize"
					className="min-max-button focus:outline-none hover:bg-gray-700 p-1 -webkit-app-region-no-drag"
					onClick={onMaximize}
					style={
						{ WebkitAppRegion: "no-drag" } as React.CSSProperties
					}
				>
					{maximized ? <TbArrowsDiagonalMinimize2 /> : <TbMaximize />}
				</button>
				<button
					onClick={() => setIsExitModalOpen(true)}
					title="Close"
					style={
						{ WebkitAppRegion: "no-drag" } as React.CSSProperties
					}
					className="close-button focus:outline-none hover:bg-gray-700 p-1 -webkit-app-region-no-drag"
				>
					<IoCloseOutline />
				</button>
			</div>
			<EnterpriseInfoModal
				isOpen={showInfoModal}
				onClose={() => setShowInfoModal(false)}
			/>

			{isExitModalOpen && (
				<div className="fixed inset-0 z-10 bg-black bg-opacity-50 flex items-center justify-center p-4">
					<div className="bg-gray-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl">
						<div className="px-6 py-8 text-center">
							<h2 className="text-2xl font-bold text-black mb-2">
								{
									content[language as string].salesPage
										.footerExit
								}
							</h2>
							<p className="text-black text-lg mb-6">
								{
									content[language as string].salesPage
										.footerExitConfirm
								}
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
									content[language as string].salesPage
										.headerDiscountCancel
								}
							</button>

							<NavLink
								ref={okButtonRef}
								to="/crm"
								className={`flex-1 py-4 text-lg font-medium flex items-center justify-center transition-all duration-200 ${
									focusedButton === "ok"
										? "bg-gray-300 text-blue-600 font-bold"
										: "text-blue-500 hover:bg-gray-300"
								} focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-inset`}
							>
								{
									content[language as string].salesPage
										.footerExitYes
								}
							</NavLink>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

