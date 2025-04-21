import React, { useEffect, useState, useRef } from "react";
import { Layout } from "../../layout/LoginLayout/layout";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { Toaster, toast } from "sonner";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

import { useAuth } from "../../context/Auth";

import LoginForm from "./components/LoginForm";

import nodeUrl from "../../links";

function LoginPageKSB({ socket, verified }) {
	const { login } = useAuth();
	const [userType, setUserType] = useState("");
	const [password, setPassword] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [isPasswordVisible, setIsPasswordVisible] = useState(false);
	const [users, setUsers] = useState([]);
	// const [enterprise, setEnterprise] = useState(null);
	// const [isLoading, setIsLoading] = useState(false);
	const navigate = useNavigate();
	const abortControllerRef = useRef(null);

	const [language] = useLang("uz");

	const ksbId = localStorage.getItem("ksbIdNumber");
	const deviceId = localStorage.getItem("device_id");
	const ipAddressPort = localStorage.getItem("ipaddress:port");
	const mainDatabase = localStorage.getItem("mainDatabase");

	// const [showPasswordModal, setShowPasswordModal] = useState(false);
	// const [isFirstTimePassword, setIsFirstTimePassword] = useState(false);
	// const [passwordError, setPasswordError] = useState("");

	useEffect(() => {
		const fetchLoginData = async () => {
			if (!ksbId) return;

			// setIsLoading(true);

			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			abortControllerRef.current = new AbortController();

			try {
				const cachedData = localStorage.getItem(`loginData_${ksbId}`);
				const cachedTimestamp = localStorage.getItem(
					`loginDataTimestamp_${ksbId}`,
				);

				const ipAddressPort =
					localStorage.getItem("ipaddress:port") || "";
				const database = localStorage.getItem("mainDatabase") || "";
				const userName = localStorage.getItem("mainUsername") || "";
				const userPass = localStorage.getItem("mainPassword") || "";

				if (cachedData && cachedTimestamp) {
					const isExpired =
						Date.now() - parseInt(cachedTimestamp) > 5 * 60 * 1000;
					if (!isExpired) {
						const parsedData = JSON.parse(cachedData);
						setUsers(parsedData.users);
						// setEnterprise(parsedData.enterprise);
						// setIsLoading(false);
						return;
					}
				}

				const response = await fetch(`${nodeUrl}/api/login/${ksbId}`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						"ipaddress:port": ipAddressPort,
						database: database,
						userName: userName,
						userPass: userPass,
						deviceId: deviceId,
					}),
					signal: abortControllerRef.current.signal,
				});

				if (!response.ok) {
					throw new Error(`HTTP error! status: ${response.status}`);
				}

				const data = await response.json();

				if (
					data.enterpriseInfo &&
					Object.keys(data.enterpriseInfo).length > 0
				) {
					localStorage.setItem(
						"enterpriseFullTitle",
						data.enterpriseInfo.full_title ||
							localStorage.getItem("enterpriseFullTitle"),
					);
					localStorage.setItem(
						"enterprisePhone1",
						data.enterpriseInfo.phone1 ||
							localStorage.getItem("enterprisePhone1"),
					);
					localStorage.setItem(
						"enterprisePhone2",
						data.enterpriseInfo.phone2 ||
							localStorage.getItem("enterprisePhone2"),
					);
					localStorage.setItem(
						"enterpriseSlogan1",
						data.enterpriseInfo.slogan1 ||
							localStorage.getItem("enterpriseSlogan1"),
					);
					localStorage.setItem(
						"enterpriseSlogan2",
						data.enterpriseInfo.slogan2 ||
							localStorage.getItem("enterpriseSlogan2"),
					);
					localStorage.setItem(
						"enterpriseName",
						data.enterpriseInfo.title ||
							localStorage.getItem("enterpriseName"),
					);
					localStorage.setItem(
						"enterpriseUUID",
						data.enterpriseInfo.uid ||
							localStorage.getItem("enterpriseUUID"),
					);
					localStorage.setItem(
						"usersPermissionInfo",
						JSON.stringify(data.usersInfo) ||
							localStorage.getItem("usersPermissionInfo"),
					);
				}

				setUsers(data.users);
			} catch (error) {
				if (error.name === "AbortError") {
					console.log("Fetch aborted");
					return;
				}
				console.error("Fetch error:", error);
			} finally {
				// setIsLoading(false);
			}
		};

		const intervalId = setInterval(() => {
			fetchLoginData();
		}, 1000);

		return () => {
			clearInterval(intervalId);
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [ksbId, deviceId, language]);

	const handleLogin = async (e) => {
		if (e && e.preventDefault) {
			e.preventDefault();
		}

		if (!userType) {
			return;
		}

		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000);

			const response = await fetch(`${nodeUrl}/api/authenticate`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					userType: userType,
					password: password || "",
					ksbId: ksbId,
					deviceId: deviceId,
					ipAddressPort: ipAddressPort,
					database: mainDatabase,
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (response.status === 403) {
				toast.error(
					<div className="flex items-center text-white">
						<FaTimesCircle className="mr-2" size={20} />
						{content[language].login.databaseBlocked}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#ef4444" },
					},
				);
				return;
			}

			if (response.status === 500) {
				toast.error(
					<div className="flex items-center text-white">
						<FaTimesCircle className="mr-2" size={20} />
						{content[language].login.serverError}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#ef4444" },
					},
				);
				return;
			}

			if (!response.ok) {
				toast.error(
					<div className="flex items-center text-white">
						<FaTimesCircle className="mr-2" size={20} />
						{content[language].login.fetchError}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#ef4444" },
					},
				);
				return;
			}

			const data = await response.json();

			if (data.success) {
				console.log(socket.id);
				login(data.token);
				localStorage.setItem("userType", userType);
				localStorage.setItem("socketUserId", socket.id);
				const passwordToStore = password || "EMPTY_PASSWORD_ALLOWED";

				localStorage.setItem("showSettingsModal", data.showSettings);
				localStorage.setItem("userPassword", passwordToStore);

				let exactUserId;

				try {
					const responseDevices = await fetch(
						`${nodeUrl}/api/get/registered/devices/${deviceId}/${ksbId}`,
					);

					const deviceData = await responseDevices.json();

					const exactUser = deviceData.find(
						(user) => user.user_type === userType,
					);

					if (exactUser) {
						exactUserId = exactUser.user_id;
					}
				} catch (err) {
					console.log(err);
				}

				try {
					const responseSettings = await fetch(
						`${nodeUrl}/api/get/settings/${deviceId}/${ksbId}`,
					);

					const responseCurrency = await fetch(
						`${nodeUrl}/api/get/currency/rate/${deviceId}/${ksbId}`,
					);

					const responseSettingsDevice = await fetch(
						`${nodeUrl}/api/get/settings/device/${deviceId}/${ksbId}`,
					);

					const settingsData = await responseSettings.json();
					const currencyData = await responseCurrency.json();
					const settingsDeviceData =
						await responseSettingsDevice.json();

					const exactUser = settingsData.find(
						(user) => user.user_id === exactUserId,
					);

					if (exactUser) {
						localStorage.setItem("user_id", exactUserId);
						localStorage.setItem(
							"settingsWarehouse",
							JSON.stringify(exactUser.warehouse),
						);
						localStorage.setItem(
							"settingsPriceType",
							JSON.stringify(exactUser.price_types),
						);
						localStorage.setItem(
							"settingsCash",
							JSON.stringify(exactUser.cash),
						);
						localStorage.setItem(
							"settingsCurrency",
							exactUser.currency,
						);
						localStorage.setItem(
							"settingsMaxDiscount",
							exactUser.max_discount,
						);
						localStorage.setItem(
							"userChangePrice",
							exactUser.change_price,
						);
						localStorage.setItem("userViewBuy", exactUser.view_buy);
						localStorage.setItem(
							"currency_rate",
							JSON.stringify(currencyData),
						);
						localStorage.setItem(
							"settingsDevice",
							JSON.stringify(settingsDeviceData),
						);
					} else {
						console.log("User not found in settingsData.");
					}
				} catch (err) {
					console.log(err);
				}

				toast.success(
					<div className="flex items-center text-white">
						<FaCheckCircle className="mr-2" size={20} />
						{data.message}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#22c55e" },
					},
				);
				navigate("/crm");
			} else {
				toast.error(
					<div className="flex items-center text-white">
						<FaTimesCircle className="mr-2" size={20} />
						{content[language].login.failedToSetPassword}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#ef4444" },
					},
				);

				if (data.message === "No offline password available") {
					// setPasswordError(data.message);
					// setShowPasswordModal(true);
					// setIsFirstTimePassword(true);
				}
			}
		} catch (error) {
			console.error(error);
			if (error.name === "AbortError") {
				toast.error(
					<div className="flex items-center text-white">
						<FaTimesCircle className="mr-2" size={20} />
						{content[language].login.requestTimeOut}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#ef4444" },
					},
				);
			} else if (!navigator.onLine) {
				toast.error(
					<div className="flex items-center text-white">
						<FaTimesCircle className="mr-2" size={20} />
						{content[language].login.noInternetConnection}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#ef4444" },
					},
				);
			} else {
				toast.error(
					<div className="flex items-center text-white">
						<FaTimesCircle className="mr-2" size={20} />
						{content[language].login.connectionError}
					</div>,
					{
						position: "bottom-right",
						style: { backgroundColor: "#ef4444" },
					},
				);
			}
		}
	};

	const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

	const handleSelect = (type) => {
		setUserType(type);
		setIsDropdownOpen(false);
	};

	const togglePasswordVisibility = () => {
		setIsPasswordVisible(!isPasswordVisible);
	};

	return (
		<Layout>
			<div className="flex fixed w-full items-center justify-center h-screen bg-gradient-to-br from-blue-200 to-indigo-700">
				<LoginForm
					userType={userType}
					password={password}
					isDropdownOpen={isDropdownOpen}
					isPasswordVisible={isPasswordVisible}
					users={users}
					handleLogin={handleLogin}
					toggleDropdown={toggleDropdown}
					handleSelect={handleSelect}
					setPassword={setPassword}
					togglePasswordVisibility={togglePasswordVisibility}
					content={content}
					language={language}
				/>
			</div>

			<Toaster position="bottom-right" />

			{/* {showPasswordModal && (
				<PasswordModal
					isFirstTimePassword={isFirstTimePassword}
					userType={userType}
					passwordError={passwordError}
					handleSetPassword={handleSetPassword}
					onClose={() => {
						setShowPasswordModal(false);
						setPasswordError("");
					}}
				/>
			)} */}
		</Layout>
	);
}

export default LoginPageKSB;

