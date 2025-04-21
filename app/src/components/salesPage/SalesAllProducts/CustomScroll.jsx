import React, { useRef, useEffect } from "react";
import "./CustomScroll.css";

function CustomScroll({ children, className }) {
	const scrollContainerRef = useRef(null);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const handleWheel = (e) => {
			e.preventDefault();
			container.scrollTop += e.deltaY * 0.8;
		};

		container.addEventListener("wheel", handleWheel, { passive: false });

		return () => {
			container.removeEventListener("wheel", handleWheel);
		};
	}, []);

	return (
		<div
			ref={scrollContainerRef}
			className={`custom-scroll ${className}`}
			style={{
				overflowY: "auto",
				WebkitOverflowScrolling: "touch",
			}}
		>
			{children}
		</div>
	);
}

export default CustomScroll;

