import React, { useState, useEffect, createContext, ReactNode } from "react";

interface ContextType {
	lang: string;
	setLang: (lang: string) => void;
}

const Context = createContext<ContextType | undefined>(undefined);

interface ProviderProps {
	children: ReactNode;
}

const Provider: React.FC<ProviderProps> = ({ children }) => {
	const [lang, setLang] = useState<string>(
		window.localStorage.getItem("lang") || "uz",
	);

	useEffect(() => {
		window.localStorage.setItem("lang", lang);
	}, [lang]);

	const contextValue: ContextType = {
		lang,
		setLang: (newLang: string) => setLang(newLang),
	};

	return <Context.Provider value={contextValue}>{children}</Context.Provider>;
};

export { Context, Provider };

