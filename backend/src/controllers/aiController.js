const AIGeneration = require('../models/AIGeneration');
const User = require('../models/User');
const { uploadToCloudinary } = require('../config/cloudinary');
const { ApiResponse } = require('../utils/apiResponse');

// Blocked words for prompt moderation
const BLOCKED_WORDS = [
  'nude', 'naked', 'explicit', 'pornographic', 'nsfw',
  'violence', 'gore', 'weapon', 'terrorism',
];

const moderatePrompt = (prompt) => {
  const lower = prompt.toLowerCase();
  const found = BLOCKED_WORDS.find((word) => lower.includes(word));
  return found ? { safe: false, word: found } : { safe: true };
};

// Generate image with AI
exports.generateImage = async (req, res, next) => {
  try {
    const { prompt, negativePrompt, style, width, height, seed } = req.body;

    if (!prompt || prompt.trim().length === 0) {
      return ApiResponse.error(res, 'Prompt is required', 400);
    }

    // Moderate prompt
    const modResult = moderatePrompt(prompt);
    if (!modResult.safe) {
      return ApiResponse.error(
        res,
        `Prompt contains prohibited content: "${modResult.word}"`,
        400
      );
    }

    // Check daily limit
    const user = await User.findById(req.user._id);
    user.checkAiReset();

    if (user.aiGenerationsToday >= user.aiDailyLimit) {
      return ApiResponse.error(
        res,
        `Daily AI generation limit reached (${user.aiDailyLimit}/day). Try again tomorrow.`,
        429
      );
    }

    // Create generation record
    const generation = await AIGeneration.create({
      user: req.user._id,
      prompt,
      negativePrompt,
      style: style || 'photographic',
      width: width || 1024,
      height: height || 1024,
      seed,
      status: 'processing',
    });

    try {
      // Call AI API (Stability AI / Stable Diffusion)
      const startTime = Date.now();

      const apiUrl = process.env.AI_API_URL;
      const apiKey = process.env.AI_API_KEY;

      if (!apiKey || apiKey === 'your-stability-ai-key') {
        // Demo mode: return a placeholder for development
        generation.status = 'completed';
        generation.resultImage = {
          url: `https://picsum.photos/seed/${generation._id}/${width || 1024}/${height || 1024}`,
        };
        generation.processingTime = Date.now() - startTime;
        await generation.save();

        user.aiGenerationsToday += 1;
        user.aiGenerationsTotal += 1;
        await user.save();

        return ApiResponse.success(res, {
          generation,
          imageUrl: generation.resultImage.url,
          message: 'Demo mode: Using placeholder image. Set AI_API_KEY for real generation.',
        });
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          text_prompts: [
            { text: prompt, weight: 1 },
            ...(negativePrompt ? [{ text: negativePrompt, weight: -1 }] : []),
          ],
          cfg_scale: 7,
          width: width || 1024,
          height: height || 1024,
          steps: 30,
          samples: 1,
          style_preset: style || 'photographic',
          ...(seed ? { seed } : {}),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'AI API request failed');
      }

      const data = await response.json();
      const imageBase64 = data.artifacts[0].base64;

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(
        `data:image/png;base64,${imageBase64}`,
        { folder: 'picup/ai-generated' }
      );

      generation.status = 'completed';
      generation.resultImage = {
        url: uploadResult.url,
        publicId: uploadResult.publicId,
      };
      generation.processingTime = Date.now() - startTime;
      await generation.save();

      // Update user limits
      user.aiGenerationsToday += 1;
      user.aiGenerationsTotal += 1;
      await user.save();

      ApiResponse.success(res, {
        generation,
        imageUrl: uploadResult.url,
      }, 'Image generated successfully');
    } catch (apiError) {
      generation.status = 'failed';
      generation.error = apiError.message;
      await generation.save();
      throw apiError;
    }
  } catch (error) {
    next(error);
  }
};

// Get user's AI generations
exports.getMyGenerations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [generations, total] = await Promise.all([
      AIGeneration.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AIGeneration.countDocuments({ user: req.user._id }),
    ]);

    const user = await User.findById(req.user._id);
    user.checkAiReset();

    ApiResponse.success(res, {
      generations,
      usage: {
        today: user.aiGenerationsToday,
        limit: user.aiDailyLimit,
        total: user.aiGenerationsTotal,
        remaining: Math.max(0, user.aiDailyLimit - user.aiGenerationsToday),
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get generation status
exports.getGenerationStatus = async (req, res, next) => {
  try {
    const generation = await AIGeneration.findById(req.params.id);
    if (!generation) return ApiResponse.notFound(res, 'Generation not found');

    if (generation.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return ApiResponse.forbidden(res);
    }

    ApiResponse.success(res, generation);
  } catch (error) {
    next(error);
  }
};

// Get available styles
exports.getStyles = async (req, res) => {
  const styles = [
    { id: 'photographic', name: 'Photographic', description: 'Realistic photo style' },
    { id: 'digital-art', name: 'Digital Art', description: 'Digital artwork style' },
    { id: 'anime', name: 'Anime', description: 'Japanese anime style' },
    { id: 'comic-book', name: 'Comic Book', description: 'Comic book illustration' },
    { id: 'fantasy-art', name: 'Fantasy Art', description: 'Fantasy artwork' },
    { id: 'analog-film', name: 'Analog Film', description: 'Vintage film look' },
    { id: 'neon-punk', name: 'Neon Punk', description: 'Neon cyberpunk style' },
    { id: 'isometric', name: 'Isometric', description: '3D isometric view' },
    { id: 'origami', name: 'Origami', description: 'Paper folding art' },
    { id: 'low-poly', name: 'Low Poly', description: 'Low polygon 3D style' },
    { id: '3d-model', name: '3D Model', description: '3D rendered look' },
    { id: 'cinematic', name: 'Cinematic', description: 'Movie-like cinematography' },
    { id: 'pixel-art', name: 'Pixel Art', description: 'Retro pixel art' },
    { id: 'line-art', name: 'Line Art', description: 'Clean line drawing' },
  ];

  ApiResponse.success(res, styles);
};
