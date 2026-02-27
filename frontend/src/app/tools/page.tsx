'use client';

import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import { aiAPI } from '@/lib/api';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Wand2, Image, Palette, Sparkles, Download,
  Loader2, Settings2, Layers, Type, Zap, Wrench,
} from 'lucide-react';

const AI_STYLES = [
  { id: 'photographic', name: 'Photographic', icon: '📷' },
  { id: 'digital-art', name: 'Digital Art', icon: '🎨' },
  { id: 'anime', name: 'Anime', icon: '🎌' },
  { id: '3d-model', name: '3D Model', icon: '🧊' },
  { id: 'pixel-art', name: 'Pixel Art', icon: '👾' },
  { id: 'fantasy-art', name: 'Fantasy Art', icon: '🐉' },
  { id: 'comic-book', name: 'Comic Book', icon: '💥' },
  { id: 'neon-punk', name: 'Neon Punk', icon: '🌆' },
];

const TOOLS = [
  {
    id: 'ai-image',
    name: 'AI Image Generator',
    description: 'Generate stunning images using AI from text prompts',
    icon: Wand2,
    color: 'cyan',
    available: true,
  },
  {
    id: 'background-remove',
    name: 'Background Remover',
    description: 'Remove backgrounds from images instantly',
    icon: Layers,
    color: 'purple',
    available: false,
  },
  {
    id: 'image-upscale',
    name: 'Image Upscaler',
    description: 'Enhance image resolution using AI',
    icon: Sparkles,
    color: 'blue',
    available: false,
  },
  {
    id: 'color-palette',
    name: 'Color Palette Generator',
    description: 'Extract and generate color palettes from images',
    icon: Palette,
    color: 'amber',
    available: false,
  },
  {
    id: 'text-to-logo',
    name: 'Text to Logo',
    description: 'Generate logo concepts from text descriptions',
    icon: Type,
    color: 'green',
    available: false,
  },
];

export default function ToolsPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  const [activeTool, setActiveTool] = useState('ai-image');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [style, setStyle] = useState('photographic');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to use AI tools');
      return;
    }
    if (!prompt.trim()) {
      toast.error('Enter a prompt first');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    try {
      const { data } = await aiAPI.generateImage({
        prompt: prompt.trim(),
        negativePrompt: negativePrompt || undefined,
        style,
        width,
        height,
      });
      if (data.data?.resultImage?.url) {
        setGeneratedImage(data.data.resultImage.url);
        toast.success('Image generated!');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-14 text-center px-4">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded mb-6"
            style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
            <Wrench className="w-3.5 h-3.5 text-edith-cyan" />
            <span className="text-[11px] font-mono font-medium tracking-wider text-edith-cyan/70 uppercase">
              AI Tools & Utilities
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight">
            <span style={{ color: 'var(--edith-text)' }}>Creative </span>
            <span className="text-gradient">Tools</span>
          </h1>
          <p className="text-sm font-mono text-[var(--edith-text-dim)] max-w-xl mx-auto">
            AI-powered tools to enhance your creative workflow.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="max-w-6xl mx-auto px-4 mb-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              onClick={() => tool.available && setActiveTool(tool.id)}
              disabled={!tool.available}
              className={`relative card p-4 text-center transition-all ${
                activeTool === tool.id ? 'border-edith-cyan/30' : ''
              } ${!tool.available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:border-edith-cyan/20'}`}
            >
              {!tool.available && (
                <span className="absolute top-2 right-2 text-[7px] font-mono font-bold text-edith-amber px-1.5 py-0.5 rounded"
                  style={{ background: 'rgba(255,170,0,0.1)', border: '1px solid rgba(255,170,0,0.2)' }}>
                  SOON
                </span>
              )}
              <tool.icon className={`w-8 h-8 mx-auto mb-2 ${activeTool === tool.id ? 'text-edith-cyan' : 'text-[var(--edith-text-dim)]'}`} />
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider" style={{ color: 'var(--edith-text)' }}>
                {tool.name}
              </h3>
              <p className="text-[8px] font-mono text-[var(--edith-text-dim)] mt-1">{tool.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* AI Image Generator */}
      {activeTool === 'ai-image' && (
        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="card p-6 space-y-5">
              <h2 className="text-sm font-display font-bold uppercase tracking-wider text-edith-cyan flex items-center gap-2">
                <Wand2 className="w-4 h-4" /> AI Image Generator
              </h2>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input-field h-24 resize-none"
                  placeholder="Describe the image you want to create..."
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Negative Prompt (optional)</label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  className="input-field"
                  placeholder="Things to exclude..."
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-2 block">Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {AI_STYLES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-2 rounded text-center transition-all text-[9px] font-mono ${
                        style === s.id
                          ? 'text-edith-cyan border border-edith-cyan/30'
                          : 'text-[var(--edith-text-dim)] border border-[var(--edith-border)]'
                      }`}
                      style={style === s.id ? { background: 'rgba(0,212,255,0.08)' } : {}}
                    >
                      <span className="text-lg block mb-1">{s.icon}</span>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Width</label>
                  <select value={width} onChange={(e) => setWidth(Number(e.target.value))} className="input-field">
                    <option value={512}>512px</option>
                    <option value={768}>768px</option>
                    <option value={1024}>1024px</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-edith-cyan/60 mb-1.5 block">Height</label>
                  <select value={height} onChange={(e) => setHeight(Number(e.target.value))} className="input-field">
                    <option value={512}>512px</option>
                    <option value={768}>768px</option>
                    <option value={1024}>1024px</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="btn-primary w-full gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {isGenerating ? 'Generating...' : 'Generate Image'}
              </button>
            </div>

            {/* Preview */}
            <div className="card p-6 flex items-center justify-center min-h-[400px]">
              {isGenerating ? (
                <div className="text-center">
                  <Loader2 className="w-12 h-12 text-edith-cyan animate-spin mx-auto mb-3" />
                  <p className="text-xs font-mono text-edith-cyan/60">Generating image...</p>
                </div>
              ) : generatedImage ? (
                <div className="w-full">
                  <img
                    src={generatedImage}
                    alt="AI Generated"
                    className="w-full rounded-lg border"
                    style={{ borderColor: 'var(--edith-border)' }}
                  />
                  <div className="flex gap-2 mt-4">
                    <a
                      href={generatedImage}
                      download
                      className="btn-secondary flex-1 gap-2 text-center justify-center"
                    >
                      <Download className="w-4 h-4" /> Download
                    </a>
                    <Link href="/create" className="btn-primary flex-1 gap-2 text-center justify-center">
                      <Image className="w-4 h-4" /> Post It
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <Image className="w-16 h-16 text-edith-cyan/20 mx-auto mb-3" />
                  <p className="text-xs font-mono text-[var(--edith-text-dim)]">
                    Your generated image will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
