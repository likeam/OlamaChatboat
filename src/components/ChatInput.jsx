import { useState } from "react";

export function ChatInput({ onSend, loading, onClear, messages }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input.trim());
    setInput("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        gap: "0.5rem",
        padding: "1rem 1.5rem",
        background: "#2d2d2d",
        borderTop: "1px solid #3a3a3a",
      }}
    >
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type your message…"
        disabled={loading}
        style={{
          flex: 1,
          padding: "0.75rem 1rem",
          borderRadius: "2rem",
          border: "1px solid #444",
          background: "#1a1a1a",
          color: "#e0e0e0",
          outline: "none",
        }}
      />
      <button
        type="submit"
        disabled={loading || !input.trim()}
        style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "2rem",
          border: "none",
          background: "#0a84ff",
          color: "#fff",
          fontWeight: "600",
          cursor: "pointer",
          transition: "opacity 0.2s",
          opacity: loading || !input.trim() ? 0.5 : 1,
        }}
      >
        Send
      </button>
      {messages?.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "2rem",
            border: "1px solid #555",
            background: "transparent",
            color: "#aaa",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      )}
    </form>
  );
}
