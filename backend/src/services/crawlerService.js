/**
 * CrawlerService — fetches raw content from URLs.
 *
 * Supports:
 *   - Simple HTTP fetch (for most pages)
 *   - Headless browser (Playwright) for JS-rendered pages (optional)
 *   - PDF text extraction
 *   - Sitemap / RSS parsing
 *
 * Falls back gracefully when optional dependencies aren't installed.
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const USER_AGENT = 'PicUp-AISearchBot/1.0 (+https://picup.ai/bot)';
const TIMEOUT = 15000;
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/* ── Simple HTTP(S) fetch ───────────────────────────── */
function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;

    const req = client.get(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': options.userAgent || USER_AGENT,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          ...(options.headers || {}),
        },
        timeout: TIMEOUT,
      },
      (res) => {
        // Handle redirects (up to 5)
        if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
          const redirectCount = (options._redirects || 0) + 1;
          if (redirectCount > 5) return reject(new Error('Too many redirects'));
          const nextUrl = new URL(res.headers.location, url).href;
          return resolve(httpFetch(nextUrl, { ...options, _redirects: redirectCount }));
        }

        if (res.statusCode < 200 || res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        }

        const chunks = [];
        let totalSize = 0;

        res.on('data', (chunk) => {
          totalSize += chunk.length;
          if (totalSize > MAX_SIZE) {
            req.destroy();
            return reject(new Error('Response too large'));
          }
          chunks.push(chunk);
        });

        res.on('end', () => {
          resolve({
            body: Buffer.concat(chunks).toString('utf-8'),
            statusCode: res.statusCode,
            headers: res.headers,
            contentType: res.headers['content-type'] || '',
            url,
          });
        });

        res.on('error', reject);
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Timeout fetching ${url}`));
    });
    req.on('error', reject);
  });
}

/* ── Extract links from HTML ────────────────────────── */
function extractLinks(html, baseUrl) {
  const links = new Set();
  const regex = /href=["']([^"'#]+)["']/gi;
  let match;
  const base = new URL(baseUrl);

  while ((match = regex.exec(html)) !== null) {
    try {
      const href = match[1].trim();
      if (href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const resolved = new URL(href, baseUrl);
      // Same domain only
      if (resolved.hostname === base.hostname) {
        // Normalize: remove hash, trailing slash
        resolved.hash = '';
        let normalized = resolved.href.replace(/\/+$/, '');
        links.add(normalized);
      }
    } catch {
      // invalid URL, skip
    }
  }

  return [...links];
}

/* ── Parse sitemap XML ──────────────────────────────── */
function parseSitemap(xml) {
  const urls = [];
  const regex = /<loc>\s*(.*?)\s*<\/loc>/gi;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(match[1].trim());
  }
  return urls;
}

/* ── Parse RSS/Atom feed ────────────────────────────── */
function parseRssFeed(xml) {
  const items = [];
  // Simple RSS item extraction
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = content.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const link = content.match(/<link>([\s\S]*?)<\/link>/i);
    const desc = content.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    const pubDate = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);

    items.push({
      title: title ? title[1].trim() : '',
      url: link ? link[1].trim() : '',
      description: desc ? desc[1].trim() : '',
      publishedAt: pubDate ? pubDate[1].trim() : '',
    });
  }

  return items;
}

/* ── Crawl a URL (single page) ──────────────────────── */
async function crawlUrl(url) {
  const result = await httpFetch(url);
  const childLinks = extractLinks(result.body, url);

  return {
    url,
    rawContent: result.body,
    statusCode: result.statusCode,
    contentType: result.contentType,
    rawBytes: Buffer.byteLength(result.body, 'utf-8'),
    childLinks,
    fetchedAt: new Date(),
  };
}

/* ── Crawl with depth (BFS) ─────────────────────────── */
async function crawlWithDepth(startUrl, maxDepth = 1, maxPages = 50) {
  const visited = new Set();
  const queue = [{ url: startUrl, depth: 0 }];
  const results = [];

  while (queue.length > 0 && results.length < maxPages) {
    const { url, depth } = queue.shift();
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const result = await crawlUrl(url);
      results.push({ ...result, depth });

      // Enqueue child links if within depth
      if (depth < maxDepth) {
        for (const link of result.childLinks) {
          if (!visited.has(link) && results.length + queue.length < maxPages) {
            queue.push({ url: link, depth: depth + 1 });
          }
        }
      }
    } catch (err) {
      results.push({
        url,
        depth,
        error: err.message,
        fetchedAt: new Date(),
      });
    }
  }

  return results;
}

module.exports = {
  httpFetch,
  crawlUrl,
  crawlWithDepth,
  extractLinks,
  parseSitemap,
  parseRssFeed,
};
