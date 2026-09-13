import { Pressable, Text, TextInput, View } from "react-native";
import type { RouteDefinition } from "../types";

export function DriverView({
	routes,
	selectedRouteId,
	onSelectRoute,
	active,
	permissionGranted,
	simulationMode,
	onGrantPermission,
	onToggleSimulation,
	onStartTrip,
	onEndTrip,
	delayReason,
	setDelayReason,
}: {
	routes: RouteDefinition[];
	selectedRouteId: string;
	onSelectRoute: (routeId: string) => void;
	active: boolean;
	permissionGranted: boolean;
	simulationMode: boolean;
	onGrantPermission: () => void | Promise<void>;
	onToggleSimulation: () => void;
	onStartTrip: () => void | Promise<void>;
	onEndTrip: () => void;
	delayReason: string;
	setDelayReason: (value: string) => void;
}) {
	return (
		<>
			<Text style={{ fontSize: 20, fontWeight: "800", color: "#172033" }}>
				BUS-04 • Driver console
			</Text>
			<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
				Driver console
			</Text>

			<Text
				style={{
					fontSize: 16,
					fontWeight: "800",
					color: "#172033",
					marginTop: 18,
					marginBottom: 10,
				}}
			>
				Select route
			</Text>
			<View
				style={{
					backgroundColor: "#fff",
					borderWidth: 1,
					borderColor: "#dfe7ee",
					borderRadius: 12,
					overflow: "hidden",
					marginBottom: 16,
				}}
			>
				{routes.map((route) => (
					<Pressable
						key={route.id}
						onPress={() => onSelectRoute(route.id)}
						disabled={active}
						style={{
							padding: 12,
							borderBottomWidth: 1,
							borderBottomColor: "#edf2f7",
							backgroundColor:
								route.id === selectedRouteId ? "#e8f0f7" : "#fff",
						}}
					>
						<Text style={{ color: "#172033", fontWeight: "800" }}>
							{route.name}
						</Text>
						<Text style={{ color: "#64748b", fontSize: 12, marginTop: 3 }}>
							{route.stops.length} stops
						</Text>
					</Pressable>
				))}
			</View>

			<View
				style={{
					backgroundColor: "#fff",
					borderRadius: 14,
					borderWidth: 1,
					borderColor: "#dfe7ee",
					padding: 16,
					marginVertical: 18,
				}}
			>
				<View
					style={{
						width: 12,
						height: 12,
						borderRadius: 999,
						marginBottom: 10,
						backgroundColor: active ? "#21a366" : "#94a3b8",
					}}
				/>
				<Text
					style={{
						fontSize: 18,
						fontWeight: "800",
						color: "#123660",
						marginBottom: 6,
					}}
				>
					{active ? "LIVE LOCATION SHARING" : "ROUTE READY"}
				</Text>
				<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
					{active
						? "Sending a location heartbeat every 5 seconds"
						: "Location sharing is off until the route starts."}
				</Text>
			</View>

			<Pressable
				style={[
					{
						backgroundColor: "#17324d",
						borderRadius: 12,
						paddingVertical: 14,
						alignItems: "center",
						marginBottom: 16,
					},
					active && { backgroundColor: "#b54747" },
				]}
				onPress={active ? onEndTrip : onStartTrip}
				disabled={!simulationMode && !permissionGranted && !active}
			>
				<Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
					{active
						? "End Route"
						: permissionGranted || simulationMode
							? "Start Route"
							: "Permission Required"}
				</Text>
			</Pressable>

			{!permissionGranted && !simulationMode && (
				<Pressable
					style={{
						backgroundColor: "#2c5f7a",
						borderRadius: 12,
						paddingVertical: 12,
						alignItems: "center",
						marginBottom: 12,
					}}
					onPress={onGrantPermission}
				>
					<Text style={{ color: "#fff", fontWeight: "700" }}>
						Grant location permission
					</Text>
				</Pressable>
			)}

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
						Simulation mode
					</Text>
					<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
						{simulationMode
							? "Clearly labelled simulated route movement"
							: "Live GPS mode is active"}
					</Text>
				</View>
			</Pressable>

			<Text
				style={{
					fontSize: 16,
					fontWeight: "800",
					color: "#172033",
					marginBottom: 10,
					marginTop: 6,
				}}
			>
				Report delay
			</Text>
			<TextInput
				value={delayReason}
				onChangeText={setDelayReason}
				placeholder="Traffic, weather, mechanical issue..."
				style={{
					backgroundColor: "#fff",
					borderRadius: 12,
					borderWidth: 1,
					borderColor: "#dfe7ee",
					paddingHorizontal: 14,
					paddingVertical: 12,
					fontSize: 15,
					marginBottom: 12,
				}}
				editable={active}
			/>

			<Pressable
				style={[
					{
						backgroundColor: "#2c5f7a",
						borderRadius: 12,
						paddingVertical: 12,
						alignItems: "center",
						marginBottom: 12,
					},
					!active && { backgroundColor: "#cbd5e1" },
				]}
				disabled={!active}
			>
				<Text style={{ color: "#fff", fontWeight: "700" }}>
					Share delay reason
				</Text>
			</Pressable>

			<Text
				style={{
					marginTop: 12,
					color: "#64748b",
					fontSize: 12,
					lineHeight: 18,
				}}
			>
				Foreground-only tracking is intentional for the prototype. Ending the
				route immediately stops sharing.
			</Text>
		</>
	);
}
