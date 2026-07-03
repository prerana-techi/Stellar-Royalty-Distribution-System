import { describe, it, expect } from 'vitest';
import { shortenAddress, formatXLM, getExplorerTxUrl } from '@/shared/lib/stellar';

describe('Stellar Utilities', () => {
  describe('shortenAddress', () => {
    it('should shorten a full Stellar address', () => {
      const addr = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV';
      const short = shortenAddress(addr, 6);
      expect(short).toBe('GABCDE...QRSTUV');
    });

    it('should return empty string for empty input', () => {
      expect(shortenAddress('')).toBe('');
    });

    it('should use default chars of 4', () => {
      const addr = 'GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV';
      const short = shortenAddress(addr);
      expect(short).toBe('GABC...STUV');
    });
  });

  describe('formatXLM', () => {
    it('should format stroops to XLM', () => {
      expect(formatXLM(10000000)).toBe('1.00');
    });

    it('should handle large amounts', () => {
      const result = formatXLM(50000000000);
      expect(result).toContain('5');
    });

    it('should handle zero', () => {
      expect(formatXLM(0)).toBe('0.00');
    });
  });

  describe('getExplorerTxUrl', () => {
    it('should generate correct explorer URL', () => {
      const url = getExplorerTxUrl('abc123');
      expect(url).toContain('stellar.expert');
      expect(url).toContain('abc123');
    });
  });
});
