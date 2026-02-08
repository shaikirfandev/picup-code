const mongoose = require('mongoose');

const aiGenerationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    prompt: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    negativePrompt: {
      type: String,
      maxlength: 1000,
    },
    model: {
      type: String,
      default: 'stable-diffusion-xl-1024-v1-0',
    },
    style: {
      type: String,
      default: 'photographic',
    },
    width: { type: Number, default: 1024 },
    height: { type: Number, default: 1024 },
    seed: Number,
    steps: { type: Number, default: 30 },
    cfgScale: { type: Number, default: 7 },
    resultImage: {
      url: String,
      publicId: String,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
    },
    error: String,
    processingTime: Number,
    usedInPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
  },
  { timestamps: true }
);

aiGenerationSchema.index({ user: 1, createdAt: -1 });
aiGenerationSchema.index({ status: 1 });
aiGenerationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AIGeneration', aiGenerationSchema);
