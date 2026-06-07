import { ReactNode } from "react";
import { Home, Wand2, BookOpen, Search, Archive } from "lucide-react";
import Sidebar from "./Sidebar";
import { ViewType } from "../lib/types";

interface AppShellProps {
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  rightPanel?: ReactNode;
  children: ReactNode;
}

const TABS = [
  { view: "home"    as ViewType, label: "Home",    Icon: Home },
  { view: "input"   as ViewType, label: "Create",  Icon: Wand2 },
  { view: "library" as ViewType, label: "Library", Icon: BookOpen },
  { view: "search"  as ViewType, label: "Search",  Icon: Search },
  { view: "stash"   as ViewType, label: "Stash",   Icon: Archive },
];

export default function AppShell({ activeView, onNavigate, rightPanel, children }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left sidebar — desktop only */}
      <div className="hidden md:flex h-full">
        <Sidebar activeView={activeView} onNavigate={onNavigate} />
      </div>

      {/* Main + optional right panel */}
      <div className="flex flex-1 min-w-0 overflow-hidden">
        {/* Main content — overflow-hidden so inner screens manage their own scroll */}
        <main className="flex-1 min-w-0 overflow-hidden flex flex-col">
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-1 pt-1 pb-safe"
        style={{
          background: "hsl(var(--sidebar-background))",
          borderTop: "1px solid hsl(var(--sidebar-border))",
          backdropFilter: "blur(12px)",
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
        }}
      >
        {TABS.map((item) => {
          const active = activeView === item.view;
          return (
            <button
              key={item.label}
              onClick={() => onNavigate(item.view)}
              className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl transition-all"
              style={{
                minWidth: 52,
                minHeight: 48,
                color: active ? "#C24E6B" : "#8A6A58",
                padding: "6px 8px",
              }}
            >
              {active && (
                <span
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "rgba(194,78,107,0.10)" }}
                />
              )}
              <item.Icon
                style={{
                  width: 20,
                  height: 20,
                  position: "relative",
                  strokeWidth: active ? 2.2 : 1.8,
                  fill: "none",
                }}
              />
              <span
                className="font-semibold relative"
                style={{ fontSize: 9.5, letterSpacing: "0.01em" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
