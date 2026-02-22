import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function Chatbot() {
  const [openChat, setOpenChat] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Resume Intelligence Activated. How can I help you ?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, openChat]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setError("");
    setInput("");
    setSending(true);

    setMessages((prev) => [...prev, { sender: "user", text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      // Read safely (avoid JSON parse errors)
      const raw = await res.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        const msg =
          data?.error?.message ||
          data?.error ||
          raw ||
          `HTTP ${res.status}`;
        throw new Error(msg);
      }

      const reply =
        data?.reply ??
        data?.message ??
        data?.text ??
        "I got a response but no reply field was returned.";

      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    } catch (e) {
      setError(e?.message || "Failed to fetch");
      setMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "⚠️ I couldn’t reach the server. Verify backend is running and proxy is correct.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chatbot-container">
      {openChat ? (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>Resume Assistant</span>
            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setOpenChat(false)}
              style={{ cursor: "pointer", background: "transparent", border: "none" }}
            >
              ✕
            </button>
          </div>

          <div className="chatbot-body">
            {messages.map((msg, idx) => (
             <div key={idx} className={`chat-message ${msg.sender}`}>
  <ReactMarkdown>{msg.text}</ReactMarkdown>
</div>
            ))}
            <div ref={endRef} />
          </div>

          {error ? (
            <div style={{ padding: "8px 12px", fontSize: 12, opacity: 0.9 }}>
              Failed: {error}
            </div>
          ) : null}

          <div className="chatbot-input">
            <input
              type="text"
              placeholder={sending ? "Sending..." : "Ask something..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={sending}
            />
            <button onClick={handleSend} disabled={sending || !input.trim()}>
              {sending ? "..." : "Send"}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="chatbot-tooltip">Need help with your resume?</div>
          <button className="chatbot-toggle" onClick={() => setOpenChat(true)}>
            💬
          </button>
        </>
      )}
    </div>
  );
}