import { describe, expect, it } from 'vitest';
import { makeVideo } from '@/lib/testing/fixtures';
import { countDuplicateItems, findDuplicates } from './duplicates';

describe('findDuplicates', () => {
  it('agrupa la misma canción escrita de formas distintas', () => {
    const videos = [
      makeVideo({ videoId: 'a', title: 'Bohemian Rhapsody', artist: 'Queen' }),
      makeVideo({
        videoId: 'b',
        title: 'Bohemian Rhapsody (Official Video)',
        artist: 'Queen - Topic',
      }),
      makeVideo({ videoId: 'c', title: 'Otra canción', artist: 'Queen' }),
    ];
    const groups = findDuplicates(videos);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.videos.map((v) => v.videoId)).toEqual(['a', 'b']);
    expect(groups[0]?.label).toBe('Bohemian Rhapsody');
    expect(groups[0]?.artist).toBe('Queen');
  });

  it('no mezcla canciones homónimas de artistas distintos', () => {
    const videos = [
      makeVideo({ videoId: 'a', title: 'Hurt', artist: 'Nine Inch Nails' }),
      makeVideo({ videoId: 'b', title: 'Hurt', artist: 'Johnny Cash' }),
    ];
    expect(findDuplicates(videos)).toEqual([]);
  });

  it('ignora videos no disponibles y títulos vacíos', () => {
    const videos = [
      makeVideo({
        videoId: 'a',
        title: 'Deleted video',
        availability: 'deleted',
      }),
      makeVideo({
        videoId: 'b',
        title: 'Deleted video',
        availability: 'deleted',
      }),
      makeVideo({ videoId: 'c', title: '!!!' }),
      makeVideo({ videoId: 'd', title: '???' }),
    ];
    expect(findDuplicates(videos)).toEqual([]);
  });

  it('ordena por tamaño de grupo y luego por etiqueta', () => {
    const videos = [
      makeVideo({ videoId: '1', title: 'Beta' }),
      makeVideo({ videoId: '2', title: 'Beta' }),
      makeVideo({ videoId: '3', title: 'Alfa' }),
      makeVideo({ videoId: '4', title: 'Alfa' }),
      makeVideo({ videoId: '5', title: 'Gamma' }),
      makeVideo({ videoId: '6', title: 'Gamma' }),
      makeVideo({ videoId: '7', title: 'Gamma' }),
    ];
    const groups = findDuplicates(videos);
    expect(groups.map((g) => g.label)).toEqual(['Gamma', 'Alfa', 'Beta']);
    expect(countDuplicateItems(groups)).toBe(7);
  });
});
