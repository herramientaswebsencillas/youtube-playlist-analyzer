import { describe, expect, it } from 'vitest';
import { makeResult, makeVideo, PLAYLIST_ID } from '@/lib/testing/fixtures';
import { parseImportedAnalysis } from './import';
import { toJson } from './json';

describe('parseImportedAnalysis', () => {
  it('reimporta sin pérdida lo que exporta toJson', () => {
    const original = makeResult([
      makeVideo({ videoId: 'a', title: 'Song', artist: 'Queen', position: 0 }),
      makeVideo({
        videoId: 'b',
        title: 'Song (HD)',
        artist: 'Queen',
        position: 1,
      }),
      makeVideo({
        videoId: 'c',
        title: 'Deleted video',
        previousTitle: 'Queen - Otra',
        availability: 'deleted',
        reason: 'Video eliminado',
        position: 2,
      }),
    ]);

    const imported = parseImportedAnalysis(toJson(original));

    expect(imported).toEqual(original);
    expect(imported.duplicates).toHaveLength(1);
    expect(imported.unavailable.map((v) => v.videoId)).toEqual(['c']);
  });

  it('acepta un AnalysisResult crudo ({ info, videos })', () => {
    const original = makeResult([makeVideo({ videoId: 'a', title: 'Song' })]);
    expect(parseImportedAnalysis(JSON.stringify(original))).toEqual(original);
  });

  it('rellena campos ausentes de exportaciones antiguas', () => {
    const text = JSON.stringify({
      playlist: { playlistId: PLAYLIST_ID, title: 'Vieja' },
      videos: [
        { videoId: 'abc', title: 'Queen - Song' },
        { videoId: 'def', title: 'X', availability: 'desconocido' },
      ],
    });

    const { info, videos } = parseImportedAnalysis(text);

    expect(info).toEqual({
      playlistId: PLAYLIST_ID,
      title: 'Vieja',
      channelTitle: null,
      reportedItemCount: null,
    });
    expect(videos[0]).toMatchObject({
      songTitle: 'Queen - Song',
      normalizedTitle: 'queen song',
      url: 'https://www.youtube.com/watch?v=abc',
      availability: 'available',
      position: 0,
    });
    expect(videos[1]).toMatchObject({ availability: 'available', position: 1 });
  });

  it.each([
    ['no es json', 'El archivo no es un JSON válido.'],
    ['[]', 'Formato de archivo no reconocido.'],
    ['{"videos":[{}]}', 'El archivo no incluye la información de la playlist.'],
    [
      '{"playlist":{"title":"t"},"videos":[{}]}',
      'El archivo no contiene datos válidos de la playlist.',
    ],
    [
      '{"playlist":{"playlistId":"../otra-clave","title":"t"},"videos":[{}]}',
      'El archivo contiene un ID de playlist no válido.',
    ],
    [
      `{"playlist":{"playlistId":"${PLAYLIST_ID}","title":"t"},"videos":[]}`,
      'El archivo no contiene elementos de la playlist.',
    ],
  ])('rechaza %s', (text, message) => {
    expect(() => parseImportedAnalysis(text)).toThrow(message);
  });
});
