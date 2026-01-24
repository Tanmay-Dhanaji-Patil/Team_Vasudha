import Link from 'next/link';
import { Leaf, Search, ShoppingCart, User } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-green-800 text-white shadow-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left: Brand Identity */}
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-full">
                        <Leaf className="w-5 h-5 text-green-300" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">Krishi Fertilizer Hub</span>
                </div>

                {/* Middle: Navigation Links */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="#" className="text-green-100 hover:text-white hover:underline decoration-green-400 underline-offset-4 transition-colors">
                        Find store
                    </Link>
                    <Link href="#" className="text-green-100 hover:text-white hover:underline decoration-green-400 underline-offset-4 transition-colors">
                        Products
                    </Link>
                    <Link href="#" className="text-green-100 hover:text-white hover:underline decoration-green-400 underline-offset-4 transition-colors">
                        Support
                    </Link>
                </nav>

                {/* Right: Actions */}
                <div className="flex items-center gap-4">
                    <button className="bg-white text-green-800 px-5 py-2 rounded-full font-medium hover:bg-green-50 transition-colors shadow-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Login / Signup
                    </button>
                </div>
            </div>
        </header>
    );
}
