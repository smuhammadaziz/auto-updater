import React, { useEffect, useState } from "react";

import content from "../../localization/content";
import useLang from "../../hooks/useLang";

function InnerFooter() {
	const [daysRemaining, setDaysRemaining] = useState(null);
	const [language] = useLang("uz");

	const timeUnits = {
		uz: {
			days: "кун",
		},
		ru: {
			days: "дней",
		},
	};

	useEffect(() => {
		const deadline = localStorage.getItem("its_deadline");

		if (deadline) {
			// Set deadline to end of day (23:59:59)
			const deadlineDate = new Date(deadline);
			deadlineDate.setHours(23, 59, 59, 999);

			const currentDate = new Date();

			// Calculate difference in days
			const differenceMs = deadlineDate - currentDate;
			const days = Math.floor(differenceMs / (1000 * 60 * 60 * 24));

			setDaysRemaining(days);
		}
	}, [language]);

	if (daysRemaining === null) {
		return null;
	}

	const showAlert = daysRemaining < 3;

	return (
		<div className="fixed bottom-0 left-0 w-full bg-white text-black p-2 z-[150] overflow-hidden border-t border-gray-200">
			<div
				className={`flex space-x-40 w-max animate-marquee ${
					showAlert ? "bg-red-50" : "bg-white"
				}`}
			>
				{[...Array(40)].map((_, index) => (
					<p
						key={index}
						className={`whitespace-nowrap text-base ${
							showAlert
								? "text-red-600 font-semibold animate-pulse"
								: "text-gray-900"
						}`}
					>
						{content[language].innerFooter.its.replace(
							"${timeLeft}",
							`${daysRemaining} ${timeUnits[language].days}`,
						)}
					</p>
				))}
			</div>
		</div>
	);
}

export default InnerFooter;

