/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  E.D.I.T.H — In-Memory Redis Replacement for Development               ║
 * ║                                                                          ║
 * ║  A zero-dependency, in-process key-value store that implements the       ║
 * ║  ioredis API surface used across the codebase:                           ║
 * ║                                                                          ║
 * ║    Strings  → get · set · incr · incrby · del                            ║
 * ║    Hashes   → hset · hget · hincrby · hgetall                           ║
 * ║    Lists    → lpush · lrange · ltrim · llen                              ║
 * ║    Sets     → sadd · sismember · scard · smembers                       ║
 * ║    HyperLL  → pfadd · pfcount                                            ║
 * ║    TTL      → expire · setex · pexpire · ttl                             ║
 * ║    Pipeline → pipeline().set().get()...exec()                            ║
 * ║    Utility  → keys · exists · flushall · dbsize                          ║
 * ║                                                                          ║
 * ║  TTL is enforced via lazy expiry + periodic sweep (every 30 s).          ║
 * ║  No persistence, no networking — pure in-memory for dev speed.           ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

class MemoryRedis {
  constructor() {
    /** @type {Map<string, { value: any, expiresAt: number|null }>} */
    this.store = new Map();
    this.status = 'ready';
    this._sweepInterval = setInterval(() => this._sweep(), 30_000);
    // Don't prevent process exit
    if (this._sweepInterval.unref) this._sweepInterval.unref();
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  _now() {
    return Date.now();
  }

  /** Get entry if it hasn't expired; auto-delete if stale */
  _getEntry(key) {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt !== null && entry.expiresAt <= this._now()) {
      this.store.delete(key);
      return undefined;
    }
    return entry;
  }

  _setEntry(key, value, expiresAt = null) {
    this.store.set(key, { value, expiresAt });
  }

