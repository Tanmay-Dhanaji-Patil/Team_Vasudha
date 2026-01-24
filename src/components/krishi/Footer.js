import { Phone, MessageCircle } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#e0f2f1] border-t border-green-100 py-6 mt-12">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-green-800">

                <div className="flex items-center gap-6 font-medium">
                    <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-green-600" />
                        <span>Helpline: +91-8000-123-456</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span>WhatsApp support available</span>
                    </div>
                </div>

                <div className="text-green-700 opacity-80">
                    Powered by local agri-input dealers
                </div>
            </div>
        </footer>
    );
}
