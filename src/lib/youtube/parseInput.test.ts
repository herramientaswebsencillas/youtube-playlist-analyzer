import { describe, expect, it } from 'vitest';
import { isPlaylistId, parsePlaylistInput } from './parseInput';

const PL_ID = 'PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf';
const OLAK_ID = 'OLAK5uy_kPyBGSIG-SQ9R6mYp6WBQZyzrqyq-jQmM';

describe('isPlaylistId', () => {
  it.each([PL_ID, OLAK_ID, 'RDCLAK5uy_abcdefghij'])('acepta %s', (id) => {
    expect(isPlaylistId(id)).toBe(true);
  });

  it.each(['', 'abc', 'PL con espacios 1234567', `${PL_ID}!`, 'x'.repeat(43)])(
    'rechaza %j',
    (id) => {
      expect(isPlaylistId(id)).toBe(false);
    },
  );
});

describe('parsePlaylistInput', () => {
  it.each([
    [PL_ID, PL_ID],
    [`  ${PL_ID}  `, PL_ID],
    [`https://www.youtube.com/playlist?list=${PL_ID}`, PL_ID],
    [`https://youtube.com/playlist?list=${PL_ID}&si=abc`, PL_ID],
    [`https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=${PL_ID}`, PL_ID],
    [`https://music.youtube.com/playlist?list=${OLAK_ID}`, OLAK_ID],
    [`https://youtu.be/dQw4w9WgXcQ?list=${PL_ID}`, PL_ID],
    [`https://WWW.YOUTUBE.COM/playlist?list=${PL_ID}`, PL_ID],
  ])('extrae el ID de %s', (input, expected) => {
    expect(parsePlaylistInput(input)).toEqual({ ok: true, playlistId: expected });
  });

  it('pide una entrada cuando está vacía', () => {
    expect(parsePlaylistInput('   ')).toEqual({
      ok: false,
      message: 'Ingresa una URL o un ID de playlist.',
    });
  });

  it('rechaza texto que no es URL ni ID', () => {
    const result = parsePlaylistInput('no es una url');
    expect(result.ok).toBe(false);
  });

  it('rechaza hosts que no son de YouTube', () => {
    for (const url of [
      `https://evil.com/playlist?list=${PL_ID}`,
      `https://youtube.com.evil.com/playlist?list=${PL_ID}`,
      `https://evilyoutube.com/playlist?list=${PL_ID}`,
    ]) {
      expect(parsePlaylistInput(url)).toEqual({
        ok: false,
        message: 'La URL no pertenece a YouTube ni a YouTube Music.',
      });
    }
  });

  it('rechaza un parámetro list inválido', () => {
    const result = parsePlaylistInput(
      'https://www.youtube.com/playlist?list=<script>',
    );
    expect(result).toMatchObject({ ok: false });
    expect(result.ok || result.message).toContain('"list"');
  });

  it('rechaza URLs sin parámetro list', () => {
    expect(
      parsePlaylistInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toEqual({
      ok: false,
      message: 'La URL no contiene una playlist (falta el parámetro "list").',
    });
  });
});
