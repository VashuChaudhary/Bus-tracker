import { Text, View } from "react-native";
import type { TripStatus } from "../types";

function getStatusColor(status: TripStatus) {
	return {
		NOT_STARTED: "#64748b",
		ON_TIME: "#177c68",
		APPROACHING: "#b7791f",
		DELAYED: "#bd4b4b",
		COMPLETED: "#40556e",
	}[status];
}

export function StatusPill({ status }: { status: TripStatus }) {
	return (
		<View
			style={{
				paddingHorizontal: 11,
				paddingVertical: 7,
				borderRadius: 999,
				backgroundColor: getStatusColor(status),
			}}
		>
			<Text
				style={{
					color: "white",
					fontSize: 10,
					fontWeight: "800",
					textTransform: "uppercase",
				}}
			>
				{status.replace("_", " ")}
			</Text>
		</View>
	);
}
