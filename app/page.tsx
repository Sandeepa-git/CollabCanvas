"use client";

import {
  FileAudio,
  FileText,
  Link2,
  Mic,
  Send,
  Sparkles,
  ThumbsUp,
  Upload,
  Database,
  Grid,
  CheckCircle,
  Clock,
  Sun,
  Moon
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ColorPalette } from "@/components/ColorPalette";
import { useBoardCollaboration } from "@/hooks/useBoardCollaboration";
import type { AnalysisResult } from "@/lib/types";
import { Footer } from "@/components/Footer";

const starterText = `Maya: The launch story feels stronger with the new visual direction.
Alex: Engineering can finish the API handoff by Friday, but the dashboard export is still a risk.
Priya: Marketing needs three audience hooks and a tighter demo script.
Noah: Design research shows users love the shared mood board idea. Deadline: June 18.`;

type SourceTab = "text" | "file" | "audio";

const ConceptMap = dynamic(() => import("@/components/ConceptMap").then((mod) => mod.ConceptMap), {
  ssr: false,
  loading: () => (
    <div className="h-96 w-full animate-pulse rounded-lg bg-slate-900/30 flex items-center justify-center text-xs text-slate-500 border border-white/5">
      Loading Concept Map...
    </div>
  )
});

const WordCloud = dynamic(() => import("@/components/WordCloud").then((mod) => mod.WordCloud), {
  ssr: false,
  loading: () => (
    <div className="h-80 w-full animate-pulse rounded-lg bg-slate-900/30 flex items-center justify-center text-xs text-slate-500 border border-white/5">
      Loading Theme Cloud...
    </div>
  )
});

