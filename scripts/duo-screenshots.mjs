/**
 * App Store screenshots for the iPhone Duo (`bun store:screenshots:duo [capture|frame]`), kept in
 * ship/screenshots/duo. expo-local-ship cannot take these itself: `simctl` cannot fold and Maestro
 * only drives the Duo's cover screen. So the cover set is ship/screenshots.yaml run by Maestro on the
 * folded Duo, and the inner set is the same seven scenes driven by duoctl (github.com/skarol/duoctl,
 * v0.2.1; on PATH or in $DUOCTL), which folds, taps and shoots. Framing is expo-local-ship's, at the
 * two Duo sizes, with the captions of the iPhone set.
 *
 * Capture needs a build with EXPO_PUBLIC_STORE_DEMO=1 on the simulator named in $DUO_SIMULATOR
 * (default "Paycheck Planner Duo"): a Release build, or a dev build with $METRO_URL pointing at a
 * Metro started with that flag (see the header of ship/screenshots.yaml).
 */
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { loadShipConfig, requireScreenshots } from "@johnhaup/expo-local-ship/src/store/config";
import { frameScreenshots } from "@johnhaup/expo-local-ship/src/store/frame";

const SIMULATOR = process.env.DUO_SIMULATOR ?? "Paycheck Planner Duo";
const DUOCTL = process.env.DUOCTL ?? "duoctl";
const METRO_URL = process.env.METRO_URL;
/** What opens a dev build straight on Metro; a Release build ignores them */
const DEV_ARGS = METRO_URL
  ? ["--initialUrl", METRO_URL, "-EXDevMenuShowsAtLaunch", "NO", "-EXDevMenuShowFloatingActionButton", "NO", "-EXDevMenuIsOnboardingFinished", "YES"]
  : [];
/** The portrait pixel size App Store Connect takes for each screen (display type APP_IPHONE_DUO) */
const SCREENS = { folded: [1398, 2034], unfolded: [2007, 2853] };
/**
 * The amount sheet's number pad on the inner screen upright, in points. The keys are not in the
 * accessibility tree, and duoctl cannot type.
 */
const PAD = { 4: [121, 728], 8: [333, 787], 9: [548, 787], ".": [121, 853], delete: [548, 853] };

