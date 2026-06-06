"use client";

import { useEffect, useState } from "react";
import { Github, Linkedin, CheckCircle2, XCircle, Activity } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const [envStatus, setEnvStatus] = useState({
    openRouter: false,
    azureSpeech: false,
    workIQ: false,
    fabricIQ: false,
    foundryIQ: false
  });

  useEffect(() => {
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
  }, []);

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md transition-colors duration-300 relative z-10 pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <span className="text-white font-black text-xs">C</span>
              </div>
              <span className="text-md font-black tracking-tight text-slate-900 dark:text-white transition-colors">
                CollabCanvas <span className="text-blue-500 font-medium">Pro</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-xs">
              Enterprise AI collaboration mood boards and semantic analysis for team notes, transcripts, and voice logs.
            </p>
          </div>

          {/* Platform Navigation */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Platform
            </h4>
            <div className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)]">
              <Link href="/" className="hover:text-[var(--text-primary)] transition-colors">
                Workspace
              </Link>
              <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">
                History Gallery
              </Link>
              <span className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                Concept Mapping
              </span>
              <span className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">
                Theme Cloud
              </span>
            </div>
          </div>

          {/* Connections / API Indicators */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Activity size={14} className="text-blue-500" />
              Active Connections
            </h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs">
                {envStatus.openRouter ? (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={13} className="text-rose-500 shrink-0" />
                )}
                <span className="text-[var(--text-secondary)]">
                  OpenRouter
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {envStatus.azureSpeech ? (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={13} className="text-rose-500 shrink-0" />
                )}
                <span className="text-[var(--text-secondary)]">
                  Azure Speech
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {envStatus.foundryIQ ? (
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                ) : (
                  <XCircle size={13} className="text-rose-500 shrink-0" />
                )}
                <span className="text-[var(--text-secondary)]">
                  Foundry IQ
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="text-[var(--text-secondary)]">
                  Embeddings
                </span>
              </div>
            </div>
          </div>

          {/* Social Profiles */}
          <div className="flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Social Profiles
            </h4>
            <div className="flex flex-col gap-3">
              <a
                href="https://github.com/Sandeepa-git"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Github size={14} />
                <span>GitHub Profile</span>
              </a>
              <a
                href="https://www.linkedin.com/in/sandeepa-wimalasiri/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <Linkedin size={14} />
                <span>LinkedIn Profile</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[var(--border)] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[var(--text-secondary)]">
            © {new Date().getFullYear()} CollabCanvas. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[var(--text-secondary)]">
            <span className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">Security Standards</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
