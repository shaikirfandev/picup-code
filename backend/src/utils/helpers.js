const crypto = require('crypto');

const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

const sanitizeHtml = (text) => {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

const extractHashtags = (text) => {
  const regex = /#(\w+)/g;
  const matches = text.match(regex);
  return matches ? matches.map((tag) => tag.substring(1).toLowerCase()) : [];
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

module.exports = {
  generateSlug,
  generateRandomString,
  sanitizeHtml,
  extractHashtags,
  isValidUrl,
  formatNumber,
};
