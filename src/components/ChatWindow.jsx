import { ChatMessage } from "./ChatMessage";

export function ChatWindow({ messages, loading }) {
  return (
    <div className="chat-container">
      {messages.length === 0 && (
        <div style={{ color: "#666", textAlign: "center", marginTop: "2rem" }}>
          Ask something to DeepSeek (via Ollama) 🚀
        </div>
      )}

      {messages.map((msg, idx) => (
        <ChatMessage key={idx} message={msg} />
      ))}

      {loading && (
        <div className="loading-indicator">DeepSeek is thinking…</div>
      )}
    </div>
  );
}
