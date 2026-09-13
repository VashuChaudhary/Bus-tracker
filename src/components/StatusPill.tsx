import { Text, View } from "react-native";
import type { TripStatus } from "../types";

function getStatusColor(status: TripStatus) {
	return {
		NOT_STARTED: "#64748b",
		ON_TIME: "#16794c",
		APPROACHING: "#d97706",
		DELAYED: "#b54747",
		COMPLETED: "#475569",
	}[status];
}

export function StatusPill({ status }: { status: TripStatus }) {
	return (
		<View
			style={{
				paddingHorizontal: 10,
				paddingVertical: 6,
				borderRadius: 999,
				backgroundColor: getStatusColor(status),
			}}
		>
			<Text
				style={{
					color: "white",
					fontSize: 11,
					fontWeight: "800",
					textTransform: "uppercase",
				}}
			>
				{status.replace("_", " ")}
			</Text>
		</View>
	);
}
