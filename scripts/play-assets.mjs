// Google Play store assets from the store demo data: phone and tablet screenshots in device outlines with the App
// Store captions, the feature graphic and the promo video. Runs on the Linux worker (Android SDK emulators,
// headless; each command boots and stops its own, on ports of its own).
//
//   bun store:play avds              creates the portrait tablet AVDs Apron_Tablet_7 and Apron_Tablet_10 if missing
//   bun store:play phone             phone raws (ship/screenshots.yaml) → ship/screenshots/android/raw, then framed
//   bun store:play tablets [name]    7" and 10" raws (ship/screenshots-tablet.yaml) → android/tablet-*/raw, then framed
//   bun store:play frame [phone|tablets]   frames again from the committed raws (no emulator)
//   bun store:play promo             records ship/play-promo/*.yaml → ship/play-promo/en-US/promo.mp4
//   bun store:play sheets <dir>      contact sheets of the Play sets, the feature graphic and the promo, for review
//
// Framed sets: android/framed/<locale> (phone, 1320 x 2640: Play takes up to 2:1, the phone runs off the bottom),
// android/tablet-7|tablet-10/framed/<locale> (1440 x 2560), plus android/icon-512.png and feature-graphic.png.
//
// The app must be the store demo Release APK, where paycheck-planner://demo loads the sample budget with Pro on:
//   EXPO_PUBLIC_STORE_DEMO=1 bunx expo prebuild --platform android --clean --no-install
//   (cd android && ./gradlew :app:assembleRelease -PreactNativeArchitectures=x86_64)
// Environment:
//   APK           that APK (default android/app/build/outputs/apk/release/app-release.apk)
//   ANDROID_HOME  the Android SDK (default ~/Android/Sdk); KEEP_EMULATOR=1 leaves the emulator running
//   LOCALES       caption locales to frame, comma separated (default en-US; `all` = every locale with captions)
//   KEEP_RAW=1    keeps the promo's raw recordings
// Needs Maestro, ImageMagick 7, librsvg (rsvg-convert) and ffmpeg. Nothing here uploads: John uploads the images in
// Play Console, and the promo goes to YouTube by hand, its URL into Play Console.
import { execFileSync, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { forAndroid, loadShipConfig, requireScreenshots } from "@johnhaup/expo-local-ship/src/store/config";
import { frameScreenshots } from "@johnhaup/expo-local-ship/src/store/frame";

const ROOT = process.cwd();
const PACKAGE = "com.johnhaup.paycheckplanner";
const LOCALE = "en-US";
const config = loadShipConfig(ROOT);
const screenshots = requireScreenshots(config);
const { theme } = screenshots;
const ANDROID_DIR = path.join(screenshots.dir, "android");
const PROMO_DIR = path.join(ROOT, "ship/play-promo");
const SDK = process.env.ANDROID_HOME ?? path.join(os.homedir(), "Android/Sdk");
const ADB = path.join(SDK, "platform-tools/adb");
const APK = process.env.APK ?? path.join(ROOT, "android/app/build/outputs/apk/release/app-release.apk");
const SYSTEM_IMAGE = "system-images;android-35;google_apis;x86_64";
const FPS = 30;

/** Pixel 9 Pro at its own density (1280 x 2856). Ports differ from Apron's script, so both can run on one worker. */
const PHONE = { avd: "Pixel_9_Pro", port: 5661, density: 480 };
/** 600 dp wide or more, where the app shows its two columns. Both at 320 dpi (7": 600 x 960 dp, 10": 800 x 1280 dp) */
const TABLETS = {
  "tablet-7": { avd: "Apron_Tablet_7", port: 5663, density: 320, size: [1200, 1920] },
  "tablet-10": { avd: "Apron_Tablet_10", port: 5665, density: 320, size: [1600, 2560] },
};
/**
 * The phone captions, in this order. No `goals`: on a tablet the whole Expenses list is one screen, the same as
 * `expenses`. No `amount`: on a tablet its sheet's Save sits half under Android's keyboard.
 */
const TABLET_SHOTS = ["paychecks", "detail", "expenses", "move", "income"];
/** 9:16, which Play takes for 7" and 10" tablets alike */
const TABLET_SIZE = [1440, 2560];

const sleep = (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));
const escapeXml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function sh(command, args, { allowFailure = false, input } = {}) {
  try {
    return execFileSync(command, args, {
      cwd: ROOT,
      encoding: "utf8",
      input,
      stdio: [input ? "pipe" : "ignore", "pipe", "pipe"],
      maxBuffer: 256 * 1024 * 1024,
    });
  } catch (error) {
    if (allowFailure) return error.stdout ?? "";
    throw new Error(`${command} ${args.join(" ")}\n${error.stderr ?? ""}${error.stdout ?? ""}`);
  }
}

