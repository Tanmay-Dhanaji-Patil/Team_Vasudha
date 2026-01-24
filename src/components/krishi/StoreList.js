import { ChevronRight } from 'lucide-react';

export default function StoreList({ stores, selectedStore, onSelectStore }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-700">Nearby fertilizer stores</h3>
            </div>

            <div className="overflow-y-auto max-h-[600px] flex-1">
                {stores.map((store) => {
                    const isSelected = selectedStore?.id === store.id;
                    return (
                        <div
                            key={store.id}
                            onClick={() => onSelectStore(store)}
                            className={`p-5 border-b border-gray-50 hover:bg-green-50/40 cursor-pointer transition-all ${isSelected ? 'bg-green-50/40 border-l-4 border-l-green-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className={`font-bold text-lg ${isSelected ? 'text-green-800' : 'text-gray-800'}`}>{store.name}</h4>
                                    <p className="text-sm text-gray-500 mt-0.5">{store.address} · {store.distance}</p>

                                    <div className="flex gap-2 mt-3">
                                        {store.stocks.includes("Organic") && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-800 border border-green-200">
                                                Organic
                                            </span>
                                        )}
                                        {store.stocks.includes("Inorganic") && (
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-orange-100 text-orange-800 border border-orange-200">
                                                Inorganic
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-6">
                                    <span className={`text-xs font-medium flex items-center gap-1 group ${isSelected ? 'text-green-700' : 'text-green-600'}`}>
                                        View stock <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
