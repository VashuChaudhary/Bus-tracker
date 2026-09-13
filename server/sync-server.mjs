import http from "node:http";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const port = Number(process.env.PORT ?? 3001);
const statePath = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"state.json",
);
const defaultState = {
	routes: [
		{
			id: "route-r12",
			name: "Route R-12",
			stops: [
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
			],
		},
	],
	selectedRouteId: "route-r12",
	tripActive: false,
	simulationMode: true,
	progress: 0,
	liveLocation: null,
	lastUpdated: null,
};

let state = existsSync(statePath)
	? { ...defaultState, ...JSON.parse(readFileSync(statePath, "utf8")) }
	: defaultState;

function persist() {
	writeFileSync(statePath, JSON.stringify(state, null, 2));
}

function send(response, statusCode, body) {
	response.writeHead(statusCode, {
		"Content-Type": "application/json",
		"Access-Control-Allow-Origin": "*",
	});
	response.end(JSON.stringify(body));
}

function readBody(request) {
	return new Promise((resolve, reject) => {
		let body = "";
		request.on("data", (chunk) => {
			body += chunk;
		});
		request.on("end", () => resolve(body ? JSON.parse(body) : {}));
		request.on("error", reject);
	});
}

const server = http.createServer(async (request, response) => {
	if (request.method === "OPTIONS") {
		response.writeHead(204, {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
			"Access-Control-Allow-Headers": "Content-Type",
		});
		response.end();
		return;
	}

	try {
		if (request.method === "GET" && request.url === "/health") {
			send(response, 200, { ok: true });
			return;
		}

		if (request.method === "GET" && request.url === "/state") {
			send(response, 200, state);
			return;
		}

		if (request.method === "POST" && request.url === "/state") {
			const patch = await readBody(request);
			state = { ...state, ...patch, lastUpdated: new Date().toISOString() };
			persist();
			send(response, 200, state);
			return;
		}

		if (request.method === "POST" && request.url === "/routes") {
			const body = await readBody(request);
			state = {
				...state,
				routes: body.routes ?? state.routes,
				selectedRouteId: body.selectedRouteId ?? state.selectedRouteId,
			};
			persist();
			send(response, 200, state);
			return;
		}

		if (request.method === "DELETE" && request.url?.startsWith("/routes/")) {
			const routeId = decodeURIComponent(request.url.slice("/routes/".length));
			state = {
				...state,
				routes: state.routes.filter((route) => route.id !== routeId),
			};
			if (!state.routes.some((route) => route.id === state.selectedRouteId)) {
				state.selectedRouteId = state.routes[0]?.id ?? "";
			}
			persist();
			send(response, 200, state);
			return;
		}

		send(response, 404, { error: "Not found" });
	} catch (error) {
		console.error(error);
		send(response, 400, { error: "Invalid request" });
	}
});

server.listen(port, "0.0.0.0", () => {
	console.log(`SafeTrack sync server listening on http://0.0.0.0:${port}`);
});
