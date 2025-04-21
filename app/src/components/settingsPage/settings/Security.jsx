import React, { useState, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { MdWifiOff } from "react-icons/md";
import SectionContainer from "./SectionContainer";
import { toast, Toaster } from "sonner";
import nodeUrl from "../../../links";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

const PasswordInput = ({
	label,
	value,
	onChange,
	showPassword,
	onToggleVisibility,
	disabled,
	onKeyDown,
	inputRef,
}) => (
	<div className="w-full space-y-2">
		<label className="text-sm font-medium text-gray-700">{label}</label>
		<div className="relative group">
			<input
				type={showPassword ? "text" : "password"}
				value={value}
				onChange={onChange}
				onKeyDown={onKeyDown}
				disabled={disabled}
				ref={inputRef}
				className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
				placeholder=""
			/>
			<button
				type="button"
				onClick={onToggleVisibility}
				disabled={disabled}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:text-gray-300 disabled:cursor-not-allowed"
			>
				{showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
			</button>
		</div>
	</div>
);

const OfflineOverlay = () => {
	const [language] = useLang("uz");
	return (
		<div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
			<div className="text-center space-y-4">
				<MdWifiOff className="w-16 h-16 text-gray-400 mx-auto" />
				<div className="space-y-2">
					<h3 className="text-lg font-medium text-gray-900">
						{content[language].changePassword.noInternet}
					</h3>
					<p className="text-gray-500">
						{content[language].changePassword.noInternetText}
					</p>
				</div>
			</div>
		</div>
	);
};

function Security() {
	const [showCurrentPassword, setShowCurrentPassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	const [language] = useLang("uz");

	const currentPasswordRef = useRef(null);
	const newPasswordRef = useRef(null);
	const confirmPasswordRef = useRef(null);

	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	const handleUpdatePassword = async () => {
		if (!isOnline) {
			toast.error(content[language].changePassword.noInternetText);
			return;
		}

		const surname = localStorage.getItem("userType");
		const ipaddressPort = localStorage.getItem("ipaddress:port");
		const database = localStorage.getItem("mainDatabase");
		const password = localStorage.getItem("userPassword");

		if (!currentPassword || !newPassword || !confirmPassword) {
			toast.error(content[language].changePassword.requiredField);
			return;
		}

		if (newPassword !== confirmPassword) {
			toast.error(content[language].changePassword.newPasswordNotMatch);
			return;
		}

		try {
			const response = await fetch(`${nodeUrl}/api/change`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					surname: surname || "",
					old: currentPassword,
					news: newPassword,
					ipAddressPort: ipaddressPort,
					database: database,
					username: surname,
					password: password,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				toast.error(
					data.message.uz ||
						content[language].changePassword.oldPasswordWrong,
				);
				return;
			}

			toast.success(content[language].changePassword.changeSuccess);
			localStorage.setItem("userPassword", newPassword);
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			toast.error(content[language].changePassword.errorToast);
		}
	};

	const handleKeyDown = (e, inputField) => {
		if (e.key === "Enter") {
			e.preventDefault();
			switch (inputField) {
				case "current":
					newPasswordRef.current?.focus();
					break;
				case "new":
					confirmPasswordRef.current?.focus();
					break;
				case "confirm":
					handleUpdatePassword();
					break;
				default:
					break;
			}
		}
	};

	return (
		<>
			<Toaster position="bottom-right" richColors />
			<SectionContainer title={content[language].settingsUsers.security}>
				<div className="bg-white relative">
					{!isOnline && <OfflineOverlay />}
					<div className="space-y-6">
						<div className="grid grid-cols-12 gap-6">
							<div className="col-span-12">
								<PasswordInput
									label={
										content[language].settingsUsers
											.currenctPass
									}
									value={currentPassword}
									onChange={(e) =>
										setCurrentPassword(e.target.value)
									}
									showPassword={showCurrentPassword}
									onToggleVisibility={() =>
										setShowCurrentPassword(
											!showCurrentPassword,
										)
									}
									disabled={!isOnline}
									onKeyDown={(e) =>
										handleKeyDown(e, "current")
									}
									inputRef={currentPasswordRef}
								/>
							</div>

							<div className="col-span-12 md:col-span-6">
								<PasswordInput
									label={
										content[language].settingsUsers
											.newPassword
									}
									value={newPassword}
									onChange={(e) =>
										setNewPassword(e.target.value)
									}
									showPassword={showNewPassword}
									onToggleVisibility={() =>
										setShowNewPassword(!showNewPassword)
									}
									disabled={!isOnline}
									onKeyDown={(e) => handleKeyDown(e, "new")}
									inputRef={newPasswordRef}
								/>
							</div>

							<div className="col-span-12 md:col-span-6">
								<PasswordInput
									label={
										content[language].settingsUsers
											.confirmNewPassword
									}
									value={confirmPassword}
									onChange={(e) =>
										setConfirmPassword(e.target.value)
									}
									showPassword={showConfirmPassword}
									onToggleVisibility={() =>
										setShowConfirmPassword(
											!showConfirmPassword,
										)
									}
									disabled={!isOnline}
									onKeyDown={(e) =>
										handleKeyDown(e, "confirm")
									}
									inputRef={confirmPasswordRef}
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<button
								onClick={handleUpdatePassword}
								disabled={!isOnline}
								className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
							>
								{content[language].settingsUsers.updatePassword}
							</button>
						</div>
					</div>
				</div>
			</SectionContainer>
		</>
	);
}

export default Security;

