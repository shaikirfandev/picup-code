const Campaign = require('../models/Campaign');
const CampaignDailyStats = require('../models/CampaignDailyStats');

/**
 * Generates AI-style recommendations based on campaign performance data.
 * In production this would call an ML service; here we use rule-based heuristics.
 */
async function getRecommendations(userId) {
  const campaigns = await Campaign.find({ owner: userId, status: { $in: ['active', 'paused'] } });

  const recommendations = [];

  for (const c of campaigns) {
    const { metrics, budget, targetAudience } = c;

    // Low CTR — improve creatives
    if (metrics.impressions > 500 && metrics.ctr < 1.0) {
      recommendations.push({
        campaignId: c._id,
        campaignName: c.name,
        type: 'improve_creatives',
        priority: 'high',
        title: 'Improve ad creatives',
        description: `Campaign "${c.name}" has a CTR of ${metrics.ctr.toFixed(2)}% which is below the 1% benchmark. Consider refreshing your ad images and copy.`,
        impact: '+30-50% CTR improvement expected',
      });
    }

    // High CPC — adjust audience
    if (metrics.clicks > 50 && metrics.cpc > 2.0) {
      recommendations.push({
        campaignId: c._id,
        campaignName: c.name,
        type: 'adjust_audience',
        priority: 'medium',
        title: 'Adjust audience targeting',
        description: `Campaign "${c.name}" has a CPC of $${metrics.cpc.toFixed(2)}. Try narrowing your audience or excluding low-performing segments.`,
        impact: '-20-40% cost reduction expected',
      });
    }

    // Good performance — increase budget
    if (metrics.ctr > 3.0 && metrics.roi > 1.5 && budget.spent < budget.total * 0.7) {
      recommendations.push({
        campaignId: c._id,
        campaignName: c.name,
        type: 'increase_budget',
        priority: 'medium',
        title: 'Increase budget',
        description: `Campaign "${c.name}" is performing well (CTR: ${metrics.ctr.toFixed(2)}%, ROI: ${metrics.roi.toFixed(1)}x). Consider increasing budget to scale results.`,
        impact: '+25% more conversions at similar ROI',
      });
    }

    // Audience age insight
    if (targetAudience && targetAudience.ageMin <= 25 && targetAudience.ageMax >= 34) {
      recommendations.push({
        campaignId: c._id,
        campaignName: c.name,
        type: 'audience_insight',
        priority: 'low',
        title: 'Age targeting insight',
        description: `Campaign performance increases 35% when targeting users aged 25-34. Consider focusing "${c.name}" on this demographic.`,
        impact: '+35% performance improvement',
      });
    }

    // Schedule-based — best posting times
    const stats = await CampaignDailyStats.find({ campaign: c._id })
      .sort({ ctr: -1 })
      .limit(5);
    if (stats.length > 2) {
      const bestDays = stats.map((s) => s.date.toLocaleDateString('en-US', { weekday: 'long' }));
      recommendations.push({
        campaignId: c._id,
        campaignName: c.name,
        type: 'best_times',
        priority: 'low',
        title: 'Best posting times',
        description: `Your best performing days for "${c.name}" are ${bestDays.slice(0, 3).join(', ')}. Schedule ads to maximize reach.`,
        impact: '+15-20% engagement boost',
      });
    }

    // Low conversions, decent clicks — landing page issue
    if (metrics.clicks > 100 && metrics.conversions < 5) {
      recommendations.push({
        campaignId: c._id,
        campaignName: c.name,
        type: 'landing_page',
        priority: 'high',
        title: 'Optimize landing page',
        description: `Campaign "${c.name}" gets clicks (${metrics.clicks}) but very few conversions (${metrics.conversions}). Review your landing page experience.`,
        impact: '+50-100% conversion rate improvement',
      });
    }
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

/**
 * Media planner: estimate reach / impressions / spend for a hypothetical campaign
 */
function estimateCampaign({ budget, audience, duration, placement }) {
  // Simple estimation model based on platform averages
  const baseCPM = 5.0; // $5 per 1000 impressions
  const placementMultiplier = {
    feed: 1.0,
    sidebar: 0.6,
    banner: 1.3,
    search: 1.5,
    stories: 0.8,
  };

  const avgMultiplier =
    (placement || ['feed']).reduce((sum, p) => sum + (placementMultiplier[p] || 1), 0) /
    (placement || ['feed']).length;

  // Audience size estimation (simplified)
  const ageRange = (audience?.ageMax || 65) - (audience?.ageMin || 18);
  const locationCount = (audience?.locations || []).length || 1;
  const baseAudience = 100000;
  const audienceSize = Math.round(baseAudience * (ageRange / 47) * Math.min(locationCount, 5));

  const effectiveCPM = baseCPM * avgMultiplier;
  const estimatedImpressions = Math.round((budget / effectiveCPM) * 1000);
  const estimatedReach = Math.round(estimatedImpressions * 0.65); // ~65% unique reach
  const estimatedClicks = Math.round(estimatedImpressions * 0.02); // ~2% CTR estimate
  const estimatedConversions = Math.round(estimatedClicks * 0.05); // ~5% conversion
  const estimatedCPC = estimatedClicks > 0 ? parseFloat((budget / estimatedClicks).toFixed(2)) : 0;
  const dailyBudget = duration > 0 ? parseFloat((budget / duration).toFixed(2)) : budget;

  return {
    audienceSize,
    estimatedImpressions,
    estimatedReach,
    estimatedClicks,
    estimatedConversions,
    estimatedCPC,
    estimatedCPM: effectiveCPM,
    dailyBudget,
    totalBudget: budget,
    duration,
  };
}

module.exports = { getRecommendations, estimateCampaign };
