import React from "react";
import { Layout } from "../../layout/HomeLayout/layout";
import InnerLayoutSection from "../../layout/InnerLayout/innerlayout";
import ProductsPageComponent from "../../components/productPage/products/products";
import SalesTrashComponent from "../../components/trashPage/salesTrash";

function TrashPage({ socket }) {
	return (
		<Layout>
			<InnerLayoutSection>
				<div>
					<SalesTrashComponent socket={socket} />
				</div>
			</InnerLayoutSection>
		</Layout>
	);
}

export default TrashPage;

