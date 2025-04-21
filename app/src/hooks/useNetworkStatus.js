import { useState, useEffect } from "react";

const useNetworkStatus = () => {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [networkStatus, setNetworkStatus] = useState({
		type: navigator.connection?.effectiveType || "unknown",
		downlink: navigator.connection?.downlink || 0,
		rtt: navigator.connection?.rtt || 0,
	});

	useEffect(() => {
		const handleOnline = () => {
			setIsOnline(true);
			updateNetworkStatus();
		};

		const handleOffline = () => {
			setIsOnline(false);
		};

		const updateNetworkStatus = () => {
			if (navigator.connection) {
				setNetworkStatus({
					type: navigator.connection.effectiveType,
					downlink: navigator.connection.downlink,
					rtt: navigator.connection.rtt,
				});
			}
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		if (navigator.connection) {
			navigator.connection.addEventListener(
				"change",
				updateNetworkStatus,
			);
		}

		updateNetworkStatus();

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);

			if (navigator.connection) {
				navigator.connection.removeEventListener(
					"change",
					updateNetworkStatus,
				);
			}
		};
	}, []);

	return {
		isOnline,
		networkStatus,
		checkNetworkConnection: async () => {
			if (!navigator.onLine) return false;

			try {
				const timeoutPromise = new Promise((_, reject) =>
					setTimeout(() => reject(new Error("Timeout")), 2000),
				);

				const fetchPromise = fetch(window.location.origin, {
					method: "HEAD",
					cache: "no-store",
					mode: "no-cors",
				});

				await Promise.race([fetchPromise, timeoutPromise]);
				return true;
			} catch (error) {
				console.error("Network connectivity check failed:", error);
				return false;
			}
		},
	};
};

export default useNetworkStatus;

