import { useEffect, useMemo, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapPicker.css";

// Fix Leaflet default marker issue in React/Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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

function MapFixer({ position }) {
  const map = useMap();

  useEffect(() => {
    const timer1 = setTimeout(() => {
      map.invalidateSize(false);
    }, 200);

    const timer2 = setTimeout(() => {
      map.invalidateSize(false);
    }, 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [map]);

  useEffect(() => {
    if (
      Number.isFinite(Number(position?.lat)) &&
      Number.isFinite(Number(position?.lon))
    ) {
      map.setView([position.lat, position.lon], 13, {
        animate: false,
      });

      setTimeout(() => {
        map.invalidateSize(false);
      }, 150);
    }
  }, [position.lat, position.lon, map]);

  return null;
}

export default function MapPicker({
  lat = 28.61,
  lon = 77.2,
  onLocationSelect,
}) {
  const safeInitialPosition = useMemo(
    () => ({
      lat: Number.isFinite(Number(lat)) ? Number(lat) : 28.61,
      lon: Number.isFinite(Number(lon)) ? Number(lon) : 77.2,
    }),
    [lat, lon]
  );

  const [position, setPosition] = useState(safeInitialPosition);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPosition(safeInitialPosition);
  }, [safeInitialPosition]);

  const handleSetPosition = useCallback(
    (newPosition) => {
      const cleanPosition = {
        lat: Number(Number(newPosition.lat).toFixed(6)),
        lon: Number(Number(newPosition.lon).toFixed(6)),
      };

      setPosition(cleanPosition);

      if (onLocationSelect) {
        onLocationSelect(cleanPosition);
      }
    },
    [onLocationSelect]
  );

  const searchAddress = async () => {
    const query = search.trim();

    if (!query) {
      alert("Please enter address");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
          query
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Search request failed");
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        alert("Address not found");
        return;
      }

      const nextLat = Number(parseFloat(data[0].lat).toFixed(6));
      const nextLon = Number(parseFloat(data[0].lon).toFixed(6));

      handleSetPosition({
        lat: nextLat,
        lon: nextLon,
      });
    } catch (error) {
      console.error("Map search error:", error);
      alert("Something went wrong while searching address");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      searchAddress();
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
          onKeyDown={handleSearchKeyDown}
        />

        <button type="button" onClick={searchAddress} disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="map-shell">
        <MapContainer
          center={[position.lat, position.lon]}
          zoom={13}
          minZoom={4}
          maxZoom={18}
          scrollWheelZoom={true}
          zoomControl={true}
          attributionControl={false}
          preferCanvas={true}
          className="map-container"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            keepBuffer={2}
            updateWhenIdle={true}
            updateWhenZooming={false}
          />

          <Marker position={[position.lat, position.lon]} />

          <ClickHandler onSelect={handleSetPosition} />
          <MapFixer position={position} />
        </MapContainer>
      </div>

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
