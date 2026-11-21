/**
 * The 6.5" App Store set (`bun store:screenshots:sizes`): every framed 6.9" image (1320 × 2868) of
 * ship/screenshots/framed scaled to 1284 wide, with the 12 spare rows of background cut from top and bottom,
 * in ship/screenshots/framed-6.5. Run it after `bun store:screenshots:frame`.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const [WIDTH, HEIGHT] = [1284, 2778];
const framed = path.join(process.cwd(), "ship", "screenshots", "framed");
const out = path.join(process.cwd(), "ship", "screenshots", "framed-6.5");

fs.rmSync(out, { recursive: true, force: true });
for (const locale of fs.readdirSync(framed)) {
  fs.mkdirSync(path.join(out, locale), { recursive: true });
  for (const file of fs.readdirSync(path.join(framed, locale)).filter((f) => f.endsWith(".png"))) {
    execFileSync("magick", [
      path.join(framed, locale, file), "-resize", `${WIDTH}x`, "-gravity", "center", "-crop", `${WIDTH}x${HEIGHT}+0+0`, "+repage",
      "-alpha", "off", `PNG24:${path.join(out, locale, file)}`,
    ]);
  }
  console.log(`  → ${locale}`);
}
