import { Text, View } from "react-native";
import { RouteMap } from "./RouteMap";
import { StatusPill } from "./StatusPill";
import type { Coordinates, RouteStop, TripStatus } from "../types";

export function ParentView({
	status,
	location,
	nextStop,
	eta,
	lastUpdated,
	delayReason,
	aiSummary,
	liveGps,
	routeStops,
}: {
	status: TripStatus;
	location: Coordinates;
	nextStop: RouteStop;
	eta: number;
	lastUpdated: Date;
	delayReason: string;
	aiSummary: string;
	liveGps: boolean;
	routeStops: RouteStop[];
}) {
	const alertText =
		status === "NOT_STARTED"
			? "Bus has not started yet. The driver is ready to begin the route."
			: status === "APPROACHING"
				? "Bus is approaching the next stop. Please be ready at the pickup point."
				: status === "DELAYED"
					? `Bus is delayed${delayReason ? `: ${delayReason}` : ". Driver has not reported a reason yet."}`
					: status === "COMPLETED"
						? "Today's bus trip is complete. The route is now closed."
						: "Bus is on time and moving according to the planned route.";

	const tone =
		status === "DELAYED"
			? "danger"
			: status === "APPROACHING"
				? "warning"
				: "neutral";

	return (
		<>
			<View
				style={{
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: 16,
				}}
			>
				<View>
					<Text style={{ fontSize: 20, fontWeight: "800", color: "#172033" }}>
						BUS-04 • Route R-12
					</Text>
					<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
						Your stop: Green Valley Gate
					</Text>
				</View>
				<StatusPill status={status} />
			</View>

			<View
				style={{
					borderRadius: 12,
					padding: 13,
					marginBottom: 16,
					backgroundColor:
						tone === "danger"
							? "#fee2e2"
							: tone === "warning"
								? "#fef3c7"
								: "#e2e8f0",
				}}
			>
				<Text style={{ fontWeight: "700", color: "#334155" }}>{alertText}</Text>
			</View>

			<RouteMap
				location={location}
				nextStop={nextStop}
				liveGps={liveGps}
				routeStops={routeStops}
			/>

			<View
				style={{
					backgroundColor: "#fff",
					borderRadius: 14,
					borderWidth: 1,
					borderColor: "#dfe7ee",
					padding: 16,
					marginBottom: 16,
				}}
			>
				<Text style={{ fontWeight: "700", color: "#1f2937", marginBottom: 8 }}>
					ETA to {nextStop.name}
				</Text>
				<Text style={{ fontWeight: "800", color: "#123660", fontSize: 28 }}>
					{status === "NOT_STARTED" ? "-" : `${eta} min`}
				</Text>
				<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
					Last updated{" "}
					{lastUpdated.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
						second: "2-digit",
					})}
				</Text>
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
					AI explanation
				</Text>
				<Text style={{ color: "#334155", fontSize: 13, lineHeight: 20 }}>
					{aiSummary}
				</Text>
			</View>

			<Text
				style={{
					fontSize: 16,
					fontWeight: "800",
					color: "#172033",
					marginBottom: 10,
					marginTop: 6,
				}}
			>
				Route stops
			</Text>
			{routeStops.map((stop, index) => (
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
					<Text
						style={{
							fontSize: 14,
							fontWeight: "700",
							color: "#172033",
							flex: 1,
						}}
					>
						{stop.name}
					</Text>
					<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
						{routeStops.length === 1 && index === 0
							? "Departure / Arrival"
							: index === 0
								? "Departure"
								: index === routeStops.length - 1
									? "Arrival"
									: "Stop"}
					</Text>
				</View>
			))}
		</>
	);
}
