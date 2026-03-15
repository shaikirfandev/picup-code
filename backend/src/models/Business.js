const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: 200,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
      default: '',
    },
    logo: {
      url: String,
      publicId: String,
    },
    website: String,
    industry: String,
    // Team members with roles
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: {
          type: String,
          enum: ['admin', 'manager', 'analyst', 'viewer'],
          default: 'viewer',
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    // Linked ad accounts
    adAccounts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdAccount',
      },
    ],
    // Billing
    billing: {
      companyName: String,
      address: String,
      taxId: String,
      email: String,
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'closed'],
      default: 'active',
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

businessSchema.index({ owner: 1 });
businessSchema.index({ 'members.user': 1 });
businessSchema.index({ status: 1 });

module.exports = mongoose.model('Business', businessSchema);
