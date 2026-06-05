"use client";

import { Calendar, FileText, Search, ArrowLeft, Sun, Moon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { BoardRecord, Sentiment } from "@/lib/types";
import { Footer } from "@/components/Footer";

type BoardDashboardProps = {
  initialBoards: BoardRecord[];
};

const sentiments: Array<Sentiment | "all"> = ["all", "positive", "neutral", "negative"];

function encodeBoard(value: string) {
  if (typeof window === "undefined") return "";
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return encodeURIComponent(btoa(binary));
}

export function BoardDashboard({ initialBoards }: BoardDashboardProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [query, setQuery] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | "all">("all");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Load and sync theme
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "dark" | "light" | null;
    const initial = saved || "dark";
    setTheme(initial);
    if (initial === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      if (next === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (sentiment !== "all") {
      params.set("sentiment", sentiment);
    }

    fetch(`/api/boards?${params.toString()}`)
      .then((response) => response.json())
      .then((data: { boards: BoardRecord[] }) => setBoards(data.boards))
      .catch(() => setBoards(initialBoards));
  }, [initialBoards, query, sentiment]);

  const counts = useMemo(
    () => ({
      total: boards.length,
      positive: boards.filter((board) => board.sentiment === "positive").length,
      neutral: boards.filter((board) => board.sentiment === "neutral").length,
      negative: boards.filter((board) => board.sentiment === "negative").length
    }),
    [boards]
  );
  return (
    <div className={`bg-[var(--background)] text-[var(--text-primary)] min-h-screen relative overflow-hidden transition-colors duration-300`}>
      {/* Ambient Pulsing Background Glows */}
      <div className="ambient-glow glow-1" />
      <div className="ambient-glow glow-2" />

      {/* Sticky Premium Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-black text-sm">C</span>
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white select-none transition-colors">
                CollabCanvas <span className="text-blue-500 font-medium">Pro</span>
              </span>
            </div>

            {/* Navigation links */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Workspace</Link>
              <span className="text-sm font-semibold text-blue-500 border-b-2 border-blue-500 py-5">History Gallery</span>
            </div>

            {/* Theme switcher & actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link 
                href="/" 
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-500 px-4 py-2 text-xs font-bold text-white transition-all shadow-sm"
              >
                <ArrowLeft size={14} />
                Workspace
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Gallery Container */}
      <div className="mx-auto max-w-[1400px] flex flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <header className="flex flex-col gap-2 py-4">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-500">History Directory</p>
          <h2 className="text-3xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight transition-colors">
            CollabCanvas Gallery
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">Browse and restore previous AI-generated mood board workspaces.</p>
        </header>

        {/* Stats Section */}
        <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {Object.entries(counts).map(([label, value]) => {
            let textColor = "text-blue-500";
            if (label === "positive") textColor = "text-emerald-500";
            if (label === "neutral") textColor = "text-slate-500";
            if (label === "negative") textColor = "text-rose-500";

            return (
              <div
                key={label}
                className="premium-card p-5 border-[var(--border)] shadow-[var(--shadow-sm)]"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] capitalize">{label}</p>
                <p className={`mt-3 text-4xl font-extrabold tracking-tight ${textColor}`}>{value}</p>
              </div>
            );
          })}
        </section>

        {/* Search & Filters */}
        <section className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 md:flex-row md:items-center">
          <label className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search history by title, keywords, or summaries..."
              className="w-full premium-input py-2.5 pl-11 pr-4 text-sm"
            />
          </label>
          <div className="flex rounded-lg border border-[var(--border)] bg-[var(--background)] p-1">
            {sentiments.map((option) => (
              <button
                key={option}
                onClick={() => setSentiment(option)}
                className={`rounded-md px-4 py-1.5 text-xs font-bold tracking-wide transition capitalize ${
                  sentiment === option ? "bg-blue-600 text-white shadow" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        {/* Boards Grid */}
        <section className="grid gap-6 md:grid-cols-2">
          {boards.map((board) => (
            <Link
              href={`/#board=${encodeBoard(JSON.stringify(board.analysis))}`}
              key={board.id}
              className="block group"
              title="Click to restore this board in the workspace"
            >
              <article className="premium-card p-6 border-[var(--border)] flex flex-col justify-between h-full hover:border-blue-500 cursor-pointer">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">
                        {board.title}
                      </h2>
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <Calendar size={13} />
                        {new Date(board.createdAt).toLocaleString()} ·
                        <span className="capitalize">{board.sourceType}</span>
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide border ${
                        board.sentiment === "positive"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : board.sentiment === "negative"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                          : "bg-slate-500/10 border-slate-500/20 text-slate-500"
                      }`}
                    >
                      {board.sentiment}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)] line-clamp-3">
                    {board.summary}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap gap-1.5 pt-4 border-t border-[var(--border)]">
                  {board.topics.slice(0, 5).map((topic) => (
                    <span
                      key={topic}
                      className="rounded bg-blue-500/10 border border-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-500 transition-colors"
                    >
                      {topic}
                    </span>
                  ))}
                  {board.topics.length > 5 ? (
                    <span className="text-xs text-[var(--text-secondary)] font-bold self-center">
                      +{board.topics.length - 5} more
                    </span>
                  ) : null}
                </div>
              </article>
            </Link>
          ))}
        </section>

        {!boards.length ? (
          <div className="premium-card border-dashed border-[var(--border)] p-12 text-center bg-[var(--bg-secondary)]">
            <FileText className="mx-auto text-[var(--text-secondary)]" size={40} />
            <p className="mt-4 text-lg font-bold text-[var(--text-primary)]">No boards matching criteria</p>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-sm mx-auto">
              Generate a board from your notes or load a different filter to display records here.
            </p>
          </div>
        ) : null}
      </div>
      <Footer />
    </div>
  );
}
