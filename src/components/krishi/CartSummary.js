export default function CartSummary() {
    return (
        <div className="border-t border-gray-100 p-4 mt-auto bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">3 items in cart</p>
                    <p className="text-lg font-bold text-green-700">₹2,300</p>
                </div>
                <button className="bg-green-700 hover:bg-green-800 active:scale-95 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm">
                    Checkout
                </button>
            </div>
        </div>
    );
}
