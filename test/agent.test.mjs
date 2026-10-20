import { truncateForModel } from "../src/background/agent.js";

let fail = 0;
const ok = (cond, msg) => {
  if (cond) {
    console.log("ok  : " + msg);
  } else {
    console.error("FAIL: " + msg);
    fail++;
  }
};

const smallResult = { ok: true, elements: [{ ref: 1, text: "Small" }] };
const truncatedSmall = truncateForModel(smallResult);
ok(JSON.stringify(truncatedSmall) === JSON.stringify(smallResult), "small result remains unchanged");

const largeResult = {
  ok: true,
  url: "https://example.com",
  elements: Array.from({length: 400}, (_, i) => ({ ref: i, text: "Some long text here to take up space", name: "Link" }))
};

ok(JSON.stringify(largeResult).length > 12000, "large result is initially greater than 12000 chars");

const truncatedLarge = truncateForModel(largeResult);
ok(JSON.stringify(truncatedLarge).length <= 12000, "large result is truncated to fit under 12000 chars");
ok(Array.isArray(truncatedLarge.elements), "truncated large result maintains elements array");
ok(truncatedLarge.elements.length < 400 && truncatedLarge.elements.length > 0, "elements array is shorter but not empty");
ok(truncatedLarge._note === "result truncated to fit context", "adds truncation note");

if (fail > 0) {
  process.exit(1);
} else {
  console.log("ALL AGENT TESTS PASSED");
}
