const LoginLog = require('../models/LoginLog');
const DailyStats = require('../models/DailyStats');
const User = require('../models/User');

/**
 * Parse user-agent string into browser, OS, and device type.
 * Lightweight — no external dependency.
 */
function parseUserAgent(ua = '') {
  const result = { browser: 'Unknown', os: 'Unknown', deviceType: 'unknown' };

  // Browser detection
  if (/Edg\//i.test(ua)) result.browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) result.browser = 'Opera';
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) result.browser = 'Chrome';
  else if (/Firefox/i.test(ua)) result.browser = 'Firefox';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) result.browser = 'Safari';
  else if (/MSIE|Trident/i.test(ua)) result.browser = 'IE';

  // OS detection
  if (/Windows/i.test(ua)) result.os = 'Windows';
  else if (/Mac OS X|macOS/i.test(ua)) result.os = 'macOS';
  else if (/Android/i.test(ua)) result.os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) result.os = 'iOS';
  else if (/Linux/i.test(ua)) result.os = 'Linux';
  else if (/CrOS/i.test(ua)) result.os = 'ChromeOS';

  // Device type
  if (/Mobile|Android.*Mobile|iPhone|iPod/i.test(ua)) result.deviceType = 'mobile';
  else if (/iPad|Android(?!.*Mobile)|Tablet/i.test(ua)) result.deviceType = 'tablet';
  else if (/Windows|Mac OS|Linux|CrOS/i.test(ua)) result.deviceType = 'desktop';

  return result;
}

/**
 * Mask IP address for privacy compliance.
 * IPv4: 192.168.1.100 → 192.168.xxx.xxx
 * IPv6: first 4 groups kept, rest masked
 */
function maskIP(ip = '') {
  if (!ip) return '';

  // Handle IPv6-mapped IPv4 (::ffff:192.168.1.100)
  const v4Match = ip.match(/(?:::ffff:)?(\d+\.\d+\.\d+\.\d+)/i);
  if (v4Match) {
    const parts = v4Match[1].split('.');
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }

  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length > 4) {
      return parts.slice(0, 4).join(':') + ':xxxx:xxxx:xxxx:xxxx';
    }
  }

  return ip;
}

/**
 * Lightweight geo lookup using free ip-api.com (no key, 45 req/min).
 * Returns { country, city, region } or nulls.
 * NEVER blocks login flow — fails silently.
 */
async function geoLookup(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
    return { country: 'Local', city: 'Local', region: 'Local' };
  }

  try {
    // Clean up IP: strip ::ffff: prefix or port
    let cleanIP = ip.replace(/^::ffff:/i, '');
    cleanIP = cleanIP.split(':')[0]; // strip port from IPv4

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2s hard timeout

    const response = await fetch(`http://ip-api.com/json/${cleanIP}?fields=status,country,city,regionName`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return { country: null, city: null, region: null };
    const data = await response.json();

    if (data.status === 'success') {
      return {
        country: data.country || null,
        city: data.city || null,
        region: data.regionName || null,
      };
    }
  } catch {
    // Silently fail — never block login
  }

  return { country: null, city: null, region: null };
}

/**
 * Track login analytics. Fire-and-forget — never blocks the login response.
 * @param {Object} params
 * @param {Object} params.user - Mongoose user document
 * @param {string} params.ip - Raw IP address
 * @param {string} params.userAgent - User-Agent header
 * @param {string} params.method - 'email' | 'google' | 'github'
 */
async function trackLogin({ user, ip, userAgent, method = 'email' }) {
  try {
    const rawIP = ip || '';
    const maskedIP = maskIP(rawIP);
    const { browser, os, deviceType } = parseUserAgent(userAgent);
    const geo = await geoLookup(rawIP);

    // Create login log
    await LoginLog.create({
      user: user._id,
      email: user.email,
      ip: rawIP,
      ipMasked: maskedIP,
      userAgent,
      method,
      success: true,
      browser,
      os,
      deviceType,
      country: geo.country,
      city: geo.city,
      region: geo.region,
    });

    // Update user login metadata (non-blocking)
    const deviceLabel = `${browser} on ${os}`;
    await User.findByIdAndUpdate(user._id, {
      lastLogin: new Date(),
      lastLoginIP: maskedIP,
      lastLoginDevice: deviceLabel,
      lastLoginCountry: geo.country || '',
      isActiveToday: true,
      $inc: { loginCount: 0 }, // loginCount already incremented in auth controller
    });

    // Increment daily stats
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const methodKey = `loginsByMethod.${method}`;
    const deviceKey = `loginsByDevice.${deviceType}`;

    await DailyStats.findOneAndUpdate(
      { date: today },
      {
        $inc: {
          logins: 1,
          [methodKey]: 1,
          [deviceKey]: 1,
        },
        $setOnInsert: { date: today },
      },
      { upsert: true }
    );
  } catch (err) {
    // Never let tracking errors propagate
    console.error('[LoginTracker] Error:', err.message);
  }
}

/**
 * Get today's date string in YYYY-MM-DD
 */
function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  trackLogin,
  parseUserAgent,
  maskIP,
  geoLookup,
  getTodayStr,
};
