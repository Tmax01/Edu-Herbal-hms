import { useState } from 'react';
import { guideData, GuideStep, DepartmentGuideData } from '../../constants/guideData';
import { Modal } from './Modal';

interface DepartmentGuideProps {
  department: string;
}

// Neumorphic helpers (same palette as Login)
const NEU_BG = '#e0e5ec';
const neuRaised = '6px 6px 12px #a3b1c6, -6px -6px 12px #ffffff';
const neuInset = 'inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff';

export function DepartmentGuide({ department }: DepartmentGuideProps) {
  const [open, setOpen] = useState(false);
  const guide = guideData[department];

  if (!guide) return null;

  return (
    <>
      {/* Guide trigger card — neumorphic raised style */}
      <div
        className="cursor-pointer rounded-2xl p-5 flex items-center gap-4 group transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        style={{ background: NEU_BG, boxShadow: neuRaised }}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setOpen(true)}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 transition-transform group-hover:scale-110"
          style={{ background: NEU_BG, boxShadow: neuInset }}
        >
          {guide.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>
              How to use {guide.department}
            </p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#1b4fce]/10 text-[#1b4fce]">
              {guide.steps.length} steps
            </span>
          </div>
          <p className="text-xs text-slate-500 line-clamp-1">{guide.overview}</p>
        </div>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:translate-x-0.5"
          style={{ background: NEU_BG, boxShadow: neuInset }}
        >
          <svg className="w-4 h-4 text-[#1b4fce]" viewBox="0 0 16 16" fill="none">
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Guide modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={`${guide.icon}  ${guide.department} — Navigation Guide`} width="max-w-2xl">
        <GuideContent guide={guide} />
      </Modal>
    </>
  );
}

function GuideContent({ guide }: { guide: DepartmentGuideData }) {
  const [videoUrls, setVideoUrls] = useState<Record<number, string>>({});
  const [editingVideo, setEditingVideo] = useState<number | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  if (!guide) return null;

  const step: GuideStep = guide.steps[activeStep];

  const setVideoUrl = (idx: number, url: string) => {
    setVideoUrls((prev) => ({ ...prev, [idx]: url }));
  };

  const getEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    // YouTube
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([A-Za-z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
    // Vimeo
    const vmMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vmMatch) return `https://player.vimeo.com/video/${vmMatch[1]}`;
    return null;
  };

  return (
    <div className="flex flex-col" style={{ maxHeight: '80vh' }}>
      {/* Overview */}
      <div className="px-6 py-4 bg-gradient-to-r from-[#1b4fce]/5 to-[#0d9488]/5 border-b border-[#dbe4ef] shrink-0">
        <p className="text-sm text-slate-600 leading-relaxed">{guide.overview}</p>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden flex-col md:flex-row">
        {/* Step list — left */}
        <div className="md:w-52 shrink-0 border-b md:border-b-0 md:border-r border-[#dbe4ef] overflow-y-auto">
          <div className="p-3 space-y-1">
            {guide.steps.map((s: GuideStep, i: number) => (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full text-left flex items-start gap-3 p-3 rounded-xl transition-all ${
                  activeStep === i
                    ? 'bg-[#1b4fce] text-white'
                    : 'hover:bg-[#f0f4f8] text-slate-600'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                  activeStep === i ? 'bg-white/20 text-white' : 'bg-[#e8eef7] text-[#1b4fce]'
                }`}>
                  {videoUrls[i] ? '▶' : i + 1}
                </span>
                <span className="text-xs font-medium leading-tight">{s.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step detail — right */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Step header */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-[#1b4fce] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {activeStep + 1}
              </div>
              <h3 className="text-base font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>
                {step.title}
              </h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed pl-11">{step.description}</p>
          </div>

          {/* Tip */}
          {step.tip && (
            <div className="ml-11 flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <span className="text-amber-500 text-sm shrink-0">💡</span>
              <p className="text-xs text-amber-700 leading-relaxed"><strong>Pro tip:</strong> {step.tip}</p>
            </div>
          )}

          {/* Video section */}
          <div className="ml-11">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tutorial Video</p>
              <button
                onClick={() => setEditingVideo(editingVideo === activeStep ? null : activeStep)}
                className="text-xs text-[#1b4fce] hover:underline font-medium"
              >
                {videoUrls[activeStep] ? 'Change Video' : '+ Add Video URL'}
              </button>
            </div>

            {/* URL input */}
            {editingVideo === activeStep && (
              <div className="mb-3 flex gap-2">
                <input
                  type="url"
                  placeholder="Paste YouTube or Vimeo URL…"
                  defaultValue={videoUrls[activeStep] || ''}
                  className="flex-1 px-3 py-2 text-xs border border-[#dbe4ef] rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#1b4fce]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setVideoUrl(activeStep, (e.target as HTMLInputElement).value);
                      setEditingVideo(null);
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value) setVideoUrl(activeStep, e.target.value);
                    setEditingVideo(null);
                  }}
                  autoFocus
                />
                <button
                  onClick={() => { setVideoUrl(activeStep, ''); setEditingVideo(null); }}
                  className="text-xs text-red-500 px-2 hover:bg-red-50 rounded-lg"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Video embed */}
            {videoUrls[activeStep] ? (
              getEmbedUrl(videoUrls[activeStep]) ? (
                <div className="rounded-xl overflow-hidden border border-[#dbe4ef]" style={{ aspectRatio: '16/9' }}>
                  <iframe
                    src={getEmbedUrl(videoUrls[activeStep])!}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`Tutorial for ${step.title}`}
                  />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  ⚠️ Unrecognised URL format. Please use a YouTube or Vimeo link.
                </div>
              )
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-xl p-8 cursor-pointer"
                style={{ background: NEU_BG, boxShadow: neuInset }}
                onClick={() => setEditingVideo(activeStep)}
              >
                <span className="text-3xl opacity-40">▶</span>
                <p className="text-xs text-slate-400 font-medium">Click "+ Add Video URL" to embed a tutorial</p>
                <p className="text-[10px] text-slate-300">Supports YouTube and Vimeo</p>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between pt-2 border-t border-[#f0f4f8]">
            <button
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              disabled={activeStep === 0}
              className="text-xs px-4 py-2 rounded-xl border border-[#dbe4ef] text-slate-500 hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              ← Previous
            </button>
            <span className="text-xs text-slate-400 self-center">
              {activeStep + 1} / {guide.steps.length}
            </span>
            <button
              onClick={() => setActiveStep((s) => Math.min(guide.steps.length - 1, s + 1))}
              disabled={activeStep === guide.steps.length - 1}
              className="text-xs px-4 py-2 rounded-xl bg-[#1b4fce] text-white hover:bg-[#1640b0] disabled:opacity-30 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
