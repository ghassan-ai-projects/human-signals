/**
 * Document 04 fingerprint rules and document 05 determinism: identical inputs must produce
 * identical bytes and identical hashes, key order must not matter, array order must matter, and
 * recording an approval must not change the hash that approval refers to.
 */
import { describe, expect, it } from 'vitest';
import {
  canonicalJson,
  scientificHash,
  serialiseBundle,
  sha256Hex,
  sortBundleRecords,
} from '../../src/content/hash.ts';
import { validBundle } from '../fixtures/bundle.ts';

describe('canonical serialisation', () => {
  it('sorts object keys recursively and ignores source key order', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}');
    expect(canonicalJson({ a: { c: 3, d: 2 }, b: 1 })).toBe(canonicalJson({ b: 1, a: { d: 2, c: 3 } }));
  });

  it('preserves array order, because event order carries meaning', () => {
    expect(canonicalJson([2, 1])).toBe('[2,1]');
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
  });

  it('treats an absent optional field and an explicit undefined identically', () => {
    expect(canonicalJson({ a: 1, b: undefined })).toBe(canonicalJson({ a: 1 }));
  });

  it('refuses a non-finite number rather than emitting null', () => {
    expect(() => canonicalJson({ a: Number.NaN })).toThrow();
  });
});

describe('bundle hashing', () => {
  it('produces identical bytes for identical content', async () => {
    const first = serialiseBundle(sortBundleRecords(validBundle()));
    const second = serialiseBundle(sortBundleRecords(validBundle()));
    expect(first).toBe(second);
    expect(await sha256Hex(first)).toBe(await sha256Hex(second));
  });

  it('is insensitive to the order records were authored in', () => {
    const forward = validBundle();
    const reversed = validBundle();
    reversed.claims.reverse();
    reversed.explanations.reverse();
    expect(serialiseBundle(sortBundleRecords(forward))).toBe(
      serialiseBundle(sortBundleRecords(reversed)),
    );
  });

  it('excludes the review ledger from the scientific hash', async () => {
    const before = await scientificHash(validBundle());
    const withReview = validBundle();
    withReview.reviews.push({
      id: 'review-test',
      bundleSha256: 'a'.repeat(64),
      reviewerId: 'reviewer-test',
      reviewerRole: 'test',
      qualification: 'test fixture, not a real reviewer',
      reviewedOn: '2026-01-01',
      disposition: 'approved',
      visualReviewBuildId: 'test',
      notes: '',
    });
    expect(await scientificHash(withReview)).toBe(before);
  });

  it('changes the scientific hash when a claim changes', async () => {
    const before = await scientificHash(validBundle());
    const changed = validBundle();
    changed.claims[0]!.support = 'contested';
    expect(await scientificHash(changed)).not.toBe(before);
  });

  it('changes the scientific hash when an anatomy anchor mapping changes', async () => {
    const before = await scientificHash(validBundle());
    const changed = validBundle();
    changed.anchors[0]!.position = [0, 0, 0];
    expect(await scientificHash(changed)).not.toBe(before);
  });
});
