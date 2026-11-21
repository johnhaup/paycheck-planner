/**
 * App Store screenshots for the iPhone Duo (`bun store:screenshots:duo [capture|frame]`), kept in
 * ship/screenshots/duo. expo-local-ship cannot take these itself: `simctl` cannot fold and Maestro
 * only drives the Duo's cover screen, so duoctl (github.com/skarol/duoctl, v0.2.1; on PATH or in
 * $DUOCTL) folds, taps and shoots. The scenes are those of ship/screenshots.yaml; framing is
 * expo-local-ship's, at the two Duo sizes.
 *
 * Capture needs a Release build made with EXPO_PUBLIC_STORE_DEMO=1 on the simulator.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { loadShipConfig, requireScreenshots } from "@johnhaup/expo-local-ship/src/store/config";
import { frameScreenshots } from "@johnhaup/expo-local-ship/src/store/frame";

const SIMULATOR = "Paycheck Planner Duo";
const DUOCTL = process.env.DUOCTL ?? "duoctl";
/** The portrait pixel size App Store Connect takes for each screen (display type APP_IPHONE_DUO) */
const SCREENS = { folded: [1398, 2034], unfolded: [2007, 2853] };

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
  const find = async (label, type) => {
    const [, height] = JSON.parse(duoctl("state")).sizePoints;
    return (await elements()).find((e) => {
      const middle = e.frame.y + e.frame.height / 2;
      // A row under the navigation bar or the pinned month strip cannot be tapped
      return label.test(e.label ?? "") && (!type || e.type === type) && middle > (type ? 0 : 140) && middle < height;
    });
  };
  /** Taps the element, scrolling the list up to it first */
  const tap = async (label, type) => {
    for (let swipes = 0; swipes < 8; swipes++) {
      const element = await find(label, type);
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
  const fold = async (posture, orientation) => {
    duoctl(posture);
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
  const shoot = (file) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    duoctl("screenshot", file);
    console.log(`  → ${path.relative(process.cwd(), file)}`);
  };
  const shootAll = async (scene) => {
    // The app is portrait-only, so the cover screen has one orientation; the inner screen has both
    shoot(dir("folded", "raw", `${scene}.png`));
    await fold("open", "portrait");
    shoot(dir("unfolded", "raw", `${scene}.png`));
    await fold("open", "landscape");
    shoot(dir("unfolded", "landscape", `${scene}.png`));
    await fold("close", "portrait");
  };

  return (async () => {
    simctl("bootstatus", udid, "-b");
    simctl("status_bar", udid, "override", "--time", "9:41");
    try {
      await fold("close", "portrait");
      simctl("terminate", udid, config.bundleId);
      simctl("launch", udid, config.bundleId);
      await sleep(6000);
      // Sample data with Pro on. iOS asks before it opens the link.
      simctl("openurl", udid, "paycheck-planner://demo");
      await sleep(4000);
      if (await find(/^Open$/, "Button")) await tap(/^Open$/, "Button");
      await sleep(3000);

      await shootAll("paychecks");
      await tap(/^Expenses$/, "RadioButton");
      await shootAll("expenses");
      await tap(/^Income$/, "RadioButton");
      await shootAll("income");
      await tap(/^Paychecks$/, "RadioButton");
      // The card's own label; the pay amount inside it is a second button
      await tap(/^[A-Z]{3}, [0-9]+, Mesa Health/);
      await shootAll("detail");
      await tap(/^Change Electric amount for this paycheck$/);
      await shootAll("amount");
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
