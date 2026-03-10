/**
 * Blog Seed Script — 30 high-quality technology blog posts
 *
 * Generates:
 *   30 blog posts across all 11 categories with realistic HTML content,
 *   cover images from Unsplash, varied authors, featured flags, and tags.
 *
 * Run:  node src/seeds/seed-blog.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const BlogPost = require('../models/BlogPost');
const User = require('../models/User');

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// ─── Blog articles ──────────────────────────────────────────────────
const articles = [
  {
    title: 'The Future of AI: What to Expect in 2025',
    category: 'ai',
    tags: ['artificial-intelligence', 'machine-learning', 'future-tech', 'gpt'],
    isFeatured: true,
    coverUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&h=630&fit=crop',
    excerpt: 'From multimodal models to AI agents, explore the trends that will define artificial intelligence in 2025 and beyond.',
    content: `
<p>Artificial intelligence has undergone a breathtaking transformation over the past few years. With the emergence of large language models, multimodal systems, and autonomous AI agents, the landscape is shifting faster than ever.</p>

<h2>Multimodal AI Goes Mainstream</h2>
<p>Models that can process text, images, audio, and video simultaneously are no longer experimental. Companies are integrating multimodal capabilities into everything from customer service chatbots to creative tools. Expect to see these systems become the default rather than the exception.</p>

<h2>AI Agents and Autonomous Systems</h2>
<p>The biggest paradigm shift is the move from chatbots to agents — AI systems that can plan, reason, use tools, and execute multi-step tasks with minimal human oversight. From coding assistants that ship features to research agents that compile reports, 2025 will be the year of the agent.</p>

<blockquote>The transition from AI assistants to AI agents represents a fundamental shift in how we interact with technology.</blockquote>

<h2>Regulation and Responsible AI</h2>
<p>Governments worldwide are drafting AI regulation frameworks. The EU AI Act is already in effect, and the US is following with sector-specific guidelines. Companies that invest in responsible AI practices will gain a competitive advantage.</p>

<h2>Key Takeaways</h2>
<ul>
<li>Multimodal AI becomes standard across industries</li>
<li>AI agents will handle increasingly complex workflows</li>
<li>Open-source models continue to close the gap with proprietary ones</li>
<li>Regulation shapes deployment strategies</li>
</ul>

<p>The pace of innovation shows no signs of slowing. Whether you're a developer, entrepreneur, or technology enthusiast, staying informed about these trends is crucial for navigating the AI-driven future.</p>
    `,
  },
  {
    title: 'Building Scalable APIs with Node.js and Express',
    category: 'web-development',
    tags: ['nodejs', 'express', 'api', 'backend', 'rest'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=1200&h=630&fit=crop',
    excerpt: 'A comprehensive guide to building production-ready REST APIs with Node.js, Express, and modern best practices.',
    content: `
<p>Node.js remains one of the most popular choices for backend development. Combined with Express, it provides a lightweight yet powerful foundation for building scalable APIs.</p>

<h2>Project Structure</h2>
<p>A well-organized project structure is the foundation of maintainable code. Follow the separation of concerns principle:</p>
<pre><code>src/
  controllers/    # Request handlers
  middleware/     # Auth, validation, rate limiting
  models/         # Database schemas
  routes/         # Route definitions
  utils/          # Helper functions
  config/         # Configuration files
  server.js       # Entry point</code></pre>

<h2>Middleware Stack</h2>
<p>Essential middleware for production APIs includes rate limiting, CORS configuration, request validation, and error handling. Using libraries like <code>express-rate-limit</code> and <code>joi</code> can save significant development time.</p>

<h2>Error Handling</h2>
<p>Implement a global error handler that catches both synchronous and asynchronous errors. Use a custom error class to standardize error responses across your API:</p>
<pre><code>class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}</code></pre>

<h2>Performance Tips</h2>
<ul>
<li>Use connection pooling for database connections</li>
<li>Implement response caching with Redis</li>
<li>Enable gzip compression</li>
<li>Use PM2 or cluster mode for multi-core utilization</li>
<li>Add pagination to all list endpoints</li>
</ul>

<p>Building a scalable API is about making smart architectural decisions from the start. Focus on clean code, proper error handling, and performance optimization.</p>
    `,
  },
  {
    title: 'Next.js 14: The Complete Guide to App Router',
    category: 'web-development',
    tags: ['nextjs', 'react', 'app-router', 'ssr', 'typescript'],
    isFeatured: true,
    coverUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=630&fit=crop',
    excerpt: 'Master the Next.js App Router with server components, streaming, and the latest patterns for modern web apps.',
    content: `
<p>Next.js 14 solidifies the App Router as the recommended way to build React applications. With server components as the default, streaming, and powerful data fetching patterns, it represents a paradigm shift in how we think about web development.</p>

<h2>Server Components by Default</h2>
<p>In the App Router, every component is a React Server Component (RSC) by default. This means components render on the server, reducing the JavaScript bundle sent to the client. Only components that need interactivity should use the <code>'use client'</code> directive.</p>

<h2>Data Fetching Patterns</h2>
<p>Gone are <code>getServerSideProps</code> and <code>getStaticProps</code>. Instead, you fetch data directly in server components using async/await:</p>
<pre><code>async function BlogPage() {
  const posts = await fetch('/api/posts', {
    next: { revalidate: 3600 }
  }).then(r => r.json());
  
  return &lt;PostGrid posts={posts} /&gt;;
}</code></pre>

<h2>Route Groups and Layouts</h2>
<p>Route groups (using parentheses in folder names) let you organize routes without affecting the URL structure. Combined with nested layouts, you can create sophisticated page structures with shared UI elements.</p>

<h2>Streaming and Suspense</h2>
<p>Use <code>loading.tsx</code> files and React Suspense boundaries to stream content progressively. This dramatically improves perceived performance by showing users a meaningful UI immediately while slower data loads in the background.</p>

<h2>Migration Tips</h2>
<ul>
<li>Start by moving pages incrementally — both routers can coexist</li>
<li>Convert data fetching to server component patterns</li>
<li>Identify client-interactive components and add 'use client'</li>
<li>Leverage parallel routes for complex layouts</li>
</ul>
    `,
  },
  {
    title: 'Docker for Full-Stack Developers: A Practical Guide',
    category: 'cloud',
    tags: ['docker', 'containers', 'devops', 'deployment', 'microservices'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1200&h=630&fit=crop',
    excerpt: 'Learn how to containerize your full-stack applications with Docker and Docker Compose for consistent development and deployment.',
    content: `
<p>Docker has become an essential tool for modern developers. By packaging applications and their dependencies into containers, Docker ensures consistency across development, testing, and production environments.</p>

<h2>Why Docker?</h2>
<p>Ever heard "it works on my machine"? Docker eliminates this problem entirely. Every developer gets the same environment, and what you test locally is exactly what runs in production.</p>

<h2>Multi-stage Builds</h2>
<p>Use multi-stage builds to keep your production images lean:</p>
<pre><code># Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]</code></pre>

<h2>Docker Compose for Full-Stack</h2>
<p>Docker Compose orchestrates multi-container applications. A typical full-stack setup includes your frontend, backend, database, and reverse proxy — all defined in a single YAML file.</p>

<h2>Best Practices</h2>
<ul>
<li>Use <code>.dockerignore</code> to exclude unnecessary files</li>
<li>Pin base image versions for reproducibility</li>
<li>Run as non-root user in production</li>
<li>Use health checks for container orchestration</li>
<li>Leverage build cache by ordering Dockerfile instructions correctly</li>
</ul>

<p>Docker simplifies deployment and ensures your application runs the same way everywhere. Start by containerizing one service, then gradually adopt it across your entire stack.</p>
    `,
  },
  {
    title: 'React Native vs Flutter: Choosing the Right Framework in 2025',
    category: 'mobile',
    tags: ['react-native', 'flutter', 'mobile-development', 'cross-platform'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=1200&h=630&fit=crop',
    excerpt: 'An honest comparison of React Native and Flutter for cross-platform mobile development — performance, ecosystem, and developer experience.',
    content: `
<p>The cross-platform mobile development landscape is dominated by two frameworks: React Native and Flutter. Both have matured significantly, but they take fundamentally different approaches to building mobile apps.</p>

<h2>Architecture</h2>
<p>React Native bridges JavaScript to native components, while Flutter uses its own rendering engine (Skia/Impeller) to draw every pixel. This architectural difference impacts everything from performance to UI customization.</p>

<h2>Performance</h2>
<p>Flutter's Impeller rendering engine delivers consistently smooth 60/120fps animations. React Native has closed the gap significantly with the New Architecture (Fabric + TurboModules + JSI), but Flutter still has an edge in graphics-intensive applications.</p>

<h2>Developer Experience</h2>
<p>If your team knows JavaScript/TypeScript, React Native has a gentler learning curve. Flutter requires learning Dart, but its widget-based approach and excellent DevTools make for a productive development experience once you're up to speed.</p>

<h2>Ecosystem Comparison</h2>
<table>
<tr><th>Factor</th><th>React Native</th><th>Flutter</th></tr>
<tr><td>Language</td><td>JavaScript/TypeScript</td><td>Dart</td></tr>
<tr><td>UI Approach</td><td>Native components</td><td>Custom rendering</td></tr>
<tr><td>Hot Reload</td><td>✅ Fast Refresh</td><td>✅ Hot Reload</td></tr>
<tr><td>Web Support</td><td>Via React Native Web</td><td>Built-in</td></tr>
<tr><td>Desktop</td><td>Limited</td><td>Excellent</td></tr>
</table>

<h2>When to Choose What</h2>
<ul>
<li><strong>React Native:</strong> JS/TS team, heavy native module usage, existing React codebase</li>
<li><strong>Flutter:</strong> Pixel-perfect custom UIs, multi-platform (mobile + web + desktop), greenfield projects</li>
</ul>
    `,
  },
  {
    title: 'Cybersecurity Essentials Every Developer Should Know',
    category: 'cybersecurity',
    tags: ['security', 'owasp', 'authentication', 'encryption', 'best-practices'],
    isFeatured: true,
    coverUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&h=630&fit=crop',
    excerpt: 'Essential cybersecurity practices for developers — from input validation to JWT best practices and beyond.',
    content: `
<p>Security is not optional. As a developer, understanding cybersecurity fundamentals is just as important as mastering your framework of choice. Here are the essential practices every developer should follow.</p>

<h2>OWASP Top 10: The Essentials</h2>
<p>The OWASP Top 10 is the industry standard for web application security. The most critical vulnerabilities include injection attacks, broken authentication, and security misconfiguration.</p>

<h2>Input Validation</h2>
<p>Never trust user input. Validate on both client and server side. Use parameterized queries (never string concatenation) for database operations:</p>
<pre><code>// Bad — SQL injection vulnerable
db.query("SELECT * FROM users WHERE id = " + userId);

// Good — parameterized
db.query("SELECT * FROM users WHERE id = $1", [userId]);</code></pre>

<h2>Authentication Best Practices</h2>
<ul>
<li>Use bcrypt or Argon2 for password hashing (never MD5/SHA)</li>
<li>Implement rate limiting on login endpoints</li>
<li>Use short-lived JWTs with refresh token rotation</li>
<li>Enable multi-factor authentication (MFA)</li>
<li>Store tokens securely (httpOnly cookies, not localStorage)</li>
</ul>

<h2>HTTPS Everywhere</h2>
<p>All traffic must be encrypted. Use TLS 1.3 where possible, configure HSTS headers, and regularly rotate SSL certificates. Free certificates from Let's Encrypt make this a no-excuse requirement.</p>

<blockquote>Security is a process, not a product. Regular audits, dependency updates, and security training are essential.</blockquote>

<h2>Common Mistakes</h2>
<ul>
<li>Exposing sensitive data in error messages</li>
<li>Leaving debug mode on in production</li>
<li>Not validating file uploads (type, size, content)</li>
<li>Storing secrets in source code instead of environment variables</li>
</ul>
    `,
  },
  {
    title: 'TypeScript 5.x: Advanced Types and Patterns',
    category: 'web-development',
    tags: ['typescript', 'types', 'generics', 'utility-types', 'patterns'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=630&fit=crop',
    excerpt: 'Deep dive into advanced TypeScript patterns — conditional types, template literal types, and real-world generics.',
    content: `
<p>TypeScript has evolved far beyond simple type annotations. Modern TypeScript offers a powerful type system that can express complex constraints, infer types from runtime patterns, and catch entire categories of bugs at compile time.</p>

<h2>Conditional Types</h2>
<p>Conditional types let you create types that depend on a condition:</p>
<pre><code>type IsString&lt;T&gt; = T extends string ? 'yes' : 'no';
type Result = IsString&lt;'hello'&gt;; // 'yes'

// Practical: extract return type of async functions
type AsyncReturnType&lt;T&gt; = T extends (...args: any[]) => Promise&lt;infer R&gt; ? R : never;</code></pre>

<h2>Template Literal Types</h2>
<p>TypeScript 4.1+ supports template literal types, enabling typed string manipulation:</p>
<pre><code>type EventName = 'click' | 'focus' | 'blur';
type Handler = \`on\${Capitalize&lt;EventName&gt;}\`;
// 'onClick' | 'onFocus' | 'onBlur'</code></pre>

<h2>Discriminated Unions</h2>
<p>Use discriminated unions for type-safe state management:</p>
<pre><code>type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: string };

function render(state: State) {
  switch (state.status) {
    case 'success': return state.data; // TypeScript knows data exists
    case 'error': return state.error;  // TypeScript knows error exists
  }
}</code></pre>

<h2>Utility Types You Should Know</h2>
<ul>
<li><code>Partial&lt;T&gt;</code> — make all properties optional</li>
<li><code>Required&lt;T&gt;</code> — make all properties required</li>
<li><code>Pick&lt;T, K&gt;</code> — select specific properties</li>
<li><code>Omit&lt;T, K&gt;</code> — exclude specific properties</li>
<li><code>Record&lt;K, V&gt;</code> — typed object keys and values</li>
<li><code>ReturnType&lt;T&gt;</code> — extract function return type</li>
</ul>
    `,
  },
  {
    title: 'The Rise of Edge Computing: Beyond the Cloud',
    category: 'cloud',
    tags: ['edge-computing', 'serverless', 'cdn', 'latency', 'cloudflare'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop',
    excerpt: 'How edge computing is reshaping application architecture by bringing computation closer to users.',
    content: `
<p>Edge computing is transforming how we build and deploy applications. By moving computation from centralized data centers to the network edge — closer to end users — we can drastically reduce latency and improve user experience.</p>

<h2>What Is Edge Computing?</h2>
<p>Instead of routing all requests to a single origin server, edge computing runs your code on servers distributed globally. Platforms like Cloudflare Workers, Vercel Edge Functions, and Deno Deploy make this accessible to any developer.</p>

<h2>Use Cases</h2>
<ul>
<li><strong>API routing and middleware</strong> — Auth checks, A/B testing, geo-routing at the edge</li>
<li><strong>Personalization</strong> — Customize content based on location, device, or user preferences without round-trips to origin</li>
<li><strong>Image optimization</strong> — Transform and serve images from the nearest edge node</li>
<li><strong>Real-time data processing</strong> — IoT sensor data, analytics events, and streaming</li>
</ul>

<h2>Edge vs. Serverless</h2>
<p>While serverless functions (like AWS Lambda) run in specific regions, edge functions run in 200+ locations globally. The tradeoff is that edge environments are more constrained — limited runtime APIs, smaller memory, shorter execution times.</p>

<h2>The Edge Database Challenge</h2>
<p>Data locality is the biggest challenge. Solutions like Turso (libSQL), PlanetScale, and Cloudflare D1 are addressing this by replicating data to edge locations. The ecosystem is maturing rapidly.</p>

<blockquote>The best edge architecture combines edge compute for latency-sensitive operations with traditional servers for complex business logic.</blockquote>
    `,
  },
  {
    title: 'Building a Design System with Tailwind CSS',
    category: 'web-development',
    tags: ['tailwind', 'css', 'design-system', 'ui', 'components'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=630&fit=crop',
    excerpt: 'How to build a consistent, scalable design system using Tailwind CSS — from tokens to components.',
    content: `
<p>A design system ensures visual consistency across your application. Tailwind CSS, with its utility-first approach and powerful configuration system, is an excellent foundation for building one.</p>

<h2>Design Tokens</h2>
<p>Start by defining your design tokens in <code>tailwind.config.js</code>. These are the primitive values that everything else builds upon:</p>
<pre><code>module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { 50: '#eff6ff', 500: '#3b82f6', 900: '#1e3a8a' },
        surface: { DEFAULT: '#ffffff', dark: '#0f172a' },
      },
      fontFamily: {
        display: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        card: '12px',
      },
    },
  },
};</code></pre>

<h2>Component Patterns</h2>
<p>Create reusable component classes using Tailwind's <code>@apply</code> directive for frequently used patterns, but prefer composition for most components:</p>
<pre><code>/* globals.css */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary-500 text-white rounded-lg 
           font-medium transition-all hover:bg-primary-600 
           focus:ring-2 focus:ring-primary-500/50;
  }
}</code></pre>

