import { useContext } from "react";
import { Context } from "../context/Lang";

const useLang = () => {
	const ctx = useContext(Context);

	if (!ctx) {
		throw new Error("useLang must be a valid");
	}

	return [ctx.lang, ctx.setLang];
};

export default useLang;