const adb = (serial, ...args) => sh(ADB, ["-s", serial, ...args]);

function caption(raw) {
  const shot = screenshots.shots.find((s) => s.raw === raw);
  if (!shot) throw new Error(`ship.config.json has no shot "${raw}"`);
  return shot;
}

function renderSvg(svg, out) {
  const file = out.replace(/\.png$/, ".svg");
  fs.writeFileSync(file, svg);
  sh("rsvg-convert", [file, "-o", out]);
  fs.rmSync(file);
}

function maestroArgs(serial, flow, extra = []) {
  const env = { APP_ID: PACKAGE, METRO_URL: "", ...extra.env };
  return ["--udid", serial, "test", ...Object.entries(env).flatMap(([k, v]) => ["-e", `${k}=${v}`]), flow, ...(extra.args ?? [])];
}

// ---------------------------------------------------------------- emulators

/** Creates the tablet AVDs if they are missing: a Pixel Tablet profile with a portrait panel */
function avds() {
  for (const { avd, size, density } of Object.values(TABLETS)) {
    const dir = path.join(os.homedir(), ".android/avd", `${avd}.avd`);
    if (fs.existsSync(dir)) {
      console.log(`${avd}: exists`);
      continue;
    }
    sh(path.join(SDK, "cmdline-tools/latest/bin/avdmanager"), ["create", "avd", "-n", avd, "-k", SYSTEM_IMAGE, "-d", "pixel_tablet"], {
      input: "no\n",
    });
    const settings = {
      "hw.lcd.width": String(size[0]),
      "hw.lcd.height": String(size[1]),
      "hw.lcd.density": String(density),
      "hw.initialOrientation": "portrait",
      "hw.ramSize": "4096",
      "hw.keyboard": "yes",
      showDeviceFrame: "no",
      "skin.name": `${size[0]}x${size[1]}`,
      "skin.path": "_no_skin",
    };
    const file = path.join(dir, "config.ini");
    const lines = fs.readFileSync(file, "utf8").split("\n").filter((line) => !(line.split("=")[0].trim() in settings));
    fs.writeFileSync(file, [...lines.filter(Boolean), ...Object.entries(settings).map(([k, v]) => `${k}=${v}`), ""].join("\n"));
    console.log(`${avd}: created, ${size.join(" x ")} at ${density} dpi`);
  }
}

/** Boots the AVD headless on its port (unless it already runs there), installs the APK and returns the serial */
async function bootAndroid(device) {
  if (!fs.existsSync(APK)) throw new Error(`No APK at ${APK}: build one with EXPO_PUBLIC_STORE_DEMO=1 (see the top of this file)`);
  const serial = `emulator-${device.port}`;
  const fresh = !sh(ADB, ["devices"]).includes(serial);
  if (fresh) {
    // A cold boot keeps stray icons (a satellite, Apron's HAU-655) out of the status bar
    spawn(
      path.join(SDK, "emulator/emulator"),
      ["-avd", device.avd, "-port", String(device.port), "-no-window", "-no-audio", "-no-snapshot", "-no-boot-anim", "-gpu", "swiftshader_indirect"],
      { stdio: "ignore", detached: true }
    ).unref();
  }
  for (let i = 0; i < 150; i++) {
    if (sh(ADB, ["-s", serial, "shell", "getprop", "sys.boot_completed"], { allowFailure: true }).trim() === "1") break;
    await sleep(2);
  }
  if (adb(serial, "shell", "getprop", "sys.boot_completed").trim() !== "1") throw new Error(`${device.avd} did not boot`);
  // System UI ignores the demo mode broadcasts for a while after boot completes (the real clock stays)
  if (fresh) await sleep(30);
  adb(serial, "install", "-r", APK);
  return serial;
}