<h2>Dark Mode</h2>
<p>Tailwind's class-based dark mode strategy works perfectly with CSS custom properties. Define your color tokens as CSS variables, then swap them based on a class on the root element.</p>

<h2>Checklist</h2>
<ul>
<li>Define color, spacing, and typography tokens</li>
<li>Create base component styles (buttons, inputs, cards)</li>
<li>Document components with Storybook</li>
<li>Ensure WCAG AA contrast ratios</li>
<li>Test across viewport sizes</li>
</ul>
    `,
  },
  {
    title: 'MongoDB Aggregation Pipeline: Advanced Queries',
    category: 'tutorials',
    tags: ['mongodb', 'database', 'aggregation', 'nosql', 'performance'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=1200&h=630&fit=crop',
    excerpt: 'Master MongoDB aggregation pipelines with practical examples — from basic grouping to complex multi-stage transformations.',
    content: `
<p>The MongoDB aggregation pipeline is one of the most powerful features of the database. It allows you to process data through a sequence of stages, each transforming the documents in some way.</p>

<h2>Basic Pipeline Stages</h2>
<p>The most commonly used stages are <code>$match</code>, <code>$group</code>, <code>$sort</code>, <code>$project</code>, and <code>$lookup</code>:</p>
<pre><code>db.orders.aggregate([
  { $match: { status: 'completed' } },
  { $group: {
    _id: '$category',
    totalRevenue: { $sum: '$amount' },
    count: { $sum: 1 },
    avgOrder: { $avg: '$amount' }
  }},
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 }
]);</code></pre>

