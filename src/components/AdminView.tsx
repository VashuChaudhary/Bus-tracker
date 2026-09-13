import { Pressable, Text, TextInput, View } from "react-native";
import * as Location from "expo-location";
import { useEffect, useState } from "react";
import { StatusPill } from "./StatusPill";
import type { RouteDefinition, RouteStop, TripStatus } from "../types";

function Metric({ label, value }: { label: string; value: string }) {
	return (
		<View
			style={{
				width: "47%",
				backgroundColor: "#fff",
				borderRadius: 12,
				borderWidth: 1,
				borderColor: "#dfe7ee",
				padding: 14,
			}}
		>
			<Text style={{ fontWeight: "800", color: "#123660", fontSize: 28 }}>
				{value}
			</Text>
			<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
				{label}
			</Text>
		</View>
	);
}

export function AdminView({
	routes,
	selectedRouteId,
	onSelectRoute,
	onDeleteRoute,
	status,
	nextStop,
	eta,
	active,
	simulationMode,
	onToggleSimulation,
	aiSummary,
	liveGps,
	routeBuilderStops,
	routeName,
	onRouteNameChange,
	editingRouteId,
	onEditRoute,
	onRemoveBuilderStop,
	onEditBuilderStop,
	draftStop,
	onDraftStopChange,
	onAddStop,
	onSaveRoute,
	onSelectLocation,
}: {
	routes: RouteDefinition[];
	selectedRouteId: string;
	onSelectRoute: (routeId: string) => void;
	onDeleteRoute: (routeId: string) => void;
	status: TripStatus;
	nextStop: RouteStop;
	eta: number;
	active: boolean;
	simulationMode: boolean;
	onToggleSimulation: () => void;
	aiSummary: string;
	liveGps: boolean;
	routeBuilderStops: RouteStop[];
	routeName: string;
	onRouteNameChange: (value: string) => void;
	editingRouteId: string | null;
	onEditRoute: (route: RouteDefinition) => void;
	onRemoveBuilderStop: (stopId: string) => void;
	onEditBuilderStop: (stop: RouteStop) => void;
	draftStop: {
		name: string;
		lat: string;
		lng: string;
		scheduledMinutes: string;
	};
	onDraftStopChange: (
		field: "name" | "lat" | "lng" | "scheduledMinutes",
		value: string,
	) => void;
	onAddStop: () => void;
	onSaveRoute: () => void;
	onSelectLocation: (location: RouteStop) => void;
}) {
	const selectedRoute = routes.find((route) => route.id === selectedRouteId);
	const [locationQuery, setLocationQuery] = useState("");
	const [searchedLocations, setSearchedLocations] = useState<RouteStop[]>([]);
	const [locationsLoading, setLocationsLoading] = useState(false);
	const [locationSearchError, setLocationSearchError] = useState(false);
	const [nearbyLoading, setNearbyLoading] = useState(false);

	useEffect(() => {
		const query = locationQuery.trim();
		if (!query) {
			setSearchedLocations([]);
			setLocationSearchError(false);
			return undefined;
		}

		const controller = new AbortController();
		const timer = setTimeout(() => {
			setLocationsLoading(true);
			setLocationSearchError(false);
			const search = async (searchQuery: string) => {
				const response = await fetch(
					`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&namedetails=1&dedupe=1&limit=10&countrycodes=in&q=${encodeURIComponent(searchQuery)}`,
					{
						headers: {
							Accept: "application/json",
							"Accept-Language": "en",
							"User-Agent": "SafeTrack school transport app",
						},
						signal: controller.signal,
					},
				);
				if (!response.ok) throw new Error("Location search request failed");
				return (await response.json()) as Array<{
					place_id: number;
					display_name: string;
					lat: string;
					lon: string;
					address?: {
						amenity?: string;
						shop?: string;
						road?: string;
						suburb?: string;
						city?: string;
						state?: string;
					};
				}>;
			};

			void search(`${query}, New Delhi, India`)
				.then((results) => (results.length > 0 ? results : search(query)))
				.then((results) => {
					setSearchedLocations(
						results
							.map((result, index) => ({
								id: `search-${result.place_id}-${index}`,
								name: [
									result.address?.amenity,
									result.address?.shop,
									result.display_name,
								]
									.filter(Boolean)
									.join(", "),
								lat: Number(result.lat),
								lng: Number(result.lon),
								scheduledMinutes: 0,
								radius: 180,
							}))
							.filter(
								(result) =>
									Number.isFinite(result.lat) && Number.isFinite(result.lng),
							),
					);
				})
				.catch((error: unknown) => {
					if (!(error instanceof Error && error.name === "AbortError")) {
						setSearchedLocations([]);
						setLocationSearchError(true);
					}
				})
				.finally(() => setLocationsLoading(false));
		}, 350);

		return () => {
			clearTimeout(timer);
			controller.abort();
		};
	}, [locationQuery]);

	const chooseLocation = (location: RouteStop) => {
		onSelectLocation(location);
		onDraftStopChange("name", location.name);
		onDraftStopChange("lat", String(location.lat));
		onDraftStopChange("lng", String(location.lng));
		onDraftStopChange("scheduledMinutes", String(location.scheduledMinutes));
		setLocationQuery("");
		setSearchedLocations([]);
	};

	const useCurrentLocation = async () => {
		setNearbyLoading(true);
		try {
			const permission = await Location.requestForegroundPermissionsAsync();
			if (permission.status !== "granted") return;

			const current = await Location.getCurrentPositionAsync({
				accuracy: Location.Accuracy.High,
			});
			const { latitude, longitude } = current.coords;
			const response = await fetch(
				`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&lat=${latitude}&lon=${longitude}`,
				{
					headers: {
						Accept: "application/json",
						"Accept-Language": "en",
						"User-Agent": "SafeTrack school transport app",
					},
				},
			);
			const data = (await response.json()) as {
				display_name?: string;
			};
			const name = data.display_name || "Current location";
			onSelectLocation({
				id: `nearby-${Date.now()}`,
				name,
				lat: latitude,
				lng: longitude,
				scheduledMinutes: 0,
				radius: 180,
			});
			onDraftStopChange("name", name);
			onDraftStopChange("lat", String(latitude));
			onDraftStopChange("lng", String(longitude));
		} catch {
			setLocationSearchError(true);
		} finally {
			setNearbyLoading(false);
		}
	};

	return (
		<>
			<Text style={{ fontSize: 20, fontWeight: "800", color: "#172033" }}>
				Transport dashboard
			</Text>
			<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
				Live route management • current service health
			</Text>

			<View
				style={{
					flexDirection: "row",
					flexWrap: "wrap",
					gap: 10,
					marginVertical: 16,
				}}
			>
				<Metric label="Active buses" value={active ? "1" : "0"} />
				<Metric
					label="Delayed buses"
					value={status === "DELAYED" ? "1" : "0"}
				/>
				<Metric label="Routes" value={String(routes.length)} />
				<Metric
					label="Stops"
					value={String(selectedRoute?.stops.length ?? 0)}
				/>
			</View>

			<Pressable
				style={{
					flexDirection: "row",
					alignItems: "center",
					gap: 12,
					backgroundColor: "#fff",
					borderWidth: 1,
					borderColor: "#dfe7ee",
					borderRadius: 12,
					padding: 14,
					marginBottom: 18,
				}}
				onPress={onToggleSimulation}
			>
				<View
					style={[
						{
							width: 48,
							height: 28,
							borderRadius: 999,
							backgroundColor: "#dfe7ee",
							justifyContent: "center",
							paddingHorizontal: 4,
						},
						simulationMode && { backgroundColor: "#2e7d6b" },
					]}
				>
					<View
						style={[
							{
								width: 20,
								height: 20,
								borderRadius: 999,
								backgroundColor: "#fff",
							},
							simulationMode && { marginLeft: 20 },
						]}
					/>
				</View>
				<View>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "700",
							color: "#172033",
							flex: 1,
						}}
					>
						Demo Simulation
					</Text>
					<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
						{simulationMode
							? "Replaying a defined route for presentation"
							: "Live transport data only"}
					</Text>
				</View>
			</Pressable>

			<View style={{ marginBottom: 16 }}>
				<Text
					style={{
						fontSize: 16,
						fontWeight: "800",
						color: "#172033",
						marginBottom: 10,
					}}
				>
					Saved routes
				</Text>
				{routes.map((route) => (
					<View
						key={route.id}
						style={{
							flexDirection: "row",
							alignItems: "center",
							backgroundColor: "#fff",
							borderWidth: 1,
							borderColor: route.id === selectedRouteId ? "#123660" : "#dfe7ee",
							borderRadius: 12,
							padding: 12,
							marginBottom: 8,
						}}
					>
						<Pressable
							onPress={() => onSelectRoute(route.id)}
							style={{ flex: 1 }}
						>
							<Text style={{ fontWeight: "800", color: "#172033" }}>
								{route.name}
							</Text>
							<Text style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
								{route.stops.length} stops
								{route.id === selectedRouteId ? " • selected" : ""}
							</Text>
						</Pressable>
						<Pressable
							onPress={() => onDeleteRoute(route.id)}
							disabled={routes.length === 1}
						>
							<Text
								style={{
									color: routes.length === 1 ? "#cbd5e1" : "#b54747",
									fontWeight: "800",
								}}
							>
								Delete
							</Text>
						</Pressable>
						<Pressable
							onPress={() => onEditRoute(route)}
							style={{ marginLeft: 12 }}
						>
							<Text style={{ color: "#155fa0", fontWeight: "800" }}>Edit</Text>
						</Pressable>
					</View>
				))}
			</View>

			<Text
				style={{
					fontSize: 16,
					fontWeight: "800",
					color: "#172033",
					marginBottom: 10,
				}}
			>
				{editingRouteId ? "Edit route" : "Create new route"}
			</Text>
			{/* <Text
				style={{
					fontSize: 15,
					fontWeight: "800",
					color: "#172033",
					marginBottom: 10,
				}}
			>
				{routeName || "New School Route"} stops
			</Text>
			{routeBuilderStops.map((stop, index) => (
				<View
					key={stop.id}
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 10,
						backgroundColor: "#fff",
						padding: 12,
						borderWidth: 1,
						borderColor: "#edf2f7",
						borderRadius: 10,
						marginBottom: 8,
					}}
				>
					<View
						style={{
							width: 10,
							height: 10,
							borderRadius: 999,
							backgroundColor: "#2e7d6b",
						}}
					/>
					<View style={{ flex: 1 }}>
						<Text style={{ fontSize: 14, fontWeight: "700", color: "#172033" }}>
							{index + 1}. {stop.name}
						</Text>
						<Text style={{ color: "#64748b", fontSize: 12, lineHeight: 18 }}>
							{stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
						</Text>
					</View>
					<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
						{routeBuilderStops.length === 1 && index === 0
							? "Departure / Arrival"
							: index === 0
								? "Departure"
								: index === routeBuilderStops.length - 1
									? "Arrival"
									: `${stop.scheduledMinutes} min`}
					</Text>
				</View>
			))} */}

			<View
				style={{
					backgroundColor: "#fff",
					borderRadius: 14,
					borderWidth: 1,
					borderColor: "#dfe7ee",
					padding: 14,
					marginBottom: 16,
				}}
			>
				<Text
					style={{
						fontSize: 15,
						fontWeight: "800",
						color: "#172033",
						marginBottom: 12,
					}}
				>
					{editingRouteId
						? "Edit route stops"
						: "Create route from start to end"}
				</Text>
				<TextInput
					placeholder="Route name"
					value={routeName}
					onChangeText={onRouteNameChange}
					style={{
						borderWidth: 1,
						borderColor: "#dfe7ee",
						borderRadius: 10,
						padding: 10,
						marginBottom: 10,
						backgroundColor: "#f8fafc",
					}}
				/>
				<Pressable
					onPress={() => void useCurrentLocation()}
					style={{
						borderWidth: 1,
						borderColor: "#2e7d6b",
						borderRadius: 10,
						padding: 10,
						marginBottom: 10,
						alignItems: "center",
					}}
				>
					<Text style={{ color: "#2e7d6b", fontWeight: "800" }}>
						{nearbyLoading
							? "Finding nearby location..."
							: "Use my current location"}
					</Text>
				</Pressable>
				<TextInput
					placeholder="Search place or enter stop name"
					value={draftStop.name}
					onChangeText={(value) => {
						setLocationQuery(value);
						onDraftStopChange("name", value);
					}}
					style={{
						borderWidth: 1,
						borderColor: "#dfe7ee",
						borderRadius: 10,
						padding: 10,
						marginBottom: 10,
						backgroundColor: "#f8fafc",
					}}
				/>
				{locationQuery.trim() && (
					<View
						style={{
							borderWidth: 1,
							borderColor: "#dfe7ee",
							borderRadius: 10,
							marginTop: -6,
							marginBottom: 10,
							overflow: "hidden",
							backgroundColor: "#fff",
						}}
					>
						{locationsLoading && (
							<Text style={{ color: "#64748b", fontSize: 12, padding: 10 }}>
								Searching locations...
							</Text>
						)}
						{searchedLocations.map((location) => (
							<Pressable
								key={location.id}
								onPress={() => chooseLocation(location)}
								style={{
									padding: 10,
									borderBottomWidth: 1,
									borderBottomColor: "#edf2f7",
								}}
							>
								<Text style={{ color: "#172033", fontWeight: "700" }}>
									{location.name}
								</Text>
								<Text style={{ color: "#64748b", fontSize: 11, marginTop: 2 }}>
									{location.lat.toFixed(5)}, {location.lng.toFixed(5)}
								</Text>
							</Pressable>
						))}
						{!locationsLoading && searchedLocations.length === 0 && (
							<Text style={{ color: "#64748b", fontSize: 12, padding: 10 }}>
								{locationSearchError
									? "Location search is unavailable. Check your internet connection."
									: "No matching places found."}
							</Text>
						)}
					</View>
				)}
				<View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
					<TextInput
						placeholder="Latitude"
						keyboardType="decimal-pad"
						value={draftStop.lat}
						onChangeText={(value) => onDraftStopChange("lat", value)}
						style={{
							flex: 1,
							borderWidth: 1,
							borderColor: "#dfe7ee",
							borderRadius: 10,
							padding: 10,
							backgroundColor: "#f8fafc",
						}}
					/>
					<TextInput
						placeholder="Longitude"
						keyboardType="decimal-pad"
						value={draftStop.lng}
						onChangeText={(value) => onDraftStopChange("lng", value)}
						style={{
							flex: 1,
							borderWidth: 1,
							borderColor: "#dfe7ee",
							borderRadius: 10,
							padding: 10,
							backgroundColor: "#f8fafc",
						}}
					/>
				</View>
				<View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
					<TextInput
						placeholder="Minutes from start"
						keyboardType="number-pad"
						value={draftStop.scheduledMinutes}
						onChangeText={(value) =>
							onDraftStopChange("scheduledMinutes", value)
						}
						style={{
							flex: 1,
							borderWidth: 1,
							borderColor: "#dfe7ee",
							borderRadius: 10,
							padding: 10,
							backgroundColor: "#f8fafc",
						}}
					/>
					<Pressable
						onPress={onAddStop}
						style={{
							backgroundColor: "#475569",
							paddingHorizontal: 16,
							paddingVertical: 10,
							borderRadius: 10,
							justifyContent: "center",
						}}
					>
						<Text style={{ color: "#fff", fontWeight: "700" }}>Add stop</Text>
					</Pressable>
				</View>
				<Pressable
					onPress={onSaveRoute}
					style={{
						backgroundColor: "#123660",
						paddingVertical: 12,
						borderRadius: 10,
						alignItems: "center",
					}}
				>
					<Text style={{ color: "#fff", fontWeight: "800" }}>
						Save full route
					</Text>
				</Pressable>
			</View>
			<Text
				style={{
					fontSize: 15,
					fontWeight: "800",
					color: "#172033",
					marginBottom: 10,
				}}
			>
				{routeName || "New School Route"} stops
			</Text>
			{routeBuilderStops.map((stop, index) => (
				<View
					key={stop.id}
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 10,
						backgroundColor: "#fff",
						padding: 12,
						borderWidth: 1,
						borderColor: "#edf2f7",
						borderRadius: 10,
						marginBottom: 8,
					}}
				>
					<View
						style={{
							width: 10,
							height: 10,
							borderRadius: 999,
							backgroundColor: "#2e7d6b",
						}}
					/>
					<View style={{ flex: 1 }}>
						<Text style={{ fontSize: 14, fontWeight: "700", color: "#172033" }}>
							{index + 1}. {stop.name}
						</Text>
						<Text style={{ color: "#64748b", fontSize: 12, lineHeight: 18 }}>
							{stop.lat.toFixed(5)}, {stop.lng.toFixed(5)}
						</Text>
					</View>
					<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
						{routeBuilderStops.length === 1 && index === 0
							? "Departure / Arrival"
							: index === 0
								? "Departure"
								: index === routeBuilderStops.length - 1
									? "Arrival"
									: `${stop.scheduledMinutes} min`}
					</Text>
					<Pressable
						onPress={() => onEditBuilderStop(stop)}
						style={{ marginLeft: 10 }}
					>
						<Text style={{ color: "#155fa0", fontWeight: "800" }}>Edit</Text>
					</Pressable>
					<Pressable
						onPress={() => onRemoveBuilderStop(stop.id)}
						style={{ marginLeft: 10 }}
					>
						<Text style={{ color: "#b54747", fontWeight: "800" }}>Delete</Text>
					</Pressable>
				</View>
			))}

			<Text
				style={{
					fontSize: 16,
					fontWeight: "800",
					color: "#172033",
					marginBottom: 10,
					marginTop: 6,
				}}
			>
				Active trip
			</Text>
			<View
				style={{
					backgroundColor: "#fff",
					borderRadius: 14,
					borderWidth: 1,
					borderColor: "#dfe7ee",
					padding: 16,
					marginBottom: 12,
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<View>
					<Text
						style={{
							fontSize: 14,
							fontWeight: "700",
							color: "#172033",
							flex: 1,
						}}
					>
						BUS-04 • Route R-12
					</Text>
					<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
						Next: {nextStop.name} • ETA {active ? `${eta} min` : "-"} •{" "}
						{liveGps ? "Live GPS" : "Demo mode"}
					</Text>
				</View>
				<StatusPill status={status} />
			</View>

			<View
				style={{
					backgroundColor: "#fff",
					borderRadius: 14,
					borderWidth: 1,
					borderColor: "#dfe7ee",
					padding: 14,
					marginTop: 12,
				}}
			>
				<Text
					style={{
						fontSize: 16,
						fontWeight: "800",
						color: "#172033",
						marginBottom: 10,
						marginTop: 6,
					}}
				>
					AI assistant summary
				</Text>
				<Text style={{ color: "#334155", fontSize: 13, lineHeight: 20 }}>
					{aiSummary}
				</Text>
			</View>
		</>
	);
}
