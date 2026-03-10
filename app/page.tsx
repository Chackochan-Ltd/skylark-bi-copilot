"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "user" | "assistant";

interface Message {
  id: number;
  role: Role;
  content: string;
  qualityIssues?: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const EXAMPLE_CHIPS = [
  "Pipeline status this quarter",
  "Energy sector performance",
  "Show delayed projects",
  "Revenue collected so far",
  "Top performing sector",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span
        style={{ fontFamily: "'Share Tech Mono', monospace" }}
        className="text-amber-400 text-xs tracking-widest uppercase"
      >
        PROCESSING
      </span>
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-amber-400"
            style={{
              animation: "blink 1s step-start infinite",
              animationDelay: `${i * 0.25}s`,
            }}
          />
        ))}
      </span>
    </div>
  );
}

function QualityWarning({ issues }: { issues: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="mt-3 rounded border overflow-hidden"
      style={{
        borderColor: "#f59e0b66",
        background: "rgba(245,158,11,0.07)",
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-3 py-2 transition-colors hover:bg-amber-500/10"
        style={{ fontFamily: "'Share Tech Mono', monospace" }}
      >
        <span className="text-amber-400 text-xs tracking-widest uppercase flex items-center gap-2">
          <span className="text-base leading-none">⚠</span>
          SYS ALERT — DATA QUALITY NOTES ({issues.length})
        </span>
        <span className="text-amber-500 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <ul
          className="px-4 pb-3 space-y-1 border-t"
          style={{ borderColor: "#f59e0b33" }}
        >
          {issues.map((issue, i) => (
            <li
              key={i}
              className="text-amber-200/70 text-xs leading-relaxed pt-1"
              style={{ fontFamily: "'Share Tech Mono', monospace" }}
            >
              &gt; {issue}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Markdown Renderer ───────────────────────────────────────────────────────

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <span key={i} className="font-bold text-white">{part.slice(2, -2)}</span>;
    }
    return part;
  });
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    if (/^#{1,3}\s+/.test(trimmed)) {
      const text = trimmed.replace(/^#{1,3}\s+/, "");
      nodes.push(
        <div key={i} style={{ fontFamily: "'Share Tech Mono', monospace", color: "#f59e0b", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: "bold", marginTop: i === 0 ? 0 : 14, marginBottom: 4 }}>
          {text}
        </div>
      );
    } else if (/^(\*|-|•)\s+/.test(trimmed)) {
      const text = trimmed.replace(/^(\*|-|•)\s+/, "");
      nodes.push(
        <div key={i} style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <span style={{ color: "#06b6d4", flexShrink: 0, marginTop: 1 }}>▸</span>
          <span>{parseInline(text)}</span>
        </div>
      );
    } else if (trimmed === "") {
      nodes.push(<div key={i} style={{ height: 6 }} />);
    } else {
      nodes.push(<div key={i}>{parseInline(line)}</div>);
    }
  });

  return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{nodes}</div>;
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-6`}>
      {!isUser && (
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold mr-3 mt-1 shrink-0"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            background: "rgba(6,182,212,0.15)",
            border: "1px solid #06b6d444",
            color: "#06b6d4",
          }}
        >
          AI
        </div>
      )}
      <div className={`${isUser ? "max-w-[65%]" : "max-w-[75%]"}`}>
        {isUser ? (
          <div
            className="rounded px-6 py-4 text-sm leading-7 whitespace-pre-wrap text-black font-medium"
            style={{
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              borderRadius: "8px 8px 2px 8px",
            }}
          >
            {message.content}
          </div>
        ) : (
          <div
            className="rounded py-5 text-sm leading-7"
            style={{
              background: "rgba(6,182,212,0.05)",
              border: "1px solid #06b6d422",
              borderLeft: "3px solid #06b6d4",
              borderRadius: "2px 8px 8px 8px",
              color: "#cbd5e1",
              fontFamily: "'DM Sans', sans-serif",
              paddingLeft: "24px",
              paddingRight: "24px",
              marginLeft: "6px",
            }}
          >
            <MarkdownRenderer content={message.content} />
          </div>
        )}
        {!isUser && message.qualityIssues && message.qualityIssues.length > 0 && (
          <QualityWarning issues={message.qualityIssues} />
        )}
      </div>
      {isUser && (
        <div
          className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold ml-3 mt-1 shrink-0"
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            background: "rgba(245,158,11,0.15)",
            border: "1px solid #f59e0b44",
            color: "#f59e0b",
          }}
        >
          OPS
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "assistant",
      content:
        "SKYLARK BI COPILOT ONLINE.\n\nAll data feeds nominal. Monday.com boards connected.\n\nAwaiting mission query. Ask about pipeline value, revenue, sector performance, delayed projects, or request a full Mission Briefing.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashFading(true), 3700);
    const hideTimer = setTimeout(() => setShowSplash(false), 4200);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: idRef.current++, role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim() }),
      });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          role: "assistant",
          content: json.reply ?? "No response received.",
          qualityIssues: json.qualityIssues ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          role: "assistant",
          content: "COMMS ERROR: Unable to reach mission control server. Retry.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function generateLeadershipUpdate() {
    if (loading) return;
    const userMsg: Message = {
      id: idRef.current++,
      role: "user",
      content: "GENERATE MISSION BRIEFING — Weekly Leadership Update",
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/leadership", { method: "POST" });
      const json = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          role: "assistant",
          content: json.report ?? "No report generated.",
          qualityIssues: json.qualityIssues ?? [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: idRef.current++,
          role: "assistant",
          content: "MISSION BRIEFING FAILED: Server error. Please retry.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <>
      {/* ── Google Fonts + Global Styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=DM+Sans:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #080c14;
          color: #cbd5e1;
          overflow: hidden;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes radarSweep {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-amber {
          0%, 100% { opacity: 1; box-shadow: 0 0 4px #f59e0b; }
          50% { opacity: 0.4; box-shadow: none; }
        }

        @keyframes status-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }

        @keyframes loadbar {
          from { width: 0%; }
          to { width: 100%; }
        }

        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 999;
          background: #080c14;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 20px;
          transition: opacity 0.5s ease;
        }
        .splash-screen.fading { opacity: 0; pointer-events: none; }

        .splash-icon {
          width: 96px; height: 96px;
          border-radius: 50%;
          background: rgba(245,158,11,0.1);
          border: 2px solid #f59e0b88;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 40px rgba(245,158,11,0.5), 0 0 80px rgba(245,158,11,0.2), 0 0 120px rgba(245,158,11,0.08);
          outline: 4px solid rgba(245,158,11,0.15);
          outline-offset: 6px;
          animation: pulse-amber 2s ease-in-out infinite;
        }

        .splash-loadbar-track {
          width: 240px;
          height: 2px;
          background: rgba(245,158,11,0.15);
          border-radius: 2px;
          overflow: hidden;
          margin-top: 8px;
        }
        .splash-loadbar-fill {
          height: 100%;
          background: linear-gradient(90deg, #d97706, #f59e0b, #06b6d4);
          border-radius: 2px;
          animation: loadbar 4s cubic-bezier(0.4,0,0.2,1) forwards;
        }

        .radar-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .radar-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(6,182,212,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6,182,212,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
        }

        .radar-bg::after {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform-origin: center;
          background: conic-gradient(
            from 0deg,
            rgba(245,158,11,0) 0deg,
            rgba(245,158,11,0.06) 60deg,
            rgba(245,158,11,0) 61deg
          );
          animation: radarSweep 8s linear infinite;
          margin-top: -300px;
          margin-left: -300px;
        }

        .amber-top-border {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, #f59e0b, #06b6d4, #f59e0b, transparent);
          z-index: 100;
        }

        .status-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #22c55e;
          animation: status-blink 2s ease-in-out infinite;
          box-shadow: 0 0 6px #22c55e;
        }

        .chip-btn {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 12px;
          border: 1px solid #f59e0b66;
          border-radius: 4px;
          background: rgba(245,158,11,0.06);
          color: #f59e0b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .chip-btn:hover:not(:disabled) {
          background: rgba(245,158,11,0.15);
          border-color: #f59e0b;
          box-shadow: 0 0 8px rgba(245,158,11,0.3);
        }
        .chip-btn:disabled { opacity: 0.35; cursor: not-allowed; }

        .mission-btn {
          width: 100%;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-weight: bold;
          padding: 12px 24px;
          background: linear-gradient(90deg, #d97706, #f59e0b, #d97706);
          background-size: 200% 100%;
          color: #080c14;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .mission-btn:hover:not(:disabled) {
          background-position: right center;
          box-shadow: 0 0 20px rgba(245,158,11,0.4);
        }
        .mission-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .send-btn {
          width: 44px; height: 44px;
          border-radius: 4px;
          border: 1px solid #f59e0b66;
          background: rgba(245,158,11,0.1);
          color: #f59e0b;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .send-btn:hover:not(:disabled) {
          background: rgba(245,158,11,0.25);
          border-color: #f59e0b;
          box-shadow: 0 0 10px rgba(245,158,11,0.3);
        }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .query-input {
          flex: 1;
          resize: none;
          border-radius: 4px;
          background: rgba(6,182,212,0.04);
          border: 1px solid #06b6d433;
          color: #e2e8f0;
          padding: 12px 16px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          max-height: 144px;
          overflow-y: auto;
          line-height: 1.5;
        }
        .query-input:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 2px rgba(245,158,11,0.15);
        }
        .query-input::placeholder { color: #475569; }

        .scrollable-messages {
          flex: 1;
          overflow-y: auto;
          padding: 24px 24px;
          scrollbar-width: thin;
          scrollbar-color: #f59e0b22 transparent;
        }
        .scrollable-messages::-webkit-scrollbar { width: 4px; }
        .scrollable-messages::-webkit-scrollbar-thumb { background: #f59e0b33; border-radius: 2px; }

        .panel {
          background: rgba(8,12,20,0.9);
          border-bottom: 1px solid #06b6d422;
        }

        .footer-panel {
          background: rgba(8,12,20,0.95);
          border-top: 1px solid #f59e0b22;
          padding: 12px 16px 16px;
        }
      `}</style>

      {/* Splash screen */}
      {showSplash && (
        <div className={`splash-screen${splashFading ? " fading" : ""}`}>
          <div className="splash-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div style={{ textAlign: "center", marginTop: 8 }}>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 36, letterSpacing: "0.2em", color: "#f59e0b", marginBottom: 10, lineHeight: 1.1 }}>
              SKYLARK BI COPILOT
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, letterSpacing: "0.05em", color: "#06b6d4", fontWeight: 500 }}>
              Built for Skylark Drones Leadership
            </div>
          </div>
          <div className="splash-loadbar-track" style={{ marginTop: 12 }}>
            <div className="splash-loadbar-fill" />
          </div>
          <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 12, letterSpacing: "0.25em", color: "#475569" }}>
            INITIALIZING SYSTEMS...
          </div>
        </div>
      )}

      {/* Animated radar background */}
      <div className="radar-bg" />
      {/* Amber top border */}
      <div className="amber-top-border" />

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <header className="panel" style={{ paddingTop: "2px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Logo mark */}
              <div style={{
                width: 38, height: 38,
                border: "1px solid #f59e0b55",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(245,158,11,0.08)",
                borderRadius: 4,
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h1 style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 16, letterSpacing: "0.15em", color: "#f59e0b", lineHeight: 1.2 }}>
                  SKYLARK BI COPILOT
                </h1>
                <p style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#06b6d4", lineHeight: 1.2 }}>
                  MISSION INTELLIGENCE SYSTEM · v2.0
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="status-dot" />
              <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "0.12em", color: "#22c55e" }}>
                SYSTEMS ONLINE
              </span>
            </div>
          </div>
        </header>

        {/* ── Messages ── */}
        <div className="scrollable-messages">
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 20 }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 4,
                  background: "rgba(6,182,212,0.15)",
                  border: "1px solid #06b6d444",
                  color: "#06b6d4",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: "bold", marginRight: 12, flexShrink: 0,
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  AI
                </div>
                <div style={{
                  background: "rgba(6,182,212,0.05)",
                  border: "1px solid #06b6d422",
                  borderLeft: "3px solid #06b6d4",
                  borderRadius: "2px 8px 8px 8px",
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="footer-panel">
          <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>

            {/* Chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {EXAMPLE_CHIPS.map((chip) => (
                <button
                  key={chip}
                  className="chip-btn"
                  onClick={() => sendMessage(chip)}
                  disabled={loading}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Mission Briefing button */}
            <button
              className="mission-btn"
              onClick={generateLeadershipUpdate}
              disabled={loading}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              GENERATE MISSION BRIEFING
            </button>

            {/* Input row */}
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter mission query..."
                rows={1}
                disabled={loading}
                className="query-input"
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = "auto";
                  el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
                }}
              />
              <button
                className="send-btn"
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.269 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>

            <p style={{ textAlign: "center", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: "#334155", letterSpacing: "0.1em" }}>
              ENTER TO TRANSMIT · SHIFT+ENTER FOR NEW LINE
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
