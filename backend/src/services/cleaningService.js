/**
 * CleaningService — removes boilerplate, ads, navigation, scripts,
 * and other junk from raw HTML or text, returning clean prose.
 *
 * Uses a lightweight regex + heuristic approach that works without
 * external dependencies.  Plug in mozilla/readability or trafilatura
 * later for higher fidelity.
 */

/* ── HTML → plain text ──────────────────────────────── */
function stripHtml(html) {
  if (!html) return '';

  let text = html;

  // Remove <script>, <style>, <noscript>, <svg>, <head>
  text = text.replace(/<(script|style|noscript|svg|head)[^>]*>[\s\S]*?<\/\1>/gi, ' ');

  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '');

  // Remove all HTML tags but keep content
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode common entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&[#\w]+;/gi, ' ');

  return text;
}

/* ── Remove boilerplate patterns ────────────────────── */
function removeBoilerplate(text) {
  if (!text) return '';

  const boilerplatePatterns = [
    // Cookie / consent banners
    /we use cookies[\s\S]{0,500}accept/gi,
    /by (continuing|using) this (site|website)[\s\S]{0,300}/gi,
    /cookie (policy|preferences|settings)[\s\S]{0,200}/gi,
    // Newsletter prompts
    /sign up for (our )?newsletter[\s\S]{0,200}/gi,
    /subscribe to (our )?[\s\S]{0,100}(email|newsletter)/gi,
    // Share buttons text
    /share (this|on) (facebook|twitter|linkedin|email|pinterest|reddit)/gi,
    // Footer boilerplate
    /all rights reserved\.?/gi,
    /terms (of (service|use)|and conditions)/gi,
    /privacy policy/gi,
    // Navigation
    /skip to (main )?content/gi,
    /toggle navigation/gi,
    /previous article|next article/gi,
    // Ads
    /advertisement|sponsored content|promoted/gi,
  ];

  let cleaned = text;
  for (const pattern of boilerplatePatterns) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  return cleaned;
}

/* ── Normalize whitespace ───────────────────────────── */
function normalizeWhitespace(text) {
  return text
    .replace(/\t/g, ' ')
    .replace(/ {2,}/g, ' ')          // multiple spaces → single
    .replace(/\n{3,}/g, '\n\n')      // 3+ newlines → 2
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n')
    .trim();
}

/* ── Remove short / junk lines ──────────────────────── */
function removeJunkLines(text) {
  return text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      // Skip very short lines that look like menu items
      if (trimmed.length < 3) return false;
      // Skip lines that are mostly numbers / special chars
      const alphaRatio = (trimmed.match(/[a-zA-Z]/g) || []).length / trimmed.length;
      if (trimmed.length < 30 && alphaRatio < 0.4) return false;
      return true;
    })
    .join('\n');
}

/* ── Extract metadata from raw HTML ─────────────────── */
function extractMetadata(html) {
  const meta = {};

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) meta.title = titleMatch[1].trim();

  // OG title
  const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i);
  if (ogTitle) meta.ogTitle = ogTitle[1];

  // Description
  const desc = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  if (desc) meta.description = desc[1];

  // Author
  const author = html.match(/<meta[^>]*name="author"[^>]*content="([^"]*)"[^>]*>/i);
  if (author) meta.author = author[1];

  // Published date
  const pubDate = html.match(/<meta[^>]*property="article:published_time"[^>]*content="([^"]*)"[^>]*>/i)
    || html.match(/<time[^>]*datetime="([^"]*)"[^>]*>/i);
  if (pubDate) meta.publishedAt = pubDate[1];

  // Language
  const lang = html.match(/<html[^>]*lang="([^"]*)"[^>]*>/i);
  if (lang) meta.language = lang[1].substring(0, 2);

  return meta;
}

/* ── Public API ─────────────────────────────────────── */
function cleanHtml(rawHtml) {
  const metadata = extractMetadata(rawHtml);
  let text = stripHtml(rawHtml);
  text = removeBoilerplate(text);
  text = removeJunkLines(text);
  text = normalizeWhitespace(text);
  return { text, metadata };
}

function cleanText(rawText) {
  let text = removeBoilerplate(rawText);
  text = removeJunkLines(text);
  text = normalizeWhitespace(text);
  return { text, metadata: {} };
}

module.exports = {
  cleanHtml,
  cleanText,
  stripHtml,
  removeBoilerplate,
  normalizeWhitespace,
  extractMetadata,
};
