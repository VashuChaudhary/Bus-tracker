import { spawn } from "node:child_process";
import localtunnel from "localtunnel";

const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "npx.cmd" : "npx";

const syncServer = spawn(npmCommand, ["node", "server/sync-server.mjs"], {
	stdio: "inherit",
	shell: isWindows,
});

const tunnel = await localtunnel({ port: 3001 });
console.log(`Public sync API: ${tunnel.url}`);
console.log("Keep this terminal open while testing outside Wi-Fi.");

const expo = spawn(npmCommand, ["expo", "start", "--tunnel"], {
	stdio: "inherit",
	shell: isWindows,
	env: {
		...process.env,
		EXPO_PUBLIC_API_URL: tunnel.url,
	},
});

function shutdown() {
	tunnel.close();
	syncServer.kill();
	expo.kill();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
expo.on("exit", () => {
	tunnel.close();
	syncServer.kill();
});
