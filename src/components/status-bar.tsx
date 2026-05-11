import { Cpu, Database } from "lucide-react";

export function StatusBar({ topicCount }: { topicCount: number }) {
  return (
    <footer className="h-7 border-t border-border bg-bg flex items-center px-3 text-[11px] font-mono font-semibold uppercase tracking-wider text-text-subtle gap-4">
      <div className="flex items-center gap-1.5">
        <Cpu className="w-3 h-3 text-accent" strokeWidth={2.5} />
        <span className="text-text">COWORK</span>
        <span className="text-accent">v0.1</span>
      </div>

      <Divider />

      <div className="flex items-center gap-1.5">
        <Database className="w-3 h-3 text-accent" />
        <span className="text-text-subtle">DB</span>
        <span className="text-text">SQLite · local</span>
      </div>

      <Divider />

      <div className="flex items-center gap-1.5">
        <span className="text-text-subtle">TOPICS</span>
        <span className="text-text">{topicCount}</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <kbd>⌘K</kbd>
          <span className="text-text-subtle">palette</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd>⌘N</kbd>
          <span className="text-text-subtle">new</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_6px_var(--accent)] pulse-dot" />
          <span className="text-accent">READY</span>
        </span>
      </div>
    </footer>
  );
}

function Divider() {
  return <span className="text-border-strong">·</span>;
}