<h2>$lookup for Joins</h2>
<p>MongoDB isn't purely "no joins" — the <code>$lookup</code> stage performs left outer joins:</p>
<pre><code>{ $lookup: {
  from: 'users',
  localField: 'authorId',
  foreignField: '_id',
  as: 'author'
}},
{ $unwind: '$author' }</code></pre>

<h2>Window Functions with $setWindowFields</h2>
<p>Added in MongoDB 5.0, window functions enable running totals, rankings, and moving averages directly in the pipeline — capabilities that previously required application-level processing.</p>

<h2>Performance Tips</h2>
<ul>
<li>Put <code>$match</code> early in the pipeline to reduce documents processed</li>
<li>Use <code>$project</code> to limit fields and reduce memory usage</li>
<li>Create indexes that support your <code>$match</code> and <code>$sort</code> stages</li>
<li>Use <code>explain()</code> to analyze pipeline performance</li>
<li>Consider <code>allowDiskUse: true</code> for large datasets</li>
</ul>
    `,
  },
  {
    title: 'iPhone 16 Pro Review: A Year of Living with Apple Intelligence',
    category: 'gadgets',
    tags: ['iphone', 'apple', 'review', 'smartphone', 'apple-intelligence'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=1200&h=630&fit=crop',
    excerpt: 'After 12 months with the iPhone 16 Pro, here\'s an honest assessment of Apple Intelligence, the camera system, and daily usability.',
    content: `
<p>The iPhone 16 Pro promised to be the gateway to Apple Intelligence. After a full year of daily use, here's an honest assessment of what works, what doesn't, and whether it's worth the upgrade.</p>

<h2>Apple Intelligence: The Real Story</h2>
<p>Apple Intelligence arrived in waves throughout the year. Writing tools, notification summaries, and the enhanced Siri were the first to land. They're useful but not life-changing. The real standout is the on-device processing — your data stays on your phone, which matters for privacy.</p>

<h2>Camera System</h2>
<p>The 48MP main sensor delivers stunning photos in any lighting condition. The 5x telephoto is genuinely useful for street photography and concerts. But the real upgrade is the Photographic Styles 2.0 — real-time color grading that actually looks professional.</p>

<h2>Performance</h2>
<p>The A18 Pro chip is absurdly capable. I've yet to find a task that makes this phone stutter. Gaming, video editing, running local AI models — everything is butter smooth with battery to spare.</p>

<h2>Battery Life</h2>
<p>Easily lasts a full day of heavy use. I consistently finish the day with 20-30% remaining. The USB-C fast charging and MagSafe wireless charging ecosystem is mature and reliable.</p>

<h2>Verdict</h2>
<p><strong>Rating: 8.5/10</strong> — An excellent phone that proves Apple Intelligence is a marathon, not a sprint. The camera alone justifies the upgrade from anything older than the 15 Pro. If you're on a 14 or older, it's a no-brainer.</p>
    `,
  },
  {
    title: 'Getting Started with Kubernetes: A Developer\'s Perspective',
    category: 'cloud',
    tags: ['kubernetes', 'k8s', 'devops', 'containers', 'orchestration'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=1200&h=630&fit=crop',
    excerpt: 'Kubernetes demystified — the essential concepts, commands, and patterns every developer needs to know.',
    content: `
<p>Kubernetes can feel overwhelming at first. But at its core, it's a system for running and managing containerized applications at scale. Let's break down the essential concepts.</p>

<h2>Core Concepts</h2>
<ul>
<li><strong>Pod:</strong> The smallest deployable unit — one or more containers running together</li>
<li><strong>Deployment:</strong> Manages pod replicas and rolling updates</li>
<li><strong>Service:</strong> Stable network endpoint for accessing pods</li>
<li><strong>ConfigMap/Secret:</strong> External configuration and sensitive data</li>
<li><strong>Ingress:</strong> HTTP routing and load balancing</li>
</ul>

<h2>Your First Deployment</h2>
<pre><code>apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
      - name: app
        image: my-app:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "128Mi"
            cpu: "250m"
          limits:
            memory: "256Mi"
            cpu: "500m"</code></pre>

<h2>Essential kubectl Commands</h2>
<pre><code>kubectl get pods                    # List pods
kubectl logs my-pod                 # View logs
kubectl exec -it my-pod -- sh       # Shell into pod
kubectl apply -f deployment.yaml    # Apply config
kubectl rollout status deployment   # Check rollout</code></pre>

<h2>When to Use Kubernetes</h2>
<p>Kubernetes shines when you need auto-scaling, self-healing, rolling deployments, and multi-service orchestration. For simple apps, consider managed platforms like Railway, Render, or Fly.io first.</p>
    `,
  },
  {
    title: 'The Complete Guide to Git Workflow for Teams',
    category: 'tutorials',
    tags: ['git', 'github', 'workflow', 'collaboration', 'version-control'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1556075798-4825dfaaf498?w=1200&h=630&fit=crop',
    excerpt: 'Streamline your team\'s Git workflow with trunk-based development, conventional commits, and automated CI/CD.',
    content: `
<p>A good Git workflow reduces merge conflicts, improves code review quality, and keeps your main branch always deployable. Here's a modern approach that works for teams of all sizes.</p>

