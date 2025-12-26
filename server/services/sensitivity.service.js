const KEYWORDS = ['banned', 'prohibited', 'restricted'];

class SensitivityService {
  analyze({ filename, size, durationSeconds }) {
    const lower = (filename || '').toLowerCase();
    const keywordHit = KEYWORDS.some((k) => lower.includes(k));
    const oddSize = typeof size === 'number' && size % 2 === 1;
    const segments = [];

    if (durationSeconds && durationSeconds > 30) {
      segments.push({ start: 10, end: 15, reason: 'Simulated sensitive segment' });
    }

    if (keywordHit) {
      const start = Math.max(0, Math.min(5, durationSeconds || 5) - 2);
      const end = start + Math.min(3, durationSeconds ? durationSeconds * 0.1 : 3);
      segments.push({ start, end, reason: 'Filename contains sensitive keyword' });
    }

    if (oddSize) {
      segments.push({ start: 0, end: Math.min(3, durationSeconds || 3), reason: 'Heuristic odd-size flag' });
    }

    const flagged = segments.length > 0;

    return {
      status: flagged ? 'FLAGGED' : 'SAFE',
      confidence: flagged ? 90 : 20,
      reason: flagged ? segments[0].reason : 'No sensitive patterns detected',
      sensitivitySegments: segments,
    };
  }
}

module.exports = new SensitivityService();
