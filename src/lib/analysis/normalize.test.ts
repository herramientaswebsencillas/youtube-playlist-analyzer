import { describe, expect, it } from 'vitest';
import {
  buildDedupKey,
  deriveTrackMeta,
  isPlaceholderTitle,
  normalizeArtist,
  normalizeTitle,
} from './normalize';

describe('normalizeTitle', () => {
  it.each([
    ['Bohemian Rhapsody (Official Video)', 'bohemian rhapsody'],
    ['Bohemian Rhapsody [Official Music Video]', 'bohemian rhapsody'],
    ['Song {Lyric Video}', 'song'],
    ['Yesterday - Remastered', 'yesterday'],
    ['Despacito HD', 'despacito'],
    ['Song - Live | HD', 'song'],
    ['Canción de Ñandú', 'cancion de nandu'],
    ['  HELLO,   World!!  ', 'hello world'],
    ['Amor (en vivo)', 'amor'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeTitle(input)).toBe(expected);
  });

  it('conserva palabras clave que forman parte del título', () => {
    // "Live" no está al final ni entre paréntesis: es parte del nombre.
    expect(normalizeTitle('Live Forever')).toBe('live forever');
  });

  it('respeta la configuración recibida', () => {
    expect(
      normalizeTitle('Canción', {
        tagKeywords: [],
        stripDiacritics: false,
        caseInsensitive: false,
      }),
    ).toBe('Canción');
  });
});

describe('normalizeArtist', () => {
  it.each([
    ['Queen - Topic', 'queen'],
    ['QueenVEVO', 'queen'],
    ['Beyoncé', 'beyonce'],
    ['  AC/DC ', 'ac dc'],
  ])('%j → %j', (input, expected) => {
    expect(normalizeArtist(input)).toBe(expected);
  });

  it('devuelve cadena vacía sin artista', () => {
    expect(normalizeArtist(null)).toBe('');
    expect(normalizeArtist(undefined)).toBe('');
    expect(normalizeArtist('')).toBe('');
  });
});

describe('deriveTrackMeta', () => {
  it('prioriza el bloque "Provided to YouTube by" de la descripción', () => {
    const description = [
      'Provided to YouTube by Universal Music Group',
      '',
      'Bohemian Rhapsody · Queen',
      '',
      'A Night At The Opera',
    ].join('\n');
    expect(
      deriveTrackMeta({
        title: 'Otro - Título',
        channelTitle: 'Canal - Topic',
        description,
      }),
    ).toEqual({ title: 'Bohemian Rhapsody', artist: 'Queen' });
  });

  it('une varios artistas de la descripción', () => {
    const description =
      'Provided to YouTube by X\n\nCanción · Artista A · Artista B\n';
    expect(deriveTrackMeta({ title: 't', description })).toEqual({
      title: 'Canción',
      artist: 'Artista A, Artista B',
    });
  });

  it('usa el canal "Artista - Topic"', () => {
    expect(
      deriveTrackMeta({ title: 'Song', channelTitle: 'Queen - Topic' }),
    ).toEqual({ title: 'Song', artist: 'Queen' });
  });

  it('interpreta el patrón "Artista - Canción"', () => {
    expect(
      deriveTrackMeta({
        title: 'Queen - Bohemian Rhapsody (Official Video)',
        channelTitle: 'Queen Official',
      }),
    ).toEqual({ artist: 'Queen', title: 'Bohemian Rhapsody (Official Video)' });
  });

  it('no toma una etiqueta como nombre de canción', () => {
    expect(
      deriveTrackMeta({ title: 'Song - Live', channelTitle: 'Canal' }),
    ).toEqual({ title: 'Song - Live', artist: 'Canal' });
  });

  it('usa el canal como artista cuando no hay otro dato', () => {
    expect(deriveTrackMeta({ title: 'Algo', channelTitle: 'Canal' })).toEqual({
      title: 'Algo',
      artist: 'Canal',
    });
    expect(deriveTrackMeta({ title: 'Algo' })).toEqual({
      title: 'Algo',
      artist: null,
    });
  });
});

describe('buildDedupKey', () => {
  it('combina título y artista', () => {
    expect(buildDedupKey('song', 'queen')).toBe('song|@|queen');
  });

  it('usa solo el título si no hay artista', () => {
    expect(buildDedupKey('song', '')).toBe('song');
  });
});

describe('isPlaceholderTitle', () => {
  it.each([
    ['Deleted video', true],
    ['  private VIDEO ', true],
    ['Deleted video (live)', false],
    ['Bohemian Rhapsody', false],
  ])('%s → %s', (title, expected) => {
    expect(isPlaceholderTitle(title)).toBe(expected);
  });
});
