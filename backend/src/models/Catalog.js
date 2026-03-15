const mongoose = require('mongoose');

const catalogSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Catalog name is required'],
      trim: true,
      maxlength: 200,
    },
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: { type: String, maxlength: 500, default: '' },
    productGroups: [
      {
        name: { type: String, required: true },
        description: String,
        filters: {
          category: String,
          priceMin: Number,
          priceMax: Number,
          tags: [String],
        },
      },
    ],
    products: [
      {
        externalId: String,
        name: { type: String, required: true },
        description: String,
        price: { type: Number, default: 0 },
        currency: { type: String, default: 'USD' },
        imageUrl: String,
        productUrl: String,
        category: String,
        tags: [String],
        availability: {
          type: String,
          enum: ['in_stock', 'out_of_stock', 'preorder'],
          default: 'in_stock',
        },
        status: {
          type: String,
          enum: ['active', 'archived'],
          default: 'active',
        },
      },
    ],
    // Feed source
    feedUrl: String,
    feedType: {
      type: String,
      enum: ['manual', 'csv', 'xml', 'api'],
      default: 'manual',
    },
    lastSyncAt: Date,
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

catalogSchema.index({ business: 1 });
catalogSchema.index({ owner: 1 });

module.exports = mongoose.model('Catalog', catalogSchema);
