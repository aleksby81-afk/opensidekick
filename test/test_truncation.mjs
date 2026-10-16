const result = { ok: true, elements: Array(500).fill({ ref: 1, text: "Some text that repeats", name: "Link" }) };
const s = JSON.stringify(result);
console.log("Length:", s.length);

function truncateForModel(result) {
  const s = JSON.stringify(result);
  if (s.length <= 12000) return result;
  return { ok: result.ok, note: "result truncated", preview: s.slice(0, 12000) };
}

const truncated = truncateForModel(result);
console.log("Truncated preview ends with:", truncated.preview.slice(-50));
console.log("Is preview valid JSON?", (() => { try { JSON.parse(truncated.preview); return true; } catch { return false; } })());
