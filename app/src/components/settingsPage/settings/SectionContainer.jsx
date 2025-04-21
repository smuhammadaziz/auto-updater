import React from "react";

function SectionContainer({ title, children }) {
	return (
		<div className="bg-white shadow-lg rounded-xl p-6">
			<h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
			{children}
		</div>
	);
}

export default SectionContainer;

