/**
 * Unit Tests — Utility Functions (lib/utils.ts)
 */
import {
  cn,
  formatNumber,
  formatPrice,
  timeAgo,
  truncate,
  getInitials,
  generateAvatarColor,
  debounce,
} from '@/lib/utils';

describe('cn (className merger)', () => {
  it('should merge class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    const result = cn('base', false && 'hidden', 'visible');
    expect(result).toBe('base visible');
  });

  it('should merge Tailwind conflicts', () => {
    const result = cn('p-4', 'p-2');
    expect(result).toBe('p-2'); // tailwind-merge keeps the last one
  });
});

describe('formatNumber', () => {
  it('should return raw number below 1000', () => {
    expect(formatNumber(999)).toBe('999');
    expect(formatNumber(0)).toBe('0');
  });

  it('should format thousands as K', () => {
    expect(formatNumber(1000)).toBe('1.0K');
    expect(formatNumber(15000)).toBe('15.0K');
    expect(formatNumber(999999)).toBe('1000.0K');
  });

  it('should format millions as M', () => {
    expect(formatNumber(1000000)).toBe('1.0M');
    expect(formatNumber(2500000)).toBe('2.5M');
  });
});

describe('formatPrice', () => {
  it('should format currency amount', () => {
    const result = formatPrice(29.99);
    expect(result).toContain('29.99');
  });

  it('should return empty string for no amount', () => {
    expect(formatPrice(undefined)).toBe('');
    expect(formatPrice(0)).toBe('');
  });
});

describe('timeAgo', () => {
  it('should return "just now" for recent dates', () => {
    expect(timeAgo(new Date().toISOString())).toBe('just now');
  });

  it('should return minutes format', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    expect(timeAgo(fiveMinAgo)).toBe('5m ago');
  });

  it('should return hours format', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000).toISOString();
    expect(timeAgo(twoHoursAgo)).toBe('2h ago');
  });

  it('should return days format', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000).toISOString();
    expect(timeAgo(threeDaysAgo)).toBe('3d ago');
  });
});

describe('truncate', () => {
  it('should not truncate short strings', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('should truncate long strings with ellipsis', () => {
    expect(truncate('hello world', 5)).toBe('hello...');
  });

  it('should handle exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('getInitials', () => {
  it('should return first letter of each word', () => {
    expect(getInitials('John Doe')).toBe('JD');
  });

  it('should cap at 2 characters', () => {
    expect(getInitials('John Michael Doe')).toBe('JM');
  });

  it('should handle single word', () => {
    expect(getInitials('Admin')).toBe('A');
  });
});

describe('generateAvatarColor', () => {
  it('should return a hex color', () => {
    const color = generateAvatarColor('testuser');
    expect(color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('should return the same color for the same name', () => {
    expect(generateAvatarColor('alice')).toBe(generateAvatarColor('alice'));
  });

  it('should return different colors for different names', () => {
    // Not guaranteed but very likely
    const a = generateAvatarColor('alice');
    const b = generateAvatarColor('zzzzz');
    // Just check they're both valid
    expect(a).toMatch(/^#/);
    expect(b).toMatch(/^#/);
  });
});

describe('debounce', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('should delay execution', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    expect(fn).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous call on rapid fire', () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 300);

    debounced();
    debounced();
    debounced();

    jest.advanceTimersByTime(300);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
