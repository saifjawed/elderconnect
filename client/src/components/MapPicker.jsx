import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Navigation } from "lucide-react";

// Use a custom icon to avoid Vite relative asset issues with Leaflet
const markerIcon = L.divIcon({
  html: `<div class="flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg ring-2 ring-white">
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
  </div>`,
  className: "custom-picker-marker",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const MapPicker = ({ lat, lng, onChange, readOnly = false }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Default to center of USA
    const initialLat = lat || 37.0902;
    const initialLng = lng || -95.7129;
    const initialZoom = lat && lng ? 13 : 4;

    const map = L.map(containerRef.current, {
      zoomControl: true,
      maxZoom: 18,
    }).setView([initialLat, initialLng], initialZoom);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
    ).addTo(map);

    mapRef.current = map;

    // Add marker if initial coords are provided
    if (lat && lng) {
      const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
      markerRef.current = marker;
    }

    // Map click handler to select location
    if (!readOnly && onChange) {
      map.on("click", (e) => {
        const { lat: clickedLat, lng: clickedLng } = e.latlng;
        const roundedLat = parseFloat(clickedLat.toFixed(6));
        const roundedLng = parseFloat(clickedLng.toFixed(6));

        if (markerRef.current) {
          markerRef.current.setLatLng([roundedLat, roundedLng]);
        } else {
          const marker = L.marker([roundedLat, roundedLng], { icon: markerIcon }).addTo(map);
          markerRef.current = marker;
        }

        onChange(roundedLat, roundedLng);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync prop changes externally (e.g. if geolocated or edited)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { icon: markerIcon }).addTo(map);
        markerRef.current = marker;
      }
      // Only pan/zoom if map center is far from coordinates
      const currentCenter = map.getCenter();
      const distance = Math.sqrt(
        Math.pow(currentCenter.lat - lat, 2) + Math.pow(currentCenter.lng - lng, 2)
      );
      if (distance > 0.05) {
        map.setView([lat, lng], 14);
      }
    } else {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    }
  }, [lat, lng]);

  // Geolocation trigger to locate device
  const handleLocate = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const deviceLat = parseFloat(position.coords.latitude.toFixed(6));
        const deviceLng = parseFloat(position.coords.longitude.toFixed(6));
        
        const map = mapRef.current;
        if (map) {
          map.setView([deviceLat, deviceLng], 14);
          if (markerRef.current) {
            markerRef.current.setLatLng([deviceLat, deviceLng]);
          } else {
            const marker = L.marker([deviceLat, deviceLng], { icon: markerIcon }).addTo(map);
            markerRef.current = marker;
          }
        }
        onChange(deviceLat, deviceLng);
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Unable to retrieve your location. Please check browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="relative z-0 w-full h-[250px] rounded-lg overflow-hidden border border-gray-300 shadow-inner bg-gray-50">
      <div ref={containerRef} className="w-full h-full" />
      {!readOnly && onChange && (
        <button
          type="button"
          onClick={handleLocate}
          className="absolute bottom-4 right-4 z-[400] flex h-9 w-9 items-center justify-center rounded-full bg-white text-teal-600 shadow-lg ring-1 ring-gray-200 hover:bg-gray-50 active:scale-95 transition-all duration-200"
          title="Share Current Location"
        >
          <Navigation className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default MapPicker;
