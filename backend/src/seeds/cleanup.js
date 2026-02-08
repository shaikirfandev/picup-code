require('dotenv').config();
const mongoose = require('mongoose');
const CrawlJob = require('../models/CrawlJob');
const Source = require('../models/Source');
const Chunk = require('../models/Chunk');

mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 }).then(async () => {
  console.log('Connected to MongoDB');

  // Fix stuck jobs
  const updated = await CrawlJob.updateMany(
    { stage: { $in: ['chunking', 'crawling', 'cleaning', 'embedding', 'indexing'] } },
    { $set: { stage: 'failed', error: 'Cleaned up', completedAt: new Date() } }
  );
  console.log('Fixed stuck jobs:', updated.modifiedCount);

  // Remove sources with 0 indexed chunks
  const allSources = await Source.find({});
  for (const src of allSources) {
    const count = await Chunk.countDocuments({ source: src._id, status: 'indexed' });
    if (count === 0) {
      await CrawlJob.deleteMany({ source: src._id });
      await src.deleteOne();
      console.log('Removed empty source:', src.name || src.url);
    }
  }

  // Remove example.com if still present
  const exSrc = await Source.findOne({ url: 'https://example.com' });
  if (exSrc) {
    await Chunk.deleteMany({ source: exSrc._id });
    await CrawlJob.deleteMany({ source: exSrc._id });
    await exSrc.deleteOne();
    console.log('Removed example.com');
  }

  // Delete failed crawl jobs
  const delFailed = await CrawlJob.deleteMany({ stage: 'failed' });
  console.log('Deleted failed jobs:', delFailed.deletedCount);

  const finalSources = await Source.countDocuments();
  const finalChunks = await Chunk.countDocuments({ status: 'indexed' });
  const finalJobs = await CrawlJob.countDocuments();
  console.log(`\nFinal: ${finalSources} sources, ${finalChunks} indexed chunks, ${finalJobs} jobs`);

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
