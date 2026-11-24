import { expect, test } from "bun:test";

import { closeAmount } from "@/utils/rtlAmount";

test("Arabic Latin symbols end with a left-to-right mark so they read US$", () => {
  expect(closeAmount("‏1,270.15 US$")).toBe("‏1,270.15‏ US$‎");
  expect(closeAmount("‏‎-292.84 US$")).toBe(
    "‏‎-292.84‏ US$‎",
  );
  expect(closeAmount("‏4.8 US$", "k")).toBe("‏4.8k‏ US$‎");
  expect(closeAmount("‏1,270.15 ‏CA$")).toBe(
    "‏1,270.15‏ ‏CA$‎",
  );
});

test("right-to-left amounts without a Latin symbol get only the mark after the number", () => {
  expect(closeAmount("‏883.00 ‏$")).toBe("‏883.00‏ ‏$");
  expect(closeAmount("‏1,270.15 €")).toBe("‏1,270.15‏ €");
  expect(closeAmount("‏1,270.15 ج.م.‏")).toBe("‏1,270.15‏ ج.م.‏");
});

test("left-to-right amounts come back unchanged", () => {
  expect(closeAmount("$1,270.15")).toBe("$1,270.15");
  expect(closeAmount("1.980,00 $")).toBe("1.980,00 $");
  expect(closeAmount("CA$1,270.15")).toBe("CA$1,270.15");
});

test("a suffix goes after the number without marks", () => {
  expect(closeAmount("$1.3", "k")).toBe("$1.3k");
  expect(closeAmount("1,3 $", "k")).toBe("1,3k $");
});
