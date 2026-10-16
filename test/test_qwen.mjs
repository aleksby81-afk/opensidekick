import { callModel } from "../src/background/providers.js";

const provider = { type: "openai", baseUrl: "http://127.0.0.1:11434/v1", apiKey: "test" };
const msgs = [
  { role: "user", content: "hi" },
  { role: "assistant", content: "", toolCalls: [{ id: "call_1", name: "read_page", args: {} }] },
  { role: "tool", toolCallId: "call_1", name: "read_page", content: '{"ok":true,"elements":[{"ref":1,"text":"Item 1"},{"ref":2,"text":"Item 2"}]}' }
];

console.log(JSON.stringify(msgs, null, 2));
