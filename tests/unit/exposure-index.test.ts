import { describe, expect, it } from 'vitest';
import { createExposureIndex } from '../../src/content/exposure.ts';
import { validBundle } from '../fixtures/bundle.ts';

describe('exposure reverse index', () => {
  it('maps an authored relationship to the family it reveals', () => {
    const index = createExposureIndex(validBundle());
    // The fixture lists rel-beta-gamma as exposure for the sequence family.
    expect(index.familiesFor('relationship', 'rel-beta-gamma')).toEqual([
      'family-fictional-sequence',
    ]);
  });

  it('maps an authored explanation to its family', () => {
    const index = createExposureIndex(validBundle());
    expect(index.familiesFor('explanation', 'why-fictional-beta-root')).toEqual([
      'family-fictional-sequence',
    ]);
  });

  it('returns every family for a shared source, sorted, without duplicates', () => {
    const bundle = validBundle();
    const second = structuredClone(bundle.predictions[0]!);
    second.id = 'pred-second';
    second.familyId = 'family-another';
    bundle.predictions.push(second);
    const index = createExposureIndex(bundle);
    expect(index.familiesFor('relationship', 'rel-beta-gamma')).toEqual([
      'family-another',
      'family-fictional-sequence',
    ]);
  });

  it('does not treat a question timeline as exposure unless it is listed', () => {
    const index = createExposureIndex(validBundle());
    expect(index.familiesFor('timeline', 'exercise-synthetic-feedback')).toEqual([]);
  });

  it('maps a listed exposure timeline to its family', () => {
    const bundle = validBundle();
    bundle.predictions[0]!.exposureTimelineIds = ['j-other-lesson'];
    const index = createExposureIndex(bundle);
    expect(index.familiesFor('timeline', 'j-other-lesson')).toEqual(['family-fictional-sequence']);
  });

  it('answers unknown ids with an empty list', () => {
    const index = createExposureIndex(validBundle());
    expect(index.familiesFor('relationship', 'rel-nowhere')).toEqual([]);
  });
});
