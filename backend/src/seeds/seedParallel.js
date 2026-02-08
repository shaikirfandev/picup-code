/**
 * Seed script for the Parallel.AI search platform.
 * Cleans up stuck jobs, then injects pre-made content chunks directly
 * into the database so the search engine has meaningful data to query.
 *
 * Usage:
 *   cd backend && node src/seeds/seedParallel.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');
const connectDB = require('../config/db');

// Models
const Source = require('../models/Source');
const Chunk = require('../models/Chunk');
const CrawlJob = require('../models/CrawlJob');

const { embedBatch, EMBEDDING_MODEL, EMBEDDING_DIM } = require('../services/embeddingService');

/* ── Helper: content hash ── */
function contentHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

/* ── Curated seed content ── */
const SEED_DATA = [
  {
    name: 'Node.js — About',
    url: 'https://nodejs.org/en/about',
    domain: 'nodejs.org',
    tags: ['nodejs', 'javascript', 'backend', 'runtime', 'server'],
    chunks: [
      `Node.js is an open-source, cross-platform JavaScript runtime environment. As an asynchronous event-driven JavaScript runtime, Node.js is designed to build scalable network applications. Node.js is similar in design to, and influenced by, systems like Ruby's Event Machine and Python's Twisted. Node.js takes the event model a bit further. It presents an event loop as a runtime construct instead of as a library.`,
      `Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient. Node.js' package ecosystem, npm, is the largest ecosystem of open source libraries in the world. Many connections can be handled concurrently. Upon each connection, the callback is fired, but if there is no work to be done, Node.js will sleep.`,
      `HTTP is a first-class citizen in Node.js, designed with streaming and low latency in mind. This makes Node.js well suited for the foundation of a web library or framework. Node.js being designed without threads doesn't mean you can't take advantage of multiple cores in your environment. Child processes can be spawned using the child_process.fork() API.`,
      `Node.js was originally written by Ryan Dahl in 2009, about thirteen years after the introduction of the first server-side JavaScript environment, Netscape's LiveWire Pro Web. The initial release supported only Linux and Mac OS X. Its development and maintenance was led by Dahl and later sponsored by Joyent. Node.js uses the V8 JavaScript engine developed by Google for use in Chrome.`,
    ],
  },
  {
    name: 'Express.js — Getting Started',
    url: 'https://expressjs.com/en/starter/installing.html',
    domain: 'expressjs.com',
    tags: ['express', 'nodejs', 'backend', 'framework', 'api', 'middleware'],
    chunks: [
      `Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. With a myriad of HTTP utility methods and middleware at your disposal, creating a robust API is quick and easy. Express provides a thin layer of fundamental web application features, without obscuring Node.js features that you know and love.`,
      `To install Express.js, first create a directory to hold your application, and make that your working directory. Use the npm init command to create a package.json file for your application. Then install Express in the app directory using npm install express. You can also install Express temporarily and not add it to the dependencies list with the --no-save option.`,
      `Express routing refers to how an application's endpoints (URIs) respond to client requests. You define routing using methods of the Express app object that correspond to HTTP methods: app.get() to handle GET requests, app.post() to handle POST requests, and so on. Route paths define the endpoints at which requests can be made. They can be strings, string patterns, or regular expressions.`,
      `Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application's request-response cycle. Middleware can execute any code, make changes to the request and the response objects, end the request-response cycle, or call the next middleware function in the stack.`,
    ],
  },
  {
    name: 'React — Quick Start Guide',
    url: 'https://react.dev/learn',
    domain: 'react.dev',
    tags: ['react', 'frontend', 'javascript', 'ui', 'components', 'hooks'],
    chunks: [
      `React is a JavaScript library for building user interfaces. React lets you build user interfaces out of individual pieces called components. Create your own React components like Thumbnail, LikeButton, and Video. Then combine them into entire screens, pages, and apps. Whether you work on your own or with thousands of other developers, using React feels the same.`,
      `React components are JavaScript functions that return markup. React components can be as small as a button, or as large as an entire page. Components can render other components. To use a component from another file, you need to export it from the file where it's defined, and import it in the file that uses it. JSX looks like HTML but is stricter and can display dynamic information.`,
      `React Hooks let you use state and other React features without writing a class. The useState hook lets you add state to function components. When you call useState, you are telling React that you want this component to remember something. The useEffect hook lets you perform side effects in function components, such as data fetching, setting up a subscription, and manually changing the DOM.`,
      `In React, data flows down from parent components to child components through props. Props are the information that you pass to a JSX tag. For example, className, src, alt, width, and height are some of the props you can pass to an img tag. When you want child components to communicate with parents, you can pass callback functions as props.`,
    ],
  },
  {
    name: 'MongoDB — Introduction to Documents',
    url: 'https://www.mongodb.com/docs/manual/introduction/',
    domain: 'mongodb.com',
    tags: ['mongodb', 'database', 'nosql', 'documents', 'queries'],
    chunks: [
      `MongoDB is a document database designed for ease of application development and scaling. MongoDB stores data in flexible, JSON-like documents. The document model maps to the objects in your application code, making data easy to work with. MongoDB is a distributed database at its core, so high availability, horizontal scaling, and geographic distribution are built in and easy to use.`,
      `A record in MongoDB is a document, which is a data structure composed of field and value pairs. MongoDB documents are similar to JSON objects. The values of fields may include other documents, arrays, and arrays of documents. The advantages of using documents include documents correspond to native data types in many programming languages and embedded documents reduce need for expensive joins.`,
      `MongoDB provides high performance data persistence. Support for embedded data models reduces I/O activity on the database system. Indexes support faster queries and can include keys from embedded documents and arrays. The MongoDB Query API supports read and write operations (CRUD) as well as data aggregation, text search, and geospatial queries for flexible access to data.`,
      `MongoDB Atlas is the fully managed cloud database service for MongoDB. Atlas handles all the complexity of deploying, managing, and healing your deployments on the cloud service provider of your choice (AWS, Azure, and GCP). MongoDB also offers the MongoDB Enterprise Advanced on-premise database that includes comprehensive support, flexible licensing, and additional enterprise features.`,
    ],
  },
  {
    name: 'Artificial Intelligence — Overview',
    url: 'https://en.wikipedia.org/wiki/Artificial_intelligence',
    domain: 'en.wikipedia.org',
    tags: ['ai', 'machine-learning', 'technology', 'deep-learning', 'neural-networks'],
    chunks: [
      `Artificial intelligence (AI) is the intelligence of machines or software, as opposed to the intelligence of humans or animals. It is a field of study in computer science that develops and studies intelligent machines. Such machines may be called AIs. AI technology is widely used throughout industry, government, and science. Some high-profile applications are advanced web search engines, recommendation systems, and self-driving cars.`,
      `Machine learning is a subset of artificial intelligence that focuses on the development of algorithms and statistical models that enable computers to perform tasks without explicit instructions. Deep learning is part of a broader family of machine learning methods based on artificial neural networks. These neural networks are inspired by information processing and distributed communication nodes in biological systems.`,
      `Natural language processing (NLP) allows machines to read and understand human language. NLP tasks include text classification, named entity recognition, question answering, sentiment analysis, and machine translation. Modern NLP approaches use large language models (LLMs) trained on vast amounts of text data using transformer architectures. GPT, BERT, and other models have achieved remarkable results.`,
      `Computer vision is a field of AI that trains computers to interpret and understand the visual world. Using digital images from cameras and videos, deep learning models can accurately identify and classify objects, and then react to what they see. Applications include facial recognition, image classification, autonomous vehicles, medical image analysis, and augmented reality.`,
    ],
  },
  {
    name: 'TypeScript — Programming Language',
    url: 'https://en.wikipedia.org/wiki/TypeScript',
    domain: 'en.wikipedia.org',
    tags: ['typescript', 'javascript', 'programming', 'types', 'microsoft'],
    chunks: [
      `TypeScript is a free and open-source high-level programming language developed by Microsoft that adds static typing with optional type annotations to JavaScript. It is designed for the development of large applications and transpiles to JavaScript. TypeScript is a strict syntactical superset of JavaScript and adds optional static typing to the language. It was designed by Anders Hejlsberg at Microsoft.`,
      `TypeScript supports type annotations for variables, function parameters, and return values. This helps catch errors at compile time rather than at runtime. TypeScript's type system includes interfaces, generics, union types, intersection types, mapped types, and conditional types. These features enable developers to write more maintainable and self-documenting code.`,
      `TypeScript compiles to plain JavaScript, which means it runs everywhere JavaScript runs: in a browser, on Node.js, or in apps. The TypeScript compiler (tsc) checks for type errors during compilation and produces clean, readable JavaScript. TypeScript also supports modern JavaScript features like modules, classes, arrow functions, destructuring, and async/await.`,
      `TypeScript has become one of the most popular programming languages for web development. Major frameworks like Angular are written in TypeScript, and React and Vue.js have excellent TypeScript support. The language is widely used in enterprise applications, providing better tooling, refactoring support, and code navigation in editors like Visual Studio Code.`,
    ],
  },
  {
    name: 'Python — Programming Language',
    url: 'https://www.python.org/about/',
    domain: 'python.org',
    tags: ['python', 'programming', 'scripting', 'data-science', 'automation'],
    chunks: [
      `Python is a high-level, general-purpose programming language. Its design philosophy emphasizes code readability with the use of significant indentation. Python is dynamically typed and garbage-collected. It supports multiple programming paradigms, including structured, object-oriented, and functional programming. Python was conceived in the late 1980s by Guido van Rossum.`,
      `Python is commonly used for web development with frameworks like Django and Flask, data analysis and machine learning with libraries like NumPy, Pandas, and scikit-learn, artificial intelligence with TensorFlow and PyTorch, automation and scripting, scientific computing, and system administration. Its simple syntax and extensive library ecosystem make it accessible to beginners.`,
      `Python's standard library is very extensive, offering a wide range of facilities. The library contains built-in modules written in C that provide access to system functionality such as file I/O, as well as modules written in Python that provide standardized solutions for many problems in everyday programming. Some of these modules include os, sys, json, re, and urllib.`,
      `Python uses pip as its package manager, and the Python Package Index (PyPI) hosts over 400,000 packages. Virtual environments allow developers to create isolated Python environments for different projects. Python supports both synchronous and asynchronous programming, with the asyncio module providing support for asynchronous I/O, event loops, and coroutines.`,
    ],
  },
  {
    name: 'CSS Flexbox — Layout Guide',
    url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',
    domain: 'css-tricks.com',
    tags: ['css', 'flexbox', 'layout', 'frontend', 'web-design', 'responsive'],
    chunks: [
      `The Flexbox Layout (Flexible Box) module aims at providing a more efficient way to lay out, align and distribute space among items in a container, even when their size is unknown or dynamic. The main idea behind the flex layout is to give the container the ability to alter its items' width/height and order to best fill the available space.`,
      `A flex container expands items to fill available free space or shrinks them to prevent overflow. The flex-direction property establishes the main-axis, defining the direction flex items are placed in the flex container. Values include row, row-reverse, column, and column-reverse. The justify-content property defines alignment along the main axis and distributes extra free space.`,
      `The align-items property defines the default behavior for how flex items are laid out along the cross axis. Think of it as the justify-content version for the cross-axis. Values include flex-start, flex-end, center, baseline, and stretch. The flex-wrap property allows flex items to wrap onto multiple lines as needed, with values of nowrap, wrap, and wrap-reverse.`,
      `The flex property is a shorthand for flex-grow, flex-shrink, and flex-basis combined. The second and third parameters (flex-shrink and flex-basis) are optional. The default is 0 1 auto. It is recommended to use this shorthand property rather than set the individual properties. The gap property explicitly controls the space between flex items and applies that spacing only between items.`,
    ],
  },
  {
    name: 'Git — Version Control System',
    url: 'https://git-scm.com/about',
    domain: 'git-scm.com',
    tags: ['git', 'version-control', 'scm', 'developer-tools', 'collaboration'],
    chunks: [
      `Git is a free and open source distributed version control system designed to handle everything from small to very large projects with speed and efficiency. Git is easy to learn and has a tiny footprint with lightning fast performance. It outclasses SCM tools like Subversion, CVS, Perforce, and ClearCase with features like cheap local branching, convenient staging areas, and multiple workflows.`,
      `Branching in Git is incredibly lightweight, making branching operations nearly instantaneous, and switching back and forth between branches generally just as fast. Git encourages workflows that branch and merge often, even multiple times in a day. The Git feature that really makes it stand apart from nearly every other SCM is its branching model. Creating a new branch is as simple as git branch.`,
      `Git is a distributed version control system, which means that every developer has a full copy of the entire repository history on their local machine. This makes most operations much faster than centralized version control systems. You can commit, branch, and merge all locally without needing network access. Then you push your changes to a remote repository when you're ready.`,
      `GitHub, GitLab, and Bitbucket are popular hosting platforms for Git repositories. They add collaboration features like pull requests, issue tracking, and CI/CD pipelines on top of Git. GitHub is the largest host of source code in the world, with over 100 million developers and 330 million repositories. GitLab offers a complete DevOps platform, and Bitbucket integrates well with Atlassian products.`,
    ],
  },
  {
    name: 'REST API — Design Best Practices',
    url: 'https://restfulapi.net/',
    domain: 'restfulapi.net',
    tags: ['rest', 'api', 'http', 'backend', 'web-services', 'architecture'],
    chunks: [
      `REST stands for REpresentational State Transfer. It is an architectural style for designing networked applications. RESTful applications use HTTP requests to perform CRUD operations: Create (POST), Read (GET), Update (PUT/PATCH), and Delete (DELETE). REST is not a protocol or a standard, but rather a set of architectural constraints. API developers can implement REST in a variety of ways.`,
      `A RESTful API should follow key principles: use nouns instead of verbs in endpoint paths, handle errors gracefully and return standard error codes, use filtering, sorting, and pagination, maintain good security practices, and cache data to improve performance. Resources should be grouped logically, and the API should use JSON as the primary data format for request and response bodies.`,
      `HTTP status codes are an important part of REST API design. 200 OK for successful GET requests, 201 Created for successful POST requests that create a resource, 204 No Content for successful DELETE requests, 400 Bad Request for invalid client requests, 401 Unauthorized for authentication failures, 404 Not Found when a resource doesn't exist, and 500 Internal Server Error for unexpected server failures.`,
      `API versioning is important for maintaining backward compatibility. Common approaches include URI path versioning (/api/v1/users), query parameter versioning (?version=1), and header versioning (Accept: application/vnd.myapi.v1+json). Authentication and authorization are critical: common methods include API keys, OAuth 2.0, and JWT (JSON Web Tokens) for securing REST APIs.`,
    ],
  },
];

