import { Pressable, SafeAreaView, Text, View } from "react-native";
import type { Role } from "../types";

export function RolePicker({ onSelect }: { onSelect: (role: Role) => void }) {
	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "#eef4f1" }}>
			<View style={{ flex: 1, justifyContent: "center", padding: 24 }}>
				<View
					style={{
						flexDirection: "row",
						alignItems: "center",
						gap: 12,
						marginBottom: 28,
					}}
				>
					<View
						style={{
							width: 52,
							height: 52,
							borderRadius: 16,
							backgroundColor: "#123660",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Text style={{ color: "#f7c948", fontSize: 18, fontWeight: "900" }}>
							ST
						</Text>
					</View>
					<View>
						<Text
							style={{
								color: "#123660",
								fontSize: 31,
								fontWeight: "900",
								letterSpacing: 0.2,
							}}
						>
							SafeTrack
						</Text>
						<Text
							style={{
								color: "#2e7d6b",
								fontSize: 12,
								fontWeight: "800",
								letterSpacing: 1.2,
							}}
						>
							SCHOOL TRANSPORT
						</Text>
					</View>
				</View>
				<Text
					style={{
						fontSize: 27,
						fontWeight: "900",
						color: "#172033",
						marginBottom: 8,
					}}
				>
					Welcome back
				</Text>
				<Text style={{ color: "#64748b", fontSize: 13, lineHeight: 19 }}>
					Choose the workspace for today&apos;s school transport operations.
				</Text>

				<View style={{ gap: 12, marginTop: 24 }}>
					{(["parent", "driver", "admin"] as Role[]).map((roleItem) => (
						<Pressable
							key={roleItem}
							style={{
								backgroundColor: roleItem === "driver" ? "#123660" : "#fff",
								borderRadius: 18,
								padding: 18,
								borderWidth: 1,
								borderColor: roleItem === "driver" ? "#123660" : "#d7e3df",
								shadowColor: "#123660",
								shadowOpacity: 0.08,
								shadowRadius: 10,
								shadowOffset: { width: 0, height: 4 },
								elevation: 2,
							}}
							onPress={() => onSelect(roleItem)}
						>
							<Text
								style={{
									fontSize: 16,
									fontWeight: "800",
									color: roleItem === "driver" ? "#fff" : "#172033",
								}}
							>
								{roleItem === "parent"
									? "Parent - Priya Sharma"
									: roleItem === "driver"
										? "Driver - Arun Kumar"
										: "Admin - Transport Office"}
							</Text>
							<Text
								style={{
									color: roleItem === "driver" ? "#d9e8f5" : "#64748b",
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
			</View>
		</SafeAreaView>
	);
}
