import { truncateForModel } from "../src/background/agent.js";
import assert from "node:assert/strict";

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




// Regression cases for large tool results, nested values and the byte budget.
function verifyLarge(input) {
  const output = truncateForModel(input);
  assert.ok(JSON.stringify(output).length <= 12000, "entire serialized result fits");
  assert.equal(output._note, "result truncated to fit context");
  assert.ok(!Object.hasOwn(output, "preview"), "never return a sliced JSON preview");
  return output;
}

const longText = verifyLarge({ok:true, url:"https://example.com", text:"X".repeat(30000)});
assert.ok(longText.text.length < 30000);
assert.equal(longText.url, "https://example.com");

const nested = verifyLarge({
  ok:true,
  summary:{headline:"products",excerpt:"E".repeat(30000)},
  elements:[{ref:1,name:"First"},{ref:2,name:"Second"}],
});
assert.equal(nested.summary.headline,"products");
assert.equal(nested.elements.length,2);
assert.equal(nested.elements[0].ref,1);

const boundary = verifyLarge({ok:true,text:"a".repeat(11990)});
assert.ok(JSON.stringify(boundary).length <= 12000,"marker included in size");

const keyHeavy = verifyLarge({ok:true,["Z".repeat(15000)]:null});
assert.equal(keyHeavy.error,"Tool result exceeded context limit");

const circular = {ok:true};
circular.self = circular;
const invalid = truncateForModel(circular);
assert.equal(invalid.ok,false);
assert.ok(JSON.stringify(invalid).length < 12000);

// Ensure URL strings, hrefs, and refs are preserved
const preservedFields = verifyLarge({
  ok: true,
  elements: [{
    ref: 1234,
    url: "https://example.com/a-very-long-url-that-must-be-preserved-" + "A".repeat(500),
    href: "https://example.com/a-very-long-href-that-must-be-preserved-" + "A".repeat(500),
    name: "A preserved name string that must not be truncated-" + "B".repeat(500),
    description: "A description that should be truncated to save space-" + "C".repeat(15000)
  }]
});
assert.ok(preservedFields.elements[0].url.includes("A".repeat(500)), "url is preserved");
assert.ok(preservedFields.elements[0].href.includes("A".repeat(500)), "href is preserved");
assert.ok(preservedFields.elements[0].name.includes("B".repeat(500)), "name is preserved");
assert.equal(preservedFields.elements[0].ref, 1234, "ref is preserved");
assert.ok(preservedFields.elements[0].description.length < 15000, "other fields are truncated");

console.log("ALL AGENT HARDENING TESTS PASSED");
