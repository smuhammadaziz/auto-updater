import React from "react";
import SalesPageLayoutFooter from "./footer/SalesPageLayoutFooter";
import SalesPageLayoutSidebar from "./sidebar";
import { Layout } from "../../layout/SalesHomeLayout/layout";
import SalesPageLayoutHeader from "./header";

function SalesPageLayoutMain({ children, socket }) {
	return (
		<Layout>
			<div className="flex flex-col z-0">
				<header>
					<SalesPageLayoutHeader socket={socket} />
				</header>
				<div className="flex flex-1 ">
					<div className="flex-1  px-1 py-0 bg-white overflow-auto">
						{children}
					</div>

					<div className="w-52 bg-slate-100 text-white border-l-2">
						<SalesPageLayoutSidebar socket={socket} />
					</div>
				</div>

				<div className="fixed bottom-0 left-0 w-full bg-white shadow-lg">
					<SalesPageLayoutFooter socket={socket} />
				</div>
			</div>
		</Layout>
	);
}

export default SalesPageLayoutMain;

