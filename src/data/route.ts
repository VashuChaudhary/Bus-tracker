import type { RouteStop } from "../types";

export const STOPS: RouteStop[] = [
	{
		id: "school",
		name: "SafeTrack School",
		lat: 28.6139,
		lng: 77.209,
		scheduledMinutes: 0,
		radius: 140,
	},
	{
		id: "green-valley",
		name: "Green Valley Gate",
		lat: 28.6152,
		lng: 77.2111,
		scheduledMinutes: 8,
		radius: 180,
	},
	{
		id: "library",
		name: "City Library",
		lat: 28.6173,
		lng: 77.2134,
		scheduledMinutes: 14,
		radius: 220,
	},
	{
		id: "lake-view",
		name: "Lake View Stop",
		lat: 28.6191,
		lng: 77.2158,
		scheduledMinutes: 20,
		radius: 180,
	},
	{
		id: "north-campus",
		name: "North Campus",
		lat: 28.6212,
		lng: 77.218,
		scheduledMinutes: 27,
		radius: 180,
	},
];

export const DELAY_THRESHOLD_MINUTES = 8;
export const ROUTE_SPEED_KMH = 18;
