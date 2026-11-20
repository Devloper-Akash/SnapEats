import React, { useEffect } from "react";
import scooter from "../assets/scooter.png";
import home from "../assets/home.png";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, Popup, TileLayer, Marker, Polyline, useMap } from "react-leaflet";

const deliveryBoyIcon = new L.Icon({
  iconUrl: scooter,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});
const customerIcon = new L.Icon({
  iconUrl: home,
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function MapUpdater({ deliveryBoyLat, deliveryBoyLon, customerLat, customerLon }) {
  const map = useMap();

  useEffect(() => {
    const hasDelivery = Boolean(
      deliveryBoyLat != null && deliveryBoyLon != null && !isNaN(deliveryBoyLat) && !isNaN(deliveryBoyLon)
    );
    const hasCustomer = Boolean(
      customerLat != null && customerLon != null && !isNaN(customerLat) && !isNaN(customerLon)
    );

    if (hasDelivery && hasCustomer) {
      const bounds = L.latLngBounds([
        [Number(deliveryBoyLat), Number(deliveryBoyLon)],
        [Number(customerLat), Number(customerLon)],
      ]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    } else if (hasDelivery) {
      map.panTo([Number(deliveryBoyLat), Number(deliveryBoyLon)], { animate: true });
    } else if (hasCustomer) {
      map.panTo([Number(customerLat), Number(customerLon)], { animate: true });
    }
  }, [deliveryBoyLat, deliveryBoyLon, customerLat, customerLon, map]);

  return null;
}

const DeliveryBoyTracking = ({ data }) => {
  const deliveryBoyLat = data?.deliveryBoyLocation?.lat;
  const deliveryBoyLon = data?.deliveryBoyLocation?.lon;
  const customerLat = data?.customerLocation?.lat;
  const customerLon = data?.customerLocation?.lon;

  const hasDelivery = Boolean(
    deliveryBoyLat != null && deliveryBoyLon != null && !isNaN(deliveryBoyLat) && !isNaN(deliveryBoyLon)
  );
  const hasCustomer = Boolean(
    customerLat != null && customerLon != null && !isNaN(customerLat) && !isNaN(customerLon)
  );

  const center = hasDelivery
    ? [Number(deliveryBoyLat), Number(deliveryBoyLon)]
    : hasCustomer
      ? [Number(customerLat), Number(customerLon)]
      : [20.5937, 78.9629];

  const path =
    hasDelivery && hasCustomer
      ? [
          [Number(deliveryBoyLat), Number(deliveryBoyLon)],
          [Number(customerLat), Number(customerLon)],
        ]
      : [];

  return (
    <div className="w-full h-[300px] mt-3 rounded-lg overflow-hidden shadow-md">
      <MapContainer className={"h-full w-full"} center={center} zoom={13}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater
          deliveryBoyLat={deliveryBoyLat}
          deliveryBoyLon={deliveryBoyLon}
          customerLat={customerLat}
          customerLon={customerLon}
        />
        {hasDelivery && (
          <Marker position={[deliveryBoyLat, deliveryBoyLon]} icon={deliveryBoyIcon}>
            <Popup>Delivery Boy</Popup>
          </Marker>
        )}
        {hasCustomer && (
          <Marker position={[customerLat, customerLon]} icon={customerIcon}>
            <Popup>Customer</Popup>
          </Marker>
        )}
        {path.length === 2 && <Polyline positions={path} color="#ff4d2d" weight={4} opacity={0.9} />}
      </MapContainer>
    </div>
  );
};

export default DeliveryBoyTracking;
