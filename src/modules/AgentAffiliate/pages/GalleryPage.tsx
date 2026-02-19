
import React, { useState } from 'react';
import { ListingGallery } from '../components/ListingGallery';
import ProductModal from '../components/ProductModal';
import { useAgentData } from '../context/AgentDataContext';
import { Product } from '../types';

const GalleryPage: React.FC = () => {
    const { workspaceProducts, toggleProductStatus, deleteProduct, confirmProduct, sendMessage } = useAgentData();
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCardClick = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    return (
        <div className="w-full h-full p-6 overflow-y-auto">
            <ListingGallery
                products={workspaceProducts}
                onViewDetails={handleCardClick}
                onToggleStatus={toggleProductStatus}
                onDelete={deleteProduct}
            />
            {isModalOpen && selectedProduct && (
                <ProductModal
                    product={selectedProduct}
                    onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
                    onConfirm={() => {
                        confirmProduct(selectedProduct.id);
                        setIsModalOpen(false);
                    }}
                    onDelete={() => {
                        deleteProduct(selectedProduct.id);
                        setIsModalOpen(false);
                    }}
                    onEdit={() => {
                        setIsModalOpen(false);
                        sendMessage(`I want to edit the "${selectedProduct.title}" listing.`);
                    }}
                />
            )}
        </div>
    );
};

export default GalleryPage;