<h2>Trunk-Based Development</h2>
<p>Instead of long-lived feature branches, trunk-based development encourages short-lived branches that merge into main (trunk) frequently — ideally daily. This reduces integration pain and encourages continuous delivery.</p>

<h2>Conventional Commits</h2>
<p>Standardize your commit messages for automated changelogs and semantic versioning:</p>
<pre><code>feat: add user authentication with OAuth
fix: resolve race condition in checkout flow
docs: update API documentation for v2 endpoints
refactor: extract payment logic into service class
chore: upgrade dependencies to latest versions</code></pre>

<h2>Branch Naming</h2>
<pre><code>feature/TICKET-123-add-search
fix/TICKET-456-login-redirect
chore/update-dependencies</code></pre>

<h2>Code Review Best Practices</h2>
<ul>
<li>Keep PRs small (under 400 lines of diff)</li>
<li>Write descriptive PR descriptions with context</li>
<li>Use draft PRs for early feedback</li>
<li>Review code, not the person</li>
<li>Automate what you can (linting, formatting, tests)</li>
</ul>

<h2>Protected Main Branch</h2>
<p>Configure branch protection rules: require PR reviews, passing CI, and up-to-date branches before merging. This ensures your main branch is always in a deployable state.</p>
    `,
  },
  {
    title: 'Rust for JavaScript Developers: Why You Should Care',
    category: 'software',
    tags: ['rust', 'javascript', 'systems-programming', 'wasm', 'performance'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1515879218367-8466d910auj7?w=1200&h=630&fit=crop',
    excerpt: 'Why Rust is becoming essential for JavaScript developers — from WASM to build tools like SWC and Turbopack.',
    content: `
<p>Rust is everywhere in the JavaScript ecosystem. SWC (the compiler behind Next.js), Turbopack, Biome, and Rspack are all written in Rust. Understanding why Rust matters can make you a better developer, even if you never write Rust professionally.</p>

<h2>Why Rust in JS Tooling?</h2>
<p>JavaScript build tools written in Rust are 10-100x faster than their JS counterparts. SWC compiles TypeScript 20x faster than the official TypeScript compiler. This isn't a marginal improvement — it fundamentally changes the developer experience.</p>

<h2>Key Rust Concepts for JS Devs</h2>
<ul>
<li><strong>Ownership:</strong> Rust's unique memory management system — no garbage collector needed</li>
<li><strong>Borrowing:</strong> References without ownership transfer — prevents data races at compile time</li>
<li><strong>Enums + Pattern Matching:</strong> Like TypeScript discriminated unions, but enforced and more powerful</li>
<li><strong>Result/Option:</strong> No null, no undefined — explicit error handling everywhere</li>
</ul>

<h2>WebAssembly Connection</h2>
<p>Rust compiles to WebAssembly excellently. Libraries like <code>wasm-bindgen</code> make it easy to call Rust code from JavaScript, enabling compute-intensive operations (image processing, cryptography, simulations) to run at near-native speed in the browser.</p>

<h2>Getting Started</h2>
<pre><code>// Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

// Create a new project
cargo new hello-rust
cd hello-rust
cargo run</code></pre>

<p>You don't need to become a Rust expert, but understanding its principles will make you appreciate why the JS ecosystem is moving in this direction.</p>
    `,
  },
  {
    title: 'Prompt Engineering: The Developer\'s Guide to Better AI Outputs',
    category: 'ai',
    tags: ['prompt-engineering', 'chatgpt', 'llm', 'ai-tools', 'productivity'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1676277791608-ac54525aa94d?w=1200&h=630&fit=crop',
    excerpt: 'Practical prompt engineering techniques for developers — structured outputs, chain-of-thought, and few-shot patterns.',
    content: `
<p>The difference between a mediocre AI output and a great one often comes down to how you prompt it. As a developer, understanding prompt engineering patterns can dramatically improve your productivity with AI tools.</p>

<h2>The Basics: Be Specific</h2>
<p>Vague prompts produce vague results. Instead of "write a function to process data," try:</p>
<pre><code>"Write a TypeScript function that takes an array of User objects, 
filters out inactive users (isActive === false), groups them by 
department, and returns a Record&lt;string, User[]&gt;. Include JSDoc 
comments and handle edge cases."</code></pre>

<h2>Chain-of-Thought Prompting</h2>
<p>Ask the AI to think step-by-step for complex problems. This significantly improves reasoning accuracy:</p>
<pre><code>"Analyze this database query for performance issues. 
Think step by step:
1. Identify what indexes would be needed
2. Check for N+1 query patterns
3. Suggest optimizations with explanations"</code></pre>

<h2>Few-Shot Examples</h2>
<p>Provide examples of the desired output format. The AI will follow the pattern:</p>
<pre><code>"Convert these requirements to user stories:

Example:
Requirement: Users can save posts
Story: As a user, I want to save posts to my collection so that I can revisit them later.

Now convert:
Requirement: Users can filter search results by date"</code></pre>

<h2>Structured Output</h2>
<p>Request specific output formats (JSON, TypeScript interfaces, markdown tables) to get immediately usable results rather than prose that needs parsing.</p>

<h2>Key Principles</h2>
<ul>
<li>Provide context about your tech stack and constraints</li>
<li>Specify the output format explicitly</li>
<li>Use system prompts for consistent behavior</li>
<li>Iterate — refine prompts based on output quality</li>
<li>Break complex tasks into smaller, focused prompts</li>
</ul>
    `,
  },
  {
    title: 'State Management in 2025: Redux vs Zustand vs Jotai',
    category: 'web-development',
    tags: ['react', 'state-management', 'redux', 'zustand', 'jotai'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=630&fit=crop',
    excerpt: 'Comparing the top React state management libraries — when to use Redux Toolkit, Zustand, or Jotai for your next project.',
    content: `
<p>State management remains one of the most debated topics in the React ecosystem. With several mature options available, choosing the right one depends on your project's complexity and team preferences.</p>

<h2>Redux Toolkit</h2>
<p>Redux Toolkit (RTK) is the official, opinionated way to use Redux. It dramatically reduces boilerplate while adding powerful features like RTK Query for data fetching:</p>
<pre><code>const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (state) => { state.value += 1; },
    decrement: (state) => { state.value -= 1; },
  },
});</code></pre>
<p><strong>Best for:</strong> Large applications, complex state logic, teams that want strict patterns.</p>

<h2>Zustand</h2>
<p>Zustand provides a minimal, hook-based API with no boilerplate:</p>
<pre><code>const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));</code></pre>
<p><strong>Best for:</strong> Medium-sized apps, developers who want simplicity, quick prototyping.</p>

<h2>Jotai</h2>
<p>Jotai takes an atomic approach — each piece of state is an independent atom:</p>
<pre><code>const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);

function Counter() {
  const [count, setCount] = useAtom(countAtom);
  return &lt;button onClick={() => setCount(c => c + 1)}&gt;{count}&lt;/button&gt;;
}</code></pre>
<p><strong>Best for:</strong> Fine-grained reactivity, avoiding unnecessary re-renders, composable state.</p>

<h2>Decision Matrix</h2>
<ul>
<li>Need DevTools + middleware + strict patterns → <strong>Redux Toolkit</strong></li>
<li>Want minimal API + fast setup → <strong>Zustand</strong></li>
<li>Need atomic state + derived computed values → <strong>Jotai</strong></li>
</ul>
    `,
  },
  {
    title: 'Web Performance Optimization: The 2025 Checklist',
    category: 'web-development',
    tags: ['performance', 'core-web-vitals', 'lighthouse', 'optimization', 'speed'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=630&fit=crop',
    excerpt: 'The definitive checklist for web performance — Core Web Vitals, image optimization, code splitting, and caching strategies.',
    content: `
<p>Web performance directly impacts user experience, conversion rates, and SEO rankings. Google's Core Web Vitals are now a ranking factor, making performance optimization a business priority.</p>

