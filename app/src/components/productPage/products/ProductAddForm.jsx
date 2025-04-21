import React, { useState } from "react";

const ProductAddForm = ({ onAddProduct, onCancel }) => {
	const [newProduct, setNewProduct] = useState({
		product_name: "",
		currency: "",
		box: "",
		remaining: "",
		price_in_currency: "",
		price_in_UZS: "",
		warehouse: "",
	});

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setNewProduct((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onAddProduct(newProduct);
		setNewProduct({
			product_name: "",
			currency: "",
			box: "",
			remaining: "",
			price_in_currency: "",
			price_in_UZS: "",
			warehouse: "",
		});
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Product Name
				</label>
				<input
					type="text"
					name="product_name"
					value={newProduct.product_name}
					onChange={handleInputChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Currency
				</label>
				<input
					type="text"
					name="currency"
					value={newProduct.currency}
					onChange={handleInputChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Box
				</label>
				<input
					type="number"
					name="box"
					value={newProduct.box}
					onChange={handleInputChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Remaining
				</label>
				<input
					type="number"
					name="remaining"
					value={newProduct.remaining}
					onChange={handleInputChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Price in Currency
				</label>
				<input
					type="number"
					name="price_in_currency"
					value={newProduct.price_in_currency}
					onChange={handleInputChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Price in UZS
				</label>
				<input
					type="number"
					name="price_in_UZS"
					value={newProduct.price_in_UZS}
					onChange={handleInputChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 mb-1">
					Warehouse
				</label>
				<input
					type="text"
					name="warehouse"
					value={newProduct.warehouse}
					onChange={handleInputChange}
					className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
				/>
			</div>

			<div className="flex justify-end space-x-3 mt-6">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
				>
					Cancel
				</button>
				<button
					type="submit"
					className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
				>
					Add Product
				</button>
			</div>
		</form>
	);
};

export default ProductAddForm;

