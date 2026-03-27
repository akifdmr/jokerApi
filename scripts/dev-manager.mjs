import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const rootDir = process.cwd();
const services = [
  { name: "server", cwd: path.join(rootDir, "server"), color: "\x1b[36m" },
  { name: "client", cwd: path.join(rootDir, "client"), color: "\x1b[35m" },
];

const reset = "\x1b[0m";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const children = [];
let shuttingDown = false;

function log(name, color, message) {
  process.stdout.write(`${color}[${name}]${reset} ${message}`);
}

function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill("SIGTERM");
    }
  }

  setTimeout(() => {
    for (const child of children) {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
    }
    process.exit(exitCode);
  }, 1500);
}

for (const service of services) {
  const child = spawn(npmCmd, ["run", "dev"], {
    cwd: service.cwd,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  children.push(child);

  child.stdout.on("data", (chunk) => log(service.name, service.color, chunk.toString()));
  child.stderr.on("data", (chunk) => log(service.name, service.color, chunk.toString()));

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    const reason = signal ? `signal ${signal}` : `code ${code ?? 0}`;
    log(service.name, service.color, `stopped with ${reason}\n`);
    shutdown(code ?? 1);
  });

  child.on("error", (err) => {
    if (shuttingDown) return;
    log(service.name, service.color, `failed to start: ${err.message}\n`);
    shutdown(1);
  });
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
