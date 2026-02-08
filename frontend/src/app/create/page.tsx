'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import { postsAPI, categoriesAPI, aiAPI, uploadAPI } from '@/lib/api';
import { Category, AIStyle } from '@/types';
import {
  Upload, X, ImagePlus, Sparkles, Tag, DollarSign, ExternalLink,
  Loader2, Wand2, ChevronRight, AlertCircle, FileImage, Palette,
  Video, Play, Clock,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';

export default function CreatePostPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const [activeTab, setActiveTab] = useState<'upload' | 'video' | 'ai'>('upload');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedPublicId, setUploadedPublicId] = useState('');

  // Video state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoError, setVideoError] = useState('');
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadedVideoData, setUploadedVideoData] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // AI state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('');
  const [aiStyles, setAiStyles] = useState<AIStyle[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState('');

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    const fetchData = async () => {
      try {
        const [catRes, styleRes] = await Promise.all([
          categoriesAPI.getAll(),
          aiAPI.getStyles(),
        ]);
        setCategories(catRes.data.data || []);
        setAiStyles(styleRes.data.data || []);
      } catch { /* silent */ }
    };
    fetchData();
  }, [isAuthenticated, router]);

  // Image Dropzone
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

  // Video Dropzone
  const onVideoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setVideoFile(file);
      setVideoError('');
      setUploadedVideoData(null);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);

      // Validate video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        const dur = video.duration;
        setVideoDuration(dur);
        if (dur > 15) {
          setVideoError(`Video is ${Math.round(dur)}s long. Maximum allowed is 15 seconds.`);
        } else if (dur < 1) {
          setVideoError('Video is too short. Minimum is 1 second.');
        }
      };
      video.src = url;
    }
  }, []);

  const {
    getRootProps: getVideoRootProps,
    getInputProps: getVideoInputProps,
    isDragActive: isVideoDragActive,
  } = useDropzone({
    onDrop: onVideoDrop,
    accept: { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const clearVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setVideoDuration(0);
    setVideoError('');
    setUploadedVideoData(null);
  };

  // Tags
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  // AI Generation
  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { data } = await aiAPI.generateImage({ prompt: aiPrompt, style: aiStyle || undefined });
      setGeneratedImage(data.data.imageUrl);
      setUploadedImageUrl(data.data.imageUrl);
      setImagePreview('');
      setImageFile(null);
      toast.success('Image generated!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit
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
          // Upload video first via the dedicated endpoint
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
            setIsSubmitting(false);
            setIsUploadingVideo(false);
            return;
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
    } finally {
      setIsSubmitting(false);
      setIsUploadingVideo(false);
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Create New Pin</h1>
        <p className="text-surface-500 mb-8">Upload an image, a short video, or generate with AI</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left — Media */}
          <div>
            {/* Tab switcher */}
            <div className="flex rounded-xl bg-surface-100 dark:bg-surface-800 p-1 mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'upload' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
              >
                <FileImage className="w-4 h-4" />
                Image
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'video' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
              >
                <Video className="w-4 h-4" />
                Video
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ai')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'ai' ? 'bg-white dark:bg-surface-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'}`}
              >
                <Sparkles className="w-4 h-4" />
                AI
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                {...getRootProps()}
                className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                  isDragActive
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                    : 'border-surface-200 dark:border-surface-700 hover:border-brand-300'
                }`}
              >
                <input {...getInputProps()} />
                {imagePreview ? (
                  <div className="relative w-full h-full">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(''); }}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-7 h-7 text-surface-400" />
                    </div>
                    <p className="font-medium mb-1">Drag & drop or click to upload</p>
                    <p className="text-sm text-surface-400">PNG, JPG, WEBP • Max 10 MB</p>
                  </div>
                )}
              </div>
            ) : activeTab === 'video' ? (
              <div className="space-y-4">
                <div
                  {...getVideoRootProps()}
                  className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex items-center justify-center overflow-hidden ${
                    isVideoDragActive
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/20'
                      : 'border-surface-200 dark:border-surface-700 hover:border-brand-300'
                  }`}
                >
                  <input {...getVideoInputProps()} />
                  {videoPreview ? (
                    <div className="relative w-full h-full bg-black">
                      <video
                        ref={videoRef}
                        src={videoPreview}
                        className="w-full h-full object-contain"
                        controls
                        muted
                        playsInline
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearVideo(); }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {/* Duration badge */}
                      {videoDuration > 0 && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-medium backdrop-blur-sm z-10">
                          <Clock className="w-3 h-3" />
                          {formatDuration(videoDuration)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-7 h-7 text-surface-400" />
                      </div>
                      <p className="font-medium mb-1">Drag & drop or click to upload video</p>
                      <p className="text-sm text-surface-400">MP4, WebM, MOV • Max 15 seconds • 50 MB</p>
                    </div>
                  )}
                </div>

                {/* Video validation feedback */}
                {videoError && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {videoError}
                  </div>
                )}
                {videoFile && !videoError && videoDuration > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-sm">
                    <Play className="w-4 h-4 shrink-0" />
                    Video ready — {formatDuration(videoDuration)} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative aspect-[3/4] rounded-2xl bg-surface-100 dark:bg-surface-800 overflow-hidden flex items-center justify-center">
                  {generatedImage ? (
                    <div className="relative w-full h-full">
                      <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setGeneratedImage('')}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
                        <Wand2 className="w-7 h-7 text-white" />
                      </div>
                      <p className="font-medium mb-1">AI Image Generation</p>
                      <p className="text-sm text-surface-400">Describe what you want to create</p>
                    </div>
                  )}
                  {isGenerating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <div className="text-center text-white">
                        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-3" />
                        <p className="font-medium">Generating your image...</p>
                        <p className="text-sm text-white/70">This may take a moment</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Prompt */}
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="A beautiful sunset over a mountain lake with reflections, digital art style..."
                  rows={3}
                  className="input-field resize-none"
                />

                {/* Style selector */}
                {aiStyles.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {aiStyles.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setAiStyle(aiStyle === s.id ? '' : s.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                          aiStyle === s.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30 text-brand-600'
                            : 'border-surface-200 dark:border-surface-700 hover:border-brand-300'
                        }`}
                      >
                        <Palette className="w-3.5 h-3.5" />
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="btn-primary w-full gap-2 py-3"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isGenerating ? 'Generating...' : 'Generate Image'}
                </button>
              </div>
            )}
          </div>

          {/* Right — Details */}
          <div className="space-y-5">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your pin a catchy title"
                className="input-field"
                maxLength={200}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell everyone what your pin is about"
                rows={4}
                className="input-field resize-none"
                maxLength={5000}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Tags</label>
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Add a tag"
                  className="input-field flex-1"
                />
                <button type="button" onClick={addTag} className="btn-ghost px-3">
                  <Tag className="w-4 h-4" />
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 dark:bg-brand-950/30 text-brand-600 text-sm">
                      #{t}
                      <button type="button" onClick={() => removeTag(t)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Product URL */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" />
                  Product URL
                </span>
              </label>
              <input
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://example.com/product"
                className="input-field"
                type="url"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Price (optional)
                </span>
              </label>
              <div className="flex gap-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="input-field w-24"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="MAD">MAD</option>
                </select>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="input-field flex-1"
                  type="number"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isSubmitting ||
                isUploadingVideo ||
                !title.trim() ||
                (activeTab === 'video'
                  ? (!videoFile && !uploadedVideoData) || !!videoError
                  : !imageFile && !generatedImage && !uploadedImageUrl)
              }
              className="btn-primary w-full py-3.5 text-base gap-2"
            >
              {isSubmitting || isUploadingVideo ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {isUploadingVideo ? 'Uploading Video...' : 'Publishing...'}
                </>
              ) : (
                <>
                  {activeTab === 'video' ? <Video className="w-5 h-5" /> : <ImagePlus className="w-5 h-5" />}
                  Publish Pin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

