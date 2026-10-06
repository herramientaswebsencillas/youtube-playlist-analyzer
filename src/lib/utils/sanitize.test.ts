import { describe, expect, it } from 'vitest';
import { playlistUrl, safeYouTubeUrl, videoUrl } from './sanitize';

describe('safeYouTubeUrl', () => {
  it.each([
    'https://www.youtube.com/watch?v=abc',
    'https://i.ytimg.com/vi/abc/mqdefault.jpg',
    'https://yt3.ggpht.com/foto.jpg',
    'https://music.youtube.com/playlist?list=abc',
  ])('acepta %s', (url) => {
    expect(safeYouTubeUrl(url)).toBe(url);
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'https://evil.com/',
    'https://youtube.com.evil.com/',
    'https://evilyoutube.com/',
    'ftp://www.youtube.com/',
    'no es una url',
    '',
    null,
    undefined,
  ])('rechaza %j', (value) => {
    expect(safeYouTubeUrl(value)).toBeNull();
  });
});

describe('videoUrl / playlistUrl', () => {
  it('codifica el ID', () => {
    expect(videoUrl('a b&c')).toBe('https://www.youtube.com/watch?v=a%20b%26c');
    expect(playlistUrl('PL1')).toBe(
      'https://www.youtube.com/playlist?list=PL1',
    );
  });
});
