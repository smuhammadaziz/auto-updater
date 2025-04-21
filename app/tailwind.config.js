/** @type {import("tailwindcss").Config} */
module.exports = {
	content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
	theme: {
		extend: {
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				slideIn: {
					"0%": { transform: "translateY(-10px)", opacity: "0" },
					"100%": { transform: "translateY(0)", opacity: "1" },
				},
				scaleIn: {
					"0%": { transform: "scale(0.9)", opacity: "0" },
					"100%": { transform: "scale(1)", opacity: "1" },
				},
				bounce: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-5px)" },
				},
				progress: {
					"0%": { width: "0%" },
					"100%": { width: "100%" },
				},
				slide: {
					"0%": { transform: "translateX(-200%)" },
					"100%": { transform: "translateX(300%)" },
				},
				marquee: {
					"0%": { transform: "translateX(0%)" },
					"100%": { transform: "translateX(-100%)" },
				},
			},
			animation: {
				fadeIn: "fadeIn 0.3s ease-out",
				slideIn: "slideIn 0.4s ease-out",
				scaleIn: "scaleIn 0.3s ease-out",
				bounce: "bounce 1s ease-in-out infinite",
				progress: "progress 5s linear",
				slide: "slide 1s linear infinite",
				marquee: "marquee 600s linear infinite",
			},
		},
	},
	darkMode: "media",
	plugins: [],
};