const config = loadShipConfig(process.cwd());
const screenshots = requireScreenshots(config);
const dir = (screen, ...rest) => path.join(screenshots.dir, "duo", screen, ...rest);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const sh = (command, args) => execFileSync(command, args, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

function capture() {
  const { devices } = JSON.parse(sh("xcrun", ["simctl", "list", "devices", "available", "-j"]));
  const udid = Object.values(devices).flat().find((d) => d.name === SIMULATOR)?.udid;
  if (!udid) throw new Error(`No simulator named "${SIMULATOR}" (an iPhone Duo on iOS 27.1 or later)`);
  const simctl = (...args) => sh("xcrun", ["simctl", ...args]);
  const duoctl = (...args) => sh(DUOCTL, ["-d", udid, ...args]);

  // The accessibility service is slow to answer after a fold or a launch
  const elements = async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return JSON.parse(duoctl("elements"));
      } catch (error) {
        if (attempt === 4) throw error;
        await sleep(2000);
      }
    }
  };
  const find = async (label, type, index = 0) => {
    const [, height] = JSON.parse(duoctl("state")).sizePoints;
    return (await elements()).filter((e) => {
      const middle = e.frame.y + e.frame.height / 2;
      // A row under the navigation bar or the pinned month strip cannot be tapped
      return label.test(e.label ?? "") && (!type || e.type === type) && middle > (type ? 0 : 140) && middle < height;
    })[index];
  };
  /** Taps the element, scrolling the list in the first column up to it first */
  const tap = async (label, type, index) => {
    for (let swipes = 0; swipes < 8; swipes++) {
      const element = await find(label, type, index);
      if (element) {
        duoctl("tap", String(element.frame.x + element.frame.width / 2), String(element.frame.y + element.frame.height / 2));
        await sleep(2000);
        return;
      }
      duoctl("swipe", "200", "480", "200", "280", "--duration", "0.5");
      await sleep(1500);
    }
    throw new Error(`Nothing on screen is labelled ${label}`);
  };
  /** Upright the tabs are in iOS's sidebar (HAU-695), behind the button at the top left of the navigation bar */
  const openTab = async (name) => {
    duoctl("tap", "44", "48");
    await sleep(2000);
    await tap(new RegExp(`^${name}$`), "GenericElement");
  };
  const press = async (key) => {
    duoctl("tap", ...PAD[key].map(String));
    // Taps that follow each other at once are dropped
    await sleep(600);
  };
  const rotate = async (orientation) => {
    // Now and then a rotation does not take the first time it is asked for
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        duoctl("rotate", orientation);
        break;
      } catch {
        await sleep(1000);
      }
    }
    // The screen redraws for its new size after the display has switched
    await sleep(2500);
  };
  const openLink = async (url) => {
    simctl("openurl", udid, url);
    await sleep(4000);
    // iOS asks before a link opens the app
    if (await find(/^Open$/, "Button")) await tap(/^Open$/, "Button");
    await sleep(3000);
  };
  const save = (file) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    duoctl("screenshot", file);
    console.log(`  → ${path.relative(process.cwd(), file)}`);
  };
  /** The inner screen upright (the store size), then on its side */
  const shoot = async (scene) => {
    save(dir("unfolded", "raw", `${scene}.png`));
    await rotate("landscape");
    save(dir("unfolded", "landscape", `${scene}.png`));
    await rotate("portrait");
  };

  /** The cover screen is an iPhone to Maestro: the iPhone set's own flow, at the cover's size */
  const captureFolded = async () => {
    duoctl("close");
    await rotate("portrait");
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "duo-folded-"));
    try {
      execFileSync(
        "maestro",
        ["--udid", udid, "test", "-e", `METRO_URL=${METRO_URL ?? ""}`, screenshots.flow, "--test-output-dir", out],
        { stdio: "inherit" }
      );
      const shots = fs.globSync(path.join(out, "**", "takeScreenshot", "*.png"));
      for (const shot of shots) {
        const file = dir("folded", "raw", path.basename(shot));
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.copyFileSync(shot, file);
        console.log(`  → ${path.relative(process.cwd(), file)}`);
      }
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  };

  /** The scenes of ship/screenshots.yaml on the inner screen, where a paycheck opens beside the list */
  const captureUnfolded = async () => {
    simctl("terminate", udid, config.bundleId);
    simctl("launch", udid, config.bundleId, ...DEV_ARGS);
    await sleep(8000);
    duoctl("open");
    await rotate("portrait");
    // The sample budget again: the cover run left a paycheck short
    await openLink("paycheck-planner://demo");
    await shoot("paychecks");

    await tap(/^Change Internet amount for this paycheck$/);
    for (const key of ["delete", "delete", "delete", "delete", "delete", "8", "4", ".", "9", "9"]) await press(key);
    await shoot("amount");
    await tap(/^Save$/);

    await tap(/^[A-Z]{3}, [0-9]+, Mesa Health/);
    await shoot("detail");

    await openTab("Expenses");
    await shoot("goals");
    // The inner screen shows the whole list from its top: scrolling would cut the summary and filter under the bar
    await shoot("expenses");

    await openTab("Income");
    await tap(/Mesa Health.*per check/);
    await shoot("income");
    await tap(/^Close$/, "Button");

    await openLink("paycheck-planner://demo?short=1");
    await tap(/is short by/);
    await tap(/^Move a bill$/);
    await tap(/^Car repair · /);
    // The Brightline paycheck after the next one
    await tap(/ · Brightline Co\.$/, undefined, 1);
    await shoot("move");
  };

  return (async () => {
    simctl("bootstatus", udid, "-b");
    simctl("status_bar", udid, "override", "--time", "9:41");
    try {
      await captureFolded();
      await captureUnfolded();
      duoctl("close");
    } finally {
      simctl("status_bar", udid, "clear");
    }
  })();
}

/** A plain dark outline around a screen of this size. The framer's own has a camera in the top middle, which is the fold of the open Duo. */
function drawBezel([w, h], tmp) {
  const edge = Math.round(w * 0.035);
  const radius = Math.round(w * 0.11);
  const [width, height] = [w + 2 * edge, h + 2 * edge];
  const svg = path.join(tmp, `bezel-${w}.svg`);
  const png = path.join(tmp, `bezel-${w}.png`);
  fs.writeFileSync(
    svg,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs><mask id="screen"><rect width="${width}" height="${height}" fill="#fff"/><rect x="${edge}" y="${edge}" width="${w}" height="${h}" rx="${radius - edge}" fill="#000"/></mask></defs>
  <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="${radius}" fill="#141518" stroke="#3b3e44" stroke-width="4" mask="url(#screen)"/>
</svg>`
  );
  sh("rsvg-convert", [svg, "-o", png]);
  return png;
}

async function frame() {
  const only = process.argv.find((arg) => arg.startsWith("--locales="))?.slice("--locales=".length).split(",");
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "duo-bezel-"));
  try {
    for (const [screen, size] of Object.entries(SCREENS)) {
      // The framer's poster is laid out for a tall phone and runs off these pages
      // Only the scenes capture() shoots here; the iPhone set has more
      const shots = screenshots.shots.filter((shot) => fs.existsSync(dir(screen, "raw", `${shot.raw}.png`)));
      const duo = { ...screenshots, shots, dir: dir(screen), size: [...size], bezel: drawBezel(size, tmp), poster: undefined };
      await frameScreenshots(config, duo, { only });
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const step = process.argv[2];
if (step !== "frame") await capture();
if (step !== "capture") await frame();
