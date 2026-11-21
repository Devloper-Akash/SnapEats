import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LocateFixed, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setAddress, setLocation, setManualSelection } from "../redux/mapSlice";
import {
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
} from "../redux/userSlice";

const defaultMapCenter = { lat: 20.5937, lon: 78.9629 };

const getLocationServiceError = (error, action, gpsCoordinatesFound = false) => {
  const status = error.response?.status;
  if (status === 401 || status === 403) {
    return "The location service rejected its API key. Please check the location API configuration.";
  }
  if (status === 429) {
    return "The location service is busy. Please wait a moment and try again.";
  }
  if (!error.response) {
    return gpsCoordinatesFound
      ? `GPS coordinates were found, but we couldn’t ${action} because the address service could not be reached. Check your connection or search for your address.`
      : `We couldn’t ${action} because the address service could not be reached. Check your connection and try again.`;
  }
  return `We couldn’t ${action}. Please try again or search for your address.`;
};

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lon], 15, { duration: 0.5 });
    }
  }, [map, position?.lat, position?.lon]);

  return null;
}

const LocationPicker = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { currentCity, currentState, currentAddress } = useSelector((state) => state.user);
  const { location, address } = useSelector((state) => state.map);
  const apiKey = import.meta.env.VITE_GEOAPIKEY;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [resolvingPin, setResolvingPin] = useState(false);
  const [error, setError] = useState("");
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const hasLocation = location.lat != null && location.lon != null;
    const currentPosition = hasLocation
      ? { lat: Number(location.lat), lon: Number(location.lon) }
      : null;
    setQuery(currentAddress || currentCity || "");
    setResults([]);
    setSelectedPosition(currentPosition);
    setSelectedPlace(
      currentPosition && address
        ? {
            lat: currentPosition.lat,
            lon: currentPosition.lon,
            city: currentCity,
            state: currentState,
            formatted: address,
            address_line1: currentAddress,
          }
        : null,
    );
    setError("");
  }, [open, location.lat, location.lon, address, currentAddress, currentCity, currentState]);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.scrollTo({ top: 0 });
  }, [open]);

  if (!open) return null;

  const reverseGeocode = async (lat, lon) => {
    // 1. Try Geoapify
    if (apiKey) {
      try {
        const response = await axios.get(
          "https://api.geoapify.com/v1/geocode/reverse",
          {
            params: { lat, lon, format: "json", apiKey },
            withCredentials: false,
          },
        );
        const place = response.data?.results?.[0];
        if (place) {
          return {
            ...place,
            lat,
            lon,
            city: place.city || place.town || place.village || place.county || place.state,
            formatted: place.formatted || place.address_line1,
          };
        }
      } catch (geoErr) {
        console.warn("Geoapify reverse failed, falling back to OSM:", geoErr);
      }
    }

    // 2. Fallback to OpenStreetMap Nominatim
    try {
      const osmRes = await axios.get(
        "https://nominatim.openstreetmap.org/reverse",
        {
          params: { lat, lon, format: "json", addressdetails: 1 },
          withCredentials: false,
        },
      );
      if (osmRes.data) {
        const addr = osmRes.data.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || addr.state || "";
        const formatted = osmRes.data.display_name || `${city}, ${addr.state || ""}`;
        return {
          lat,
          lon,
          city,
          state: addr.state || "",
          formatted,
          address_line1: addr.road || osmRes.data.name || formatted,
          name: osmRes.data.name || formatted,
        };
      }
    } catch (osmErr) {
      console.warn("OSM reverse failed:", osmErr);
    }

    // 3. Coordinate fallback so user location is NEVER lost
    return {
      lat,
      lon,
      city: currentCity || "Your Location",
      state: currentState || "",
      formatted: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
      address_line1: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
    };
  };

  const searchLocations = async (event) => {
    event.preventDefault();
    const searchText = query.trim();
    if (!searchText) {
      setError("Enter a street address, neighborhood, or city.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);
    try {
      let validPlaces = [];

      // 1. Try Geoapify
      if (apiKey) {
        try {
          const response = await axios.get(
            "https://api.geoapify.com/v1/geocode/search",
            {
              params: { text: searchText, format: "geojson", limit: 5, apiKey },
              withCredentials: false,
            },
          );
          const places =
            response.data?.features?.map((feature) => feature.properties) ||
            response.data?.results ||
            [];
          validPlaces = places.filter(
            (place) =>
              Number.isFinite(Number(place.lat)) &&
              Number.isFinite(Number(place.lon)),
          );
        } catch (geoapifyErr) {
          console.warn("Geoapify search failed, trying OSM Nominatim:", geoapifyErr);
        }
      }

      // 2. Fallback to OpenStreetMap Nominatim
      if (!validPlaces.length) {
        const osmRes = await axios.get(
          "https://nominatim.openstreetmap.org/search",
          {
            params: { q: searchText, format: "json", limit: 5, addressdetails: 1 },
            withCredentials: false,
          },
        );
        if (Array.isArray(osmRes.data)) {
          validPlaces = osmRes.data.map((item) => ({
            lat: Number(item.lat),
            lon: Number(item.lon),
            city:
              item.address?.city ||
              item.address?.town ||
              item.address?.village ||
              item.address?.suburb ||
              item.address?.county ||
              item.address?.state ||
              "",
            state: item.address?.state || "",
            formatted: item.display_name,
            address_line1: item.display_name?.split(",")?.[0] || item.display_name,
            name: item.name || item.display_name,
          }));
        }
      }

      if (!validPlaces.length) {
        setError("No matching places found. Try a nearby street or city.");
      } else {
        setResults(validPlaces);
      }
    } catch (error) {
      setError(getLocationServiceError(error, "search that location"));
    } finally {
      setLoading(false);
    }
  };

  const selectSearchResult = (place) => {
    setSelectedPosition({ lat: Number(place.lat), lon: Number(place.lon) });
    setSelectedPlace(place);
    setResults([]);
    setError("");
  };

  const useCurrentLocation = () => {
    setError("");
    setResults([]);
    if (!navigator.geolocation) {
      setError("This browser can’t access device location. Search for an address instead.");
      return;
    }

    setLocating(true);

    const onCoordsReceived = async ({ coords }) => {
      const nextPosition = { lat: coords.latitude, lon: coords.longitude };
      setSelectedPosition(nextPosition);
      try {
        const place = await reverseGeocode(nextPosition.lat, nextPosition.lon);
        setSelectedPlace(place);
        setError("");
      } catch {
        setSelectedPlace({
          lat: nextPosition.lat,
          lon: nextPosition.lon,
          city: currentCity || "Current Location",
          state: currentState || "",
          formatted: `Location (${nextPosition.lat.toFixed(4)}, ${nextPosition.lon.toFixed(4)})`,
          address_line1: `Location (${nextPosition.lat.toFixed(4)}, ${nextPosition.lon.toFixed(4)})`,
        });
      } finally {
        setLocating(false);
      }
    };

    const onCoordsFailed = (locationError) => {
      if (locationError.code === locationError.PERMISSION_DENIED) {
        setLocating(false);
        setError("Location permission was denied. Please allow location access in your browser or search for an address.");
      } else {
        // Retry with high accuracy false as second attempt
        navigator.geolocation.getCurrentPosition(
          onCoordsReceived,
          (secondError) => {
            setLocating(false);
            if (secondError.code === secondError.PERMISSION_DENIED) {
              setError("Location permission was denied. Please allow location access in your browser or search for an address.");
            } else if (secondError.code === secondError.TIMEOUT) {
              setError("Finding location timed out. Please drag the pin or search for your address.");
            } else {
              setError("Could not detect device location. Please search for an address or drag the map pin.");
            }
          },
          { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
        );
      }
    };

    navigator.geolocation.getCurrentPosition(
      onCoordsReceived,
      onCoordsFailed,
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 8000 },
    );
  };

  const handleMarkerDrag = async (event) => {
    const point = event.target.getLatLng();
    const nextPosition = { lat: point.lat, lon: point.lng };
    setSelectedPosition(nextPosition);
    setSelectedPlace(null);
    setResolvingPin(true);
    setError("");

    try {
      const place = await reverseGeocode(nextPosition.lat, nextPosition.lon);
      setSelectedPlace(place);
    } catch {
      setSelectedPlace({
        lat: nextPosition.lat,
        lon: nextPosition.lon,
        city: currentCity || "Pin Location",
        state: currentState || "",
        formatted: `Location (${nextPosition.lat.toFixed(4)}, ${nextPosition.lon.toFixed(4)})`,
        address_line1: `Location (${nextPosition.lat.toFixed(4)}, ${nextPosition.lon.toFixed(4)})`,
      });
    } finally {
      setResolvingPin(false);
    }
  };

  const applySelectedLocation = () => {
    if (!selectedPosition || !selectedPlace) {
      setError("Search for a place or move the pin to a mappable address first.");
      return;
    }
    const city = selectedPlace.city || selectedPlace.town || selectedPlace.village || selectedPlace.county || selectedPlace.state;
    const formatted = selectedPlace.formatted || selectedPlace.address_line1 || selectedPlace.name || city;
    if (!city || !formatted) {
      setError("Choose a result with a city so we can find nearby restaurants.");
      return;
    }

    dispatch(setLocation(selectedPosition));
    dispatch(setAddress(formatted));
    dispatch(setManualSelection(true));
    dispatch(setCurrentCity(city));
    dispatch(setCurrentState(selectedPlace.state || null));
    dispatch(setCurrentAddress(selectedPlace.address_line1 || selectedPlace.name || formatted));
    onClose();
  };

  const mapCenter = selectedPosition || location || defaultMapCenter;

  return createPortal((
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-[#21150f]/40 p-4 backdrop-blur-[2px]">
      <button
        type="button"
        aria-label="Close location picker"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="location-picker-title"
        className="relative z-10 max-h-[calc(100dvh-2rem)] w-full max-w-lg touch-pan-y overscroll-contain overflow-y-auto rounded-3xl border border-orange-100 bg-[#fffaf6] p-5 shadow-2xl shadow-[#55321f]/20 sm:p-7"
      >
        <div className="sticky top-0 z-20 -mx-5 -mt-5 mb-4 bg-[#fffaf6] px-5 pt-5 pb-3 sm:-mx-7 sm:-mt-7 sm:px-7 sm:pt-7">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <span className="mb-2 inline-flex size-10 items-center justify-center rounded-2xl bg-[#fff0e7] text-[#ff4d2d]">
                <MapPin size={20} />
              </span>
              <h2 id="location-picker-title" className="text-xl font-extrabold text-[#26221f] sm:text-2xl">
                Change delivery location
              </h2>
              <p className="mt-1 text-sm leading-5 text-[#746b64]">
                Search for a place, then drag the pin to fine-tune your delivery spot.
              </p>
            </div>
            <button
              type="button"
              aria-label="Close location picker"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#eadfd8] bg-white text-[#625b55] shadow-sm transition hover:bg-orange-100 hover:text-[#26221f]"
              onClick={onClose}
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={searchLocations} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setError("");
              }}
              placeholder="Street, neighborhood, or city"
              aria-label="Search delivery address or city"
              className="h-12 min-w-0 flex-1 rounded-xl border border-[#eadfd8] bg-white px-3.5 text-sm text-[#26221f] outline-none transition placeholder:text-[#a39a93] focus:border-[#ff4d2d] focus:ring-4 focus:ring-[#ff4d2d]/10"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ff4d2d] px-4 text-sm font-bold text-white shadow-sm transition hover:bg-[#e94325] disabled:cursor-wait disabled:opacity-65"
            >
              {loading ? <LoaderCircle size={17} className="animate-spin" /> : <Search size={17} />}
              <span className="hidden sm:inline">Search</span>
            </button>
          </form>

          <button
            type="button"
            disabled={locating || loading}
            onClick={useCurrentLocation}
            className="mt-3 inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-[#ff4d2d]/25 bg-[#fff0e7] text-sm font-semibold text-[#d83e22] shadow-sm transition hover:bg-[#ffe6d7] disabled:cursor-wait disabled:opacity-60"
          >
            {locating ? <LoaderCircle size={17} className="animate-spin" /> : <LocateFixed size={17} />}
            {locating ? "Finding your location…" : "Use my current location"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-3 max-h-32 space-y-1.5 overflow-y-auto" aria-label="Location search results">
            {results.map((place, index) => {
              const title = place.address_line1 || place.name || place.city || place.formatted;
              const detail = place.address_line2 || place.city || place.state || place.country;
              return (
                <button
                  key={`${place.place_id || place.lat}-${place.lon}-${index}`}
                  type="button"
                  onClick={() => selectSearchResult(place)}
                  className="flex w-full items-start gap-3 rounded-xl border border-[#eee4de] bg-white p-2.5 text-left transition hover:border-[#ff4d2d]/40 hover:bg-[#fff5ee]"
                >
                  <MapPin size={17} className="mt-0.5 shrink-0 text-[#ff4d2d]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#35302c]">{title}</span>
                    <span className="mt-0.5 block truncate text-xs text-[#827971]">{detail}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 h-44 shrink-0 overflow-hidden rounded-2xl border border-[#eadfd8] bg-[#f2e9e2] sm:h-52">
          <MapContainer
            key={open ? "location-picker-map" : "location-picker-closed"}
            className="h-full w-full"
            center={[
              mapCenter.lat == null ? defaultMapCenter.lat : Number(mapCenter.lat),
              mapCenter.lon == null ? defaultMapCenter.lon : Number(mapCenter.lon),
            ]}
            zoom={selectedPosition ? 14 : 5}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap position={selectedPosition} />
            {selectedPosition && (
              <Marker
                position={[selectedPosition.lat, selectedPosition.lon]}
                draggable
                eventHandlers={{ dragend: handleMarkerDrag }}
              />
            )}
          </MapContainer>
        </div>

        <div className="mt-3 min-h-10" aria-live="polite">
          {resolvingPin ? (
            <p className="flex items-center gap-2 text-sm text-[#746b64]">
              <LoaderCircle size={15} className="animate-spin text-[#ff4d2d]" />
              Looking up the pin’s address…
            </p>
          ) : selectedPlace ? (
            <p className="text-sm font-medium text-[#433c37]">
              <MapPin size={15} className="mr-1 inline text-[#ff4d2d]" />
              {selectedPlace.formatted || selectedPlace.address_line1 || selectedPlace.name || "Selected delivery point"}
            </p>
          ) : (
            <p className="text-sm text-[#827971]">
              {selectedPosition
                ? "Drag the pin to fine-tune your delivery spot."
                : "Search for an address or city to place a pin on the map."}
            </p>
          )}
          {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
        </div>

        <button
          type="button"
          disabled={!selectedPlace || resolvingPin}
          onClick={applySelectedLocation}
          className="mt-2 h-11 w-full rounded-xl bg-[#ff4d2d] px-5 text-sm font-bold text-white transition hover:bg-[#e94325] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Use this location
        </button>
      </section>
    </div>
  ), document.body);
};

export default LocationPicker;
