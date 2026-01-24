'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';

// Custom icons for store types
const createIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const organicIcon = createIcon('#22c55e'); // Green
const inorganicIcon = createIcon('#f97316'); // Orange
const bothIcon = createIcon('#a855f7'); // Purple

export default function MapComponent({ stores = [] }) {
    const position = [16.8524, 74.5815]; // Sangli coordinates

    return (
        <MapContainer center={position} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }} className="rounded-2xl z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Store Markers */}
            {stores.map((store) => {
                let icon = bothIcon;
                if (store.stocks.length === 1) {
                    if (store.stocks.includes("Organic")) icon = organicIcon;
                    else if (store.stocks.includes("Inorganic")) icon = inorganicIcon;
                }

                return (
                    <Marker key={store.id} position={[store.lat, store.lng]} icon={icon}>
                        <Popup>
                            <strong>{store.name}</strong><br />
                            {store.address}<br />
                            <span className="text-xs font-semibold text-gray-500">
                                {store.stocks.join(" & ")}
                            </span>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
