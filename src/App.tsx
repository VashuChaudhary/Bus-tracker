import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { AdminView } from "./components/AdminView";
import { DriverView } from "./components/DriverView";
import { ParentView } from "./components/ParentView";
import { RolePicker } from "./components/RolePicker";
import {
	deleteSharedRoute,
	getSharedState,
	publishRoutes,
	publishState,
} from "./services/syncClient";
import { STOPS, DELAY_THRESHOLD_MINUTES } from "./data/route";
import type {
	PermissionState,
	Role,
	RouteDefinition,
	RouteStop,
	TripStatus,
} from "./types";
import {
	clamp,
	distanceMeters,
	getEtaMinutes,
	getInterpolatedLocation,
	getNearestStop,
} from "./utils/geo";

function buildAiSummary(
	status: TripStatus,
	eta: number,
	delayReason: string,
	nextStop: { name: string },
) {
	if (status === "DELAYED") {
		return `AI check: The trip is delayed and the next stop is ${nextStop.name}. The deterministic ETA is about ${eta} minutes. Delay reason: ${delayReason || "Driver has not reported a reason yet."}`;
	}

	if (status === "APPROACHING") {
		return `AI check: The bus is approaching ${nextStop.name}. The estimated arrival is about ${eta} minutes.`;
	}

	if (status === "ON_TIME") {
		return `AI check: The route remains on time. The bus is expected to reach ${nextStop.name} in approximately ${eta} minutes.`;
	}

	if (status === "NOT_STARTED") {
		return "AI check: The trip has not started yet. The system is waiting for the driver to begin live sharing.";
	}

	return "AI check: The trip has ended. The system is showing the final trip status with no live GPS updates.";
}

type StopDraft = {
	name: string;
	lat: string;
	lng: string;
	scheduledMinutes: string;
};

