/**
 * App Store screenshots for the iPhone Duo (`bun store:screenshots:duo [capture|frame]`), kept in
 * ship/screenshots/duo. expo-local-ship cannot take these itself: `simctl` cannot fold and Maestro
 * only drives the Duo's cover screen. So the cover set is ship/screenshots.yaml run by Maestro on the
 * folded Duo, and the inner set is the same seven scenes driven by duoctl (github.com/skarol/duoctl,
 * v0.2.1; on PATH or in $DUOCTL), which folds, taps and shoots. Framing is expo-local-ship's, at the
 * two Duo sizes, with the captions of the iPhone set.
 *
 * Every store locale gets its own set: the app runs in the locale's language (`-AppleLanguages`), and every label
 * the steps look for comes from that language's file in src/localization/locales. One capture serves the locales
 * that share a language (en-US, en-GB, ...). English is kept in raw/ (and the inner screen on its side in
 * landscape/), every other language in raw/<language>/; only English is committed. `--locales=de-DE,ja` limits
 * both steps to those store locales.
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

const LOCALES_DIR = path.join(process.cwd(), "src", "localization", "locales");
const RTL = new Set(["ar", "he", "ur"]);
/** The store locales to make: the primary one plus every listing with captions, as the framer does */
const only = process.argv.find((arg) => arg.startsWith("--locales="))?.slice("--locales=".length).split(",");
const storeLocales = [config.locale, ...Object.keys(config.localizations).filter((l) => config.localizations[l].captions)]
  .filter((l) => !only || only.includes(l));
/** The app's language for a store locale, matched the way iOS picks one: pt-BR as is, de-DE as de */
const appLanguage = (locale) =>
  [locale, locale.split("-")[0]].find((code) => fs.existsSync(path.join(LOCALES_DIR, `${code}.json`))) ?? "en";