  /** Periodic sweep of expired keys */
  _sweep() {
    const now = this._now();
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  // ── String commands ────────────────────────────────────────────────────────

  async get(key) {
    const entry = this._getEntry(key);
    if (!entry) return null;
    return String(entry.value);
  }

  async set(key, value, ...args) {
    let expiresAt = null;
    // Parse ioredis-style args: 'EX', seconds | 'PX', ms
    for (let i = 0; i < args.length; i++) {
      const flag = String(args[i]).toUpperCase();
      if (flag === 'EX' && args[i + 1] != null) {
        expiresAt = this._now() + Number(args[i + 1]) * 1000;
        i++;
      } else if (flag === 'PX' && args[i + 1] != null) {
        expiresAt = this._now() + Number(args[i + 1]);
        i++;
      }
    }
    this._setEntry(key, value, expiresAt);
    return 'OK';
  }

  async setex(key, seconds, value) {
    this._setEntry(key, value, this._now() + seconds * 1000);
    return 'OK';
  }

  async incr(key) {
    const entry = this._getEntry(key);
    const current = entry ? parseInt(entry.value, 10) || 0 : 0;
    const next = current + 1;
    // Preserve existing TTL
    this._setEntry(key, next, entry ? entry.expiresAt : null);
    return next;
  }

  async incrby(key, amount) {
    const entry = this._getEntry(key);
    const current = entry ? parseInt(entry.value, 10) || 0 : 0;
    const next = current + Number(amount);
    this._setEntry(key, next, entry ? entry.expiresAt : null);
    return next;
  }

  async decr(key) {
    return this.incrby(key, -1);
  }

  async decrby(key, amount) {
    return this.incrby(key, -Number(amount));
  }

  async mget(...keys) {
    const flat = keys.flat();
    return Promise.all(flat.map((k) => this.get(k)));
  }

  async mset(...args) {
    const flat = args.flat();
    for (let i = 0; i < flat.length; i += 2) {
      await this.set(flat[i], flat[i + 1]);
    }
    return 'OK';
  }

  // ── Key commands ───────────────────────────────────────────────────────────

  async del(...keys) {
    const flat = keys.flat();
    let count = 0;
    for (const key of flat) {
      if (this.store.has(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async exists(...keys) {
    const flat = keys.flat();
    let count = 0;
    for (const key of flat) {
      if (this._getEntry(key)) count++;
    }
    return count;
  }

  async expire(key, seconds) {
    const entry = this._getEntry(key);
    if (!entry) return 0;
    entry.expiresAt = this._now() + Number(seconds) * 1000;
    return 1;
  }

  async pexpire(key, ms) {
    const entry = this._getEntry(key);
    if (!entry) return 0;
    entry.expiresAt = this._now() + Number(ms);
    return 1;
  }

  async ttl(key) {
    const entry = this._getEntry(key);
    if (!entry) return -2; // key doesn't exist
    if (entry.expiresAt === null) return -1; // no expiry
    return Math.max(0, Math.ceil((entry.expiresAt - this._now()) / 1000));
  }

  async keys(pattern) {
    const now = this._now();
    const results = [];
    const regex = new RegExp(
      '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );
    for (const [key, entry] of this.store) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.store.delete(key);
        continue;
      }
      if (regex.test(key)) results.push(key);
    }
    return results;
  }

  async type(key) {
    const entry = this._getEntry(key);
    if (!entry) return 'none';
    const v = entry.value;
    if (v instanceof Map) return 'hash';
    if (Array.isArray(v)) return 'list';
    if (v instanceof Set) return 'set';
    return 'string';
  }

  // ── Hash commands ──────────────────────────────────────────────────────────

  _getHash(key) {
    const entry = this._getEntry(key);
    if (!entry) {
      const m = new Map();
      this._setEntry(key, m);
      return m;
    }
    if (!(entry.value instanceof Map)) {
      const m = new Map();
      this._setEntry(key, m, entry.expiresAt);
      return m;
    }
    return entry.value;
  }

  async hset(key, ...args) {
    const hash = this._getHash(key);
    // hset(key, field, value) or hset(key, { field: value, ... }) or hset(key, f1, v1, f2, v2)
    if (args.length === 1 && typeof args[0] === 'object' && !(args[0] instanceof Map)) {
      const obj = args[0];
      for (const [f, v] of Object.entries(obj)) hash.set(f, String(v));
      return Object.keys(obj).length;
    }
    let count = 0;
    for (let i = 0; i < args.length; i += 2) {
      hash.set(String(args[i]), String(args[i + 1]));
      count++;
    }
    return count;
  }

  async hget(key, field) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Map)) return null;
    const val = entry.value.get(String(field));
    return val !== undefined ? String(val) : null;
  }

  async hincrby(key, field, amount) {
    const hash = this._getHash(key);
    const current = parseInt(hash.get(String(field)) || '0', 10);
    const next = current + Number(amount);
    hash.set(String(field), String(next));
    return next;
  }

  async hgetall(key) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Map)) return {};
    const obj = {};
    for (const [f, v] of entry.value) obj[f] = String(v);
    return obj;
  }

  async hdel(key, ...fields) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Map)) return 0;
    let count = 0;
    for (const f of fields.flat()) {
      if (entry.value.delete(String(f))) count++;
    }
    return count;
  }

  async hexists(key, field) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Map)) return 0;
    return entry.value.has(String(field)) ? 1 : 0;
  }

  async hlen(key) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Map)) return 0;
    return entry.value.size;
  }

  // ── List commands ──────────────────────────────────────────────────────────

  _getList(key) {
    const entry = this._getEntry(key);
    if (!entry) {
      const arr = [];
      this._setEntry(key, arr);
      return arr;
    }
    if (!Array.isArray(entry.value)) {
      const arr = [];
      this._setEntry(key, arr, entry.expiresAt);
      return arr;
    }
    return entry.value;
  }

  async lpush(key, ...values) {
    const list = this._getList(key);
    const flat = values.flat();
    list.unshift(...flat.reverse()); // Redis lpush inserts at head
    return list.length;
  }

  async rpush(key, ...values) {
    const list = this._getList(key);
    const flat = values.flat();
    list.push(...flat);
    return list.length;
  }

  async lpop(key) {
    const entry = this._getEntry(key);
    if (!entry || !Array.isArray(entry.value) || entry.value.length === 0) return null;
    return String(entry.value.shift());
  }

  async rpop(key) {
    const entry = this._getEntry(key);
    if (!entry || !Array.isArray(entry.value) || entry.value.length === 0) return null;
    return String(entry.value.pop());
  }

  async lrange(key, start, stop) {
    const entry = this._getEntry(key);
    if (!entry || !Array.isArray(entry.value)) return [];
    const list = entry.value;
    const len = list.length;
    let s = start < 0 ? Math.max(len + start, 0) : start;
    let e = stop < 0 ? len + stop : stop;
    return list.slice(s, e + 1).map(String);
  }

  async ltrim(key, start, stop) {
    const entry = this._getEntry(key);
    if (!entry || !Array.isArray(entry.value)) return 'OK';
    const list = entry.value;
    const len = list.length;
    let s = start < 0 ? Math.max(len + start, 0) : start;
    let e = stop < 0 ? len + stop : stop;
    entry.value = list.slice(s, e + 1);
    return 'OK';
  }

  async llen(key) {
    const entry = this._getEntry(key);
    if (!entry || !Array.isArray(entry.value)) return 0;
    return entry.value.length;
  }

  async lindex(key, index) {
    const entry = this._getEntry(key);
    if (!entry || !Array.isArray(entry.value)) return null;
    const list = entry.value;
    const idx = index < 0 ? list.length + index : index;
    return list[idx] !== undefined ? String(list[idx]) : null;
  }

  // ── Set commands ───────────────────────────────────────────────────────────

  _getSet(key) {
    const entry = this._getEntry(key);
    if (!entry) {
      const s = new Set();
      this._setEntry(key, s);
      return s;
    }
    if (!(entry.value instanceof Set)) {
      const s = new Set();
      this._setEntry(key, s, entry.expiresAt);
      return s;
    }
    return entry.value;
  }

  async sadd(key, ...members) {
    const set = this._getSet(key);
    let added = 0;
    for (const m of members.flat()) {
      const str = String(m);
      if (!set.has(str)) { set.add(str); added++; }
    }
    return added;
  }

  async srem(key, ...members) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Set)) return 0;
    let removed = 0;
    for (const m of members.flat()) {
      if (entry.value.delete(String(m))) removed++;
    }
    return removed;
  }

  async sismember(key, member) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Set)) return 0;
    return entry.value.has(String(member)) ? 1 : 0;
  }

  async scard(key) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Set)) return 0;
    return entry.value.size;
  }

  async smembers(key) {
    const entry = this._getEntry(key);
    if (!entry || !(entry.value instanceof Set)) return [];
    return [...entry.value];
  }

  // ── HyperLogLog (approximate unique counts — exact in dev, same API) ─────

  async pfadd(key, ...elements) {
    // Use a Set under the hood for exact counts
    const set = this._getSet(key);
    let changed = 0;
    for (const el of elements.flat()) {
      const str = String(el);
      if (!set.has(str)) { set.add(str); changed = 1; }
    }
    return changed;
  }

  async pfcount(...keys) {
    const flat = keys.flat();
    if (flat.length === 1) {
      const entry = this._getEntry(flat[0]);
      if (!entry || !(entry.value instanceof Set)) return 0;
      return entry.value.size;
    }
    // Merge multiple HLLs
    const merged = new Set();
    for (const k of flat) {
      const entry = this._getEntry(k);
      if (entry && entry.value instanceof Set) {
        for (const v of entry.value) merged.add(v);
      }
    }
    return merged.size;
  }

  // ── Pipeline (batch commands, execute together) ────────────────────────────

  pipeline() {
    return new MemoryPipeline(this);
  }

  // ── Utility ────────────────────────────────────────────────────────────────

  async flushall() {
    this.store.clear();
    return 'OK';
  }

  async flushdb() {
    return this.flushall();
  }

  async dbsize() {
    this._sweep();
    return this.store.size;
  }

  async ping(message) {
    return message || 'PONG';
  }

  async info() {
    return `# MemoryRedis (dev)\r\nkeys=${this.store.size}\r\n`;
  }

  /** ioredis-compat: no-op event methods */
  on(event, handler) { 
    // Fire 'connect' and 'ready' immediately
    if (event === 'connect' || event === 'ready') {
      setImmediate(handler);
    }
    return this; 
  }
  once(event, handler) { return this.on(event, handler); }
  removeListener() { return this; }

  /** Cleanup (for graceful shutdown) */
  disconnect() {
    clearInterval(this._sweepInterval);
    this.store.clear();
    this.status = 'end';
  }
  quit() { return this.disconnect(); }
}


