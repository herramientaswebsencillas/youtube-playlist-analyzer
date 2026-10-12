import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Recaptcha = typeof import('./recaptcha');

/**
 * Sustituto de `window.grecaptcha`. `solve` simula que la persona supera el
 * reto; si no se llama, el reto queda abierto, como cuando se cierra su
 * ventana sin resolverlo.
 */
function fakeGrecaptcha() {
  let onSolved: ((token: string) => void) | undefined;
  return {
    ready: (cb: () => void) => cb(),
    render: vi.fn((_el: unknown, params: { callback: typeof onSolved }) => {
      onSolved = params.callback;
      return 0;
    }),
    reset: vi.fn(),
    execute: vi.fn(),
    solve: () => onSolved?.('token'),
  };
}

let grecaptcha: ReturnType<typeof fakeGrecaptcha>;

/** Carga el módulo de nuevo: guarda la site key y el widget al importarse. */
async function load(siteKey = 'site-key'): Promise<Recaptcha> {
  vi.stubEnv('NEXT_PUBLIC_RECAPTCHA_SITE_KEY', siteKey);
  vi.resetModules();
  return import('./recaptcha');
}

beforeEach(() => {
  grecaptcha = fakeGrecaptcha();
  vi.stubGlobal('window', { grecaptcha });
  vi.stubGlobal('document', {
    getElementById: () => ({}),
    createElement: () => ({}),
    body: { appendChild: () => {} },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('executeCaptcha', () => {
  it('se omite si no hay site key', async () => {
    const { executeCaptcha } = await load('');

    await expect(executeCaptcha()).resolves.toBeUndefined();
    expect(grecaptcha.execute).not.toHaveBeenCalled();
  });

  it('resuelve cuando se supera el reto', async () => {
    const { executeCaptcha } = await load();

    const promise = executeCaptcha();
    await vi.waitFor(() => expect(grecaptcha.execute).toHaveBeenCalled());
    grecaptcha.solve();

    await expect(promise).resolves.toBeUndefined();
  });

  it('rechaza si el reto no se completa a tiempo', async () => {
    vi.useFakeTimers();
    const { executeCaptcha, CAPTCHA_TIMEOUT_MS } = await load();

    const promise = executeCaptcha();
    const assertion = expect(promise).rejects.toMatchObject({
      name: 'CaptchaError',
      message: expect.stringContaining('tardó demasiado'),
    });
    await vi.advanceTimersByTimeAsync(CAPTCHA_TIMEOUT_MS);

    await assertion;
  });

  it('cancelCaptcha rechaza el reto en curso y cierra su ventana', async () => {
    const { executeCaptcha, cancelCaptcha } = await load();

    const promise = executeCaptcha();
    await vi.waitFor(() => expect(grecaptcha.execute).toHaveBeenCalled());
    grecaptcha.reset.mockClear();
    cancelCaptcha();

    await expect(promise).rejects.toMatchObject({
      message: 'Verificación cancelada.',
    });
    expect(grecaptcha.reset).toHaveBeenCalled();
    // Resolver el reto después ya no tiene efecto.
    grecaptcha.solve();
  });

  it('no abre el reto si se cancela mientras carga', async () => {
    const { executeCaptcha, cancelCaptcha } = await load();

    const promise = executeCaptcha();
    cancelCaptcha();

    await expect(promise).rejects.toMatchObject({ name: 'CaptchaError' });
    expect(grecaptcha.execute).not.toHaveBeenCalled();
  });
});
