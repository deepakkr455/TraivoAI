
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { ActivityEvent } from '../../../../types';

const createCustomIcon = (index: number) => {
    return L.divIcon({
        html: `<div class="relative flex items-center justify-center">
                    <svg class="w-10 h-10 text-red-500 drop-shadow-lg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 20l-4.95-5.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                    </svg>
                    <span class="absolute text-white text-xs font-bold top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2">${index + 1}</span>
               </div>`,
        className: 'bg-transparent border-0',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
    });
};

const MapUpdater: React.FC<{ activities: ActivityEvent[]; selectedPlace: ActivityEvent | null }> = ({ activities, selectedPlace }) => {
    const map = useMap();

    useEffect(() => {
        if (activities.length > 0) {
            const bounds = L.latLngBounds(activities.map(p => [p.latitude, p.longitude]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14, duration: 1 });
        }
    }, [activities, map]);

    useEffect(() => {
        if (selectedPlace) {
            map.flyTo([selectedPlace.latitude, selectedPlace.longitude], 13, {
                animate: true,
                duration: 1,
            });
        }
    }, [selectedPlace, map]);

    return null;
};

interface MapComponentProps {
    activities: ActivityEvent[];
    selectedPlace: ActivityEvent | null;
}

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            map.invalidateSize();
        });
        resizeObserver.observe(map.getContainer());
        return () => resizeObserver.disconnect();
    }, [map]);
    return null;
};

export const MapComponent: React.FC<MapComponentProps> = ({ activities, selectedPlace }) => {
    // Explicitly mapping to [lat, lng] tuples for Leaflet
    const positions = (activities || []).map(p => [p.latitude, p.longitude] as [number, number]);

    if (typeof window === 'undefined') {
        return null;
    }

    const center: L.LatLngExpression = activities.length > 0 ? [activities[0].latitude, activities[0].longitude] : [32.25, 78.05];

    return (
        <MapContainer center={center} zoom={10} className="w-full h-full z-0" scrollWheelZoom={true}>
            <MapResizer />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Render Polyline BEFORE Markers so it's behind them, but verify z-index if needed */}
            {positions.length > 1 ? (
                <Polyline
                    key={`polyline-${positions.length}`} // Force re-render on length change
                    positions={positions}
                    pathOptions={{ color: '#2563EB', weight: 4, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }} // Tailwind blue-600
                />
            ) : null}

            {activities.map((place, index) => (
                <Marker
                    key={`${place.name}-${index}`}
                    position={[place.latitude, place.longitude]}
                    icon={createCustomIcon(index)}
                >
                    <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                        <span className="font-bold text-sm text-gray-800">{place.name}</span>
                    </Tooltip>
                </Marker>
            ))}

            <MapUpdater activities={activities} selectedPlace={selectedPlace} />
        </MapContainer>
    );
};