/** Only the emulator this script started, by its serial */
function stopAndroid(serial) {
  if (!process.env.KEEP_EMULATOR) sh(ADB, ["-s", serial, "emu", "kill"], { allowFailure: true });
}

/**
 * Dark mode (the app follows it, and so does the keyboard), the device's density, animations off for stills (on
 * for the promo), and the status bar's demo mode: 9:41, full Wi-Fi, a full battery not charging, no mobile data
 * and no notification icons.
 */
async function androidPrep(serial, device, { animations }) {
  adb(serial, "shell", "wm", "density", String(device.density));
  adb(serial, "shell", "cmd", "uimode", "night", "yes");
  for (const scale of ["window_animation_scale", "transition_animation_scale", "animator_duration_scale"]) {
    adb(serial, "shell", "settings", "put", "global", scale, animations ? "1" : "0");
  }
  const demo = (...extras) => adb(serial, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", ...extras);
  adb(serial, "shell", "settings", "put", "global", "sysui_demo_allowed", "1");
  demo("-e", "command", "enter");
  demo("-e", "command", "clock", "-e", "hhmm", "0941");
  demo("-e", "command", "battery", "-e", "level", "100", "-e", "plugged", "false");
  demo("-e", "command", "network", "-e", "wifi", "show", "-e", "level", "4", "-e", "fully", "true");
  demo("-e", "command", "network", "-e", "mobile", "hide");
  demo("-e", "command", "notifications", "-e", "visible", "false");
  await sleep(1);
}

function exitDemo(serial) {
  sh(ADB, ["-s", serial, "shell", "am", "broadcast", "-a", "com.android.systemui.demo", "-e", "command", "exit"], {
    allowFailure: true,
  });
}

/** Runs a screenshot flow and copies its captures into `rawDir` */
function captureAndroid(serial, flow, rawDir) {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "pp-android-"));
  try {
    sh("maestro", maestroArgs(serial, flow, { args: ["--test-output-dir", output] }));
    const found = fs.globSync(path.join(output, "**", "takeScreenshot", "*.png"));
    fs.mkdirSync(rawDir, { recursive: true });
    for (const file of found) fs.copyFileSync(file, path.join(rawDir, path.basename(file)));
    return found.length;
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------- screenshots

const frameLocales = () => {
  const value = process.env.LOCALES ?? LOCALE;
  return value === "all" ? undefined : value.split(",");
};

/** ship/screenshots.yaml on the Pixel 9 Pro, framed by expo-local-ship with the icon and feature graphic */
async function phone() {
  const serial = await bootAndroid(PHONE);
  try {
    await androidPrep(serial, PHONE, { animations: false });
    const count = captureAndroid(serial, "ship/screenshots.yaml", path.join(ANDROID_DIR, "raw"));
    console.log(`${count} raw screenshots → ship/screenshots/android/raw`);
  } finally {
    exitDemo(serial);
    stopAndroid(serial);
  }
  await framePhone();
}

async function framePhone() {
  await frameScreenshots(config, forAndroid(screenshots), { only: frameLocales() });
}

async function tablets(only) {
  for (const [name, device] of Object.entries(TABLETS)) {
    if (only && only !== name) continue;
    const serial = await bootAndroid(device);
    try {
      await androidPrep(serial, device, { animations: false });
      const count = captureAndroid(serial, "ship/screenshots-tablet.yaml", path.join(ANDROID_DIR, name, "raw"));
      console.log(`${name}: ${count} raw screenshots`);
    } finally {
      exitDemo(serial);
      stopAndroid(serial);
    }
  }
  await frameTablets();
}

/** A plain dark outline round the raw's own size; a tablet's corners are tight (rounder ones cut into the clock) */
function drawBezel([w, h], tmp) {
  const edge = Math.round(w * 0.025);
  const radius = Math.round(w * 0.03) + edge;
  const [width, height] = [w + 2 * edge, h + 2 * edge];
  const png = path.join(tmp, `bezel-${w}.png`);
  renderSvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><mask id="screen"><rect width="${width}" height="${height}" fill="#fff"/><rect x="${edge}" y="${edge}" width="${w}" height="${h}" rx="${radius - edge}" fill="#000"/></mask></defs>
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="${radius}" fill="#141518" stroke="#3b3e44" stroke-width="4" mask="url(#screen)"/>
</svg>`,
    png
  );
  return png;
}

/** The tablet raws through the same framer, at 1440 x 2560; `platform: "ios"` keeps Play's graphics out of these folders */
async function frameTablets() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pp-tablet-"));
  try {
    for (const name of Object.keys(TABLETS)) {
      const dir = path.join(ANDROID_DIR, name);
      if (!fs.existsSync(path.join(dir, "raw"))) continue;
      const shots = TABLET_SHOTS.filter((raw) => fs.existsSync(path.join(dir, "raw", `${raw}.png`))).map(caption);
      const size = sh("magick", ["identify", "-format", "%w %h", path.join(dir, "raw", `${shots[0].raw}.png`)]).split(" ").map(Number);
      const tablet = { ...screenshots, shots, dir, size: [...TABLET_SIZE], bezel: drawBezel(size, tmp), poster: undefined, platform: "ios" };
      await frameScreenshots(config, tablet, { only: frameLocales() });
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

async function frame(only) {
  if (!only || only === "phone") await framePhone();
  if (!only || only === "tablets") await frameTablets();
}

// ---------------------------------------------------------------- promo video

const [PROMO_WIDTH, PROMO_HEIGHT] = [1080, 1920];
/** Seconds: a title card, the intro and outro cards, and the cross-fade between any two clips */
const [CARD, END_CARD, FADE] = [1.3, 1.8, 0.4];
/** Scene score under which a frame counts as still: the last traces of a fade score less */
const STILL = 0.00005;

/**
 * Recorded one by one after ship/play-promo/setup.yaml (off camera: a fresh install, the demo link, Paychecks),
 * each after its caption's title card. `holds`: how long the screen rests after the step matching each pattern;
 * `tail`: after the last movement; `lead`: before the first one.
 */
const PROMO_SCENES = [
  { flow: "1-paychecks", shot: "paychecks", link: "paycheck-planner://demo", holds: [[/Swipe/, 0.5]], tail: 0.8, lead: 0.8 },
  { flow: "2-detail", shot: "detail", link: "paycheck-planner://demo", holds: [[/This paycheck/, 0.6], [/unpaid/, 0.6]], tail: 1.2 },
  { flow: "3-move", shot: "move", link: "paycheck-planner://demo?short=1", holds: [[/short by/, 0.6], [/To paycheck/, 0.5], [/Brightline/, 0.8]], tail: 1.2 },
  { flow: "4-goals", shot: "goals", link: "paycheck-planner://demo", holds: [[/Emergency fund/, 0.6]], tail: 1 },
];

/** Records one flow and returns when each Maestro step finished, in seconds from the recording's start */
async function record(serial, flow, out) {
  const remote = "/sdcard/pp-promo-scene.mp4";
  // At its native size (1280 x 2856) the emulator's encoder fails and screenrecord falls back to 720 x 1280, the
  // wrong shape: record 1080 wide at the panel's aspect instead
  const [width, height] = adb(serial, "shell", "wm", "size").match(/(\d+)x(\d+)/).slice(1).map(Number);
  const size = `1080x${2 * Math.round((1080 * height) / width / 2)}`;
  const recorder = spawn(ADB, ["-s", serial, "shell", "screenrecord", "--size", size, "--bit-rate", "20000000", remote], {
    stdio: "ignore",
  });
  const recorderExited = new Promise((resolve) => recorder.on("exit", resolve));
  // screenrecord prints nothing when it starts; it writes frames within half a second
  await sleep(1.5);
  const started = performance.now();

  const steps = [];
  const maestro = spawn("maestro", maestroArgs(serial, flow), { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  let pending = "";
  maestro.stdout.on("data", (chunk) => {
    pending += chunk.toString();
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      if (line.includes("COMPLETED")) steps.push({ line, at: (performance.now() - started) / 1000 });
      if (line.includes("FAILED")) console.error(line);
    }
  });
  const code = await new Promise((resolve) => maestro.on("exit", resolve));
  await sleep(3);
  adb(serial, "shell", "pkill", "-INT", "screenrecord");
  await recorderExited;
  // The muxer finishes the file after the signal
  await sleep(1.5);
  adb(serial, "pull", remote, out);
  adb(serial, "shell", "rm", remote);
  if (code !== 0) throw new Error(`${flow} failed`);
  return steps;
}

/**
 * The frames worth keeping: from just before the first movement to `tail` seconds after the last, with each still
 * screen cut to `idle`, or to the hold of the step it follows. Maestro needs a second or two for every step.
 */
function cutStills(steady, steps, holds, tail, { lead = 0.1, idle = 0.15 } = {}) {
  const scores = sh("ffmpeg", ["-i", steady, "-vf", "select='gte(scene,0)',metadata=print:file=-", "-f", "null", "-"])
    .split("\n")
    .filter((line) => line.startsWith("lavfi.scene_score="))
    .map((line) => Number(line.split("=")[1]));
  const moving = scores.map((score, frame) => frame > 0 && score > STILL);
  // Movement that lasts, not a one-frame flicker when Maestro attaches
  const firstMove = moving.findIndex((_, frame) => frame > 0 && moving[frame] && moving[frame + 1] && moving[frame + 2]);
  const lastMove = moving.lastIndexOf(true);
  if (firstMove < 0) throw new Error(`${steady}: nothing moved in the recording`);
  const start = Math.max(0, firstMove - Math.round(lead * FPS));
  const end = Math.min(scores.length - 1, lastMove + Math.round(tail * FPS));
  // The step whose result a still screen shows: the one that finished as it went still
  const stepAt = (frame) => steps.find((step) => step.at >= frame / FPS - 0.5);
  const holdAt = (frame) => {
    const line = stepAt(frame)?.line ?? "";
    return holds.find(([pattern]) => pattern.test(line))?.[1] ?? idle;
  };
  const keep = [];
  for (let frame = start; frame <= end; ) {
    if (moving[frame] || frame > lastMove) {
      keep.push(frame++);
      continue;
    }
    let runEnd = frame;
    while (runEnd <= lastMove && !moving[runEnd]) runEnd++;
    const hold = Math.round(holdAt(frame) * FPS);
    for (let i = frame; i < Math.min(runEnd, frame + hold); i++) keep.push(i);
    frame = runEnd;
  }
  return keep;
}

/** The phone in the video, drawn like expo-local-ship's Android outline: screen size, rim and where it sits */
function promoDevice(rawWidth, rawHeight) {
  const screenHeight = 1560;
  const screenWidth = 2 * Math.round((screenHeight * rawWidth) / rawHeight / 2);
  const rim = Math.round(screenWidth * 0.035);
  const [deviceWidth, deviceHeight] = [screenWidth + 2 * rim, screenHeight + 2 * rim];
  const left = Math.round((PROMO_WIDTH - deviceWidth) / 2);
  const top = PROMO_HEIGHT - deviceHeight - 56;
  return { screenWidth, screenHeight, rim, deviceWidth, deviceHeight, left, top };
}

function promoBackground(extra, defs = "") {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${PROMO_WIDTH}" height="${PROMO_HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme.background[0]}"/><stop offset="1" stop-color="${theme.background[1]}"/></linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.6" r="0.55"><stop offset="0" stop-color="${theme.accent}" stop-opacity="0.26"/><stop offset="1" stop-color="${theme.accent}" stop-opacity="0"/></radialGradient>
    ${defs}
  </defs>
  ${extra}
</svg>`;
}

const backgroundRects = `<rect width="${PROMO_WIDTH}" height="${PROMO_HEIGHT}" fill="url(#bg)"/>
  <rect width="${PROMO_WIDTH}" height="${PROMO_HEIGHT}" fill="url(#glow)"/>`;

/** A scene's frame: the caption on one line over the phone outline, with the screen cut out (transparent) */
function sceneFrame(shot, d, out) {
  const outer = Math.round(d.screenWidth * 0.11);
  const inner = outer - d.rim;
  const [sx, sy] = [d.left + d.rim, d.top + d.rim];
  const title = (text, y, fill) =>
    `<text x="${PROMO_WIDTH / 2}" y="${y}" text-anchor="middle" font-family="${theme.font}" font-weight="bold" font-size="62" fill="${fill}">${escapeXml(text)}</text>`;
  renderSvg(
    promoBackground(
      `<g mask="url(#hole)">
  ${backgroundRects}
  ${title(shot.title[0], d.top - 108, theme.text)}
  ${title(shot.title[1], d.top - 32, theme.accent)}
  <rect x="${d.left}" y="${d.top}" width="${d.deviceWidth}" height="${d.deviceHeight}" rx="${outer}" fill="#141518" stroke="#3b3e44" stroke-width="3"/>
  </g>`,
      `<mask id="hole"><rect width="${PROMO_WIDTH}" height="${PROMO_HEIGHT}" fill="#fff"/><rect x="${sx}" y="${sy}" width="${d.screenWidth}" height="${d.screenHeight}" rx="${inner}" fill="#000"/></mask>`
    ).replace("\n</svg>", `\n  <circle cx="${PROMO_WIDTH / 2}" cy="${sy + Math.round(d.screenWidth * 0.04)}" r="${Math.round(d.screenWidth * 0.018)}" fill="#050505"/>\n</svg>`),
    out
  );
}

/** A title card: the screenshot caption large and centred, with its subtitle */
function titleCard(shot, out) {
  const y = PROMO_HEIGHT * 0.44;
  renderSvg(
    promoBackground(`${backgroundRects}
  <text x="${PROMO_WIDTH / 2}" y="${y}" text-anchor="middle" font-family="${theme.font}" font-weight="bold" font-size="100" fill="${theme.text}">${escapeXml(shot.title[0])}</text>
  <text x="${PROMO_WIDTH / 2}" y="${y + 124}" text-anchor="middle" font-family="${theme.font}" font-weight="bold" font-size="100" fill="${theme.accent}">${escapeXml(shot.title[1])}</text>
  <text x="${PROMO_WIDTH / 2}" y="${y + 228}" text-anchor="middle" font-family="${theme.font}" font-size="44" fill="${theme.muted}">${escapeXml(shot.subtitle ?? "")}</text>`),
    out
  );
}

/** The intro and outro: the icon, the app's name and the poster subtitle, as on the feature graphic */
function posterCard(out, tmp) {
  const { poster } = screenshots;
  const logo = 300;
  const y = PROMO_HEIGHT * 0.42;
  const bg = path.join(tmp, "poster-bg.png");
  renderSvg(
    promoBackground(`${backgroundRects}
  <text x="${PROMO_WIDTH / 2}" y="${y + logo / 2 + 150}" text-anchor="middle" font-family="${theme.font}" font-weight="bold" font-size="112" fill="${theme.text}">${escapeXml(poster.title)}</text>
  <text x="${PROMO_WIDTH / 2}" y="${y + logo / 2 + 240}" text-anchor="middle" font-family="${theme.font}" font-size="50" fill="${theme.muted}">${escapeXml(poster.subtitle ?? "")}</text>`),
    bg
  );
  sh("magick", [
    bg,
    "(", poster.icon, "-resize", `${logo}x${logo}`,
    "(", "-size", `${logo}x${logo}`, "xc:none", "-fill", "white", "-draw", `roundrectangle 0,0 ${logo - 1},${logo - 1} 68,68`, ")",
    "-alpha", "set", "-compose", "DstIn", "-composite", ")",
    "-compose", "Over", "-geometry", `+${(PROMO_WIDTH - logo) / 2}+${Math.round(y - logo / 2 - 40)}`, "-composite",
    "-alpha", "off", `PNG24:${out}`,
  ]);
}

function stillClip(png, seconds, out) {
  sh("ffmpeg", [
    "-y", "-loop", "1", "-i", png, "-t", seconds.toFixed(3), "-r", String(FPS), "-vf", "format=yuv420p", "-c:v",
    "libx264", "-crf", "10", out,
  ]);
}

/** Records one scene and renders it in the phone outline under its caption, still screens cut */
async function promoScene(serial, scene, tmp) {
  sh("maestro", maestroArgs(serial, "ship/play-promo/setup.yaml", { env: { DEMO_LINK: scene.link } }));
  const raw = path.join(tmp, `${scene.flow}-raw.mp4`);
  const steps = await record(serial, path.join("ship/play-promo", `${scene.flow}.yaml`), raw);
  const [rawWidth, rawHeight] = sh("ffprobe", [
    "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", raw,
  ]).trim().split(",").map(Number);
  const d = promoDevice(rawWidth, rawHeight);

  const steady = path.join(tmp, `${scene.flow}-steady.mp4`);
  sh("ffmpeg", [
    "-y", "-i", raw, "-vf", `fps=${FPS},scale=${d.screenWidth}:${d.screenHeight}:flags=lanczos`,
    "-an", "-c:v", "libx264", "-crf", "10", "-pix_fmt", "yuv420p", steady,
  ]);
  const keep = cutStills(steady, steps, scene.holds, scene.tail, { lead: scene.lead });
  const ranges = [];
  for (const frame of keep) {
    const last = ranges[ranges.length - 1];
    if (last && last[1] === frame - 1) last[1] = frame;
    else ranges.push([frame, frame]);
  }
  const select = ranges.map(([a, b]) => `between(n\\,${a}\\,${b})`).join("+");
  const frame = path.join(tmp, `${scene.flow}-frame.png`);
  sceneFrame(caption(scene.shot), d, frame);
  const clip = path.join(tmp, `${scene.flow}.mp4`);
  const seconds = keep.length / FPS;
  sh("ffmpeg", [
    "-y", "-i", steady, "-loop", "1", "-i", frame, "-filter_complex",
    `[0:v]select='${select}',setpts=N/${FPS}/TB,pad=${PROMO_WIDTH}:${PROMO_HEIGHT}:${d.left + d.rim}:${d.top + d.rim}:black[s];[s][1:v]overlay=format=auto,format=yuv420p[v]`,
    "-map", "[v]", "-r", String(FPS), "-t", seconds.toFixed(3), "-c:v", "libx264", "-crf", "10", clip,
  ]);
  console.log(`${scene.flow}: ${seconds.toFixed(1)}s after cutting still screens`);
  return { clip, seconds };
}

/** The Play promo video: intro, then a title card and a scene per caption, then the outro, cross-faded */
async function promo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pp-promo-"));
  const clips = [];
  const poster = path.join(tmp, "poster.png");
  posterCard(poster, tmp);
  const intro = path.join(tmp, "intro.mp4");
  stillClip(poster, END_CARD, intro);
  clips.push({ clip: intro, seconds: END_CARD });
  const serial = await bootAndroid(PHONE);
  try {
    await androidPrep(serial, PHONE, { animations: true });
    for (const scene of PROMO_SCENES) {
      const card = path.join(tmp, `${scene.flow}-card.png`);
      titleCard(caption(scene.shot), card);
      const cardClip = path.join(tmp, `${scene.flow}-card.mp4`);
      stillClip(card, CARD, cardClip);
      clips.push({ clip: cardClip, seconds: CARD }, await promoScene(serial, scene, tmp));
    }
  } finally {
    exitDemo(serial);
    stopAndroid(serial);
  }
  const outro = path.join(tmp, "outro.mp4");
  stillClip(poster, END_CARD, outro);
  clips.push({ clip: outro, seconds: END_CARD });

  // Each fade starts FADE before the clip before it ends
  const filters = [];
  let offset = 0;
  let last = "0:v";
  clips.slice(1).forEach((_, i) => {
    offset += clips[i].seconds - FADE;
    const label = `x${i + 1}`;
    filters.push(`[${last}][${i + 1}:v]xfade=transition=fade:duration=${FADE}:offset=${offset.toFixed(3)}[${label}]`);
    last = label;
  });
  const seconds = offset + clips[clips.length - 1].seconds;
  if (seconds < 20 || seconds > 30) {
    console.error(`Clips kept in ${tmp}`);
    throw new Error(`The promo is ${seconds.toFixed(1)}s; it must be 20 to 30`);
  }
  const out = path.join(PROMO_DIR, LOCALE, "promo.mp4");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  sh("ffmpeg", [
    "-y", ...clips.flatMap(({ clip }) => ["-i", clip]), "-filter_complex", filters.join(";"), "-map", `[${last}]`,
    "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-crf", "18", "-r", String(FPS), "-an",
    "-movflags", "+faststart", out,
  ]);
  if (process.env.KEEP_RAW) console.log(`Recordings kept in ${tmp}`);
  else fs.rmSync(tmp, { recursive: true });
  console.log(`→ ${path.relative(ROOT, out)} (${seconds.toFixed(1)}s)`);
}