export default function Home() {
  const [text, setText] = useState(starterText);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState("");
  const [annotation, setAnnotation] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [sourceType, setSourceType] = useState<AnalysisResult["sourceType"]>("text");
  const [activeTab, setActiveTab] = useState<SourceTab>("text");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [envStatus, setEnvStatus] = useState({
    openRouter: false,
    azureSpeech: false,
    workIQ: false,
    fabricIQ: false,
    foundryIQ: false
  });
  
  const boardRef = useRef<HTMLDivElement>(null);
  const collaboration = useBoardCollaboration(analysis?.id);

  const exportDisabled = !analysis;
  const boardTitle = useMemo(() => analysis?.title ?? "CollabCanvas Mood Board", [analysis?.title]);

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

  // Read URL hash and config status on load
  useEffect(() => {
    // Load config status safely
    fetch("/api/config-status")
      .then((res) => res.json())
      .then((data) => {
        setEnvStatus({
          openRouter: !!data.openRouter,
          azureSpeech: !!data.azureSpeech,
          workIQ: !!data.workIQ,
          fabricIQ: !!data.fabricIQ,
          foundryIQ: !!data.foundryIQ
        });
      })
      .catch(() => {});

    const hash = window.location.hash.replace(/^#board=/, "");
    if (!hash) {
      return;
    }

    try {
      const decoded = JSON.parse(decodeBoard(hash)) as AnalysisResult;
      setAnalysis(decoded);
    } catch {
      setError("This shared board link could not be opened.");
    }
  }, []);

  async function analyze() {
    setIsLoading(true);
    setError("");
    setShareUrl("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sourceType })
      });

      if (!response.ok) {
        throw new Error("Analysis failed.");
      }

      const payload = (await response.json()) as AnalysisResult;
      setAnalysis(payload);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTextFile(file: File) {
    setSourceType("file");
    const contents = await file.text();

    if (file.name.endsWith(".json")) {
      try {
        const parsed = JSON.parse(contents) as unknown;
        setText(JSON.stringify(parsed, null, 2));
        return;
      } catch {
        setError("JSON file could not be parsed, so its raw text was loaded.");
      }
    }

    setText(contents);
  }

  async function transcribeAudio(file: File) {
    setIsTranscribing(true);
    setError("");
    setSourceType("audio");

    try {
      const formData = new FormData();
      formData.append("audio", file);
      const response = await fetch("/api/transcribe", { method: "POST", body: formData });
      const payload = (await response.json()) as { text?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Transcription failed.");
      }

      setText((current) => `${current.trim()}\n\n${payload.text ?? ""}`.trim());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Audio transcription failed.");
    } finally {
      setIsTranscribing(false);
    }
  }



  function createShareLink() {
    if (!analysis) {
      return;
    }

    const encoded = encodeBoard(JSON.stringify({ ...analysis, annotations: collaboration.annotations, votes: collaboration.votes }));
    const url = `${window.location.origin}${window.location.pathname}#board=${encoded}`;
    setShareUrl(url);
    void navigator.clipboard?.writeText(url);
  }

  // Calculate Sentiment Score percentage for gauge
  const sentimentScorePct = useMemo(() => {
    if (!analysis) return 50;
    return Math.round(((analysis.sentimentScore + 1) / 2) * 100);
  }, [analysis]);

  // Styling helpers based on light/dark mode theme
  const isDark = theme === "dark";
  const bgClass = "bg-[var(--background)] text-[var(--text-primary)]";
  const panelClass = "premium-card p-6 border-[var(--border)] text-[var(--text-primary)]";
  const textHeadingClass = "text-[var(--text-primary)]";
  const borderClass = "border-[var(--border)]";
  const buttonSecondaryClass = "bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-all";
  const codeBoxClass = "bg-[var(--background)] border border-[var(--border)] rounded-lg";

  return (
    <div className={`min-h-screen relative overflow-hidden bg-[var(--background)] text-[var(--text-primary)] transition-colors duration-300`}>
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
              <span className="text-sm font-semibold text-blue-500 border-b-2 border-blue-500 py-5">Workspace</span>
              <Link href="/dashboard" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">History Gallery</Link>
            </div>

            {/* Theme switcher, share link, and system status indicators */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <Link 
                href="/dashboard" 
                className="md:hidden inline-flex items-center justify-center h-9 px-3 text-xs font-bold rounded-lg border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Gallery
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Workspace Container */}
      <div className="mx-auto max-w-[1400px] flex flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Premium SaaS Hero Section */}
        <header className="flex flex-col gap-3 text-center max-w-3xl mx-auto py-4">
          <h2 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[var(--text-primary)] mt-2 transition-colors">
            Synthesize Notes into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-400">Creative Boards</span>
          </h2>
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-xl mx-auto mt-2 transition-colors">
            Turn unstructured collaboration logs and voice transcripts into interactive concept maps, theme clouds, and semantic vector details in real-time.
          </p>
        </header>

        {/* Workspace Columns */}
        <section className="grid gap-6 lg:grid-cols-[430px_1fr]">

          {/* Runtime Integration Status */}
          <div className="lg:col-span-2 hidden flex-wrap gap-3 justify-center">
            {[
              { label: "OpenRouter", ready: envStatus.openRouter },
              { label: "Azure Speech", ready: envStatus.azureSpeech },
              { label: "Work IQ", ready: envStatus.workIQ },
              { label: "Fabric IQ", ready: envStatus.fabricIQ },
              { label: "Foundry IQ", ready: envStatus.foundryIQ }
            ].map((item) => (
              <span
                key={item.label}
                className={`rounded-full border px-3 py-1 text-xxs font-bold uppercase tracking-wide ${
                  item.ready
                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
                    : "border-rose-500/25 bg-rose-500/10 text-rose-300"
                }`}
              >
                {item.label}: {item.ready ? "Ready" : "Disabled"}
              </span>
            ))}
          </div>

          {/* Left Column: Input Panel */}
          <div className={`${panelClass} flex flex-col gap-5 relative`}>
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-secondary)]">Input Source</h2>
              <span className="rounded-full bg-teal-500/10 border border-teal-500/20 px-2.5 py-0.5 text-xxs font-extrabold tracking-wide uppercase text-teal-400">
                Active: {sourceType}
              </span>
            </div>

            {/* Premium Tab Bar */}
            <div className={`grid grid-cols-3 rounded-lg p-1 border ${codeBoxClass}`}>
              <button
                onClick={() => { setActiveTab("text"); setSourceType("text"); }}
                className={`flex items-center justify-center gap-1.5 rounded py-2 text-xs font-bold transition ${
                  activeTab === "text" 
                    ? "bg-teal-500 text-slate-950" 
                    : (isDark ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-black")
                }`}
              >
                <FileText size={14} />
                Text
              </button>
              <button
                onClick={() => { setActiveTab("file"); setSourceType("file"); }}
                className={`flex items-center justify-center gap-1.5 rounded py-2 text-xs font-bold transition ${
                  activeTab === "file" 
                    ? "bg-teal-500 text-slate-950" 
                    : (isDark ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-black")
                }`}
              >
                <Upload size={14} />
                File
              </button>
              <button
                onClick={() => { setActiveTab("audio"); setSourceType("audio"); }}
                className={`flex items-center justify-center gap-1.5 rounded py-2 text-xs font-bold transition ${
                  activeTab === "audio" 
                    ? "bg-teal-500 text-slate-950" 
                    : (isDark ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-black")
                }`}
              >
                <Mic size={14} />
                Audio
              </button>
            </div>

            {/* Dynamic input components depending on active tab */}
            {activeTab === "text" && (
              <div className="flex flex-col gap-2">
                <label htmlFor="meeting-text" className="text-xs font-bold text-[var(--text-secondary)]">
                  Paste collaborative notes / chat transcripts:
                </label>
                <textarea
                  id="meeting-text"
                  value={text}
                  onChange={(event) => {
                    setSourceType("text");
                    setText(event.target.value);
                  }}
                  placeholder="Paste meeting text or logs here..."
                  className={`h-72 w-full resize-none rounded-xl border p-4 text-sm leading-relaxed outline-none ring-teal-500 focus:ring-1 ${
                    isDark 
                      ? "bg-slate-950/40 border-white/10 text-white focus:border-teal-500" 
                      : "bg-slate-50 border-slate-200 text-black focus:border-teal-500"
                  }`}
                />
              </div>
            )}

            {activeTab === "file" && (
              <div className={`flex flex-col justify-center items-center h-72 border-2 border-dashed rounded-xl p-6 text-center hover:border-teal-500/40 transition ${
                isDark ? "border-white/10 bg-slate-950/20" : "border-slate-200 bg-slate-50/50"
              }`}>
                <Upload className="text-slate-500 mb-3" size={32} />
                <p className="text-sm font-bold">Upload chat transcript</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[200px]">Supports structured JSON, plain TXT files</p>
                <label className={`mt-5 cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition ${buttonSecondaryClass}`}>
                  Select File
                  <input
                    type="file"
                    accept=".txt,.json,application/json,text/plain"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void loadTextFile(file);
                      }
                    }}
                  />
                </label>
                {sourceType === "file" && (
                  <p className="text-xxs text-teal-400 font-semibold mt-3 max-w-[280px] truncate">
                    Loaded text from file
                  </p>
                )}
              </div>
            )}

            {activeTab === "audio" && (
              <div className={`flex flex-col justify-center items-center h-72 border-2 border-dashed rounded-xl p-6 text-center hover:border-teal-500/40 transition ${
                isDark ? "border-white/10 bg-slate-950/20" : "border-slate-200 bg-slate-50/50"
              }`}>
                {isTranscribing ? (
                  <Mic className="text-pink-500 animate-pulse mb-3" size={32} />
                ) : (
                  <FileAudio className="text-slate-500 mb-3" size={32} />
                )}
                <p className="text-sm font-bold">Transcribe audio logs</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-[200px]">Processes audio files using Azure Speech Service</p>
                <label className={`mt-5 cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition ${buttonSecondaryClass}`}>
                  {isTranscribing ? "Transcribing..." : "Choose Audio File"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    disabled={isTranscribing}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void transcribeAudio(file);
                      }
                    }}
                  />
                </label>
                {sourceType === "audio" && (
                  <p className="text-xxs text-teal-400 font-semibold mt-3">
                    Audio added. Ready for analysis.
                  </p>
                )}
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={analyze}
              disabled={isLoading || isTranscribing || !text.trim()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-3.5 font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? <Sparkles className="animate-spin" size={17} /> : <Send size={17} />}
              {isLoading ? "Ensemble Analyzing..." : "Generate Mood Board"}
            </button>

            {analysis ? (
              <button
                type="button"
                onClick={createShareLink}
                disabled={isLoading}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 px-4 py-3.5 text-sm font-bold text-teal-400 transition hover:bg-teal-500/15 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Link2 size={16} />
                Copy Share Link
              </button>
            ) : null}

            {error ? (
              <p className="rounded-lg bg-rose-500/10 border border-rose-500/15 p-3 text-xs font-bold text-rose-400">
                {error}
              </p>
            ) : null}
            {shareUrl ? (
              <p className="rounded-lg bg-teal-500/10 border border-teal-500/15 p-3 text-xxs break-all text-teal-400">
                Share Link Copied: {shareUrl}
              </p>
            ) : null}
          </div>

          {/* Right Column: Visual Mood Board Canvas */}
          <div ref={boardRef} className={`rounded-2xl border p-4 min-h-[640px] relative flex flex-col gap-6 ${
            isDark ? "bg-slate-900/30 border-white/5" : "bg-slate-100/30 border-slate-200"
          }`}>
            
            {isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center min-h-[600px] z-50">
                <div className="relative h-16 w-16 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-teal-500/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-teal-400 animate-spin" />
                </div>
                <h3 className="text-xl font-extrabold text-[var(--text-primary)]">Synthesizing Creative Canvas</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2">Running ensemble parsing & semantic calculations...</p>
                <div className="mt-6 flex flex-col gap-2 items-start w-56 text-xxs font-semibold text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                    <CheckCircle size={12} />
                    Connecting to backend nodes
                  </div>
                  <div className="flex items-center gap-2 text-emerald-500 dark:text-emerald-400">
                    <CheckCircle size={12} />
                    Invoking OpenRouter
                  </div>
                  <div className="flex items-center gap-2 text-[var(--text-primary)] animate-pulse">
                    <Clock size={12} />
                    Merging and mapping nodes...
                  </div>
                </div>
              </div>
            ) : analysis ? (
              <div
                className="flex flex-col gap-6"
                style={
                  analysis.backgroundImageUrl
                    ? {
                        backgroundImage: isDark
                          ? `linear-gradient(rgba(15,23,42,0.92), rgba(15,23,42,0.92)), url(${analysis.backgroundImageUrl})`
                          : `linear-gradient(rgba(248,250,252,0.92), rgba(248,250,252,0.92)), url(${analysis.backgroundImageUrl})`,
                        backgroundSize: "cover",
                        borderRadius: 12
                      }
                    : undefined
                }
              >
                {/* 1. Summary & Sentiment Panel */}
                <div className={`rounded-xl p-6 flex flex-col md:flex-row items-stretch justify-between gap-6 ${panelClass}`}>
                  <div className="flex-1 flex flex-col gap-2">
                    <span className="text-xxs font-extrabold uppercase tracking-wider text-teal-400">AI Synthesized Executive Summary</span>
                    <p className="text-lg font-bold leading-relaxed">
                      {analysis.summary}
                    </p>
                  </div>
                  
                  {/* Sentiment Gauge */}
                  <div className={`md:w-60 rounded-xl p-4 border flex flex-col justify-between ${
                    isDark ? "bg-slate-950/45 border-white/5" : "bg-slate-50 border-slate-200"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xxs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">Sentiment Score</span>
                        <span className={`text-xs font-black uppercase ${
                          analysis.sentiment === "positive" ? "text-emerald-400" :
                          analysis.sentiment === "negative" ? "text-rose-400" : "text-slate-400"
                        }`}>
                          {analysis.sentiment}
                        </span>
                      </div>
                      <p className={`text-2xl font-black mt-1 ${textHeadingClass}`}>
                        {analysis.sentimentScore > 0 ? "+" : ""}{analysis.sentimentScore.toFixed(2)}
                      </p>
                    </div>

                    <div className="mt-3">
                      <div className="h-2 w-full bg-slate-900/80 rounded-full overflow-hidden border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            analysis.sentiment === "positive" ? "bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_8px_rgba(20,184,166,0.5)]" :
                            analysis.sentiment === "negative" ? "bg-gradient-to-r from-orange-400 to-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" :
                            "bg-slate-500"
                          }`}
                          style={{ width: `${sentimentScorePct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xxs text-slate-600 dark:text-slate-300 mt-1 font-bold">
                        <span>Negative</span>
                        <span>Neutral</span>
                        <span>Positive</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Map & Word Cloud */}
                <div className="grid gap-6 xl:grid-cols-2">
                  <WordCloud themes={analysis.themes} colors={analysis.palette} theme={theme} />
                  <ConceptMap analysis={analysis} theme={theme} />
                </div>

                {/* 3. Sentiment Colors */}
                <ColorPalette colors={analysis.palette} sentiment={analysis.sentiment} />

                {/* 4. Details row */}
                <div className="grid gap-6 lg:grid-cols-3">
                  <InfoPanel
                    title="Work Context (Work IQ)"
                    items={[
                      `Participants: ${Array.isArray(analysis.workIQ?.participants) ? analysis.workIQ.participants.join(", ") : "No records"}`,
                      `Deadlines: ${Array.isArray(analysis.workIQ?.deadlines) ? analysis.workIQ.deadlines.join(", ") : "None"}`,
                      `Topics: ${Array.isArray(analysis.workIQ?.topics) ? analysis.workIQ.topics.join(", ") : "None"}`
                    ]}
                    theme={theme}
                  />
                  <InfoPanel
                    title="Domain Clusters (Fabric IQ)"
                    items={Object.entries(analysis.fabricIQGroups || {}).map(
                      ([group, values]) => `${group}: ${Array.isArray(values) ? values.join(", ") : String(values || "None")}`
                    )}
                    theme={theme}
                  />
                  
                  {/* Realtime collaboration chat-feed style */}
                  <div className={`rounded-xl p-5 flex flex-col justify-between ${panelClass}`}>
                    <div>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400">Collaboration Feed</h2>
                      <p className="text-xxs text-slate-600 dark:text-slate-300 mt-0.5">Annotate & upvote key themes in realtime</p>

                      {/* Vote Buttons / Static Tags on Export */}
                      <div className="mt-3 flex flex-wrap gap-1.5 max-h-[88px] overflow-y-auto pr-1">
                        {analysis.themes.slice(0, 5).map((themeObj) => (
                          <button
                            key={themeObj.label}
                            onClick={() => collaboration.vote(themeObj.label)}
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                              isDark
                                ? "bg-slate-950/40 hover:bg-slate-950/80 border-white/10 hover:border-teal-500/20 text-white"
                                : "bg-slate-50 hover:bg-slate-100 border-slate-200/80 hover:border-teal-500/30 text-black"
                            }`}
                          >
                            <ThumbsUp size={12} className="text-teal-400" />
                            <span className="truncate max-w-[70px]">{themeObj.label}</span>
                            <span className="rounded bg-teal-500/10 px-1 py-0.2 text-xxs font-extrabold text-teal-400">
                              {collaboration.votes[themeObj.label] ?? 0}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Chat Input & Output list */}
                    <div className="mt-4 border-t border-white/5 pt-4">
                      <div className="flex gap-2">
                        <input
                          value={annotation}
                          onChange={(event) => setAnnotation(event.target.value)}
                          placeholder="Annotate this canvas..."
                          className={`min-w-0 flex-1 rounded-lg border px-3 py-2 text-xs outline-none ring-teal-500 focus:ring-1 ${
                            isDark
                              ? "bg-slate-950/50 border-white/10 text-white focus:border-teal-500/50"
                              : "bg-slate-50 border-slate-200 text-black focus:border-teal-500/30"
                          }`}
                        />
                        <button
                          onClick={() => {
                            collaboration.addAnnotation(annotation);
                            setAnnotation("");
                          }}
                          className="rounded-lg bg-teal-500 hover:bg-teal-400 px-3 py-2 text-xs font-bold text-slate-950 transition"
                        >
                          Send
                        </button>
                      </div>
                      <div className="mt-3 space-y-1.5 pr-1 max-h-[110px] overflow-y-auto">
                        {collaboration.annotations.map((item, idx) => (
                          <div key={idx} className={`flex gap-2 items-start rounded-lg border p-2.5 ${
                            isDark ? "bg-slate-950/30 border-white/5" : "bg-slate-50 border-slate-100"
                          }`}>
                            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-xxs font-black text-white shrink-0">
                              U
                            </div>
                            <p className={`text-xs leading-normal ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                              {item}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Semantic Clusters and Foundry IQ Grounded Context */}
                <div className="grid gap-6 md:grid-cols-2">
                  <InfoPanel
                    title="Semantic Vector Details"
                    items={[
                      ...Object.entries(analysis.semanticClusters ?? {}).map(
                        ([cluster, values]) => `${cluster}: ${Array.isArray(values) ? values.join(", ") : String(values || "")}`
                      ),
                      analysis.embeddings
                        ? `Embedding vector powered by ${analysis.embeddings.model} (${analysis.embeddings.dimensions} dimensions)`
                        : "Embedding vector: Fallback loaded"
                    ]}
                    theme={theme}
                  />

                  {analysis.foundryIQ ? (
                    <div className={`rounded-xl p-5 border ${
                      isDark ? "glass-panel border-white/10 bg-slate-900/70" : "bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
                    }`}>
                      <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400">Foundry IQ Grounded Context</h2>
                      <div className="mt-4 p-3 rounded-lg border border-teal-500/10 bg-teal-500/5 text-xs text-[var(--text-secondary)] leading-relaxed">
                        <span className="font-extrabold text-[var(--text-primary)] block mb-1">Grounded Synthesis:</span>
                        {analysis.foundryIQ.answer}
                      </div>
                      <h3 className="text-xxs font-extrabold uppercase tracking-wide text-slate-400 mt-4 mb-2">Cited Sources</h3>
                      <ul className="space-y-2 pr-1 max-h-[140px] overflow-y-auto">
                        {analysis.foundryIQ.citations.map((cite, idx) => (
                          <li key={idx} className={`rounded-lg border p-2.5 text-xxs leading-relaxed ${
                            isDark ? "bg-slate-950/30 border-white/5 text-slate-100" : "bg-slate-50 border-slate-100 text-slate-800"
                          }`}>
                            <span className="font-black text-[var(--text-primary)] block">{cite.title}</span>
                            <span className="text-blue-500 dark:text-blue-400 block font-semibold text-[10px] mt-0.5">{cite.source}</span>
                            <p className="mt-1 text-slate-400 dark:text-slate-300 italic">&quot;{cite.snippet}&quot;</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              // Empty Welcome State
              <div className={`flex-1 grid place-items-center rounded-xl border border-dashed p-8 text-center relative overflow-hidden ${
                isDark ? "border-white/10 bg-slate-950/20" : "border-slate-300 bg-white"
              }`}>
                <div className="relative z-10 max-w-sm">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 mb-4 animate-bounce">
                    <Sparkles size={24} />
                  </div>
                  <h3 className={`text-xl font-extrabold ${textHeadingClass}`}>Your Canvas is Ready</h3>
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    Insert your collaborative logs, upload team conversations, or record audio transcripts to generate a gorgeous interactive concept mood board with semantic layers.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}

function StatusItem({ label, active, tooltip, theme }: { label: string; active: boolean; tooltip?: string; theme: "dark" | "light" }) {
  const isDark = theme === "dark";
  return (
    <div 
      className={`flex items-center gap-1.5 rounded border px-2 py-1 ${
        isDark ? "bg-slate-950/40 border-white/5" : "bg-slate-50 border-slate-200"
      }`} 
      title={tooltip}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-slate-400"}`} />
      <span className={active ? (isDark ? "text-slate-200" : "text-slate-700") : "text-slate-400"}>{label}</span>
    </div>
  );
}

function encodeBoard(value: string) {
  const bytes = new TextEncoder().encode(value);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return encodeURIComponent(btoa(binary));
}

function decodeBoard(value: string) {
  const binary = atob(decodeURIComponent(value));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function InfoPanel({ title, items, theme }: { title: string; items: string[]; theme: "dark" | "light" }) {
  const isDark = theme === "dark";
  return (
    <div className={`rounded-xl p-5 border ${
      isDark ? "glass-panel border-white/10 bg-slate-900/70" : "bg-white border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
    }`}>
      <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400">{title}</h2>
      <ul className="mt-4 space-y-2 pr-1 max-h-[220px] overflow-y-auto">
        {items.map((item, idx) => (
          <li key={idx} className={`rounded-lg border p-3 text-xs leading-relaxed ${
            isDark ? "bg-slate-950/30 border-white/5 text-slate-100" : "bg-slate-50 border-slate-100 text-slate-800"
          }`}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
