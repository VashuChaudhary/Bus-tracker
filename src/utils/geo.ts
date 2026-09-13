import type { Coordinates, RouteStop } from "../types";
import { ROUTE_SPEED_KMH, STOPS } from "../data/route";

export function clamp(value: number, min: number, max: number) {
	return Math.min(Math.max(value, min), max);
}

export function distanceMeters(a: Coordinates, b: Coordinates) {
	const toRad = (value: number) => (value * Math.PI) / 180;
	const earthRadius = 6371000;
	const latDelta = toRad(b.lat - a.lat);
	const lngDelta = toRad(b.lng - a.lng);
	const haversine =
		Math.sin(latDelta / 2) ** 2 +
		Math.cos(toRad(a.lat)) *
			Math.cos(toRad(b.lat)) *
			Math.sin(lngDelta / 2) ** 2;

	return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

export function getInterpolatedLocation(
	progress: number,
	stops: RouteStop[] = STOPS,
): Coordinates {
	const safeStops = stops.length > 0 ? stops : STOPS;
	const lowerIndex = Math.floor(progress);
	const upperIndex = Math.min(lowerIndex + 1, safeStops.length - 1);
	const lowerStop = safeStops[lowerIndex] ?? safeStops[0];
	const upperStop = safeStops[upperIndex] ?? safeStops[safeStops.length - 1];
	const fraction = progress - lowerIndex;

	return {
		lat: lowerStop.lat + (upperStop.lat - lowerStop.lat) * fraction,
		lng: lowerStop.lng + (upperStop.lng - lowerStop.lng) * fraction,
	};
}

export function getNearestStop(
	location: Coordinates,
	stops: RouteStop[] = STOPS,
): RouteStop {
	const safeStops = stops.length > 0 ? stops : STOPS;
	let nearestStop = safeStops[0];
	let nearestDistance = Number.POSITIVE_INFINITY;

	for (const stop of safeStops) {
		const distance = distanceMeters(location, stop);
		if (distance < nearestDistance) {
			nearestDistance = distance;
			nearestStop = stop;
		}
	}

	return nearestStop;
}

export function getEtaMinutes(location: Coordinates, stop: RouteStop) {
	const meters = distanceMeters(location, stop);
	const etaMinutes = (meters / 1000 / ROUTE_SPEED_KMH) * 60;
	return Math.max(1, Math.ceil(etaMinutes));
}
