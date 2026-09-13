export type Role = "parent" | "driver" | "admin";
export type TripStatus =
	| "NOT_STARTED"
	| "ON_TIME"
	| "APPROACHING"
	| "DELAYED"
	| "COMPLETED";
export type PermissionState = "unknown" | "granted" | "denied";

export type RouteStop = {
	id: string;
	name: string;
	lat: number;
	lng: number;
	scheduledMinutes: number;
	radius: number;
};

export type RouteDefinition = {
	id: string;
	name: string;
	stops: RouteStop[];
};

export type Coordinates = {
	lat: number;
	lng: number;
};