// ---------------------------------------------------------------- contact sheets

function sheets(outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const sets = {
    "play-phone": path.join(ANDROID_DIR, "framed", LOCALE),
    "play-tablet-7": path.join(ANDROID_DIR, "tablet-7", "framed", LOCALE),
    "play-tablet-10": path.join(ANDROID_DIR, "tablet-10", "framed", LOCALE),
  };
  for (const [name, dir] of Object.entries(sets)) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".png")).sort().map((f) => path.join(dir, f));
    sh("magick", [
      "montage", ...files, "-tile", `${Math.min(files.length, 4)}x`, "-geometry", "x900+16+16", "-background",
      "#2a2c30", path.join(outDir, `${name}.png`),
    ]);
  }
  fs.copyFileSync(path.join(ANDROID_DIR, "feature-graphic.png"), path.join(outDir, "play-feature-graphic.png"));
  const video = path.join(PROMO_DIR, LOCALE, "promo.mp4");
  if (fs.existsSync(video)) {
    // One frame a second
    sh("ffmpeg", [
      "-y", "-i", video, "-vf", "fps=1,scale=-2:700,tile=10x3:margin=12:padding=12:color=0x2a2c30", "-frames:v", "1",
      path.join(outDir, "play-promo.png"),
    ]);
  }
  console.log(`Contact sheets → ${outDir}`);
}

const [command, ...rest] = process.argv.slice(2);
if (command === "avds") avds();
else if (command === "phone") await phone();
else if (command === "tablets") await tablets(rest[0]);
else if (command === "frame") await frame(rest[0]);
else if (command === "promo") await promo();
else if (command === "sheets" && rest[0]) sheets(rest[0]);
else {
  console.error("Usage: bun store:play avds | phone | tablets [tablet-7|tablet-10] | frame [phone|tablets] | promo | sheets <dir>");
  process.exit(1);
}
