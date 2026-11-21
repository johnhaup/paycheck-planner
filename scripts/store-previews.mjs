/**
 * App Preview videos (`bun store:previews [name…]`), kept in ship/previews. Each one is a Maestro flow
 * (ship/previews/<name>.yaml) recorded with `simctl io recordVideo` on the store sample budget, then cut and
 * encoded to Apple's spec: 886 × 1920, H.264, 30 fps, silent stereo AAC, 15 to 30 seconds. The captions are
 * the screenshot captions of ship.config.json, faded in over the bottom of the clean screen recording.
 *
 * Needs a booted simulator running a build made with EXPO_PUBLIC_STORE_DEMO=1 (or the dev build on a Metro
 * started with that flag: pass its address in METRO_URL), plus maestro, ffmpeg and rsvg-convert.
 *   UDID=<simulator> METRO_URL=http://127.0.0.1:8096 bun store:previews
 */
import { execFileSync, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { loadShipConfig, requireScreenshots } from "@johnhaup/expo-local-ship/src/store/config";

const [WIDTH, HEIGHT] = [886, 1920];
/** Seconds of the still first screen kept before the first movement; that frame is the poster */
const LEAD_IN = 2;
/** Seconds a screen stays still between two steps of the flow */
const HOLD = 1.3;
const MAX_SECONDS = 30;
const MIN_SECONDS = 15;

/**
 * `link` loads the sample data off camera. A caption shows the title of that screenshot from `at` seconds
 * into the finished video (from its end when negative) for `seconds`.
 */
const PREVIEWS = {
  paychecks: {
    link: "paycheck-planner://demo",
    captions: [
      { shot: "paychecks", at: 0.4, seconds: 4 },
      { shot: "detail", at: 9.5, seconds: 6 },
    ],
  },
  bills: {
    link: "paycheck-planner://demo?short=1",
    captions: [
      { shot: "move", at: 0.4, seconds: 4.5 },
      { shot: "goals", at: -6.2, seconds: 2.7 },
      { shot: "expenses", at: -3.2, seconds: 3.2 },
    ],
  },
};

const config = loadShipConfig(process.cwd());
const screenshots = requireScreenshots(config);
const dir = path.join(process.cwd(), "ship", "previews");
const udid = process.env.UDID;
if (!udid) throw new Error("Set UDID to the booted simulator to record on");

const sh = (command, args) => execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const escapeXml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function maestro(flow, env = {}) {
  const vars = { METRO_URL: process.env.METRO_URL ?? "", ...env };
  const args = ["--udid", udid, "test", ...Object.entries(vars).flatMap(([key, value]) => ["-e", `${key}=${value}`]), flow];
  execFileSync("maestro", args, { stdio: "inherit" });
}

/** ffmpeg writes its filter reports to stderr */
function ffmpegReport(args) {
  try {
    execFileSync("ffmpeg", ["-hide_banner", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    throw new Error(error.stderr);
  }
}

async function record(name, raw) {
  const recorder = spawn("xcrun", ["simctl", "io", udid, "recordVideo", "--codec", "h264", "--force", raw], {
    stdio: ["ignore", "ignore", "pipe"],
  });
  const started = new Promise((resolve) => recorder.stderr.on("data", (data) => /Recording started/.test(data) && resolve()));
  const stopped = new Promise((resolve) => recorder.on("exit", resolve));
  await started;
  try {
    maestro(path.join(dir, `${name}.yaml`));
  } finally {
    // simctl finishes the file on an interrupt
    recorder.kill("SIGINT");
    await stopped;
  }
}

/**
 * Maestro takes seconds to find each element, so the recording is mostly waiting. Returns the stretches to cut
 * (source seconds) so that the still first screen lasts LEAD_IN and every later still stretch lasts HOLD.
 */
function waits(raw) {
  const result = spawn("ffmpeg", ["-hide_banner", "-i", raw, "-vf", "freezedetect=n=0.00005:d=0.5", "-map", "0:v", "-f", "null", "-"]);
  return new Promise((resolve, reject) => {
    let log = "";
    result.stderr.on("data", (data) => (log += data));
    result.on("exit", () => {
      const total = Number(sh("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", raw]));
      const starts = [...log.matchAll(/freeze_start: ([0-9.]+)/g)].map((m) => Number(m[1]));
      const ends = [...log.matchAll(/freeze_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
      if (!starts.length || starts[0] > 1) return reject(new Error(`No still lead-in found in ${raw}`));
      const cuts = starts
        .map((start, i) => {
          const end = ends[i] ?? total;
          // The lead-in keeps its end, a hold keeps its start
          return i === 0 ? [0, end - LEAD_IN] : [start + HOLD, end];
        })
        .filter(([from, to]) => to - from > 0.05);
      resolve({ cuts, duration: total - cuts.reduce((sum, [from, to]) => sum + to - from, 0) });
    });
  });
}

/** The caption over a fade to the screenshots' background colour, as a full-frame transparent image */
function captionImage(shot, file) {
  const { theme } = screenshots;
  const [first, second] = shot.title;
  const svg = file.replace(/\.png$/, ".svg");
  fs.writeFileSync(
    svg,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
  <defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.background[1]}" stop-opacity="0"/><stop offset="0.45" stop-color="${theme.background[1]}" stop-opacity="0.96"/><stop offset="1" stop-color="${theme.background[1]}"/></linearGradient></defs>
  <rect y="${HEIGHT - 420}" width="${WIDTH}" height="420" fill="url(#fade)"/>
  <text x="${WIDTH / 2}" y="${HEIGHT - 178}" text-anchor="middle" font-family="${theme.font}" font-weight="bold" font-size="62" fill="${theme.text}">${escapeXml(first)}</text>
  <text x="${WIDTH / 2}" y="${HEIGHT - 104}" text-anchor="middle" font-family="${theme.font}" font-weight="bold" font-size="62" fill="${theme.accent}">${escapeXml(second)}</text>
</svg>`
  );
  sh("rsvg-convert", [svg, "-o", file]);
}

function encode(name, raw, { cuts, duration: uncut }, tmp) {
  const duration = Math.min(MAX_SECONDS, uncut);
  if (duration < MIN_SECONDS) throw new Error(`${name} is ${duration.toFixed(1)} s; an App Preview is 15 to 30 seconds`);

  const inputs = ["-i", raw];
  const cut = cuts.map(([from, to]) => `between(t,${from.toFixed(3)},${to.toFixed(3)})`).join("+") || "0";
  // The simulator records at the screen's size, a hair taller than 886 × 1920 once scaled
  const filters = [`[0:v]fps=30,select='not(${cut})',setpts=N/30/TB,scale=${WIDTH}:-2,crop=${WIDTH}:${HEIGHT},setsar=1[v0]`];
  PREVIEWS[name].captions.forEach((caption, i) => {
    const shot = screenshots.shots.find((s) => s.raw === caption.shot);
    if (!shot) throw new Error(`ship.config.json has no screenshot "${caption.shot}" to take the caption from`);
    const image = path.join(tmp, `${name}-${i}.png`);
    captionImage(shot, image);
    const at = caption.at < 0 ? duration + caption.at : caption.at;
    const end = Math.min(duration, at + caption.seconds);
    inputs.push("-loop", "1", "-t", duration.toFixed(3), "-i", image);
    filters.push(
      `[${i + 1}:v]format=rgba,fade=in:st=${at.toFixed(2)}:d=0.4:alpha=1,fade=out:st=${(end - 0.4).toFixed(2)}:d=0.4:alpha=1[c${i}]`,
      `[v${i}][c${i}]overlay=enable='between(t,${at.toFixed(2)},${end.toFixed(2)})'[v${i + 1}]`
    );
  });
  const silence = PREVIEWS[name].captions.length + 1;
  const out = path.join(dir, `${name}.mp4`);
  ffmpegReport([
    "-y", ...inputs,
    "-f", "lavfi", "-t", duration.toFixed(3), "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-filter_complex", filters.join(";"),
    "-map", `[v${PREVIEWS[name].captions.length}]`, "-map", `${silence}:a`,
    "-c:v", "libx264", "-profile:v", "high", "-level", "4.0", "-pix_fmt", "yuv420p", "-b:v", "10M", "-maxrate", "12M", "-bufsize", "20M",
    "-r", "30", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", "-t", duration.toFixed(3), out,
  ]);
  console.log(`  → ${path.relative(process.cwd(), out)} (${duration.toFixed(1)} s)`);
}

const names = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(PREVIEWS);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "store-previews-"));
sh("xcrun", ["simctl", "status_bar", udid, "override", "--time", "9:41", "--dataNetwork", "wifi", "--wifiMode", "active", "--wifiBars", "3", "--cellularMode", "active", "--cellularBars", "4", "--batteryState", "charged", "--batteryLevel", "100"]);
try {
  for (const name of names) {
    if (!PREVIEWS[name]) throw new Error(`No preview named "${name}" (${Object.keys(PREVIEWS).join(", ")})`);
    console.log(`\n🎬 ${name}`);
    const raw = path.join(tmp, `${name}.mov`);
    maestro(path.join(dir, "setup.yaml"), { DEMO_LINK: PREVIEWS[name].link });
    await sleep(1500);
    await record(name, raw);
    encode(name, raw, await waits(raw), tmp);
  }
} finally {
  sh("xcrun", ["simctl", "status_bar", udid, "clear"]);
  fs.rmSync(tmp, { recursive: true, force: true });
}
