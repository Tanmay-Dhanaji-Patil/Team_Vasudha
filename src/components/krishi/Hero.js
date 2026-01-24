'use client';

import dynamic from 'next/dynamic';
import { Search } from 'lucide-react';

// Dynamically import MapComponent with no SSR
const MapComponent = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 animate-pulse rounded-2xl flex items-center justify-center text-gray-400">
            Loading map...
        </div>
    ),
});

export default function Hero() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Text & Filters */}
            <div className="lg:col-span-5 space-y-8 pt-4">
                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-green-900 leading-tight">
                        Find the right fertilizer near your farm
                    </h1>
                    <p className="text-lg text-green-700/80 leading-relaxed max-w-md">
                        Locate nearby stores, check availability of organic & inorganic fertilizers, and book your pickup instantly.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <span className="bg-white/80 border border-green-200 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                        5000+ farmers
                    </span>
                    <span className="bg-white/80 border border-green-200 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                        Same-day pickup
                    </span>
                    <span className="bg-white/80 border border-green-200 text-green-800 px-4 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                        Best prices
                    </span>
                </div>

                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-2 max-w-lg">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search village / taluka"
                            className="w-full h-12 rounded-xl bg-gray-50 pl-10 pr-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        />
                    </div>
                    <select className="h-12 px-4 rounded-xl bg-gray-50 text-gray-700 font-medium border-l-8 border-transparent focus:outline-none cursor-pointer hover:bg-gray-100">
                        <option>Organic + Inorganic</option>
                        <option>Organic only</option>
                        <option>Inorganic only</option>
                    </select>
                    <button className="h-12 px-6 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold transition-colors">
                        Apply
                    </button>
                </div>
            </div>

            {/* Right Side: Map Card */}
            <div className="lg:col-span-7 h-[500px] relative">
                <div className="absolute inset-0 bg-white rounded-3xl shadow-lg border border-gray-100 p-3">
                    <div className="w-full h-full rounded-2xl overflow-hidden relative z-0">
                        <MapComponent />
                    </div>

                    {/* Legend Overlay */}
                    <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-md border border-gray-100 z-[1000] flex gap-4 text-xs font-semibold text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            Organic
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                            Inorganic
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                            Both
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
