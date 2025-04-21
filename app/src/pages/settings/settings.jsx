import React, { useState } from "react";
import { Layout } from "../../layout/HomeLayout/layout";
import InnerLayoutSection from "../../layout/InnerLayout/innerlayout";
import Sidebar from "../../components/settingsPage/settings/Sidebar";
import PersonalInformation from "../../components/settingsPage/settings/PersonalInformation";
import Security from "../../components/settingsPage/settings/Security";
import MessageNotifications from "../../components/settingsPage/settings/Notifications";
import SendSales from "../../components/settingsPage/settings/SendSales";

function SettingsPage({ socket }) {
	const [activeSection, setActiveSection] = useState("Personal Information");

	return (
		<Layout>
			<InnerLayoutSection socket={socket}>
				<div className="h-[80vh] bg-gray-100">
					<div className=" mx-auto flex space-x-6">
						<Sidebar
							activeSection={activeSection}
							setActiveSection={setActiveSection}
						/>
						<div className="w-3/4">
							{activeSection === "Personal Information" && (
								<PersonalInformation />
							)}
							{activeSection === "Security" && <Security />}
							{activeSection === "Notifications" && (
								<MessageNotifications />
							)}
						</div>
					</div>
				</div>
			</InnerLayoutSection>
		</Layout>
	);
}

export default SettingsPage;

