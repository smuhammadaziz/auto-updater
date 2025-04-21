import { FC, useEffect, useState, useRef } from "react";
import {
	IoCloseOutline,
	IoContractOutline,
	IoExpandOutline,
	IoRemove,
} from "react-icons/io5";
import logo from "../../assets/icon.png";

import { ImExit } from "react-icons/im";
import { FaTimes } from "react-icons/fa";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

import { IoExitOutline } from "react-icons/io5";

import { TbArrowsDiagonalMinimize2 } from "react-icons/tb";
import { TbMaximize } from "react-icons/tb";

const { getCurrentWindow, app } = window.require("@electron/remote");

export const Titlebar: FC = () => {
	const currentWindow = getCurrentWindow();
	const [maximized, setMaximized] = useState(currentWindow.isMaximized());
	const [focusedButton, setFocusedButton] = useState<"ok" | "cancel">("ok");
	const okButtonRef = useRef<HTMLButtonElement>(null);
	const cancelButtonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const icon = document.getElementById("icon") as HTMLElement;
		icon.ondragstart = () => false;
	}, []);

	const [language] = useLang();

	const [isExitModalOpen, setIsExitModalOpen] = useState(false);

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

	const onMinimize = () => currentWindow.minimize();
	const onMaximize = () => {
		setMaximized(!currentWindow.isMaximized());
		currentWindow.isMaximized()
			? currentWindow.unmaximize()
			: currentWindow.maximize();
	};
	const onQuit = () => app.quit();
	return (
		<div className="title-bar sticky top-0 select-none z-[999]">
			<div className="menu-button-container">
				<img
					id="icon"
					src={logo}
					className="menu-icon select-none"
					alt="amethyst"
				/>
			</div>
			<div className="app-name-container select-none uppercase"></div>
			<div className="window-controls-container">
				<button
					title="Minimize"
					className="minimize-button focus:outline-none hover:bg-gray-700 p-1"
					onClick={onMinimize}
				>
					<IoRemove />
				</button>
				<button
					title="Maximize"
					className="min-max-button focus:outline-none hover:bg-gray-700 p-1"
					onClick={onMaximize}
				>
					{maximized ? <TbArrowsDiagonalMinimize2 /> : <TbMaximize />}
				</button>
				<button
					title="Close"
					className="close-button focus:outline-none hover:bg-gray-700 p-1"
					onClick={() => setIsExitModalOpen(true)}
				>
					<IoCloseOutline />
				</button>
			</div>
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

