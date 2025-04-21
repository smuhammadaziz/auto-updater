import React, { useState, useEffect } from "react";
import moment from "moment";
import "moment/locale/ru";
import "moment/locale/uz-latn";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";
import nodeUrl from "../../../links";

moment.defineLocale("uz-cyrl", {
	months: "январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь".split(
		"_",
	),
	monthsShort: "янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек".split("_"),
	weekdays: "Якшанба_Душанба_Сешанба_Чоршанба_Пайшанба_Жума_Шанба".split("_"),
	weekdaysShort: "Якш_Душ_Сеш_Чор_Пай_Жум_Шан".split("_"),
	weekdaysMin: "Як_Ду_Се_Чо_Па_Жу_Ша".split("_"),
	longDateFormat: {
		LT: "HH:mm",
		LTS: "HH:mm:ss",
		L: "DD/MM/YYYY",
		LL: "D MMMM YYYY",
		LLL: "D MMMM YYYY HH:mm",
		LLLL: "D MMMM YYYY, dddd HH:mm",
	},
	calendar: {
		sameDay: "[Бугун соат] LT [да]",
		nextDay: "[Эртага] LT [да]",
		nextWeek: "dddd [куни соат] LT [да]",
		lastDay: "[Кеча соат] LT [да]",
		lastWeek: "[Утган] dddd [куни соат] LT [да]",
		sameElse: "L",
	},
	relativeTime: {
		future: "%s ичида",
		past: "%s олдин",
		s: "фурсат",
		m: "бир дакика",
		mm: "%d дакика",
		h: "бир соат",
		hh: "%d соат",
		d: "бир кун",
		dd: "%d кун",
		M: "бир ой",
		MM: "%d ой",
		y: "бир йил",
		yy: "%d йил",
	},
	week: {
		dow: 1,
		doy: 7,
	},
});

const DeviceIcon = ({ type }) => {
	return (
		<div className="relative">
			<div className="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg">
				{type === "Laptop" && (
					<svg
						className="w-6 h-6 text-blue-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect
							x="2"
							y="3"
							width="20"
							height="14"
							rx="2"
							ry="2"
						></rect>
						<line x1="2" y1="20" x2="22" y2="20"></line>
					</svg>
				)}
				{type === "Mobile" && (
					<svg
						className="w-6 h-6 text-purple-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect
							x="7"
							y="2"
							width="10"
							height="20"
							rx="2"
							ry="2"
						></rect>
						<line x1="12" y1="18" x2="12" y2="18"></line>
					</svg>
				)}
				{type === "Desktop" && (
					<svg
						className="w-6 h-6 text-emerald-500"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<rect
							x="2"
							y="3"
							width="20"
							height="14"
							rx="2"
							ry="2"
						></rect>
						<line x1="8" y1="21" x2="16" y2="21"></line>
						<line x1="12" y1="17" x2="12" y2="21"></line>
					</svg>
				)}
			</div>
		</div>
	);
};

const ActiveSessions = () => {
	const [language] = useLang("uz");
	const [users, setUsers] = useState([]);
	const device_id = localStorage.getItem("device_id");
	const ksb_id = localStorage.getItem("ksbIdNumber");
	const userType = localStorage.getItem("userType");

	const getLocalizedTime = (time) => {
		if (language === "ru") {
			moment.locale("ru");
		} else if (language === "uz") {
			moment.locale("uz-cyrl");
		} else {
			moment.locale("en");
		}
		return moment(time).calendar();
	};

	useEffect(() => {
		const fetchProducts = async () => {
			try {
				const response = await fetch(
					`${nodeUrl}/api/get/active/users/${device_id}/${ksb_id}`,
					{
						method: "POST",
					},
				);
				const data = await response.json();
				setUsers(data);
			} catch (error) {
				console.error("Error fetching products:", error);
			}
		};
		fetchProducts();
	}, [device_id, ksb_id]);

	const sortedUsers = [...users].sort(
		(a, b) => new Date(b.last_entered_time) - new Date(a.last_entered_time),
	);

	const currentUserSession = sortedUsers.find(
		(session) => session.usertype === userType,
	);
	const otherSessions = sortedUsers.filter(
		(session) => session.usertype !== userType,
	);

	return (
		<div className="w-full bg-white rounded-xl shadow-lg">
			<div className="p-6">
				<div className="flex items-center justify-between mb-6">
					<h2 className="text-2xl font-semibold text-gray-800">
						{content[language].settingsUsers.users} ({users.length})
					</h2>
					{/* <span className="px-4 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
						{users.length} {content[language].settingsUsers.active}
					</span> */}
				</div>

				{currentUserSession && (
					<div className="mb-6">
						<div className="text-sm font-medium text-gray-500 mb-3">
							{content[language].settingsUsers.current}
						</div>
						<div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div className="">
										<DeviceIcon
											type="Laptop"
											className="w-6 h-6 text-blue-600"
										/>
									</div>
									<div>
										<div className="font-medium text-blue-900">
											{currentUserSession.usertype}
										</div>
										<div className="text-sm text-blue-600">
											{
												content[language].settingsUsers
													.currentDevice
											}
										</div>
									</div>
								</div>
								<span className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
									{getLocalizedTime(
										currentUserSession.last_entered_time,
									)}
								</span>
							</div>
						</div>
					</div>
				)}

				<div className="space-y-1">
					{otherSessions.length > 0 && (
						<div className="text-sm font-medium text-gray-500 mb-3">
							{content[language].settingsUsers.others}
						</div>
					)}
					{otherSessions.map((session) => (
						<div
							key={session.date}
							className="group hover:bg-gray-50 p-4 rounded-lg transition-all duration-200 border border-gray-100"
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-4">
									<div className="">
										<DeviceIcon
											type="Laptop"
											className="w-5 h-5 text-gray-600"
										/>
									</div>
									<div>
										<div className="font-medium text-gray-900">
											{session.usertype}
										</div>
									</div>
								</div>
								<span className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
									{getLocalizedTime(
										session.last_entered_time,
									)}
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ActiveSessions;

