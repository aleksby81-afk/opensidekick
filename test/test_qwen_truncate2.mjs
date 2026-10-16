const readPageResult = {
  ok: true,
  url: "https://example.com",
  title: "Test",
  text: "Short text",
  elements: Array(400).fill({ ref: 1, text: "Some text that repeats", name: "Link" })
};

function truncateForModelLocal(result) {
  const s = JSON.stringify(result);
  if (s.length <= 12000) return result;
  return { ok: result.ok, note: "result truncated", preview: s.slice(0, 12000) };
}

const truncated = truncateForModelLocal(readPageResult);
console.log(truncated.preview.substring(truncated.preview.length - 200));
