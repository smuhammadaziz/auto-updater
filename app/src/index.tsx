import React from "react";
import ReactDOM from "react-dom/client";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import "./styles/index.css";
import "./styles/tailwind.css";
import "./styles/titlebar.css";

import { Router } from "./router";
import { Provider as LangProvider } from "./context/Lang";

const root = ReactDOM.createRoot(
	document.getElementById("root") as HTMLElement,
);

root.render(
	<React.StrictMode>
		<LangProvider>
			<ToastContainer position="bottom-right" autoClose={2500} />
			<Router />
		</LangProvider>
	</React.StrictMode>,
);