<h2>Core Web Vitals</h2>
<ul>
<li><strong>LCP (Largest Contentful Paint):</strong> &lt; 2.5s — How fast the main content loads</li>
<li><strong>INP (Interaction to Next Paint):</strong> &lt; 200ms — How responsive the page feels</li>
<li><strong>CLS (Cumulative Layout Shift):</strong> &lt; 0.1 — How stable the visual layout is</li>
</ul>

<h2>Image Optimization</h2>
<p>Images are often the biggest performance bottleneck. Use modern formats (WebP, AVIF), responsive sizing, and lazy loading:</p>
<pre><code>&lt;picture&gt;
  &lt;source srcset="image.avif" type="image/avif"&gt;
  &lt;source srcset="image.webp" type="image/webp"&gt;
  &lt;img src="image.jpg" loading="lazy" 
       width="800" height="600" alt="Description"&gt;
&lt;/picture&gt;</code></pre>

<h2>Code Splitting</h2>
<p>Only load the JavaScript users need. Use dynamic imports for route-based and component-based code splitting:</p>
<pre><code>const HeavyComponent = lazy(() => import('./HeavyComponent'));

function Page() {
  return (
    &lt;Suspense fallback={&lt;Skeleton /&gt;}&gt;
      &lt;HeavyComponent /&gt;
    &lt;/Suspense&gt;
  );
}</code></pre>

<h2>Caching Strategy</h2>
<ul>
<li>Static assets: Cache for 1 year with content hashing</li>
<li>HTML pages: Short cache with <code>stale-while-revalidate</code></li>
<li>API responses: Cache based on data freshness needs</li>
<li>Use a CDN for global distribution</li>
</ul>

<h2>Quick Wins</h2>
<ul>
<li>Enable Brotli/gzip compression</li>
<li>Preconnect to critical third-party origins</li>
<li>Inline critical CSS, defer non-critical</li>
<li>Use <code>font-display: swap</code> for web fonts</li>
<li>Remove unused JavaScript with tree shaking</li>
</ul>
    `,
  },
  {
    title: 'GraphQL vs REST in 2025: Making the Right Choice',
    category: 'technology',
    tags: ['graphql', 'rest', 'api', 'architecture', 'comparison'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&h=630&fit=crop',
    excerpt: 'An objective comparison of GraphQL and REST APIs — when each makes sense, common pitfalls, and hybrid approaches.',
    content: `
<p>The GraphQL vs REST debate continues, but in 2025 the answer is more nuanced than ever. Both have matured significantly, and the best choice depends on your specific requirements.</p>

<h2>REST: The Reliable Standard</h2>
<p>REST APIs are universally understood, cacheable by default, and simpler to implement. They work perfectly when your data model maps cleanly to resources:</p>
<pre><code>GET    /api/users/:id
GET    /api/users/:id/posts
POST   /api/posts
PUT    /api/posts/:id
DELETE /api/posts/:id</code></pre>

<h2>GraphQL: Flexible Data Fetching</h2>
<p>GraphQL shines when you need to fetch complex, nested data in a single request:</p>
<pre><code>query {
  user(id: "123") {
    name
    posts(limit: 10) {
      title
      comments { content author { name } }
    }
    followers { name avatar }
  }
}</code></pre>

<h2>When to Use What</h2>
<table>
<tr><th>Scenario</th><th>Best Choice</th></tr>
<tr><td>Simple CRUD APIs</td><td>REST</td></tr>
<tr><td>Mobile apps (bandwidth-sensitive)</td><td>GraphQL</td></tr>
<tr><td>Public APIs</td><td>REST</td></tr>
<tr><td>Complex nested data</td><td>GraphQL</td></tr>
<tr><td>Real-time subscriptions</td><td>GraphQL</td></tr>
<tr><td>File uploads</td><td>REST</td></tr>
<tr><td>Microservices gateway</td><td>GraphQL (as BFF)</td></tr>
</table>

<h2>The Hybrid Approach</h2>
<p>Many teams use both: REST for simple CRUD operations and file handling, GraphQL as a Backend-for-Frontend (BFF) layer aggregating data from multiple services. This gives you the best of both worlds.</p>
    `,
  },
  {
    title: 'Building Real-Time Applications with WebSockets',
    category: 'tutorials',
    tags: ['websockets', 'real-time', 'socket-io', 'nodejs', 'collaboration'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&h=630&fit=crop',
    excerpt: 'Build real-time features with WebSockets and Socket.IO — from chat to collaborative editing and live notifications.',
    content: `
<p>Real-time communication is essential for modern web applications. Whether you're building a chat app, collaborative editor, or live dashboard, WebSockets provide bidirectional communication between client and server.</p>

<h2>WebSocket vs HTTP</h2>
<p>HTTP is request-response: the client asks, the server answers. WebSockets maintain a persistent connection, allowing both sides to send data at any time. This eliminates polling overhead and enables true real-time communication.</p>

<h2>Socket.IO Setup</h2>
<pre><code>// Server
const io = require('socket.io')(server, {
  cors: { origin: 'http://localhost:3000' }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-joined', socket.id);
  });
  
  socket.on('message', ({ roomId, text }) => {
    io.to(roomId).emit('new-message', { 
      text, sender: socket.id, timestamp: Date.now() 
    });
  });
});

// Client
const socket = io('http://localhost:4000');
socket.emit('join-room', 'chat-123');
socket.on('new-message', (msg) => {
  console.log('New message:', msg);
});</code></pre>

<h2>Common Patterns</h2>
<ul>
<li><strong>Rooms:</strong> Group connections for targeted broadcasting</li>
<li><strong>Namespaces:</strong> Separate concerns (chat, notifications, presence)</li>
<li><strong>Acknowledgements:</strong> Confirm message delivery</li>
<li><strong>Middleware:</strong> Authentication and rate limiting on socket events</li>
</ul>

<h2>Scaling WebSockets</h2>
<p>Single-server WebSockets don't scale horizontally. Use Redis adapter (<code>@socket.io/redis-adapter</code>) to sync events across multiple server instances.</p>
    `,
  },
  {
    title: 'The M4 MacBook Pro: Is It Worth the Upgrade?',
    category: 'gadgets',
    tags: ['macbook', 'apple', 'review', 'laptop', 'developer-tools'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=630&fit=crop',
    excerpt: 'A developer\'s review of the M4 MacBook Pro — compilation benchmarks, display quality, and real-world performance.',
    content: `
<p>Apple's M4 MacBook Pro continues the revolution started by M1. As a developer who compiles code, runs Docker containers, and occasionally edits video, here's my honest take after three months.</p>

<h2>Performance: The Numbers</h2>
<p>Compared to M2 Pro (my previous machine):</p>
<ul>
<li>Next.js full build: 45s → 28s (38% faster)</li>
<li>Docker compose up (5 services): 32s → 18s</li>
<li>Rust compile (large project): 4m 20s → 2m 45s</li>
<li>TypeScript type checking: 12s → 7s</li>
</ul>

<h2>The Display</h2>
<p>The XDR display with nano-texture option is stunning. SDR content looks great, and HDR video editing is genuinely enjoyable. At 120Hz ProMotion, everything feels fluid — scrolling code in VS Code is noticeably smoother.</p>

<h2>Battery Life</h2>
<p>14-16 hours of actual coding use (VS Code, terminals, browser with 30+ tabs). I regularly leave the charger at home. This is genuinely transformative for productivity on the go.</p>

<h2>The Ecosystem Advantage</h2>
<p>Universal Clipboard, Handoff, AirDrop to iPhone, and iCloud are seamless. If you're already in the Apple ecosystem, the integration is unmatched. If not, the M4's raw power still makes it the best laptop for most developers.</p>

<h2>Verdict</h2>
<p><strong>Worth upgrading from:</strong> M1, M2 (non-Pro), Intel Macs (absolutely).<br/>
<strong>Skip if you have:</strong> M2 Pro/Max, M3 Pro/Max — the improvements are incremental.</p>
    `,
  },
  {
    title: 'Understanding OAuth 2.0 and OpenID Connect',
    category: 'cybersecurity',
    tags: ['oauth', 'oidc', 'authentication', 'authorization', 'security'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f2?w=1200&h=630&fit=crop',
    excerpt: 'Demystifying OAuth 2.0 and OpenID Connect — the flows, tokens, and security considerations every developer needs to know.',
    content: `