/**
 * Pipeline — buffers commands and executes them atomically.
 */
class MemoryPipeline {
  constructor(redis) {
    this._redis = redis;
    this._queue = [];
  }

  // Dynamically proxy all command methods
  _enqueue(method, args) {
    this._queue.push({ method, args });
    return this; // chainable
  }

  // Generate proxy methods for all supported commands
  get(...args)      { return this._enqueue('get', args); }
  set(...args)      { return this._enqueue('set', args); }
  setex(...args)    { return this._enqueue('setex', args); }
  del(...args)      { return this._enqueue('del', args); }
  incr(...args)     { return this._enqueue('incr', args); }
  incrby(...args)   { return this._enqueue('incrby', args); }
  expire(...args)   { return this._enqueue('expire', args); }
  hset(...args)     { return this._enqueue('hset', args); }
  hget(...args)     { return this._enqueue('hget', args); }
  hincrby(...args)  { return this._enqueue('hincrby', args); }
  hgetall(...args)  { return this._enqueue('hgetall', args); }
  lpush(...args)    { return this._enqueue('lpush', args); }
  lrange(...args)   { return this._enqueue('lrange', args); }
  ltrim(...args)    { return this._enqueue('ltrim', args); }
  llen(...args)     { return this._enqueue('llen', args); }
  sadd(...args)     { return this._enqueue('sadd', args); }
  sismember(...args){ return this._enqueue('sismember', args); }
  scard(...args)    { return this._enqueue('scard', args); }
  pfadd(...args)    { return this._enqueue('pfadd', args); }
  pfcount(...args)  { return this._enqueue('pfcount', args); }

  async exec() {
    const results = [];
    for (const { method, args } of this._queue) {
      try {
        const result = await this._redis[method](...args);
        results.push([null, result]);
      } catch (err) {
        results.push([err, null]);
      }
    }
    this._queue = [];
    return results;
  }
}

module.exports = { MemoryRedis };
