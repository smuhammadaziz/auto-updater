import React from "react";

const InputField = ({ label, name, value, onChange, type = "text" }) => (
	<div className="mb-4">
		<label className="block text-sm font-medium text-gray-700 mb-1">
			{label}
		</label>
		<input
			type={type}
			name={name}
			value={value}
			onChange={onChange}
			className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
		/>
	</div>
);

export default InputField;

