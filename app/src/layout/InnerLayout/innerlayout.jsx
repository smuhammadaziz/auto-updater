import React, { useState } from "react";
import HeaderInner from "./header";
import SidebarInner from "./sidebar";
import InnerFooter from "./footer";

function InnerLayoutSection({ children, socket }) {
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
	const [refreshKey, setRefreshKey] = useState(0);

	const handleSidebarToggle = (expanded) => {
		setIsSidebarExpanded(expanded);
	};

	const handleDataRefresh = () => {
		setRefreshKey((prevKey) => prevKey + 1);
	};

	return (
		<div className="flex h-[90vh] bg-slate-100">
			<SidebarInner onToggle={handleSidebarToggle} socket={socket} />

			<div className={`flex-1 ${isSidebarExpanded ? "ml-64" : "ml-20"}`}>
				<HeaderInner onRefresh={handleDataRefresh} socket={socket} />
				<main className="p-4 bg-slate-100" key={refreshKey}>
					{children}
				</main>
				<InnerFooter />
			</div>
		</div>
	);
}

export default InnerLayoutSection;

