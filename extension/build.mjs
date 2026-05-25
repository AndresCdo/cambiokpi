#!/usr/bin/env node
// Build script for CambioKPI Chrome Extension
// 1. Build popup with Vite
// 2. Copy static assets (manifest, background, icons)

import { execSync } from "child_process";
import { existsSync, mkdirSync, cpSync, rmSync } from "fs";
import { resolve } from "path";

const root = resolve(import.meta.dirname || ".");
const dist = resolve(root, "dist");
const pub = resolve(root, "public");

// Clean dist
console.log("Cleaning dist...");
if (existsSync(dist)) rmSync(dist, { recursive: true });
mkdirSync(dist, { recursive: true });

// Build popup
console.log("Building popup...");
execSync("npx vite build --outDir dist", { stdio: "inherit", cwd: root });

// Copy static files
console.log("Copying static assets...");
cpSync(resolve(pub, "manifest.json"), resolve(dist, "manifest.json"));
cpSync(resolve(pub, "background.js"), resolve(dist, "background.js"));
cpSync(resolve(pub, "icons"), resolve(dist, "icons"), { recursive: true });

console.log("Extension build complete!");
