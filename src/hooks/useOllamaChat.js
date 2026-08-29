import { useState, useCallback, useRef } from "react";

export function useOllamaChat(model = "deepseek-r1:1.5b") {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortControllerRef = useRef(null);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim()) return;

      // Add user message
      const userMsg = { role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      // Placeholder for assistant's streaming reply
      const assistantMsg = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      const apiMessages = [...messages, userMsg].map(({ role, content }) => ({
        role,
        content,
      }));

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/ollama/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            stream: true,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Ollama error: ${response.status} ${errText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        // Read the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                // Update the last assistant message incrementally
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    last.content += json.message.content;
                  }
                  return updated;
                });
              }
              if (json.done && json.done === true) {
                // Stream finished – we can ignore
              }
            } catch (parseError) {
              console.warn("Failed to parse chunk:", line);
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          // Remove the incomplete assistant message
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, model],
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    if (loading) abort();
    setMessages([]);
    setError(null);
  }, [loading, abort]);

  return { messages, loading, error, sendMessage, abort, clearMessages };
}
