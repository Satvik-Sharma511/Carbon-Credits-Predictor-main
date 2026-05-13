import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "./MapPicker.css";

// Fix Leaflet default marker issue in React/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      const lat = Number(e.latlng.lat.toFixed(6));
      const lon = Number(e.latlng.lng.toFixed(6));

      onSelect({ lat, lon });
    },
  });

  return null;
}

function ChangeMapCenter({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position?.lat && position?.lon) {
      map.setView([position.lat, position.lon], 14);
    }
  }, [position, map]);

  return null;
}

export default function MapPicker({ lat = 28.61, lon = 77.2, onLocationSelect }) {
  const [position, setPosition] = useState({
    lat,
    lon,
  });

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPosition({
      lat,
      lon,
    });
  }, [lat, lon]);

  const handleSetPosition = (newPosition) => {
    setPosition(newPosition);

    if (onLocationSelect) {
      onLocationSelect(newPosition);
    }
  };

  const searchAddress = async () => {
    if (!search.trim()) {
      alert("Please enter address");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          search
        )}`
      );

      const data = await response.json();

      if (!data || data.length === 0) {
        alert("Address not found");
        return;
      }

      const lat = Number(parseFloat(data[0].lat).toFixed(6));
      const lon = Number(parseFloat(data[0].lon).toFixed(6));

      handleSetPosition({ lat, lon });
    } catch (error) {
      console.error(error);
      alert("Something went wrong while searching address");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-picker">
      <div className="map-search-box">
        <input
          type="text"
          placeholder="Search address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="button" onClick={searchAddress} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <MapContainer
        center={[position.lat, position.lon]}
        zoom={13}
        className="map-container"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[position.lat, position.lon]} />

        <ClickHandler onSelect={handleSetPosition} />
        <ChangeMapCenter position={position} />
      </MapContainer>

      <div className="lat-lng-box">
        <div>
          <label>Latitude</label>
          <input type="text" value={position.lat} readOnly />
        </div>

        <div>
          <label>Longitude</label>
          <input type="text" value={position.lon} readOnly />
        </div>
      </div>
    </div>
  );
}