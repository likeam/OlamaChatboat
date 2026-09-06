import "./App.css";
import { useGroceryChat } from "./hooks/useGroceryChat";
import { ChatWindow } from "./components/ChatWindow";
import { ChatInput } from "./components/ChatInput";
import { ExcelUploader } from "./components/ExcelUploader";
import { useState } from "react";

function App() {
  const [showUploader, setShowUploader] = useState(false);
  const chat = useGroceryChat("deepseek-r1:1.5b");

  return (
    <div className="app">
      <div className="app-header" style={{ flexWrap: "wrap" }}>
        <span>🛒 Grocery Store Assistant</span>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginLeft: "auto",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.8rem", color: "#888" }}>
            {chat.isDataLoaded
              ? `📦 ${chat.getItemCount()} items loaded`
              : "📂 No data loaded"}
          </span>
          <button
            onClick={() => setShowUploader(!showUploader)}
            style={{
              padding: "0.25rem 0.75rem",
              background: showUploader ? "#3a3a3a" : "#0a84ff",
              border: "none",
              borderRadius: "0.5rem",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}
          >
            {showUploader ? "Close" : "📊 Import Excel"}
          </button>
          {chat.isDataLoaded && (
            <button
              onClick={chat.clearMessages}
              style={{
                padding: "0.25rem 0.75rem",
                background: "#3a3a3a",
                border: "none",
                borderRadius: "0.5rem",
                color: "#e0e0e0",
                cursor: "pointer",
                fontSize: "0.8rem",
              }}
            >
              🗑️ Clear Chat
            </button>
          )}
        </div>
      </div>

      {chat.error && (
        <div
          style={{
            background: "#442222",
            color: "#ff8888",
            padding: "0.5rem 1.5rem",
            borderBottom: "1px solid #662222",
          }}
        >
          ⚠️ {chat.error}
        </div>
      )}

      {showUploader ? (
        <div style={{ padding: "1.5rem" }}>
          <ExcelUploader onDataImported={chat.loadGroceryData} />
        </div>
      ) : (
        <>
          <ChatWindow messages={chat.messages} loading={chat.loading} />
          <ChatInput
            onSend={chat.sendMessage}
            loading={chat.loading}
            onClear={chat.clearMessages}
            messages={chat.messages}
          />
        </>
      )}
    </div>
  );
}

export default App;
