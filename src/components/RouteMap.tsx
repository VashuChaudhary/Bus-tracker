import { Text, View } from "react-native";
import WebView from "react-native-webview";
import type { Coordinates, RouteStop } from "../types";

export function RouteMap({
	location,
	nextStop,
	liveGps,
	routeStops,
}: {
	location: Coordinates;
	nextStop: RouteStop;
	liveGps: boolean;
	routeStops: RouteStop[];
}) {
	const safeStops =
		routeStops.length > 0
			? routeStops
			: [
					{
						id: "fallback",
						name: "School",
						lat: 28.6139,
						lng: 77.209,
						scheduledMinutes: 0,
						radius: 180,
					},
				];
	const mapHtml = `
		<!doctype html>
		<html>
		<head>
			<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
			<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
			<style>
				html, body, #map { margin: 0; height: 100%; width: 100%; background: #dfeef5; }
				body { font-family: sans-serif; }
				.bus-marker { position: relative; width: 30px; height: 30px; border-radius: 50%; background: #dc2626; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.45); display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 8px; font-weight: 800; }
				.bus-marker::after { content: ''; position: absolute; inset: -7px; border: 2px solid rgba(220, 38, 38, 0.35); border-radius: 50%; animation: bus-pulse 1.8s ease-out infinite; }
				@keyframes bus-pulse { 0% { transform: scale(0.75); opacity: 0.9; } 100% { transform: scale(1.25); opacity: 0; } }
			</style>
		</head>
		<body>
			<div id="map"></div>
			<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
			<script>
				const stops = ${JSON.stringify(safeStops.map((stop) => ({ id: stop.id, name: stop.name, lat: stop.lat, lng: stop.lng })))};
				const bus = ${JSON.stringify({ lat: location.lat, lng: location.lng })};
				const nextStopName = ${JSON.stringify(nextStop.name)};
				const map = L.map('map', { zoomControl: true, attributionControl: true });
				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					maxZoom: 19,
					attribution: '&copy; OpenStreetMap contributors'
				}).addTo(map);
				const bounds = L.latLngBounds(stops.map((stop) => [stop.lat, stop.lng]));
				map.fitBounds(bounds.pad(0.35));
				const routeLine = L.polyline(stops.map((stop) => [stop.lat, stop.lng]), { color: '#1d4ed8', weight: 5, opacity: 0.9 }).addTo(map);
				stops.forEach((stop, index) => {
					L.marker([stop.lat, stop.lng]).addTo(map).bindPopup((index + 1) + '. ' + stop.name);
				});
				const busIcon = L.divIcon({
					className: 'bus-icon-wrapper',
					html: '<div class="bus-marker">BUS</div>',
					iconSize: [30, 30],
					iconAnchor: [15, 15],
				});
				L.marker([bus.lat, bus.lng], { icon: busIcon, zIndexOffset: 1000 }).addTo(map).bindPopup('BUS-04');
				map.flyTo([bus.lat, bus.lng], Math.max(map.getZoom(), 12), { animate: true, duration: 1.2 });
				const label = L.divIcon({ className: 'route-badge', html: '<div style="background:#123660;color:#fff;border-radius:999px;padding:6px 10px;font-size:11px;font-weight:700;">Next: ' + nextStopName + '</div>' });
				L.marker([bus.lat, bus.lng], { icon: label, opacity: 0 }).addTo(map);
			</script>
		</body>
		</html>
	`;

	return (
		<View
			style={{
				height: 260,
				borderRadius: 16,
				overflow: "hidden",
				marginBottom: 16,
				backgroundColor: "#dfeef5",
			}}
		>
			<WebView
				source={{ html: mapHtml }}
				originWhitelist={["*"]}
				javaScriptEnabled
				scalesPageToFit
				style={{ flex: 1, backgroundColor: "#dfeef5" }}
			/>
			<Text
				style={{
					position: "absolute",
					right: 12,
					bottom: 12,
					backgroundColor: "#123660",
					color: "#fff",
					fontSize: 11,
					fontWeight: "700",
					paddingHorizontal: 10,
					paddingVertical: 5,
					borderRadius: 999,
					overflow: "hidden",
				}}
			>
				Next: {nextStop.name}
			</Text>
		</View>
	);
}
