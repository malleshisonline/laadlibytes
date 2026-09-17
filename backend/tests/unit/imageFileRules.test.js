import { describe, expect, test } from '@jest/globals';

import { detectImageMimeTypeFromFileSignature } from '../../src/utils/imageFileRules.js';

const paddedTo16Bytes = (headerBytes) => Buffer.concat([headerBytes, Buffer.alloc(16)]).subarray(0, 16);

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
const WEBP_HEADER = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x24, 0x00, 0x00, 0x00]), Buffer.from('WEBPVP8 ')]);
const avifHeaderWithBrand = (majorBrand) =>
  Buffer.concat([Buffer.from([0x00, 0x00, 0x00, 0x1c]), Buffer.from('ftyp'), Buffer.from(majorBrand)]);

describe('detectImageMimeTypeFromFileSignature', () => {
  test.each([
    ['PNG', PNG_HEADER, 'image/png'],
    ['JPEG', JPEG_HEADER, 'image/jpeg'],
    ['WebP', WEBP_HEADER, 'image/webp'],
    ['AVIF still image', avifHeaderWithBrand('avif'), 'image/avif'],
    ['AVIF image sequence', avifHeaderWithBrand('avis'), 'image/avif'],
  ])('recognises %s', (_formatName, headerBytes, expectedMimeType) => {
    expect(detectImageMimeTypeFromFileSignature(paddedTo16Bytes(headerBytes))).toBe(expectedMimeType);
  });

  test.each([
    ['GIF', Buffer.from('GIF89a')],
    ['a RIFF file that is not WebP (WAV audio)', Buffer.concat([Buffer.from('RIFF'), Buffer.alloc(4), Buffer.from('WAVE')])],
    ['an ISO media file that is not AVIF (MP4 video)', avifHeaderWithBrand('isom')],
    ['HEIC, which shares the ftyp box with AVIF', avifHeaderWithBrand('heic')],
    ['plain text', Buffer.from('just some text here')],
  ])('rejects %s', (_description, headerBytes) => {
    expect(detectImageMimeTypeFromFileSignature(paddedTo16Bytes(headerBytes))).toBeNull();
  });

  test('rejects an empty or non-buffer input', () => {
    expect(detectImageMimeTypeFromFileSignature(Buffer.alloc(0))).toBeNull();
    expect(detectImageMimeTypeFromFileSignature('RIFF....WEBP')).toBeNull();
  });
});