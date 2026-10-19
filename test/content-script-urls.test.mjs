// Verify browser link serialization directly from the content script source.
// This catches truncation upstream of agent.js truncateForModel.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const source = readFileSync(new URL("../src/content/content-script.js", import.meta.url), "utf8");
const match = source.match(/^  function shortUrl\(href\) \{[\s\S]*?^  \}/m);
assert.ok(match, "content script must expose the shortUrl helper source for regression testing");
const shortUrl = runInNewContext(
  `(() => { ${match[0]}; return shortUrl; })()`,
  { URL }
);

const longListing = "https://www.avito.ru/moskva/bytovaya_tehnika/elektricheskaya_schetka_dlya_uborki_9_in_1_8376005045";
assert.ok(longListing.length > 80, "regression URL exceeds previous 80-char limit");
assert.equal(shortUrl(longListing), longListing, "full listing URL and numeric ID remain intact");
assert.equal(
  shortUrl(longListing + "?context=H4sIAAAAA&foo=bar"),
  longListing + "?foo=bar",
  "remove only tracking context from a listing; preserve other parameters"
);

const secondListing = "https://www.avito.ru/penzenskaya_oblast_zarechnyy/posuda_i_tovary_dlya_kuhni/elektroschetka_dlya_uborki_8146291487";
assert.equal(shortUrl(secondListing), secondListing, "preserve other long Avito listing URLs");

const category = "https://www.avito.ru/moskva?context=not-a-listing&query=trimmer";
assert.equal(shortUrl(category), category, "non-listing Avito URLs are unchanged");

const external = "https://example.com/catalog/long-article?context=keep";
assert.equal(shortUrl(external), external, "non-Avito URLs are unchanged");

const impostor = "https://fakeavito.ru/moskva/item_12345678?context=keep";
assert.equal(shortUrl(impostor), impostor, "similar-looking domains are not treated as Avito");

const relative = "/moskva/item_1234567890?context=keep";
assert.equal(shortUrl(relative), relative, "relative and unparseable URLs are not cut");

console.log("PASS: content-script URL preservation regression tests");
