import { Pressable, SafeAreaView, Text, View } from "react-native";
import type { Role } from "../types";

export function RolePicker({ onSelect }: { onSelect: (role: Role) => void }) {
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#f6f8fb" }}>
			<View style={{ flex: 1, justifyContent: "center", padding: 24, gap: 16 }}>
				<Text style={{ color: "#123660", fontSize: 32, fontWeight: "800" }}>
					SafeTrack
				</Text>
				<Text
					style={{
						fontSize: 21,
						fontWeight: "700",
						color: "#172033",
						marginTop: 12,
					}}
				>
					Choose a demo account
				</Text>
				<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
					Role-based access for Parent, Driver, and Admin with live demo
					transport data.
				</Text>

				{(["parent", "driver", "admin"] as Role[]).map((roleItem) => (
					<Pressable
						key={roleItem}
						style={{
							backgroundColor: "#fff",
							borderRadius: 14,
							padding: 18,
							borderWidth: 1,
							borderColor: "#e2e8f0",
						}}
						onPress={() => onSelect(roleItem)}
					>
						<Text style={{ fontSize: 16, fontWeight: "700", color: "#172033" }}>
							{roleItem === "parent"
								? "Parent - Priya Sharma"
								: roleItem === "driver"
									? "Driver - Arun Kumar"
									: "Admin - Transport Office"}
						</Text>
						<Text
							style={{
								color: "#64748b",
								fontSize: 13,
								lineHeight: 19,
								marginTop: 6,
							}}
						>
							{roleItem === "parent"
								? "Follow BUS-04 and Green Valley Gate"
								: roleItem === "driver"
									? "Start a route and share location"
									: "Monitor routes and active trips"}
						</Text>
					</Pressable>
				))}
			</View>
		</SafeAreaView>
	);
}
