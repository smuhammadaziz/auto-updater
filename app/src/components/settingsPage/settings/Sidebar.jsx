import React from "react";
import { FaLock } from "react-icons/fa";

import { LiaCloudUploadAltSolid } from "react-icons/lia";

import { MdDevices } from "react-icons/md";
import LogoutButton from "./LogoutButton";

import content from "../../../localization/content";
import useLang from "../../../hooks/useLang";

function Sidebar({ activeSection, setActiveSection }) {
	const [language] = useLang("uz");
	const settingsItems = [
		{
			icon: <MdDevices className="w-5 h-5 text-blue-500" />,
			title: "Personal Information",
			name: content[language].settingsUsers.users,
		},
		{
			icon: <FaLock className="w-5 h-5 text-green-500" />,
			title: "Security",
			name: content[language].settingsUsers.security,
		},
		{
			icon: (
				<LiaCloudUploadAltSolid className="w-5 h-5 text-purple-500" />
			),
			title: "Notifications",
			name: content[language].settingsUsers.recovery,
		},
	];
	return (
		<div className="w-1/4 bg-white shadow-lg rounded-xl p-6 h-fit">
			<h2 className="text-xl font-bold text-gray-800 mb-6">
				{content[language].innerLayout.settings}
			</h2>
			<nav>
				{settingsItems.map((item, index) => (
					<div
						key={index}
						className={`flex items-center p-3 hover:bg-gray-50 transition-colors duration-200 rounded-lg cursor-pointer group mb-2 ${
							activeSection === item.title
								? "bg-blue-50 text-blue-600"
								: ""
						}`}
						onClick={() => setActiveSection(item.title)}
					>
						<div className="mr-4">{item.icon}</div>
						<h3 className="text-sm font-medium text-gray-700 group-hover:text-blue-600">
							{item.name}
						</h3>
					</div>
				))}
				<div className="mt-4 pt-4 border-t">
					<LogoutButton />
				</div>
			</nav>
		</div>
	);
}

export default Sidebar;

