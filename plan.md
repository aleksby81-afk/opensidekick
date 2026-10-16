1.  **Diagnose the problem:** The model incorrectly handles the results of `read_page` when the tool result is large. Instead of treating it as tool response data to guide its next actions, the model acts as though the data was manually pasted by the user.

    *   **Root causes to investigate:**
        *   **Context length / Truncation:** Does `truncateForModel` create an object that looks like unstructured text to the model?
        *   **Tool message formatting:** Ollama (specifically qwen3-vl-instruct) may not correctly understand messages with `role: "tool"` or correlate them with its preceding `tool_calls`. The current serialization to OpenAI format for tools is:
            ```javascript
            } else if (m.role === "tool") {
              out.push({ role: "tool", tool_call_id: m.toolCallId, content: m.content });
            }
            ```
            Since the content here is a stringified JSON object (e.g. `content: '{"ok":true,"elements":[...]}'`), when the elements array gets truncated, the JSON becomes invalid text (`content: '{"ok":true,"note":"result truncated","preview":"{...valid up to 12000 chars..."}'`). This is highly problematic because the model expects a JSON output from the tool and instead receives a malformed string or an object with "preview" containing a broken JSON string.

        *   **System Prompt:** The prompt lacks an explicit instruction that tool results are system-generated and must be used to continue the task.

2.  **Proposed Fixes:**
    *   **Improve Truncation:** Modify `truncateForModel` in `src/background/agent.js`. Instead of wrapping a chopped stringified representation in an outer object, it should truncate the actual arrays (like `elements`) directly so the resulting JSON is still semantically valid and structurally sound.
    *   **System Prompt Enhancement:** Add a strong directive to the system prompt in `src/background/agent.js` clarifying how to handle tool results and explicitly warning not to mistake them for new user messages or user data.
    *   **Tests:** Add multi-step agent tests simulating a large `read_page` response followed by another action, ensuring the model processes the result and continues properly.

3.  **Action Plan:**
    *   Modify `truncateForModel` to safely truncate JSON objects (like the `read_page` result with a large `elements` array) instead of creating an invalid JSON substring preview.
    *   Update `SYSTEM_PROMPT` in `src/background/agent.js`.
    *   Add tests to `test/e2e.test.mjs` verifying the fix works as expected.
    *   Run tests.
    *   Create patch and prepare final report.
