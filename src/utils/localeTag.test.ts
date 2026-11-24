import { expect, test } from "bun:test";

import { pickLocaleTag, type ResolveLocale } from "@/utils/localeTag";

// Hermes on Android: a language-region pair ICU lacks resolves to the device default.
const android: ResolveLocale = (tag) =>
  tag.endsWith("-US") && tag !== "en-US" && tag !== "es-US" ? "en-US" : tag;
const echo: ResolveLocale = (tag) => tag;

test("Android falls back to the bare language for an unknown pair", () => {
  expect(pickLocaleTag("de", "US", android)).toBe("de");
  expect(pickLocaleTag("ar", "US", android)).toBe("ar-u-nu-latn");
  expect(pickLocaleTag("he", "US", android)).toBe("he");
});

test("Android keeps a pair it knows", () => {
  expect(pickLocaleTag("es", "US", android)).toBe("es-US");
  expect(pickLocaleTag("en", "US", android)).toBe("en-US");
});

test("iOS-like resolver keeps the region", () => {
  expect(pickLocaleTag("ar", "US", echo)).toBe("ar-US");
  expect(pickLocaleTag("en", "GB", echo)).toBe("en-GB");
});

test("no region gives the bare language", () => {
  expect(pickLocaleTag("de", undefined, echo)).toBe("de");
});

test("a tag with a region or script is kept without asking Intl", () => {
  let called = false;
  const resolve: ResolveLocale = (tag) => {
    called = true;
    return tag;
  };
  expect(pickLocaleTag("pt-BR", "US", resolve)).toBe("pt-BR");
  expect(called).toBe(false);
});

test("a throwing pair falls back to the bare language", () => {
  const resolve: ResolveLocale = (tag) => {
    if (tag.includes("-")) throw new RangeError("Invalid language tag");
    return tag;
  };
  expect(pickLocaleTag("de", "US", resolve)).toBe("de");
});

test("Norwegian accepts ICU's nb", () => {
  const resolve: ResolveLocale = (tag) => (tag === "no" ? "nb" : "en-US");
  expect(pickLocaleTag("no", "US", resolve)).toBe("no");
});

test("nothing in the language gives the bare language", () => {
  expect(pickLocaleTag("de", "US", () => "en-US")).toBe("de");
});

test("Arabic keeps the region pair when Intl has it", () => {
  expect(pickLocaleTag("ar", "EG", echo)).toBe("ar-EG");
});
