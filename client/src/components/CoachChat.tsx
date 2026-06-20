import { palette } from "@/lib/theme";
import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { apiRequest } from "../lib/queryClient";

interface CoachChatProps {
  patternId: string;
  sectionName?: string;
  stepText?: string;
  open: boolean;
  onClose: () => void;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Ashi the crochet coach — a small bottom sheet for "I'm stuck on this exact
 * round" questions. The current section/step travels as context so answers
 * are about THIS round, not crochet in general.
 */
export default function CoachChat({ patternId, sectionName, stepText, open, onClose }: CoachChatProps) {
  const [messages, setMessages] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const ask = useMutation({
    mutationFn: async (question: string) => {
      const res = await apiRequest("POST", `/api/patterns/${patternId}/coach`, {
        question,
        history: messages.slice(-6),
        sectionName,
        stepText,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Ashi couldn't answer");
      }
      return res.json() as Promise<{ answer: string }>;
    },
    onSuccess: ({ answer }) => {
      setMessages((m) => [...m, { role: "assistant", content: answer }]);
      setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    },
    onError: (err) => {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Oh no — ${err instanceof Error ? err.message : "something went wrong"}. Try again in a moment?` },
      ]);
    },
  });

  const send = () => {
    const q = input.trim();
    if (!q || ask.isPending) return;
    setMessages((m) => [...m, { role: "user", content: q }]);
    setInput("");
    ask.mutate(q);
    setTimeout(() => listRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex flex-col rounded-t-3xl shadow-2xl"
      style={{ background: palette.cream, borderTop: "1.5px solid rgba(140,100,55,0.2)", maxHeight: "70vh" }}
      role="dialog" aria-label="Ask Ashi">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(140,100,55,0.12)" }}>
        <div className="flex items-center gap-2.5">
          <img src="/characters/char-ashi-transparent.png" alt=""
            style={{ width: 36, height: 36, objectFit: "contain" }}
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
          <div>
            <p className="font-heading font-bold text-[14.5px]" style={{ color: palette.ink }}>Ask Ashi</p>
            <p className="text-[10.5px]" style={{ color: palette.clay }}>
              {sectionName ? `About ${sectionName} — this round` : "Your crochet coach"}
            </p>
          </div>
        </div>
        <button onClick={onClose} aria-label="Close coach"
          className="flex h-9 w-9 items-center justify-center rounded-full hover:opacity-70"
          style={{ background: "rgba(140,100,55,0.08)", color: palette.clay }}>
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5" style={{ minHeight: 140 }}>
        {messages.length === 0 && (
          <div className="text-[12.5px] leading-relaxed p-3 rounded-2xl" style={{ background: "rgba(61,143,163,0.08)", color: "#3D6E7E" }}>
            Stuck on this round? Ask me anything — <em>"what's an invisible decrease?"</em>,{" "}
            <em>"I have 23 stitches instead of 24"</em>, <em>"how do I change colours here?"</em>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i}
            className="max-w-[85%] px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap"
            style={m.role === "user"
              ? { alignSelf: "flex-end", background: palette.rose, color: "white" }
              : { alignSelf: "flex-start", background: "rgba(61,143,163,0.10)", color: "#2F4858" }}>
            {m.content}
          </div>
        ))}
        {ask.isPending && (
          <div className="self-start px-3.5 py-2.5 rounded-2xl text-[13px]" style={{ background: "rgba(61,143,163,0.10)", color: "#3D6E7E" }}>
            Ashi is thinking… 🧶
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-4 pb-[max(0.9rem,env(safe-area-inset-bottom))] pt-2"
        style={{ borderTop: "1px solid rgba(140,100,55,0.12)" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask about this round…"
          aria-label="Your question for Ashi"
          className="flex-1 rounded-full px-4 py-2.5 text-[13px] outline-none"
          style={{ background: "rgba(255,255,255,0.9)", border: "1.5px solid rgba(140,100,55,0.25)", color: palette.ink }}
        />
        <button onClick={send} disabled={!input.trim() || ask.isPending} aria-label="Send"
          className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-40"
          style={{ background: palette.teal, color: "white" }}>
          <Send className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </button>
      </div>
    </div>
  );
}
