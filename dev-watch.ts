#!/usr/bin/env -S deno run --allow-all --unstable-detect-cjs
/**
 * Development file watcher with polling support for Docker on Windows
 * This script uses polling instead of inotify to detect file changes
 */

import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

const WATCH_DIRS = [
  "./commands",
  "./db",
  "./dto",
  "./naagoLib",
  "./naagostone",
  "./types",
];
const WATCH_FILES = ["./index.ts", "./deploy-commands.ts"];
const POLL_INTERVAL = 2000; // Check every 2 seconds
const DEBOUNCE_TIME = 500; // Wait 500ms after last change before restarting

interface FileInfo {
  path: string;
  mtime: number;
}

let fileMap = new Map<string, number>();
let restartTimeout: number | null = null;
let childProcess: Deno.ChildProcess | null = null;

async function getFileHashes(): Promise<Map<string, number>> {
  const map = new Map<string, number>();

  // Watch specific files
  for (const file of WATCH_FILES) {
    try {
      const stat = await Deno.stat(file);
      if (stat.mtime) {
        map.set(file, stat.mtime.getTime());
      }
    } catch {
      // File doesn't exist
    }
  }

  // Watch directories
  for (const dir of WATCH_DIRS) {
    try {
      for await (const entry of walk(dir, { exts: [".ts", ".js", ".json"] })) {
        if (entry.isFile) {
          const stat = await Deno.stat(entry.path);
          if (stat.mtime) {
            map.set(entry.path, stat.mtime.getTime());
          }
        }
      }
    } catch {
      // Directory doesn't exist
    }
  }

  return map;
}

async function startApp() {
  if (childProcess) {
    try {
      childProcess.kill("SIGTERM");
      await childProcess.status;
    } catch {
      // Process already dead
    }
  }

  console.log("\n\x1b[36m[Watcher] Starting application...\x1b[0m");

  const command = new Deno.Command("deno", {
    args: ["run", "--allow-all", "--unstable-detect-cjs", "index.ts"],
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  childProcess = command.spawn();
}

function scheduleRestart() {
  if (restartTimeout !== null) {
    clearTimeout(restartTimeout);
  }

  restartTimeout = setTimeout(() => {
    console.log("\x1b[33m[Watcher] Files changed, restarting...\x1b[0m");
    startApp();
    restartTimeout = null;
  }, DEBOUNCE_TIME);
}

async function watchFiles() {
  fileMap = await getFileHashes();
  await startApp();

  console.log(
    "\x1b[32m[Watcher] Watching for file changes (polling mode)...\x1b[0m",
  );
  console.log(`\x1b[90m[Watcher] Watching: ${WATCH_DIRS.join(", ")}\x1b[0m\n`);

  setInterval(async () => {
    const newMap = await getFileHashes();
    let hasChanges = false;

    // Check for new or modified files
    for (const [path, mtime] of newMap) {
      const oldMtime = fileMap.get(path);
      if (!oldMtime || oldMtime !== mtime) {
        hasChanges = true;
        break;
      }
    }

    // Check for deleted files
    if (!hasChanges) {
      for (const path of fileMap.keys()) {
        if (!newMap.has(path)) {
          hasChanges = true;
          break;
        }
      }
    }

    if (hasChanges) {
      fileMap = newMap;
      scheduleRestart();
    }
  }, POLL_INTERVAL);
}

// Handle graceful shutdown
Deno.addSignalListener("SIGTERM", () => {
  if (childProcess) {
    childProcess.kill("SIGTERM");
  }
  Deno.exit(0);
});

Deno.addSignalListener("SIGINT", () => {
  if (childProcess) {
    childProcess.kill("SIGTERM");
  }
  Deno.exit(0);
});

// Start watching
watchFiles();
