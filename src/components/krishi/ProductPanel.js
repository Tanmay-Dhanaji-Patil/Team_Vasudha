import { ShoppingCart } from 'lucide-react';
import CartSummary from './CartSummary';

export default function ProductPanel() {
    // Mock data for products
    const products = [
        { id: 1, name: "Vermicompost (25 kg)", type: "Organic", crop: "Sugarcane, Vegetables", price: 320 },
        { id: 2, name: "Neem Cake (5 kg)", type: "Organic", crop: "All crops", price: 180 },
        { id: 3, name: "DAP (50 kg)", type: "Inorganic", crop: "Wheat, Corn", price: 1350 },
        { id: 4, name: "Urea (45 kg)", type: "Inorganic", crop: "Rice, Wheat", price: 266 },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800">Sangli Agro Center</h2>
                <p className="text-sm text-gray-500 mt-1">Market Yard, Sangli, Maharashtra · 1.2 km</p>
            </div>

            {/* Tabs */}
            <div className="px-6 py-4 bg-gray-50/50">
                <div className="flex p-1 bg-gray-200/50 rounded-lg w-fit">
                    <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-white text-green-700 shadow-sm transition-all">
                        All
                    </button>
                    <button className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-green-700 transition-all">
                        Organic
                    </button>
                    <button className="px-4 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-green-700 transition-all">
                        Inorganic
                    </button>
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {products.map((product) => (
                    <div key={product.id} className="group p-4 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-800 group-hover:text-green-700">{product.name}</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {product.type} · Crop: {product.crop}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-green-700">₹{product.price}</div>
                            <button className="text-xs font-medium text-green-600 mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                Add to cart <ShoppingCart className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Cart Summary */}
            <CartSummary />
        </div>
    );
}
