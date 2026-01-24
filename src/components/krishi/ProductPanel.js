import { useState, useMemo } from 'react';
import { ShoppingCart, PackageOpen } from 'lucide-react';
import CartSummary from './CartSummary';

export default function ProductPanel({ selectedStore, cart = [], onAddToCart, onCheckout }) {
    const [activeTab, setActiveTab] = useState('All');

    // Generate mock products based on store availability
    const products = useMemo(() => {
        if (!selectedStore) return [];

        const items = [];
        if (selectedStore.stocks.includes("Organic")) {
            items.push(
                { id: 101, name: "Vermicompost (25 kg)", type: "Organic", crop: "Sugarcane, Vegetables", price: 320 },
                { id: 102, name: "Neem Cake (5 kg)", type: "Organic", crop: "All crops", price: 180 },
                { id: 103, name: "Bio-Potash (50 kg)", type: "Organic", crop: "Fruits, Vegetables", price: 850 }
            );
        }
        if (selectedStore.stocks.includes("Inorganic")) {
            items.push(
                { id: 201, name: "DAP (50 kg)", type: "Inorganic", crop: "Wheat, Corn", price: 1350 },
                { id: 202, name: "Urea (45 kg)", type: "Inorganic", crop: "Rice, Wheat", price: 266 },
                { id: 203, name: "MOP (50 kg)", type: "Inorganic", crop: "Sugarcane, Banana", price: 1700 }
            );
        }
        return items;
    }, [selectedStore]);

    const filteredProducts = products.filter(p => {
        if (activeTab === 'All') return true;
        return p.type === activeTab;
    });

    if (!selectedStore) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                    <PackageOpen className="w-8 h-8 text-green-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-700">No store selected</h3>
                <p className="text-gray-500 max-w-xs mt-2">Select a store from the list or map to view available fertilizers and prices.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">{selectedStore.name}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedStore.address} · {selectedStore.distance}</p>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 bg-gray-50/50">
                <div className="flex p-1 bg-gray-200/50 rounded-lg w-fit">
                    {['All', 'Organic', 'Inorganic'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${activeTab === tab
                                    ? 'bg-white text-green-700 shadow-sm'
                                    : 'text-gray-600 hover:text-green-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                        <div key={product.id} className="group p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-800 group-hover:text-green-700">{product.name}</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {product.type} · Crop: {product.crop}
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-bold text-green-700">₹{product.price}</div>
                                <button
                                    onClick={() => onAddToCart(product)}
                                    className="text-xs font-medium text-green-600 mt-1 flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity active:scale-95 cursor-pointer hover:underline"
                                >
                                    Add to cart <ShoppingCart className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        No products found for this category in selected store.
                    </div>
                )}
            </div>

            {/* Cart Summary */}
            <CartSummary cart={cart} onCheckout={onCheckout} />
        </div>
    );
}
