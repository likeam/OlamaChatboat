export function ChatMessage({ message }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        background: isUser ? "#0a84ff" : "#3a3a3a",
        padding: "0.75rem 1rem",
        borderRadius: isUser
          ? "1rem 1rem 0.25rem 1rem"
          : "1rem 1rem 1rem 0.25rem",
        wordWrap: "break-word",
        whiteSpace: "pre-wrap",
      }}
    >
      {message.content || "…"}
    </div>
  );
}