<p>OAuth 2.0 and OpenID Connect (OIDC) are the foundation of modern authentication. Yet they're often misunderstood. Let's break down what they actually do and how to implement them securely.</p>

<h2>OAuth 2.0 vs OpenID Connect</h2>
<p><strong>OAuth 2.0</strong> is an authorization framework — it lets apps access resources on behalf of a user. <strong>OpenID Connect</strong> is an identity layer on top of OAuth 2.0 — it tells you WHO the user is.</p>

<h2>The Authorization Code Flow</h2>
<p>The most secure flow for web applications:</p>
<ol>
<li>User clicks "Login with Google"</li>
<li>App redirects to Google's authorization endpoint</li>
<li>User authenticates and consents</li>
<li>Google redirects back with an authorization code</li>
<li>App exchanges code for tokens (server-side)</li>
<li>App uses access token to call APIs</li>
</ol>

<h2>PKCE: Essential for SPAs</h2>
<p>Single-page apps can't keep secrets. PKCE (Proof Key for Code Exchange) adds a cryptographic challenge to prevent authorization code interception:</p>
<pre><code>// Generate code verifier and challenge
const verifier = generateRandomString(128);
const challenge = base64url(sha256(verifier));

// Send challenge in auth request, verifier in token request
// Server validates they match</code></pre>

<h2>Token Best Practices</h2>
<ul>
<li>Access tokens: Short-lived (15 min), used for API calls</li>
<li>Refresh tokens: Long-lived, used to get new access tokens</li>
<li>ID tokens: Contains user identity claims, verify signature</li>
<li>Store tokens in httpOnly cookies, not localStorage</li>
<li>Implement refresh token rotation for security</li>
</ul>

<h2>Common Mistakes</h2>
<ul>
<li>Using the implicit flow (deprecated — use PKCE instead)</li>
<li>Not validating the <code>state</code> parameter (CSRF protection)</li>
<li>Passing tokens in URL query parameters</li>
<li>Not checking token audience and issuer claims</li>
</ul>
    `,
  },
  {
    title: 'Microservices Architecture: Lessons from Production',
    category: 'software',
    tags: ['microservices', 'architecture', 'distributed-systems', 'patterns'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=1200&h=630&fit=crop',
    excerpt: 'Real-world lessons from running microservices in production — when they help, when they hurt, and the patterns that matter.',
    content: `
<p>Microservices are often presented as a silver bullet, but the reality is more nuanced. After years of running microservices in production, here are the lessons that textbooks don't teach you.</p>

<h2>When NOT to Use Microservices</h2>
<p>Start with a monolith. Seriously. Microservices add significant operational complexity. Unless you have a large team, high traffic, and clear domain boundaries, a well-structured monolith is almost always the better starting point.</p>

<blockquote>Don't start with microservices. Start with a well-modularized monolith and extract services when you have clear reasons.</blockquote>

<h2>Essential Patterns</h2>
<ul>
<li><strong>API Gateway:</strong> Single entry point for clients, handles routing, auth, and rate limiting</li>
<li><strong>Circuit Breaker:</strong> Prevent cascade failures when downstream services go down</li>
<li><strong>Saga Pattern:</strong> Coordinate transactions across multiple services</li>
<li><strong>Event Sourcing:</strong> Store events instead of state for audit trails and replay</li>
<li><strong>CQRS:</strong> Separate read and write models for performance optimization</li>
</ul>

<h2>Observability is Non-Negotiable</h2>
<p>In a distributed system, you need three pillars of observability:</p>
<ul>
<li><strong>Logging:</strong> Structured, correlated with trace IDs (ELK, Loki)</li>
<li><strong>Metrics:</strong> Service health, latency percentiles, error rates (Prometheus + Grafana)</li>
<li><strong>Tracing:</strong> Request flow across services (Jaeger, Zipkin)</li>
</ul>

<h2>The Cost</h2>
<p>Be honest about the costs: you need service discovery, distributed tracing, container orchestration, CI/CD per service, and someone on-call who understands the entire system. If you can't invest in these, stick with the monolith.</p>
    `,
  },
  {
    title: 'PostgreSQL vs MongoDB: Choosing Your Database',
    category: 'technology',
    tags: ['postgresql', 'mongodb', 'database', 'sql', 'nosql', 'comparison'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1489875347897-49f64b51c1f8?w=1200&h=630&fit=crop',
    excerpt: 'An honest comparison of PostgreSQL and MongoDB — when to go relational, when to go document, and when to use both.',
    content: `
<p>The database choice influences your entire application architecture. PostgreSQL and MongoDB represent the best of their respective paradigms. Here's how to make the right choice.</p>

<h2>PostgreSQL: The Relational Powerhouse</h2>
<p>PostgreSQL is the most advanced open-source relational database. It excels at:</p>
<ul>
<li>Complex queries with JOINs across many tables</li>
<li>ACID transactions with strong consistency</li>
<li>JSON/JSONB for flexible schema within a relational model</li>
<li>Full-text search (no separate search engine needed for basic cases)</li>
<li>Advanced features: CTEs, window functions, materialized views</li>
</ul>

<h2>MongoDB: The Document Database</h2>
<p>MongoDB stores data as flexible JSON-like documents. It shines when:</p>
<ul>
<li>Your data model is hierarchical/nested</li>
<li>Schema evolves frequently during development</li>
<li>You need horizontal scaling (sharding)</li>
<li>Read-heavy workloads with denormalized data</li>
<li>Rapid prototyping with changing requirements</li>
</ul>

<h2>Decision Framework</h2>
<table>
<tr><th>Factor</th><th>PostgreSQL</th><th>MongoDB</th></tr>
<tr><td>Data relationships</td><td>Complex, many-to-many</td><td>Embedded, hierarchical</td></tr>
<tr><td>Schema</td><td>Strict, enforced</td><td>Flexible, evolving</td></tr>
<tr><td>Transactions</td><td>Excellent</td><td>Good (since 4.0)</td></tr>
<tr><td>Scaling</td><td>Vertical (mostly)</td><td>Horizontal (sharding)</td></tr>
<tr><td>Aggregation</td><td>SQL (powerful)</td><td>Pipeline (different)</td></tr>
</table>

<h2>The Answer: It Depends</h2>
<p>For most web applications, either works well. If your data is relational with complex queries, choose PostgreSQL. If your data is document-oriented with frequent schema changes, choose MongoDB. Many production systems use both.</p>
    `,
  },
  {
    title: 'Testing Best Practices for Modern JavaScript',
    category: 'tutorials',
    tags: ['testing', 'jest', 'vitest', 'testing-library', 'tdd'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1576444356170-66073FB20e6c?w=1200&h=630&fit=crop',
    excerpt: 'Write tests that give you confidence without slowing you down — unit tests, integration tests, and the testing trophy.',
    content: `
<p>Testing is an investment in your future self. Good tests catch bugs before users do, enable fearless refactoring, and serve as living documentation. But testing poorly can be worse than not testing at all.</p>

<h2>The Testing Trophy</h2>
<p>Kent C. Dodds' testing trophy prioritizes integration tests over unit tests:</p>
<ul>
<li>🏆 <strong>Integration tests</strong> — Most value, test components working together</li>
<li>🥈 <strong>End-to-end tests</strong> — Critical user flows</li>
<li>🥉 <strong>Unit tests</strong> — Complex logic and utilities</li>
<li>📊 <strong>Static analysis</strong> — TypeScript + ESLint (free confidence)</li>
</ul>

<h2>Write Tests That Resemble Usage</h2>
<pre><code>// Bad — testing implementation details
expect(component.state.isOpen).toBe(true);

// Good — testing behavior
const button = screen.getByRole('button', { name: /menu/i });
await userEvent.click(button);
expect(screen.getByRole('menu')).toBeVisible();</code></pre>

<h2>Vitest: The Modern Choice</h2>
<p>Vitest is Jest-compatible but much faster, powered by Vite's transform pipeline. Migration is often as simple as changing the import:</p>
<pre><code>import { describe, it, expect, vi } from 'vitest';

