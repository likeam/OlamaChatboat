import { useState, useCallback, useRef } from "react";

export function useGroceryChat(model = "deepseek-r1:1.5b") {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groceryData, setGroceryData] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const abortControllerRef = useRef(null);

  // Function to load grocery data from Excel
  const loadGroceryData = useCallback((data) => {
    setGroceryData(data);
    setIsDataLoaded(true);
    // Add a system message indicating prices are loaded
    setMessages([
      {
        role: "assistant",
        content: `✅ Grocery data loaded! I now know ${Object.keys(data.items).length} products. Ask me about prices, specials, or help with your shopping!`,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim()) return;

      if (!isDataLoaded) {
        setError(
          'Please upload your grocery data first using the "Import Excel" button.',
        );
        return;
      }

      // Add user message
      const userMsg = { role: "user", content };
      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      // Build system prompt from grocery data
      const buildSystemPrompt = () => {
        if (!groceryData) return "You are a grocery store assistant.";

        let prompt =
          "You are a helpful grocery store assistant. Here are our current prices:\n\n";

        // Group items by category
        const categories = {};
        Object.entries(groceryData.items).forEach(([id, item]) => {
          const category = item.category || "General";
          if (!categories[category]) categories[category] = [];
          categories[category].push({
            name: item.name,
            price: item.price,
            unit: item.unit || "each",
          });
        });

        // Build the prompt
        Object.entries(categories).forEach(([category, items]) => {
          prompt += `${category.toUpperCase()}:\n`;
          items.forEach((item) => {
            prompt += `- ${item.name}: $${item.price.toFixed(2)}/${item.unit}\n`;
          });
          prompt += "\n";
        });

        // Add specials if any
        if (
          groceryData.specials &&
          Object.keys(groceryData.specials).length > 0
        ) {
          prompt += "SPECIALS:\n";
          Object.entries(groceryData.specials).forEach(([item, special]) => {
            prompt += `- ${item}: ${special.description}\n`;
          });
          prompt += "\n";
        }

        prompt += `
Instructions:
1. Always give prices in USD.
2. Calculate totals when customers ask for multiple items.
3. Suggest alternatives or complementary products when appropriate.
4. Be friendly and helpful.
5. If you don't know a price, say so honestly.

Current store data loaded: ${Object.keys(groceryData.items).length} products.
`;
        return prompt;
      };

      const systemPrompt = buildSystemPrompt();

      // Assistant placeholder
      const assistantMsg = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMsg]);

      // Build messages WITH system prompt
      const apiMessages = [
        { role: "system", content: systemPrompt },
        ...messages.map(({ role, content }) => ({ role, content })),
        { role: "user", content },
      ];

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
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last && last.role === "assistant") {
                    last.content += json.message.content;
                  }
                  return updated;
                });
              }
            } catch (parseError) {
              console.warn("Failed to parse chunk:", line);
            }
          }
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
          setMessages((prev) => prev.slice(0, -1));
        }
      } finally {
        setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, groceryData, isDataLoaded, model],
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

  const getItemCount = useCallback(() => {
    if (!groceryData || !groceryData.items) return 0;
    return Object.keys(groceryData.items).length;
  }, [groceryData]);

  return {
    messages,
    loading,
    error,
    sendMessage,
    abort,
    clearMessages,
    loadGroceryData,
    isDataLoaded,
    getItemCount,
  };
}
