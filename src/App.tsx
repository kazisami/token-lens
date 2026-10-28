/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { TokenStep, AnalysisResponse } from './types';
import {
  Sparkles,
  Send,
  Loader2,
  Cpu,
  Clock,
  Sliders,
  Thermometer,
  Layers,
  ChevronDown,
  Zap,
  CornerDownRight,
} from 'lucide-react';

export default function App() {
  const [prompt, setPrompt] = useState<string>('The capital of France is ');
  const [analyzedPrompt, setAnalyzedPrompt] = useState<string>('The capital of France is ');
  const [steps, setSteps] = useState<TokenStep[]>([]);
  const [modelUsed, setModelUsed] = useState<string>('gemini-2.5-flash');
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Parameters
  const [maxTokens, setMaxTokens] = useState<number>(10);
  const [temperature, setTemperature] = useState<number>(1.0);
  const [topK, setTopK] = useState<number>(40);

  // Popover state for 3 param buttons
  const [openParam, setOpenParam] = useState<'tokens' | 'temp' | 'topK' | null>(null);

  // Hovered token index for alternatives popover
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for closing popovers on outside click
  const paramBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (paramBarRef.current && !paramBarRef.current.contains(event.target as Node)) {
        setOpenParam(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch token probabilities from Gemini API
  const fetchResponse = async (textToAnalyze?: string) => {
    const text = textToAnalyze !== undefined ? textToAnalyze : prompt;
    if (!text.trim()) return;

    setAnalyzedPrompt(text);
    setOpenParam(null);
    setHoveredIdx(null);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/analyze-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          maxTokens,
          temperature,
          topK,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error (${res.status})`);
      }

      const data: AnalysisResponse = await res.json();
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
        setModelUsed(data.modelUsed || 'gemini-2.5-flash');
        setDurationMs(data.durationMs || null);
      } else {
        throw new Error('No token logprobs returned by Gemini API.');
      }
    } catch (err: any) {
      console.error('Error fetching token probabilities:', err);
      setError(err?.message || 'Failed to call Gemini API.');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchResponse('The capital of France is ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Branch and regenerate upon selecting a token (original or alternative)
  const handleSelectToken = (stepIndex: number, chosenTokenString: string) => {
    // Collect all tokens strictly before this step (0 up to stepIndex - 1)
    const priorTokens = steps.slice(0, stepIndex).map((s) => s.selectedToken).join('');

    // Construct new prompt: original analyzedPrompt + prior tokens + chosen token
    const newPrompt = analyzedPrompt + priorTokens + chosenTokenString;

    setPrompt(newPrompt);
    setHoveredIdx(null);
    fetchResponse(newPrompt);
  };

  // Helper styling for confidence level
  const getTokenConfidenceStyle = (p: number) => {
    if (p >= 0.8) {
      return {
        bg: 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/40 text-emerald-800 shadow-emerald-500/10',
        badge: 'bg-emerald-500 text-white',
        dot: 'bg-emerald-500',
        bar: 'bg-emerald-500',
        label: 'Very High (≥80%)',
      };
    }
    if (p >= 0.5) {
      return {
        bg: 'bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/40 text-sky-800 shadow-sky-500/10',
        badge: 'bg-sky-500 text-white',
        dot: 'bg-sky-500',
        bar: 'bg-sky-500',
        label: 'High (50–79%)',
      };
    }
    if (p >= 0.25) {
      return {
        bg: 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-900 shadow-amber-500/10',
        badge: 'bg-amber-500 text-white',
        dot: 'bg-amber-500',
        bar: 'bg-amber-500',
        label: 'Moderate (25–49%)',
      };
    }
    return {
      bg: 'bg-rose-500/15 hover:bg-rose-500/25 border-rose-500/40 text-rose-900 shadow-rose-500/10',
      badge: 'bg-rose-500 text-white',
      dot: 'bg-rose-500',
      bar: 'bg-rose-500',
      label: 'Low (<25%)',
    };
  };

  // Clean mouse enter / leave with small grace timeout so user can comfortably mouse into tooltip
  const handleMouseEnter = (idx: number) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredIdx(idx);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredIdx(null);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-50/80 bg-radial-glow text-slate-900 font-sans flex flex-col selection:bg-blue-500/20 selection:text-blue-900 relative overflow-x-hidden">
      {/* Subtle decorative glow circles in background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-b from-blue-400/10 via-indigo-300/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Modern Frosted Header */}
      <header className="backdrop-blur-md bg-white/75 border-b border-slate-200/80 px-6 py-3.5 sticky top-0 z-30 shadow-xs transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3 group cursor-default">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 bg-clip-text text-transparent">
                  TokenLens
                </h1>
                <span className="text-[10px] font-bold font-mono tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60">
                  Interactive Token Stream
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 border border-slate-200 text-xs font-mono text-slate-700 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Cpu className="w-3.5 h-3.5 text-blue-600 ml-0.5" />
              <span className="font-semibold">{modelUsed.replace(/\s*\(.*?\)\s*/g, '').trim()}</span>
            </div>
            {durationMs && (
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-mono px-2 py-1 rounded-md bg-slate-100/70 border border-slate-200/60">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{(durationMs / 1000).toFixed(2)}s</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Centered Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-10 space-y-7">
        {/* PROMPT BOX IN THE MIDDLE WITH 4 BOTTOM BUTTONS */}
        <div className="relative group">
          {/* Subtle gradient backlight on focus */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-3xl blur-md opacity-0 group-focus-within:opacity-100 transition duration-500 pointer-events-none" />

          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-sm transition-all duration-300 group-focus-within:border-blue-400 group-focus-within:shadow-xl group-focus-within:shadow-blue-500/5">
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Input Prompt
                </span>
                <span className="text-[11px] font-mono text-slate-400 hidden sm:inline-flex items-center gap-1">
                  <span>Press</span>
                  <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 rounded shadow-2xs">⌘ + Enter</kbd>
                  <span>to run</span>
                </span>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    fetchResponse();
                  }
                }}
                rows={4}
                placeholder="Enter your prompt here (e.g., 'The capital of France is ')..."
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 text-base font-mono resize-none focus:outline-none leading-relaxed transition-colors"
              />
            </div>

            {/* BOTTOM BUTTONS BAR */}
            <div
              ref={paramBarRef}
              className="border-t border-slate-100/90 px-4 py-3 bg-gradient-to-b from-slate-50/50 to-slate-100/60 rounded-b-2xl flex flex-wrap items-center justify-between gap-3 relative"
            >
              {/* Left 3 Param Buttons */}
              <div className="flex items-center gap-2 relative">
                {/* BUTTON 1: Tokens */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenParam(openParam === 'tokens' ? null : 'tokens')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono border transition-all duration-200 cursor-pointer ${
                      openParam === 'tokens'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-blue-50/60 hover:text-blue-700 hover:border-blue-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <Sliders className={`w-3.5 h-3.5 ${openParam === 'tokens' ? 'text-white' : 'text-blue-600'}`} />
                    <span>Tokens: <strong>{maxTokens}</strong></span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openParam === 'tokens' ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                  </button>

                  {/* Tokens Popover */}
                  {openParam === 'tokens' && (
                    <div className="absolute left-0 bottom-full mb-3 w-76 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-blue-600" />
                          <span className="text-xs font-bold text-slate-800">Tokens to Generate</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {maxTokens} tokens
                        </span>
                      </div>

                      <input
                        type="range"
                        min={1}
                        max={60}
                        step={1}
                        value={maxTokens}
                        onChange={(e) => setMaxTokens(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>1</span>
                        <span>15</span>
                        <span>30</span>
                        <span>45</span>
                        <span>60</span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 block mb-2 font-medium">Quick Presets:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[5, 10, 15, 20, 30, 45, 60].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => {
                                setMaxTokens(t);
                                setOpenParam(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-150 cursor-pointer ${
                                maxTokens === t
                                  ? 'bg-blue-600 text-white shadow-xs scale-105'
                                  : 'bg-slate-100/80 hover:bg-blue-50 hover:text-blue-700 text-slate-700'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BUTTON 2: Temp */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenParam(openParam === 'temp' ? null : 'temp')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono border transition-all duration-200 cursor-pointer ${
                      openParam === 'temp'
                        ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/25 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-rose-50/60 hover:text-rose-700 hover:border-rose-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <Thermometer className={`w-3.5 h-3.5 ${openParam === 'temp' ? 'text-white' : 'text-rose-500'}`} />
                    <span>Temp: <strong>{temperature.toFixed(1)}</strong></span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openParam === 'temp' ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                  </button>

                  {/* Temp Popover */}
                  {openParam === 'temp' && (
                    <div className="absolute left-0 bottom-full mb-3 w-80 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-xs font-bold text-slate-800">Sampling Temperature</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">
                          {temperature.toFixed(2)}
                        </span>
                      </div>

                      <input
                        type="range"
                        min={0.0}
                        max={2.0}
                        step={0.05}
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(Number(e.target.value).toFixed(2)))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>0.0 (Argmax)</span>
                        <span>1.0 (Default)</span>
                        <span>2.0 (Max)</span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 block mb-2 font-medium">Sampling Mode:</span>
                        <div className="grid grid-cols-2 gap-1.5 text-xs">
                          {[
                            { label: '0.0 Greedy', val: 0.0, desc: 'Deterministic' },
                            { label: '0.3 Precise', val: 0.3, desc: 'Fact-focused' },
                            { label: '0.7 Balanced', val: 0.7, desc: 'Standard' },
                            { label: '1.0 Default', val: 1.0, desc: 'Original' },
                            { label: '1.4 Creative', val: 1.4, desc: 'Novel ideas' },
                            { label: '1.8 Wild', val: 1.8, desc: 'High variance' },
                          ].map((item) => (
                            <button
                              key={item.label}
                              type="button"
                              onClick={() => {
                                setTemperature(item.val);
                                setOpenParam(null);
                              }}
                              className={`p-2 rounded-xl text-left transition-all duration-150 cursor-pointer border ${
                                Math.abs(temperature - item.val) < 0.01
                                  ? 'bg-rose-50 border-rose-300 text-rose-800 font-semibold shadow-2xs'
                                  : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              <span className="block font-mono text-[11px] font-bold">{item.label}</span>
                              <span className="text-[10px] text-slate-400">{item.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* BUTTON 3: Top-K */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setOpenParam(openParam === 'topK' ? null : 'topK')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold font-mono border transition-all duration-200 cursor-pointer ${
                      openParam === 'topK'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/25 scale-[1.02]'
                        : 'bg-white text-slate-700 border-slate-200/90 hover:bg-indigo-50/60 hover:text-indigo-700 hover:border-indigo-200 shadow-2xs hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <Layers className={`w-3.5 h-3.5 ${openParam === 'topK' ? 'text-white' : 'text-indigo-600'}`} />
                    <span>Top-K: <strong>{topK}</strong></span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${openParam === 'topK' ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                  </button>

                  {/* Top-K Popover */}
                  {openParam === 'topK' && (
                    <div className="absolute left-0 bottom-full mb-3 w-76 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-4 z-40 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="text-xs font-bold text-slate-800">Top-K Candidate Pool</span>
                        </div>
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {topK} tokens
                        </span>
                      </div>

                      <input
                        type="range"
                        min={1}
                        max={100}
                        step={1}
                        value={topK}
                        onChange={(e) => setTopK(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
                        <span>1</span>
                        <span>20</span>
                        <span>40 (Default)</span>
                        <span>64</span>
                        <span>100</span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500 block mb-2 font-medium">Quick Presets:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {[1, 5, 10, 20, 40, 64, 100].map((k) => (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                setTopK(k);
                                setOpenParam(null);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all duration-150 cursor-pointer ${
                                topK === k
                                  ? 'bg-indigo-600 text-white shadow-xs scale-105'
                                  : 'bg-slate-100/80 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'
                              }`}
                            >
                              {k}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Button: Response Action */}
              <button
                type="button"
                onClick={() => fetchResponse()}
                disabled={isLoading || !prompt.trim()}
                className="group relative inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-600 active:scale-[0.97] text-white font-semibold text-xs shadow-md shadow-blue-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer overflow-hidden"
              >
                {/* Button shine sweep effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <span>Response</span>
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ERROR DISPLAY */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-300 text-rose-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => fetchResponse()}
              className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-700 rounded-lg border border-rose-200 font-semibold cursor-pointer transition-colors shadow-2xs"
            >
              Retry
            </button>
          </div>
        )}

        {/* LIVELY CUTE WAITING ANIMATION WHILE GENERATING */}
        {isLoading && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 p-9 shadow-lg shadow-blue-500/5 text-center space-y-4 animate-in fade-in duration-300">
            {/* Whimsical animated loader with orbiting particles */}
            <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping opacity-60"></div>
              {/* Spinning gradient ring */}
              <div className="absolute inset-1 rounded-full border-3 border-transparent border-t-blue-600 border-r-indigo-500 border-b-purple-500 animate-spin"></div>
              {/* Floating inner core */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-float">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                Sampling Model Probabilities...
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Predicting {maxTokens} tokens (Temp: {temperature.toFixed(1)} · Top-K: {topK})
              </p>
            </div>

            {/* Pulsing wave of multi-color bouncing dots */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce [animation-delay:0.15s]"></span>
            </div>
          </div>
        )}

        {/* PROMINENT LIVELY RESPONSE DISPLAY: PROMPT PREPENDED + COLOR-CODED TOKENS */}
        {!isLoading && steps.length > 0 && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-md shadow-slate-900/5 p-6 sm:p-8 space-y-5 transition-all duration-300">
            {/* Confidence Legend Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Token Stream</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-400 font-normal">Hover to explore alternatives · Click any to branch</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-slate-400 text-[10px] hidden sm:inline">Confidence:</span>
                <span className="flex items-center gap-1.5 text-emerald-800 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ≥80%
                </span>
                <span className="flex items-center gap-1.5 text-sky-800 bg-sky-500/10 border border-sky-500/30 px-2 py-0.5 rounded-lg font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span> 50-79%
                </span>
                <span className="flex items-center gap-1.5 text-amber-900 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> 25-49%
                </span>
                <span className="flex items-center gap-1.5 text-rose-900 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-lg font-semibold shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span> &lt;25%
                </span>
              </div>
            </div>

            {/* UNIFIED MEANINGFUL TEXT: PROMPT + COLOR-CODED GENERATED TOKENS */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-50/80 to-slate-100/50 border border-slate-200/80 font-mono text-base leading-loose flex flex-wrap items-center gap-2">
              {/* Original User Prompt Prepended */}
              <span className="text-slate-800 font-semibold px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs select-text">
                {analyzedPrompt}
              </span>

              {/* Color-coded Generated Tokens */}
              {steps.map((step, idx) => {
                const style = getTokenConfidenceStyle(step.selectedProbability);
                const isHovered = hoveredIdx === idx;

                // Build full list of alternatives including original selected token
                const candidates = step.topCandidates && step.topCandidates.length > 0
                  ? step.topCandidates
                  : [{ token: step.selectedToken, probability: step.selectedProbability, logProbability: step.selectedLogProb }];

                return (
                  <div
                    key={step.stepIndex}
                    className="relative inline-block"
                    onMouseEnter={() => handleMouseEnter(idx)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* Primary Token Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectToken(idx, step.selectedToken)}
                      title="Click to branch prompt up to this token"
                      className={`group relative px-2.5 py-1 rounded-xl border text-sm font-bold transition-all duration-150 cursor-pointer shadow-xs ${style.bg} ${
                        isHovered
                          ? 'scale-110 z-30 ring-2 ring-blue-500/60 shadow-md shadow-blue-500/20'
                          : 'hover:scale-105'
                      }`}
                    >
                      {/* Token Text with readable whitespace indicator */}
                      {step.selectedToken === '\n' ? (
                        <span className="text-slate-400 font-sans">↵</span>
                      ) : (
                        <span>{step.selectedToken}</span>
                      )}
                    </button>

                    {/* INTERACTIVE ALTERNATIVES POPOVER ON HOVER */}
                    {isHovered && (
                      <div
                        className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2.5 w-64 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl p-3 z-50 text-xs font-sans animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150 border border-slate-700/80"
                        onMouseEnter={() => handleMouseEnter(idx)}
                        onMouseLeave={handleMouseLeave}
                      >
                        {/* Popover Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                            <CornerDownRight className="w-3 h-3 text-blue-400" />
                            <span>Select Next Token</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            Step #{step.stepIndex}
                          </span>
                        </div>

                        {/* List of Clickable Tokens (Original + Top Alternatives) */}
                        <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">
                          {candidates.map((cand, cIdx) => {
                            const isChosenOne = cand.token === step.selectedToken;
                            const candPct = (cand.probability * 100).toFixed(1);
                            const candStyle = getTokenConfidenceStyle(cand.probability);

                            return (
                              <button
                                key={cIdx}
                                type="button"
                                onClick={() => handleSelectToken(idx, cand.token)}
                                className={`w-full group/item flex items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer text-left border ${
                                  isChosenOne
                                    ? 'bg-blue-600/25 border-blue-500/50 text-white hover:bg-blue-600/40'
                                    : 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-700/80 hover:border-slate-600 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2 overflow-hidden pr-2">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${candStyle.dot}`}
                                  />
                                  <span className="font-mono text-xs font-bold truncate">
                                    &quot;{cand.token}&quot;
                                  </span>
                                  {isChosenOne && (
                                    <span className="text-[9px] font-mono font-semibold uppercase px-1 py-0.2 bg-blue-500/30 text-blue-300 rounded border border-blue-400/30">
                                      current
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-mono text-[11px] font-bold text-slate-300 group-hover/item:text-white">
                                    {candPct}%
                                  </span>
                                  <CornerDownRight className="w-3 h-3 text-slate-400 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all" />
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Popover Action Hint */}
                        <div className="pt-2 mt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center font-mono">
                          Click to branch stream from here
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