describe('calculateTotal', () => {
  it('applies discount correctly', () => {
    expect(calculateTotal(100, 0.2)).toBe(80);
  });
  
  it('handles zero amount', () => {
    expect(calculateTotal(0, 0.5)).toBe(0);
  });
});</code></pre>

<h2>Testing Async Code</h2>
<pre><code>it('fetches user data', async () => {
  const user = await fetchUser('123');
  expect(user).toEqual({
    id: '123',
    name: 'John Doe',
  });
});</code></pre>

<h2>Golden Rules</h2>
<ul>
<li>Test behavior, not implementation</li>
<li>One assertion per concept (not necessarily per test)</li>
<li>Don't test external libraries</li>
<li>Mock sparingly — prefer integration over mocking</li>
<li>Keep tests fast — slow tests don't get run</li>
</ul>
    `,
  },
  {
    title: 'The Rise of Local AI: Running LLMs on Your Machine',
    category: 'ai',
    tags: ['local-ai', 'llama', 'ollama', 'privacy', 'open-source'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&h=630&fit=crop',
    excerpt: 'Run powerful language models locally with Ollama, llama.cpp, and open-source models — privacy, speed, and zero API costs.',
    content: `
<p>You no longer need cloud APIs to use powerful AI models. Thanks to quantization, efficient inference engines, and a thriving open-source ecosystem, running LLMs locally is practical and increasingly performant.</p>

<h2>Why Run AI Locally?</h2>
<ul>
<li><strong>Privacy:</strong> Your data never leaves your machine</li>
<li><strong>Cost:</strong> Zero API fees, unlimited usage</li>
<li><strong>Speed:</strong> No network latency for inference</li>
<li><strong>Offline:</strong> Works without internet connection</li>
<li><strong>Customization:</strong> Fine-tune models for your specific use case</li>
</ul>

<h2>Getting Started with Ollama</h2>
<p>Ollama makes running local models as easy as Docker makes running containers:</p>
<pre><code># Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Run a model
ollama run llama3.1

# Use via API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1",
  "prompt": "Explain quantum computing in simple terms"
}'</code></pre>

<h2>Model Recommendations</h2>
<ul>
<li><strong>Llama 3.1 8B:</strong> Great general-purpose model, runs on 8GB RAM</li>
<li><strong>CodeLlama 13B:</strong> Optimized for code generation and analysis</li>
<li><strong>Mistral 7B:</strong> Excellent reasoning for its size</li>
<li><strong>Phi-3 Mini:</strong> Microsoft's small but capable model</li>
<li><strong>Gemma 2B:</strong> Google's tiny model for resource-constrained devices</li>
</ul>

<h2>Hardware Requirements</h2>
<p>For comfortable local AI usage:</p>
<ul>
<li><strong>Minimum:</strong> 8GB RAM, any modern CPU (7B models, quantized)</li>
<li><strong>Recommended:</strong> 16GB RAM, Apple M-series or NVIDIA GPU (13B+ models)</li>
<li><strong>Power user:</strong> 32GB+ RAM, NVIDIA RTX 4090 (70B models)</li>
</ul>
    `,
  },
  {
    title: 'Progressive Web Apps: Native-Like Experiences on the Web',
    category: 'mobile',
    tags: ['pwa', 'service-worker', 'offline', 'web-app', 'manifest'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=630&fit=crop',
    excerpt: 'Build progressive web apps that work offline, send push notifications, and feel like native apps — with just HTML, CSS, and JavaScript.',
    content: `
<p>Progressive Web Apps (PWAs) bridge the gap between web and native applications. They load instantly, work offline, and can be installed on the home screen — all while being just a website under the hood.</p>

<h2>The Three Pillars</h2>
<ul>
<li><strong>Service Worker:</strong> Background script that intercepts network requests, enabling offline functionality and caching</li>
<li><strong>Web App Manifest:</strong> JSON file that tells the browser how to display your app when installed</li>
<li><strong>HTTPS:</strong> Required for security and service worker registration</li>
</ul>

<h2>Service Worker Caching</h2>
<pre><code>// sw.js
const CACHE_NAME = 'app-v1';
const ASSETS = ['/', '/index.html', '/styles.css', '/app.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => 
      cached || fetch(event.request)
    )
  );
});</code></pre>

<h2>Web App Manifest</h2>
<pre><code>{
  "name": "My PWA",
  "short_name": "PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#00d4ff",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}</code></pre>

<h2>Modern PWA Features</h2>
<ul>
<li>Push notifications (Web Push API)</li>
<li>Background sync for offline form submissions</li>
<li>File system access for local file editing</li>
<li>Share target — receive shared content from other apps</li>
<li>Shortcuts — deep link to specific app features</li>
</ul>
    `,
  },
  {
    title: 'CI/CD with GitHub Actions: A Complete Pipeline',
    category: 'software',
    tags: ['github-actions', 'ci-cd', 'automation', 'devops', 'deployment'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=1200&h=630&fit=crop',
    excerpt: 'Build a complete CI/CD pipeline with GitHub Actions — from linting and testing to building and deploying automatically.',
    content: `
<p>GitHub Actions provides free CI/CD directly in your repository. No external services needed. Here's how to build a complete pipeline that catches bugs early and deploys with confidence.</p>

<h2>Basic Workflow</h2>
<pre><code>name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test -- --coverage
      
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run build</code></pre>

<h2>Caching for Speed</h2>
<p>Caching dependencies dramatically speeds up workflows. The <code>setup-node</code> action's built-in cache handles <code>node_modules</code>, but you can also cache build outputs:</p>
<pre><code>- uses: actions/cache@v4
  with:
    path: .next/cache
    key: next-$&lbrace;&lbrace; hashFiles('**/package-lock.json') &rbrace;&rbrace;</code></pre>

<h2>Environment Secrets</h2>
<p>Never hardcode secrets. Use GitHub's encrypted secrets:</p>
<pre><code>env:
  DATABASE_URL: $&lbrace;&lbrace; secrets.DATABASE_URL &rbrace;&rbrace;
  API_KEY: $&lbrace;&lbrace; secrets.API_KEY &rbrace;&rbrace;</code></pre>

<h2>Deployment Strategies</h2>
<ul>
<li><strong>Vercel/Netlify:</strong> Automatic deployment on push (zero config)</li>
<li><strong>Docker + SSH:</strong> Build image, push to registry, deploy via SSH</li>
<li><strong>AWS/GCP:</strong> Use official deployment actions</li>
<li><strong>Kubernetes:</strong> Apply manifests with kubectl action</li>
</ul>

<h2>Pro Tips</h2>
<ul>
<li>Use concurrency groups to cancel in-progress runs</li>
<li>Run jobs in parallel when possible</li>
<li>Use reusable workflows for shared CI logic</li>
<li>Set up Dependabot for automated dependency updates</li>
</ul>
    `,
  },
  {
    title: 'Tailwind CSS v4: What\'s New and How to Migrate',
    category: 'news',
    tags: ['tailwind', 'css', 'update', 'migration', 'frontend'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1523437113738-bbd3cc89fb19?w=1200&h=630&fit=crop',
    excerpt: 'Everything new in Tailwind CSS v4 — the new engine, CSS-first configuration, and how to migrate your existing projects.',
    content: `
<p>Tailwind CSS v4 is the biggest update since the framework's inception. With a completely new engine built in Rust, CSS-first configuration, and zero-config content detection, it's faster and simpler than ever.</p>

<h2>What Changed</h2>
<ul>
<li><strong>Rust-powered engine:</strong> 10x faster builds with Lightning CSS under the hood</li>
<li><strong>CSS-first config:</strong> No more <code>tailwind.config.js</code> — configure via CSS</li>
<li><strong>Auto content detection:</strong> No more <code>content: []</code> configuration</li>
<li><strong>Native CSS imports:</strong> Use <code>@import "tailwindcss"</code> instead of <code>@tailwind</code> directives</li>
</ul>

