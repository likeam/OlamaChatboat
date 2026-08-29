import "./App.css";
import { useOllamaChat } from "./hooks/useOllamaChat";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";

function App() {
  const { messages, loading, error, sendMessage, clearMessages } =
    useOllamaChat(
      "deepseek-r1:1.5b", // Change to any model you've pulled (e.g., 'deepseek-r1:7b')
    );

  return (
    <div className="app">
      <div className="app-header">
        💬 DeepSeek · Ollama
        <small>{loading ? "…" : "local"}</small>
      </div>

      {error && (
        <div
          style={{
            background: "#442222",
            color: "#ff8888",
            padding: "0.5rem 1.5rem",
            borderBottom: "1px solid #662222",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      <ChatWindow messages={messages} loading={loading} />
      <ChatInput
        onSend={sendMessage}
        loading={loading}
        onClear={clearMessages}
        messages={messages}
      />
    </div>
  );
}

export default App;