/** The store locales of each language the app runs in */
const languages = Map.groupBy(storeLocales, appLanguage);
const rawDir = (screen, language) => (language === "en" ? dir(screen, "raw") : dir(screen, "raw", language));

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Direction marks and isolates that numbers and names carry in RTL labels */
const BIDI = /[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

/**
 * The labels the steps look for, as regexes matched against the whole label. A placeholder matches anything,
 * or the value given for it.
 */
function labels(language) {
  const read = (code) => JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${code}.json`), "utf8"));
  const [strings, en] = [read(language), read("en")];
  const t = (key, values = {}) => {
    const lookup = (table) => key.split(".").reduce((node, part) => node?.[part], table);
    // A key a language lacks shows in English in the app too
    const text = typeof lookup(strings) === "string" ? lookup(strings) : lookup(en);
    return text
      .split(/(%\{\w+\})/)
      .map((part) => {
        const name = part.match(/^%\{(\w+)\}$/)?.[1];
        if (!name) return escape(part);
        return name in values ? values[name] : ".*";
      })
      .join("");
  };
  return {
    LANGUAGE: language,
    TRY_SAMPLE: t("welcome.trySample"),
    THIS_PAYCHECK: t("payDate.thisPaycheck"),
    CHANGE_INTERNET: t("paychecks.changeAmount", { payee: t("demo.internet") }),
    PAYCHECK_ONLY: t("amountSheet.subtitle"),
    SAVE: t("common.save"),
    BACK: t("common.back"),
    EXPENSES: t("tabs.expenses"),
    EMERGENCY_FUND: `.*${t("demo.emergencyFund")}.*`,
    INCOME: t("tabs.income"),
    NEXT_PAYDAY: t("income.nextPayday"),
    MESA_ROW: `.*Mesa Health.*${t("income.perCheck")}.*`,
    ADJUST_TO_WORKDAY: t("income.form.adjustToWorkday"),
    CLOSE: t("common.close"),
    SHORT: `.*${t("paychecks.shortAhead", { source: "Mesa Health" })}.*`,
    MOVE_BILL: t("paychecks.moveBill"),
    TO_PAYCHECK: t("moveBillSheet.toPaycheck"),
    CAR_REPAIR: t("moveBillSheet.billLabel", { payee: t("demo.carRepair") }),
    SETTINGS: t("screens.settings"),
  };
}

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
  const size = () => JSON.parse(duoctl("state")).sizePoints;
  /** `label` is a regex source matched against the whole label, as Maestro does */
  const find = async (label, type, index = 0) => {
    const [, height] = size();
    const pattern = new RegExp(`^(?:${label})$`);
    return (await elements()).filter((e) => {
      const middle = e.frame.y + e.frame.height / 2;
      // A row under the navigation bar or the pinned month strip cannot be tapped
      return pattern.test((e.label ?? "").replace(BIDI, "")) && (!type || e.type === type) && middle > (type ? 0 : 140) && middle < height;
    })[index];
  };
  // Set per language: in a right-to-left one the list column is on the right
  let rtl = false;
  /** An x in points from the leading edge */
  const leading = (x) => (rtl ? size()[0] - x : x);
  /** Taps the element, scrolling the list in the first column up to it first */
  const tap = async (label, type, index) => {
    for (let swipes = 0; swipes < 8; swipes++) {
      const element = await find(label, type, index);
      if (element) {
        duoctl("tap", String(element.frame.x + element.frame.width / 2), String(element.frame.y + element.frame.height / 2));
        await sleep(2000);
        return;
      }
      const x = String(leading(200));
      duoctl("swipe", x, "480", x, "280", "--duration", "0.5");
      await sleep(1500);
    }
    throw new Error(`Nothing on screen is labelled ${label}`);
  };
  /**
   * Upright the tabs are in iOS's sidebar (HAU-695), behind the navigation bar's button that is not Settings. Its
   * label is iOS's own, and in a right-to-left language it sits beside the status bar, so it is found by place.
   */
  const openTab = async (name, settings) => {
    const { x, y, width, height } =
      (await elements()).find(
        ({ type, label, frame }) =>
          type === "Button" && frame.y >= 20 && frame.y <= 40 && frame.height >= 30 && frame.width <= 50 && !new RegExp(`^(?:${settings})$`).test(label)
      )?.frame ?? {};
    if (x === undefined) throw new Error("No sidebar button in the navigation bar");
    const center = [x + width / 2, y + height / 2].map(String);
    // A tap on the button straight after another screen change is now and then dropped
    for (let attempt = 0; attempt < 3; attempt++) {
      duoctl("tap", ...center);
      await sleep(2000);
      if (await find(name, "GenericElement")) return tap(name, "GenericElement");
    }
    throw new Error(`The sidebar has no ${name}`);
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
    // The alert is the system's, in the simulator's language, not the app's
    if (await find("Open", "Button")) await tap("Open", "Button");
    await sleep(3000);
  };
  // Shots wait outside the project until the run ends: a dev build's Metro sees every file written in it and
  // puts its "Refreshing..." banner over the next shot
  const staging = fs.mkdtempSync(path.join(os.tmpdir(), "duo-shots-"));
  const staged = (file) => path.join(staging, path.relative(screenshots.dir, file));
  const save = (file) => {
    fs.mkdirSync(path.dirname(staged(file)), { recursive: true });
    duoctl("screenshot", staged(file));
    console.log(`  → ${path.relative(process.cwd(), file)}`);
  };
  /** The inner screen upright (the store size), then in English on its side */
  const shoot = async (language, scene) => {
    save(path.join(rawDir("unfolded", language), `${scene}.png`));
    if (language !== "en") return;
    await rotate("landscape");
    save(dir("unfolded", "landscape", `${scene}.png`));
    await rotate("portrait");
  };

  /** The cover screen is an iPhone to Maestro: the iPhone set's own flow, at the cover's size */
  const captureFolded = async (language, label) => {
    duoctl("close");
    await rotate("portrait");
    const out = fs.mkdtempSync(path.join(os.tmpdir(), "duo-folded-"));
    try {
      const env = Object.entries({ METRO_URL: METRO_URL ?? "", ...label }).flatMap(([key, value]) => ["-e", `${key}=${value}`]);
      execFileSync("maestro", ["--udid", udid, "test", ...env, screenshots.flow, "--test-output-dir", out], { stdio: "inherit" });
      const shots = fs.globSync(path.join(out, "**", "takeScreenshot", "*.png"));
      for (const shot of shots) {
        const file = path.join(rawDir("folded", language), path.basename(shot));
        fs.mkdirSync(path.dirname(staged(file)), { recursive: true });
        fs.copyFileSync(shot, staged(file));
        console.log(`  → ${path.relative(process.cwd(), file)}`);
      }
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  };

  /** The scenes of ship/screenshots.yaml on the inner screen, where a paycheck opens beside the list */
  const captureUnfolded = async (language, label) => {
    simctl("terminate", udid, config.bundleId);
    simctl("launch", udid, config.bundleId, ...DEV_ARGS, "-AppleLanguages", `(${language})`);
    await sleep(8000);
    duoctl("open");
    await rotate("portrait");
    // The sample budget again: the cover run left a paycheck short
    await openLink("paycheck-planner://demo");
    await shoot(language, "paychecks");

    await tap(label.CHANGE_INTERNET);
    for (const key of ["delete", "delete", "delete", "delete", "delete", "8", "4", ".", "9", "9"]) await press(key);
    await shoot(language, "amount");
    await tap(label.SAVE);

    // The card's own label: date tile, name, ..., joined with the language's comma
    await tap(".*[,،、] ?Mesa Health[,،、].*");
    await shoot(language, "detail");

    await openTab(label.EXPENSES, label.SETTINGS);
    await shoot(language, "goals");
    // The inner screen shows the whole list from its top: scrolling would cut the summary and filter under the bar
    await shoot(language, "expenses");

    await openTab(label.INCOME, label.SETTINGS);
    await tap(label.MESA_ROW);
    await shoot(language, "income");
    await tap(label.CLOSE, "Button");

    await openLink("paycheck-planner://demo?short=1");
    await tap(label.SHORT);
    await tap(label.MOVE_BILL);
    await tap(label.CAR_REPAIR);
    // The Brightline paycheck after the next one
    await tap(".* · Brightline Co\\.", undefined, 1);
    await shoot(language, "move");
  };

  return (async () => {
    simctl("bootstatus", udid, "-b");
    simctl("status_bar", udid, "override", "--time", "9:41");
    try {
      for (const [language, locales] of languages) {
        console.log(`${language} (${locales.join(", ")})`);
        const label = labels(language);
        rtl = RTL.has(language);
        await captureFolded(language, label);
        await captureUnfolded(language, label);
      }
      duoctl("close");
    } finally {
      simctl("status_bar", udid, "clear");
      // What was captured, also when a step failed part-way
      fs.cpSync(staging, screenshots.dir, { recursive: true });
      fs.rmSync(staging, { recursive: true, force: true });
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "duo-bezel-"));
  try {
    for (const [screen, size] of Object.entries(SCREENS)) {
      // Only the scenes capture() shoots here; the iPhone set has more
      const shots = screenshots.shots.filter((shot) => fs.existsSync(path.join(rawDir(screen, "en"), `${shot.raw}.png`)));
      // The framer's poster is laid out for a tall phone and runs off these pages
      const duo = { ...screenshots, shots, size: [...size], bezel: drawBezel(size, tmp), poster: undefined };
      for (const [language, locales] of languages) {
        // The framer reads <dir>/raw and writes <dir>/framed/<locale>: point both at this language's folders
        const work = fs.mkdtempSync(path.join(tmp, `${screen}-${language}-`));
        fs.symlinkSync(path.resolve(rawDir(screen, language)), path.join(work, "raw"));
        fs.mkdirSync(dir(screen, "framed"), { recursive: true });
        fs.symlinkSync(path.resolve(dir(screen, "framed")), path.join(work, "framed"));
        await frameScreenshots(config, { ...duo, dir: work }, { only: locales });
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const step = process.argv[2];
if (step !== "frame") await capture();
if (step !== "capture") await frame();
