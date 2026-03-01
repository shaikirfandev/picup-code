require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Post = require('../models/Post');
const PostEvent = require('../models/PostEvent');
const PostAnalyticsDaily = require('../models/PostAnalyticsDaily');
const CreatorAnalyticsSnapshot = require('../models/CreatorAnalyticsSnapshot');
const AffiliateClick = require('../models/AffiliateClick');

async function diagnose() {
  await mongoose.connect(process.env.MONGODB_URI);

  // 1. Check Post model field for user
  const samplePost = await Post.findOne({}).select('author user title').lean();
  console.log('Sample Post:', JSON.stringify(samplePost, null, 2));

  // 2. Check paid user IDs
  const User = require('../models/User');
  const paidUsers = await User.find({ accountType: 'paid' }).select('_id username').lean();
  console.log('\nPaid users:', JSON.stringify(paidUsers, null, 2));

  // 3. Check if paid users have posts
  for (const u of paidUsers) {
    const postCount = await Post.countDocuments({ author: u._id });
    console.log(`${u.username} (${u._id}): ${postCount} posts (by author field)`);
    const postCountUser = await Post.countDocuments({ user: u._id });
    console.log(`${u.username} (${u._id}): ${postCountUser} posts (by user field)`);
  }

  // 4. Check seed analytics data - what ownerIds exist?
  const eventOwners = await PostEvent.distinct('ownerId');
  console.log(`\nPostEvent distinct ownerIds (${eventOwners.length}):`, eventOwners.slice(0, 5).map(String));

  const dailyOwners = await PostAnalyticsDaily.distinct('ownerId');
  console.log(`PostAnalyticsDaily distinct ownerIds (${dailyOwners.length}):`, dailyOwners.slice(0, 5).map(String));

  const snapOwners = await CreatorAnalyticsSnapshot.distinct('userId');
  console.log(`CreatorAnalyticsSnapshot distinct userIds (${snapOwners.length}):`, snapOwners.slice(0, 5).map(String));

  // 5. Check if any paid user has analytics data
  for (const u of paidUsers) {
    const events = await PostEvent.countDocuments({ ownerId: u._id });
    const daily = await PostAnalyticsDaily.countDocuments({ ownerId: u._id });
    const snaps = await CreatorAnalyticsSnapshot.countDocuments({ userId: u._id });
    console.log(`\n${u.username}: ${events} events, ${daily} daily, ${snaps} snapshots`);
  }

  // 6. Check what the seed actually stored as ownerId vs post.author
  const someEvents = await PostEvent.find({}).select('postId ownerId').limit(3).lean();
  console.log('\nSample PostEvents:', JSON.stringify(someEvents, null, 2));

  for (const ev of someEvents) {
    const post = await Post.findById(ev.postId).select('author user').lean();
    console.log(`  PostEvent ownerId=${ev.ownerId} -> Post.author=${post?.author}, Post.user=${post?.user}`);
  }

  await mongoose.disconnect();
}
diagnose();
