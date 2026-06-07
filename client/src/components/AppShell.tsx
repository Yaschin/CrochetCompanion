import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { ViewType } from "../lib/types";

interface AppShellProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  rightPanel?: ReactNode;
  children: ReactNode;
}

export default function AppShell({ activeView, onNavigate, rightPanel, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar — desktop only */}
      <div className="hidden md:flex h-full">
        <Sidebar activeView={activeView} onNavigate={onNavigate} />
      </div>

      {/* Main + optional right panel */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto flex flex-col">
          {children}
        </main>

        {/* Right panel — home screen only, lg+ screens */}
        {rightPanel && (
          <aside
            className="hidden lg:flex flex-col overflow-y-auto flex-shrink-0"
            style={{
              width: 232,
              borderLeft: "1px solid hsl(var(--sidebar-border))",
              background: "hsl(var(--sidebar-background))",
            }}
          >
            {rightPanel}
          </aside>
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: "hsl(var(--sidebar-background))",
          borderTop: "1px solid hsl(var(--sidebar-border))",
          backdropFilter: "blur(12px)",
        }}
      >
        {([
          { view: "home",    label: "Home",    emoji: "🏠" },
          { view: "input",   label: "Create",  emoji: "✨" },
          { view: "library", label: "Library", emoji: "📚" },
          { view: "library", label: "Faves",   emoji: "♡" },
          { view: "stash",   label: "Stash",   emoji: "🧶" },
        ] as { view: ViewType; label: string; emoji: string }[]).map((item) => {
          const active = activeView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
              style={{ color: active ? "#B04060" : "#8A6A58" }}
            >
              <span className="text-lg leading-none">{item.emoji}</span>
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
