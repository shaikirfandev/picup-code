require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Upgrade admin + first 2 demo users to paid
  const result = await User.updateMany(
    { username: { $in: ['admin', 'emma_smith', 'liam_johnson'] } },
    {
      $set: {
        accountType: 'paid',
        'subscription.plan': 'pro',
        'subscription.isActive': true,
        'subscription.startDate': new Date(),
        'subscription.endDate': new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      },
    }
  );
  console.log(`Upgraded ${result.modifiedCount} users to paid/pro`);

  const paid = await User.find({ accountType: 'paid' }).select('username email accountType subscription role').lean();
  console.log(JSON.stringify(paid, null, 2));
  await mongoose.disconnect();
}
run();