async function seed() {
  console.log('🌱 Seeding Parallel.AI search platform...\n');

  await connectDB();

  /* ── Step 1: Clean up stuck jobs ───────────────────── */
  const stuckJobs = await CrawlJob.updateMany(
    { stage: { $nin: ['completed', 'failed'] }, createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } },
    { $set: { stage: 'failed', error: 'Cleaned up by seed script — previous crash', completedAt: new Date() } }
  );
  if (stuckJobs.modifiedCount > 0) {
    console.log(`🧹 Cleaned up ${stuckJobs.modifiedCount} stuck crawl job(s)`);
  }

  /* ── Step 2: Insert sources and chunks ─────────────── */
  let sourcesCreated = 0;
  let totalChunksInserted = 0;

  for (const data of SEED_DATA) {
    // Check if already exists with chunks
    const existing = await Source.findOne({ url: data.url });
    if (existing) {
      const existingChunks = await Chunk.countDocuments({ source: existing._id });
      if (existingChunks >= data.chunks.length) {
        console.log(`  ⏭  Skipping "${data.name}" — already has ${existingChunks} chunks`);
        continue;
      }
      // Delete incomplete source to re-seed
      await Chunk.deleteMany({ source: existing._id });
      await CrawlJob.deleteMany({ source: existing._id });
      await existing.deleteOne();
    }

    process.stdout.write(`  📥 Seeding "${data.name}"...`);

    // Create source
    const source = await Source.create({
      name: data.name,
      url: data.url,
      domain: data.domain,
      type: 'webpage',
      crawlDepth: 0,
      tags: data.tags,
      trustScore: 0.8,
      favicon: `https://www.google.com/s2/favicons?domain=${data.domain}&sz=32`,
      crawlStatus: 'completed',
      lastCrawledAt: new Date(),
    });

    // Generate embeddings for all chunks
    const embeddings = await embedBatch(data.chunks);

    // Create chunk documents
    const chunkDocs = data.chunks.map((text, i) => ({
      source: source._id,
      sourceUrl: data.url,
      content: text,
      contentHash: contentHash(text),
      charCount: text.length,
      wordCount: text.split(/\s+/).length,
      position: i,
      totalChunks: data.chunks.length,
      citation: {
        title: data.name,
        url: data.url,
        domain: data.domain,
      },
      embedding: embeddings[i] || [],
      embeddingModel: EMBEDDING_MODEL,
      embeddingDim: EMBEDDING_DIM,
      trustScore: 0.8,
      confidenceScore: 0.7,
      qualityScore: 0.6,
      language: 'en',
      status: 'indexed',
      processedAt: new Date(),
    }));

    const inserted = await Chunk.insertMany(chunkDocs, { ordered: false });

    // Create a completed crawl job record
    await CrawlJob.create({
      source: source._id,
      url: data.url,
      depth: 0,
      stage: 'completed',
      progress: 100,
      startedAt: new Date(),
      completedAt: new Date(),
      duration: 0,
      chunksCreated: inserted.length,
      statusCode: 200,
      contentType: 'text/html',
      rawBytes: data.chunks.join('').length,
      pageTitle: data.name,
      language: 'en',
    });

    // Update source stats
    source.chunksCount = inserted.length;
    source.pagesCount = 1;
    await source.save();

    console.log(` ✅ ${inserted.length} chunks`);
    sourcesCreated++;
    totalChunksInserted += inserted.length;
  }

  /* ── Summary ───────────────────────────────────────── */
  const totalChunks = await Chunk.countDocuments({ status: 'indexed' });
  const totalSources = await Source.countDocuments();

  console.log(`\n📊 Seed complete:`);
  console.log(`   ✅ Sources created: ${sourcesCreated}`);
  console.log(`   📝 Chunks inserted: ${totalChunksInserted}`);
  console.log(`   📦 Total indexed chunks: ${totalChunks}`);
  console.log(`   🌐 Total sources: ${totalSources}`);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
