/**
 * Component: MapComponent
 * Purpose: Renders an interactive Leaflet map to visualize nearby 
 *          agricultural supply stores and fertilizer hubs.
 */

'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';

/**
 * Utility: createIcon
 * Generates custom HTML/CSS markers for Leaflet based on inventory type.
 * 
 * @param {string} color - Hex code for the marker background.
 */
const createIcon = (color) => {
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12]
    });
};

const organicIcon = createIcon('#22c55e');
const inorganicIcon = createIcon('#f97316');
const bothIcon = createIcon('#a855f7');

/**
 * Interactive map view for store discovery.
 * Anchored to the Sangli region by default.
 * 
 * @param {Array} stores - Geospatial store data.
 * @param {Function} onSelectStore - Selection callback for store focusing.
 */
export default function MapComponent({ stores = [], onSelectStore }) {
    // Primary operational center (Sangli region)
    const position = [16.8524, 74.5815];

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
                    <Marker
                        key={store.id}
                        position={[store.lat, store.lng]}
                        icon={icon}
                        eventHandlers={{
                            click: () => {
                                if (onSelectStore) onSelectStore(store);
                            },
                        }}
                    >
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
