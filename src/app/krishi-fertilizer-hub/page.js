'use client';

import { useState } from 'react';
import Header from "@/components/krishi/Header";
import Hero from "@/components/krishi/Hero";
import StoreList from "@/components/krishi/StoreList";
import ProductPanel from "@/components/krishi/ProductPanel";
import Footer from "@/components/krishi/Footer";
import { stores } from "@/data/stores";

export default function KrishiFertilizerHub() {
  const [selectedStore, setSelectedStore] = useState(null);
  const [cart, setCart] = useState([]);
  const [filterType, setFilterType] = useState('All');

  const filteredStores = stores.filter(store => {
    if (filterType === 'All') return true;
    if (filterType === 'Organic') return store.stocks.includes('Organic');
    if (filterType === 'Inorganic') return store.stocks.includes('Inorganic');
    return true;
  });

  const handleSelectStore = (store) => {
    setSelectedStore(store);
  };

  const handleAddToCart = (product) => {
    setCart([...cart, product]);
  };

  return (
    <div className="min-h-screen bg-[#e8f5e9] font-sans text-gray-800">
      {/* Light green background #e8f5e9 */}

      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
        <Hero
          stores={filteredStores}
          onFilterChange={(type) => setFilterType(type)}
          currentFilter={filterType}
          onSelectStore={handleSelectStore}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5">
            <StoreList
              stores={filteredStores}
              selectedStore={selectedStore}
              onSelectStore={handleSelectStore}
            />
          </div>
          <div className="lg:col-span-7">
            <ProductPanel
              selectedStore={selectedStore}
              cart={cart}
              onAddToCart={handleAddToCart}
              onCheckout={() => alert('Proceeding to checkout with ' + cart.length + ' items')}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
