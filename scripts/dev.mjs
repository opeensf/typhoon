import { spawn } from "node:child_process";
import http from "node:http";

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";

function run(command, args, options = {}) {
  const child = spawn(command, args, {
    stdio: "inherit",
    shell: isWindows,
    ...options
  });
  return child;
}

function waitFor(url, timeoutMs = 30000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - started > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(tick, 350);
      });
    };
    tick();
  });
}

const vite = run(npmCmd, ["exec", "vite", "--", "--host", "127.0.0.1", "--port", "5173"]);

const shutdown = () => {
  vite.kill();
  process.exit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await waitFor("http://127.0.0.1:5173");

const electron = run(npmCmd, ["exec", "electron", "."], {
  env: {
    ...process.env,
    VITE_DEV_SERVER_URL: "http://127.0.0.1:5173"
  }
});

electron.on("exit", (code) => {
  vite.kill();
  process.exit(code ?? 0);
});