export default function App() {
	const [role, setRole] = useState<Role | null>(null);
	const [permissionState, setPermissionState] =
		useState<PermissionState>("unknown");
	const [tripActive, setTripActive] = useState(false);
	const [simulationMode, setSimulationMode] = useState(true);
	const [progress, setProgress] = useState(0.1);
	const [delayReason, setDelayReason] = useState("");
	const [lastUpdated, setLastUpdated] = useState(new Date());
	const [gpsLocation, setGpsLocation] =
		useState<Location.LocationObject | null>(null);
	const [remoteLocation, setRemoteLocation] = useState<{
		lat: number;
		lng: number;
	} | null>(null);
	const [syncConnected, setSyncConnected] = useState(false);
	const [routes, setRoutes] = useState<RouteDefinition[]>([
		{ id: "route-r12", name: "Route R-12", stops: STOPS },
	]);
	const [selectedRouteId, setSelectedRouteId] = useState("route-r12");
	const [routeBuilderStops, setRouteBuilderStops] = useState<RouteStop[]>([]);
	const [routeName, setRouteName] = useState("New school route");
	const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
	const [editingStopId, setEditingStopId] = useState<string | null>(null);
	const [draftStop, setDraftStop] = useState<StopDraft>({
		name: "",
		lat: "28.617",
		lng: "77.214",
		scheduledMinutes: "15",
	});
	const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
	const permissionGranted = permissionState === "granted";
	const selectedRoute =
		routes.find((route) => route.id === selectedRouteId) ?? routes[0];
	const activeStops = selectedRoute?.stops ?? STOPS;

	useEffect(() => {
		let isMounted = true;

		void (async () => {
			const { status } = await Location.getForegroundPermissionsAsync();
			if (isMounted) {
				setPermissionState(status === "granted" ? "granted" : "denied");
			}
		})();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		let cancelled = false;

		const applySharedState = (
			shared: Awaited<ReturnType<typeof getSharedState>>,
		) => {
			if (cancelled) return;
			setRoutes(shared.routes);
			setSelectedRouteId(shared.selectedRouteId);
			setTripActive(shared.tripActive);
			setSimulationMode(shared.simulationMode);
			setProgress(shared.progress);
			setRemoteLocation(shared.liveLocation);
			if (shared.lastUpdated) setLastUpdated(new Date(shared.lastUpdated));
			setSyncConnected(true);
		};

		const poll = async () => {
			try {
				applySharedState(await getSharedState());
			} catch {
				if (!cancelled) setSyncConnected(false);
			}
		};

		void poll();
		const timer = setInterval(() => void poll(), 2000);
		return () => {
			cancelled = true;
			clearInterval(timer);
		};
	}, []);

	useEffect(() => {
		if (!tripActive || simulationMode) {
			if (subscriptionRef.current) {
				subscriptionRef.current.remove();
				subscriptionRef.current = null;
			}
			return undefined;
		}

		let cancelled = false;

		void (async () => {
			const { status } = await Location.getForegroundPermissionsAsync();
			if (status !== "granted") {
				setPermissionState("denied");
				return;
			}

			setPermissionState("granted");

			const current = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});

			if (cancelled) {
				return;
			}

			setGpsLocation(current);
			setRemoteLocation({
				lat: current.coords.latitude,
				lng: current.coords.longitude,
			});
			setLastUpdated(new Date(current.timestamp));
			void publishState({
				tripActive: true,
				selectedRouteId,
				simulationMode: false,
				liveLocation: {
					lat: current.coords.latitude,
					lng: current.coords.longitude,
				},
			});

			const subscription = await Location.watchPositionAsync(
				{
					accuracy: Location.Accuracy.High,
					timeInterval: 5000,
					distanceInterval: 20,
				},
				(location) => {
					if (!cancelled) {
						setGpsLocation(location);
						setRemoteLocation({
							lat: location.coords.latitude,
							lng: location.coords.longitude,
						});
						setLastUpdated(new Date(location.timestamp));
						void publishState({
							tripActive: true,
							selectedRouteId,
							liveLocation: {
								lat: location.coords.latitude,
								lng: location.coords.longitude,
							},
						});
					}
				},
			);

			if (!cancelled) {
				subscriptionRef.current = subscription;
			}
		})();

		return () => {
			cancelled = true;
			if (subscriptionRef.current) {
				subscriptionRef.current.remove();
				subscriptionRef.current = null;
			}
		};
	}, [tripActive, simulationMode]);

	useEffect(() => {
		if ((!tripActive && role !== "parent") || !simulationMode) {
			return undefined;
		}

		const timer = setInterval(() => {
			setProgress((current) => {
				const nextProgress = Math.min(current + 0.08, activeStops.length - 1);
				if (tripActive) {
					void publishState({ progress: nextProgress, tripActive: true });
				}
				return nextProgress;
			});
			setLastUpdated(new Date());
		}, 4500);

		return () => clearInterval(timer);
	}, [activeStops, role, tripActive, simulationMode]);

	const effectiveLocation = useMemo(() => {
		if (tripActive && !simulationMode && gpsLocation) {
			return {
				lat: gpsLocation.coords.latitude,
				lng: gpsLocation.coords.longitude,
			};
		}
		if (tripActive && !simulationMode && remoteLocation) {
			return remoteLocation;
		}

		return getInterpolatedLocation(progress, activeStops);
	}, [
		activeStops,
		tripActive,
		simulationMode,
		gpsLocation,
		progress,
		remoteLocation,
	]);

	const nextStop = useMemo(() => {
		if (tripActive && !simulationMode && gpsLocation) {
			return getNearestStop(effectiveLocation, activeStops);
		}

		const index = clamp(
			Math.ceil(progress),
			0,
			Math.max(activeStops.length - 1, 0),
		);
		return activeStops[index] ?? activeStops[0] ?? STOPS[0];
	}, [
		activeStops,
		effectiveLocation,
		gpsLocation,
		progress,
		simulationMode,
		tripActive,
	]);

	const eta = getEtaMinutes(effectiveLocation, nextStop);
	const distanceToStop = distanceMeters(effectiveLocation, nextStop);
	const parentPreviewActive = role === "parent" && simulationMode;
	const serviceActive = tripActive || parentPreviewActive;
	const approaching = serviceActive && distanceToStop <= nextStop.radius;
	const delayed = serviceActive && eta > DELAY_THRESHOLD_MINUTES;
	const status: TripStatus = !serviceActive
		? progress >= activeStops.length - 1
			? "COMPLETED"
			: "NOT_STARTED"
		: delayed
			? "DELAYED"
			: approaching
				? "APPROACHING"
				: "ON_TIME";

	const aiSummary = buildAiSummary(status, eta, delayReason, nextStop);

	const startTrip = async () => {
		if (!simulationMode && permissionState !== "granted") {
			const { status } = await Location.requestForegroundPermissionsAsync();
			const granted = status === "granted";
			setPermissionState(granted ? "granted" : "denied");
			if (!granted) return;
		}

		setTripActive(true);
		setProgress(0.1);
		setLastUpdated(new Date());
		setRemoteLocation(null);
		void publishState({
			tripActive: true,
			selectedRouteId,
			simulationMode,
			progress: 0.1,
			liveLocation: null,
		});
	};

	const endTrip = () => {
		setTripActive(false);
		setProgress(activeStops.length - 1);
		setLastUpdated(new Date());
		setGpsLocation(null);
		setRemoteLocation(null);
		void publishState({
			tripActive: false,
			selectedRouteId,
			progress: activeStops.length - 1,
			liveLocation: null,
		});
	};

	const addRouteStop = () => {
		const parsedLat = Number(draftStop.lat);
		const parsedLng = Number(draftStop.lng);
		const parsedMinutes = Number(draftStop.scheduledMinutes);

		if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
			return;
		}

		const nextStopNumber = routeBuilderStops.length + 1;
		const stop: RouteStop = {
			id: `custom-${Date.now()}`,
			name: draftStop.name.trim() || `Stop ${nextStopNumber}`,
			lat: parsedLat,
			lng: parsedLng,
			scheduledMinutes: Number.isFinite(parsedMinutes)
				? Math.max(0, parsedMinutes)
				: 0,
			radius: 180,
		};

		setRouteBuilderStops((current) =>
			editingStopId
				? current.map((item) =>
						item.id === editingStopId ? { ...stop, id: editingStopId } : item,
					)
				: [...current, stop],
		);
		setEditingStopId(null);
		setDraftStop({
			name: "",
			lat: String(parsedLat),
			lng: String(parsedLng),
			scheduledMinutes: String(Math.max(0, parsedMinutes + 5)),
		});
	};

	const saveRoute = () => {
		const trimmedName = routeName.trim();
		if (!trimmedName || routeBuilderStops.length < 2) {
			return;
		}

		const route: RouteDefinition = {
			id: editingRouteId ?? `route-${Date.now()}`,
			name: trimmedName,
			stops: routeBuilderStops,
		};
		const nextRoutes = editingRouteId
			? routes.map((item) => (item.id === editingRouteId ? route : item))
			: [...routes, route];
		setRoutes(nextRoutes);
		setSelectedRouteId(route.id);
		setRouteBuilderStops([]);
		setRouteName("New school route");
		setEditingRouteId(null);
		setProgress(0.1);
		void publishRoutes(nextRoutes, route.id);
	};

	const editRoute = (route: RouteDefinition) => {
		setEditingRouteId(route.id);
		setRouteName(route.name);
		setRouteBuilderStops(route.stops);
		setEditingStopId(null);
	};

	const editBuilderStop = (stop: RouteStop) => {
		setEditingStopId(stop.id);
		setDraftStop({
			name: stop.name,
			lat: String(stop.lat),
			lng: String(stop.lng),
			scheduledMinutes: String(stop.scheduledMinutes),
		});
	};

	const removeBuilderStop = (stopId: string) => {
		setRouteBuilderStops((current) =>
			current.filter((stop) => stop.id !== stopId),
		);
		if (editingStopId === stopId) setEditingStopId(null);
	};

	const deleteRoute = (routeId: string) => {
		if (routes.length <= 1) {
			return;
		}

		setRoutes((current) => current.filter((route) => route.id !== routeId));
		if (selectedRouteId === routeId) {
			const nextRoute = routes.find((route) => route.id !== routeId);
			if (nextRoute) {
				setSelectedRouteId(nextRoute.id);
			}
		}
		setTripActive(false);
		setProgress(0);
		void deleteSharedRoute(routeId);
	};

	const toggleSimulation = () => {
		setSimulationMode((current) => {
			const nextMode = !current;
			void publishState({ simulationMode: nextMode });
			return nextMode;
		});
	};

	if (!role) {
		return <RolePicker onSelect={setRole} />;
	}

	return (
		<SafeAreaProvider>
			<SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8fb" }}>
				<StatusBar style="dark" />
				<ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
					<View
						style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: 26,
						}}
					>
						<View>
							<Text
								style={{ color: "#123660", fontSize: 32, fontWeight: "800" }}
							>
								SafeTrack
							</Text>
							<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
								School transport visibility
							</Text>
						</View>
						<View style={{ padding: 6 }}>
							<Text
								onPress={() => setRole(null)}
								style={{ color: "#155fa0", fontWeight: "700" }}
							>
								Switch role
							</Text>
						</View>
					</View>

					{role === "parent" && (
						<ParentView
							status={status}
							location={effectiveLocation}
							nextStop={nextStop}
							eta={eta}
							lastUpdated={lastUpdated}
							delayReason={delayReason}
							aiSummary={aiSummary}
							liveGps={tripActive && !simulationMode}
							routeStops={activeStops}
						/>
					)}

					{role === "driver" && (
						<DriverView
							routes={routes}
							selectedRouteId={selectedRouteId}
							onSelectRoute={(routeId) => {
								setSelectedRouteId(routeId);
								setTripActive(false);
								setProgress(0);
								setGpsLocation(null);
								setRemoteLocation(null);
								void publishState({
									selectedRouteId: routeId,
									tripActive: false,
									progress: 0,
									liveLocation: null,
								});
							}}
							active={tripActive}
							permissionGranted={permissionGranted}
							simulationMode={simulationMode}
							onGrantPermission={async () => {
								const { status } =
									await Location.requestForegroundPermissionsAsync();
								setPermissionState(status === "granted" ? "granted" : "denied");
							}}
							onStartTrip={startTrip}
							onEndTrip={endTrip}
							onToggleSimulation={toggleSimulation}
							delayReason={delayReason}
							setDelayReason={setDelayReason}
						/>
					)}

					{role === "admin" && (
						<AdminView
							routes={routes}
							selectedRouteId={selectedRouteId}
							onSelectRoute={(routeId) => {
								setSelectedRouteId(routeId);
								void publishState({ selectedRouteId: routeId });
							}}
							onDeleteRoute={deleteRoute}
							status={status}
							nextStop={nextStop}
							eta={eta}
							active={tripActive}
							simulationMode={simulationMode}
							onToggleSimulation={toggleSimulation}
							aiSummary={aiSummary}
							liveGps={tripActive && !simulationMode}
							routeBuilderStops={routeBuilderStops}
							routeName={routeName}
							onRouteNameChange={setRouteName}
							editingRouteId={editingRouteId}
							onEditRoute={editRoute}
							onRemoveBuilderStop={removeBuilderStop}
							onEditBuilderStop={editBuilderStop}
							draftStop={draftStop}
							onDraftStopChange={(field, value) =>
								setDraftStop((current) => ({ ...current, [field]: value }))
							}
							onAddStop={addRouteStop}
							onSaveRoute={saveRoute}
							onSelectLocation={(location) =>
								setDraftStop({
									name: location.name,
									lat: String(location.lat),
									lng: String(location.lng),
									scheduledMinutes: String(location.scheduledMinutes),
								})
							}
						/>
					)}
				</ScrollView>
			</SafeAreaView>
		</SafeAreaProvider>
	);
}
