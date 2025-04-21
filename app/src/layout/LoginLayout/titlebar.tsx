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

const { getCurrentWindow, app } = window.require("@electron/remote");

interface EnterpriseData {
	uid: string;
	title: string;
	ksb_id: string;
}

interface EnterpriseInfo {
	ip: string;
	port: string;
	info_base: string;
	its: string;
}

export const Titlebar: FC = () => {
	const currentWindow = getCurrentWindow();
	const [maximized, setMaximized] = useState<boolean>(
		currentWindow.isMaximized(),
	);
	const [showInfoModal, setShowInfoModal] = useState(false);
	const [focusedButton, setFocusedButton] = useState<"ok" | "cancel">("ok");
	const okButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const icon = document.getElementById("icon") as HTMLElement;
		if (icon) {
			icon.ondragstart = () => false;
		}
	}, []);

	const [language] = useLang();

	const [isExitModalOpen, setIsExitModalOpen] = useState(false);

	const onMinimize = () => currentWindow.minimize();
	const onMaximize = () => {
		const isMaximized = currentWindow.isMaximized();
		setMaximized(!isMaximized);
		isMaximized ? currentWindow.unmaximize() : currentWindow.maximize();
	};
	const onQuit = () => app.quit();

	const ksbId = localStorage.getItem("ksbIdNumber");

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
					onQuit();
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
							<span className="font-bold text-md">
								<span>KSB-ID </span>
								<span className="ml-1">{ksbId}</span>
							</span>
						</p>
					) : (
						<p className="mr-2 uppercase">-</p>
					)}
				</span>
			</div>
			<div className="window-controls-container flex items-center">
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
					title="Close"
					className="close-button focus:outline-none hover:bg-gray-700 p-1 -webkit-app-region-no-drag"
					onClick={() => setIsExitModalOpen(true)}
					style={
						{ WebkitAppRegion: "no-drag" } as React.CSSProperties
					}
				>
					<IoCloseOutline />
				</button>
			</div>
			<EnterpriseInfoModal
				isOpen={showInfoModal}
				onClose={() => setShowInfoModal(false)}
			/>

			{isExitModalOpen && (
				<div className="fixed inset-0 z-[9999] bg-black bg-opacity-50 flex items-center justify-center p-8">
					<div className="bg-gray-200 w-full max-w-md rounded-xl overflow-hidden shadow-xl">
						<div className="px-6 py-8 text-center">
							<h2 className="text-2xl font-bold text-black mb-2">
								{content[language as string].exit.exit}
							</h2>
							<p className="text-black text-lg mb-6">
								{content[language as string].exit.exitTest}
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

