const mongoose = require('mongoose');

const adReportTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Report template name is required'],
      trim: true,
      maxlength: 200,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: { type: String, maxlength: 500, default: '' },
    // Selected metrics for this report
    metrics: {
      type: [String],
      default: ['impressions', 'clicks', 'conversions', 'ctr', 'cpc'],
      enum: [
        'impressions', 'reach', 'clicks', 'conversions',
        'engagement', 'ctr', 'cpc', 'cpm',
        'costPerConversion', 'roi', 'spend', 'frequency',
      ],
    },
    // Filter configuration
    filters: {
      campaignIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }],
      adGroupIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AdGroup' }],
      audienceSegments: [String],
      dateRange: {
        start: Date,
        end: Date,
        preset: {
          type: String,
          enum: ['today', 'yesterday', 'last7', 'last30', 'last90', 'custom'],
          default: 'last30',
        },
      },
    },
    // Presentation
    groupBy: {
      type: String,
      enum: ['day', 'week', 'month', 'campaign', 'adGroup', 'audience'],
      default: 'day',
    },
    exportFormat: {
      type: String,
      enum: ['csv', 'pdf', 'json'],
      default: 'csv',
    },
    isTemplate: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

adReportTemplateSchema.index({ owner: 1 });

module.exports = mongoose.model('AdReportTemplate', adReportTemplateSchema);
