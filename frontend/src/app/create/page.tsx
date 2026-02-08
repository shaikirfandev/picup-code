'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { postsAPI, categoriesAPI, aiAPI, uploadAPI } from '@/lib/api';
import { Category, AIStyle } from '@/types';
import {
  Upload, X, ImagePlus, Sparkles, Tag, DollarSign, ExternalLink,
  Loader2, Wand2, AlertCircle, FileImage, Palette,
  Video, Play, Clock, Terminal, Zap,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState<'upload' | 'video' | 'ai'>('upload');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedPublicId, setUploadedPublicId] = useState('');

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadedVideoData, setUploadedVideoData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('');
  const [aiStyles, setAiStyles] = useState<AIStyle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    const fetchData = async () => {
      try {
        const [catRes, styleRes] = await Promise.all([categoriesAPI.getAll(), aiAPI.getStyles()]);
        setCategories(catRes.data.data || []);
        setAiStyles(styleRes.data.data || []);
      } catch { /* silent */ }
    };
    fetchData();
  }, [isAuthenticated, router]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setGeneratedImage('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const onVideoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      setVideoError('');
      setUploadedVideoData(null);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const dur = video.duration;
        setVideoDuration(dur);
        if (dur > 15) setVideoError(`Video is ${Math.round(dur)}s. Maximum is 15 seconds.`);
        else if (dur < 1) setVideoError('Video too short. Minimum 1 second.');
      };
      video.src = url;
    }
  }, []);

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const clearVideo = () => { setVideoFile(null); setVideoPreview(''); setVideoDuration(0); setVideoError(''); setUploadedVideoData(null); };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) { setTags([...tags, tag]); setTagInput(''); }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { data } = await aiAPI.generateImage({ prompt: aiPrompt, style: aiStyle || undefined });
      setGeneratedImage(data.data.imageUrl);
      setUploadedImageUrl(data.data.imageUrl);
      setImagePreview(''); setImageFile(null);
      toast.success('Image generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Generation failed');
    } finally { setIsGenerating(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Title required'); return; }
    const isVideoPost = activeTab === 'video';
    if (isVideoPost) {
      if (!videoFile && !uploadedVideoData) { toast.error('Video required'); return; }
      if (videoError) { toast.error(videoError); return; }
    } else {
      if (!imageFile && !generatedImage && !uploadedImageUrl) { toast.error('Image required'); return; }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (description.trim()) formData.append('description', description.trim());
      if (tags.length > 0) formData.append('tags', JSON.stringify(tags));
      if (categoryId) formData.append('category', categoryId);
      if (productUrl.trim()) formData.append('productUrl', productUrl.trim());
      if (price) formData.append('price', JSON.stringify({ amount: parseFloat(price), currency }));

      if (isVideoPost) {
        formData.append('mediaType', 'video');
        if (videoFile && !uploadedVideoData) {
          setIsUploadingVideo(true);
          const videoFormData = new FormData();
          videoFormData.append('video', videoFile);
          try {
            const uploadRes = await uploadAPI.uploadVideo(videoFormData);
            const vData = uploadRes.data.data;
            setUploadedVideoData(vData);
            formData.append('videoData', JSON.stringify(vData));
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'Video upload failed');
            setIsSubmitting(false); setIsUploadingVideo(false); return;
          }
          setIsUploadingVideo(false);
        } else if (uploadedVideoData) {
          formData.append('videoData', JSON.stringify(uploadedVideoData));
        }
      } else {
        formData.append('mediaType', 'image');
        if (generatedImage || uploadedImageUrl) {
          formData.append('isAiGenerated', String(!!generatedImage));
          formData.append('aiImageUrl', generatedImage || uploadedImageUrl);
        } else if (imageFile) {
          formData.append('media', imageFile);
        }
      }

      const { data } = await postsAPI.createPost(formData);
      toast.success('Post created!');
      router.push(`/post/${data.data._id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create post');
    } finally { setIsSubmitting(false); setIsUploadingVideo(false); }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="w-6 h-6 text-cyber-glow" />
          <h1 className="text-2xl font-bold text-white">CREATE_POST</h1>
        </div>
        <p className="text-white/30 font-mono text-xs mb-8">&gt; Upload media or generate with AI to publish_</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Media */}
          <div>
            {/* Tab switcher */}
            <div className="flex rounded-xl p-1 mb-4 gap-1" style={{ background: 'rgba(0,240,255,0.03)', border: '1px solid rgba(0,240,255,0.08)' }}>
              {[
                { key: 'upload' as const, icon: FileImage, label: 'IMAGE' },
                { key: 'video' as const, icon: Video, label: 'VIDEO' },
                { key: 'ai' as const, icon: Sparkles, label: 'AI_GEN' },
              ].map((tab) => (
                <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all
                    ${activeTab === tab.key
                      ? 'bg-cyber-glow/10 border border-cyber-glow/25 text-cyber-glow shadow-cyber'
                      : 'text-white/30 hover:text-white/50 border border-transparent'}`}>
                  <tab.icon className="w-3.5 h-3.5" />{tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'upload' ? (
              <div {...getRootProps()}
                className={`relative aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden
                  ${isDragActive ? 'border-cyber-glow bg-cyber-glow/[0.03]' : 'border-cyber-border hover:border-cyber-glow/30'}`}
                style={{ background: 'linear-gradient(135deg, rgba(14,14,30,0.6), rgba(20,20,42,0.4))' }}>
                <input {...getInputProps()} />
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(''); }}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-cyber-red transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-xl bg-cyber-glow/[0.05] border border-cyber-glow/15 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-7 h-7 text-cyber-glow/50" />
                    </div>
                    <p className="font-mono text-sm text-white/50 mb-1">DROP_IMAGE_HERE</p>
                    <p className="text-xs text-white/20 font-mono">PNG, JPG, WEBP // Max 10 MB</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'video' ? (
              <div className="space-y-4">
                <div {...getVideoRootProps()}
                  className={`relative aspect-[3/4] rounded-xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden
                    ${isVideoDragActive ? 'border-cyber-purple bg-cyber-purple/[0.03]' : 'border-cyber-border hover:border-cyber-purple/30'}`}
                  style={{ background: 'linear-gradient(135deg, rgba(14,14,30,0.6), rgba(20,20,42,0.4))' }}>
                  <input {...getVideoInputProps()} />
                  {videoPreview ? (
                    <div className="relative w-full h-full bg-black">
                      <video ref={videoRef} src={videoPreview} className="w-full h-full object-contain" controls muted playsInline />
                      <button type="button" onClick={(e) => { e.stopPropagation(); clearVideo(); }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-cyber-red z-10 transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                      {videoDuration > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm border border-cyber-glow/20 text-cyber-glow text-xs font-mono z-10">
                          <Clock className="w-3 h-3" />{formatDuration(videoDuration)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-xl bg-cyber-purple/[0.05] border border-cyber-purple/15 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-7 h-7 text-cyber-purple/50" />
                      </div>
                      <p className="font-mono text-sm text-white/50 mb-1">DROP_VIDEO_HERE</p>
                      <p className="text-xs text-white/20 font-mono">MP4, WebM, MOV // Max 15s // 50 MB</p>
                    </div>
                  )}
                </div>
                {videoError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-cyber-red/20 text-cyber-red text-xs font-mono"
                    style={{ background: 'rgba(255,0,60,0.05)' }}>
                    <AlertCircle className="w-4 h-4 shrink-0" />{videoError}
                  </div>
                )}
                {videoFile && !videoError && videoDuration > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl border border-cyber-neon/20 text-cyber-neon text-xs font-mono"
                    style={{ background: 'rgba(0,255,136,0.03)' }}>
                    <Play className="w-4 h-4 shrink-0" />
                    VIDEO_READY // {formatDuration(videoDuration)} // {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, rgba(14,14,30,0.6), rgba(20,20,42,0.4))', border: '1px solid rgba(191,0,255,0.1)' }}>
                  {generatedImage ? (
                    <div className="relative w-full h-full">
                      <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => setGeneratedImage('')}
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:text-cyber-red transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4"
                        style={{ background: 'linear-gradient(135deg, rgba(191,0,255,0.1), rgba(0,240,255,0.1))', border: '1px solid rgba(191,0,255,0.2)', boxShadow: '0 0 20px rgba(191,0,255,0.1)' }}>
                        <Wand2 className="w-7 h-7 text-cyber-purple" />
                      </div>
                      <p className="font-mono text-sm text-white/50 mb-1">AI_IMAGE_GEN</p>
                      <p className="text-xs text-white/20 font-mono">Describe what to generate_</p>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-cyber-glow mx-auto mb-3" />
                        <p className="font-mono text-sm text-cyber-glow">GENERATING...</p>
                        <p className="text-xs text-white/30 font-mono mt-1">Processing neural network_</p>
                      </div>
                    </div>
                  )}
                </div>
                <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="> Describe your vision..." rows={3} className="input-field resize-none font-mono text-sm" />
                {aiStyles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiStyles.map((s) => (
                      <button key={s.id} type="button" onClick={() => setAiStyle(aiStyle === s.id ? '' : s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono transition-all border
                          ${aiStyle === s.id
                            ? 'border-cyber-purple/40 bg-cyber-purple/10 text-cyber-purple'
                            : 'border-white/[0.06] text-white/30 hover:text-white/50 hover:border-white/10'}`}>
                        <Palette className="w-3 h-3" />{s.name}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={handleGenerate} disabled={!aiPrompt.trim() || isGenerating}
                  className="btn-primary w-full gap-2 py-3 font-mono text-xs">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'GENERATING...' : 'GENERATE_IMAGE'}
                </button>
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter post title" className="input-field font-mono" maxLength={200} />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your post..." rows={4} className="input-field resize-none" maxLength={5000} />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Tags</label>
              <div className="flex gap-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add tag" className="input-field flex-1 font-mono" />
                <button type="button" onClick={addTag} className="btn-ghost px-3 text-cyber-glow">
                  <Tag className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-cyber-glow/5 border border-cyber-glow/15 text-cyber-glow text-xs font-mono">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider">Category</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input-field font-mono">
                <option value="">Select category</option>
                {categories.map((c) => (<option key={c._id} value={c._id}>{c.icon} {c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <ExternalLink className="w-3 h-3" /> Product URL
              </label>
              <input value={productUrl} onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://..." className="input-field font-mono" type="url" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-medium mb-1.5 text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3 h-3" /> Price (optional)
              </label>
              <div className="flex gap-2">
                <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="input-field w-24 font-mono">
                  <option value="USD">USD</option><option value="EUR">EUR</option>
                  <option value="GBP">GBP</option><option value="MAD">MAD</option>
                </select>
                <input value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00" className="input-field flex-1 font-mono" type="number" step="0.01" min="0" />
              </div>
            </div>
            <button type="submit"
              disabled={isSubmitting || isUploadingVideo || !title.trim() ||
                (activeTab === 'video' ? (!videoFile && !uploadedVideoData) || !!videoError : !imageFile && !generatedImage && !uploadedImageUrl)}
              className="btn-primary w-full py-3.5 text-sm gap-2 font-mono">
              {isSubmitting || isUploadingVideo ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> {isUploadingVideo ? 'UPLOADING_VIDEO...' : 'PUBLISHING...'}</>
              ) : (
                <><Terminal className="w-4 h-4" /> PUBLISH_POST</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
