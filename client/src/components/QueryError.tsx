import { CloudOff, RefreshCw } from "lucide-react";

interface QueryErrorProps {
  /** Called when the user taps "Try again" — wire to the query's `refetch`. */
  onRetry?: () => void;
  title?: string;
  message?: string;
  /** Show a spinning icon + "Retrying…" while a refetch is in flight. */
  isRetrying?: boolean;
  /** `compact` for in-list errors; default fills the available height. */
  compact?: boolean;
}

/**
 * Friendly, consistent failure state for data screens. Without this, a failed
 * fetch falls through to React Query's `data = []` default and renders the
 * *empty* state — so "the server is unreachable" looks identical to "you have
 * nothing here." This makes the difference explicit and offers a retry.
 */
export function QueryError({
  onRetry,
  title = "Couldn't load",
  message = "We couldn't reach the server. Check your connection and try again.",
  isRetrying = false,
  compact = false,
}: QueryErrorProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-4 px-6 ${compact ? "py-12" : "h-full"}`}
      role="alert"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(194,78,107,0.10)" }}
      >
        <CloudOff className="h-8 w-8" style={{ color: "#C24E6B" }} />
      </div>
      <div>
        <p className="font-heading font-bold text-[18px]" style={{ color: "#3D2318" }}>
          {title}
        </p>
        <p className="text-[13px] mt-1 max-w-[260px] mx-auto" style={{ color: "#9A7868" }}>
          {message}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 rounded-full px-5 py-2.5 font-heading font-bold text-[13px] transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{
            background: "linear-gradient(135deg, #C24E6B, #A83050)",
            color: "white",
            boxShadow: "0 4px 16px rgba(194,78,107,0.30)",
          }}
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? "animate-spin" : ""}`} />
          {isRetrying ? "Retrying…" : "Try again"}
        </button>
      )}
    </div>
  );
}
