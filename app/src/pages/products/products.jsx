import React from "react";
import { Layout } from "../../layout/HomeLayout/layout";
import InnerLayoutSection from "../../layout/InnerLayout/innerlayout";
import ProductsPageComponent from "../../components/productPage/products/products";

function ProductsPage({ socket }) {
	return (
		<Layout>
			<InnerLayoutSection socket={socket}>
				<div>
					<ProductsPageComponent />
				</div>
			</InnerLayoutSection>
		</Layout>
	);
}

export default ProductsPage;