<h2>CSS-First Configuration</h2>
<pre><code>/* globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #3b82f6;
  --color-surface: #0f172a;
  --font-display: "Inter", sans-serif;
  --radius-card: 12px;
}</code></pre>

<h2>Migration Steps</h2>
<ol>
<li>Update to <code>tailwindcss@next</code></li>
<li>Remove <code>tailwind.config.js</code> — move theme to CSS <code>@theme</code> block</li>
<li>Replace <code>@tailwind base/components/utilities</code> with <code>@import "tailwindcss"</code></li>
<li>Update renamed utilities (some class names changed)</li>
<li>Test and fix any breaking changes</li>
</ol>

<h2>Performance Comparison</h2>
<p>Build times on a large project (50,000+ utility usages):</p>
<ul>
<li>Tailwind v3: 960ms</li>
<li>Tailwind v4: 85ms</li>
<li>Improvement: <strong>11x faster</strong></li>
</ul>

<p>The migration is straightforward for most projects. The biggest change is the mindset shift from JavaScript configuration to CSS-native configuration. Start with a fresh branch, run the migration tool, and test thoroughly.</p>
    `,
  },
  {
    title: 'Accessible Web Design: Beyond the Basics',
    category: 'web-development',
    tags: ['accessibility', 'a11y', 'wcag', 'aria', 'inclusive-design'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=1200&h=630&fit=crop',
    excerpt: 'Going beyond WCAG checkboxes — practical accessibility patterns that create genuinely inclusive web experiences.',
    content: `
<p>Accessibility isn't just about compliance — it's about building products that work for everyone. Here are practical patterns that go beyond the basics and create genuinely inclusive experiences.</p>

<h2>Semantic HTML: Your First Line of Defense</h2>
<p>Before reaching for ARIA attributes, use semantic HTML. It provides accessibility for free:</p>
<pre><code>&lt;!-- Bad --&gt;
&lt;div class="button" onclick="submit()"&gt;Submit&lt;/div&gt;

&lt;!-- Good --&gt;
&lt;button type="submit"&gt;Submit&lt;/button&gt;</code></pre>

<h2>Focus Management</h2>
<p>Keyboard users navigate with Tab, Shift+Tab, and arrow keys. Ensure:</p>
<ul>
<li>All interactive elements are focusable</li>
<li>Focus order matches visual order</li>
<li>Focus is visible (never <code>outline: none</code> without an alternative)</li>
<li>Modal dialogs trap focus inside them</li>
<li>Focus returns to trigger element when modals close</li>
</ul>

<h2>Color and Contrast</h2>
<p>WCAG AA requires a 4.5:1 contrast ratio for normal text and 3:1 for large text. But beyond contrast:</p>
<ul>
<li>Never convey information through color alone</li>
<li>Add icons, patterns, or text labels as secondary indicators</li>
<li>Test with color blindness simulators</li>
<li>Support high contrast mode and forced colors</li>
</ul>

<h2>Screen Reader Optimization</h2>
<pre><code>&lt;!-- Hidden visually but available to screen readers --&gt;
&lt;span class="sr-only"&gt;Close dialog&lt;/span&gt;

&lt;!-- Live regions for dynamic content --&gt;
&lt;div aria-live="polite" aria-atomic="true"&gt;
  {statusMessage}
&lt;/div&gt;

&lt;!-- Descriptive labels --&gt;
&lt;input aria-label="Search articles" type="search"&gt;</code></pre>

<h2>Testing Accessibility</h2>
<ul>
<li>Use axe DevTools browser extension</li>
<li>Navigate your app using only keyboard</li>
<li>Test with VoiceOver (Mac) or NVDA (Windows)</li>
<li>Add automated a11y tests (jest-axe, Playwright)</li>
<li>Include disabled users in usability testing</li>
</ul>
    `,
  },
  {
    title: 'The Developer\'s Guide to DNS and How the Internet Works',
    category: 'technology',
    tags: ['dns', 'networking', 'internet', 'infrastructure', 'fundamentals'],
    isFeatured: false,
    coverUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1200&h=630&fit=crop',
    excerpt: 'Understanding DNS, TCP/IP, and how web requests actually work — essential networking knowledge for every developer.',
    content: `
<p>Every web developer should understand what happens between typing a URL and seeing a webpage. This knowledge helps you debug network issues, optimize performance, and make better architectural decisions.</p>

<h2>The Journey of a Web Request</h2>
<ol>
<li><strong>DNS Resolution:</strong> Browser looks up the IP address for the domain</li>
<li><strong>TCP Connection:</strong> Three-way handshake establishes a connection</li>
<li><strong>TLS Handshake:</strong> Encryption is negotiated (HTTPS)</li>
<li><strong>HTTP Request:</strong> Browser sends the request</li>
<li><strong>Server Processing:</strong> Server processes and generates response</li>
<li><strong>HTTP Response:</strong> Server sends back HTML/JSON/data</li>
<li><strong>Rendering:</strong> Browser parses and renders the page</li>
</ol>

<h2>DNS Deep Dive</h2>
<p>DNS is a distributed hierarchical database. A lookup goes through multiple servers:</p>
<ul>
<li><strong>Browser cache:</strong> Checks recent lookups</li>
<li><strong>OS resolver cache:</strong> System-level DNS cache</li>
<li><strong>Recursive resolver:</strong> Your ISP or Cloudflare (1.1.1.1)</li>
<li><strong>Root nameserver:</strong> Knows where .com, .org, etc. live</li>
<li><strong>TLD nameserver:</strong> Knows where example.com lives</li>
<li><strong>Authoritative nameserver:</strong> Has the actual IP address</li>
</ul>

<h2>DNS Records You Should Know</h2>
<pre><code>A      → Maps domain to IPv4 address
AAAA   → Maps domain to IPv6 address
CNAME  → Alias one domain to another
MX     → Mail server routing
TXT    → Verification, SPF, DKIM records
NS     → Nameserver delegation</code></pre>

<h2>Why This Matters</h2>
<ul>
<li>DNS propagation delays affect deployments</li>
<li>TTL values impact caching and failover speed</li>
<li>Understanding TCP helps debug connection timeouts</li>
<li>TLS knowledge helps troubleshoot certificate issues</li>
<li>HTTP/2 and HTTP/3 fundamentally change request patterns</li>
</ul>
    `,
  },
];

// ─── Main ────────────────────────────────────────────────────────────
async function main() {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://irfan:123456seven@cluster0.fvab2fw.mongodb.net/picup';
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected\n');

    // Get existing users to assign as authors
    const users = await User.find({}).limit(20).lean();
    if (users.length === 0) {
      console.error('❌ No users found. Run seed-massive.js first to create users.');
      process.exit(1);
    }
    console.log(`👥 Found ${users.length} users to assign as authors\n`);

    // Clear existing blog posts
    const deleted = await BlogPost.deleteMany({});
    console.log(`🗑️  Cleared ${deleted.deletedCount} existing blog posts\n`);

    // Create blog posts
    const created = [];
    for (let i = 0; i < articles.length; i++) {
      const art = articles[i];
      const author = users[i % users.length];

      const post = await BlogPost.create({
        title: art.title,
        content: art.content.trim(),
        excerpt: art.excerpt,
        coverImage: { url: art.coverUrl },
        tags: art.tags,
        category: art.category,
        author: author._id,
        status: 'published',
        isFeatured: art.isFeatured,
        viewsCount: randInt(50, 15000),
        likesCount: randInt(5, 500),
        commentsCount: randInt(0, 80),
        sharesCount: randInt(0, 150),
      });

      created.push(post);
      console.log(`  📝 [${String(i + 1).padStart(2)}] ${art.title.substring(0, 60)}...  (${art.category})`);
    }

    console.log(`\n✅ Created ${created.length} blog posts across ${new Set(articles.map(a => a.category)).size} categories`);
    console.log(`   Featured: ${created.filter(p => p.isFeatured).length}`);
    console.log(`   Total tags: ${new Set(articles.flatMap(a => a.tags)).size} unique tags\n`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected. Blog seeding complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

main();
