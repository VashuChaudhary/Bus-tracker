import type { Coordinates, RouteDefinition } from "../types";

type SharedState = {
	routes: RouteDefinition[];
	selectedRouteId: string;
	tripActive: boolean;
	simulationMode: boolean;
	progress: number;
	liveLocation: Coordinates | null;
	lastUpdated: string | null;
};

const explicitUrl = process.env.EXPO_PUBLIC_API_URL;
const metroHost = process.env.EXPO_PUBLIC_METRO_HOST;
const apiBaseUrl =
	process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, "") ||
	"https://bus-tracker-w5oh.onrender.com";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(`${apiBaseUrl}${path}`, {
		headers: { "Content-Type": "application/json" },
		...init,
	});
	if (!response.ok) {
		throw new Error(`Sync request failed: ${response.status}`);
	}
	return (await response.json()) as T;
}

export function getSharedState() {
	return request<SharedState>("/state");
}

export function publishState(patch: Partial<SharedState>) {
	return request<SharedState>("/state", {
		method: "POST",
		body: JSON.stringify(patch),
	});
}

export function publishRoutes(
	routes: RouteDefinition[],
	selectedRouteId: string,
) {
	return request<SharedState>("/routes", {
		method: "POST",
		body: JSON.stringify({ routes, selectedRouteId }),
	});
}

export function deleteSharedRoute(routeId: string) {
	return request<SharedState>(`/routes/${encodeURIComponent(routeId)}`, {
		method: "DELETE",
	});
}
