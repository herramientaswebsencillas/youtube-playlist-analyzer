/**
 * Verificación "soy humano" mediante Google reCAPTCHA v2 (modo invisible).
 *
 * Objetivo: anteponer un reto reCAPTCHA a cada llamada *real* a la YouTube Data
 * API para disuadir el uso automatizado del sitio (scrapers, bots y consumo
 * abusivo de la cuota). Los aciertos de caché no llaman a la API, por lo que
 * tampoco disparan el reto.
 *
 * Limitación honesta: al ser una app 100% client-side no existe un backend que
 * verifique el token contra la API de Google. La barrera efectiva es la
 * interacción humana que reCAPTCHA exige cuando detecta tráfico sospechoso; no
 * es una verificación criptográfica del lado del servidor.
 *
 * Si no se define NEXT_PUBLIC_RECAPTCHA_SITE_KEY, la verificación se omite en
 * silencio para no romper despliegues que aún no la han habilitado.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit';
const HOST_ID = 'recaptcha-host';

/** Error tipado para fallos/cancelaciones de la verificación humana. */
export class CaptchaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CaptchaError';
  }
}

interface GrecaptchaRenderParams {
  sitekey: string;
  size: 'invisible';
  badge: 'bottomright' | 'bottomleft' | 'inline';
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
}

interface Grecaptcha {
  ready: (cb: () => void) => void;
  render: (container: HTMLElement, params: GrecaptchaRenderParams) => number;
  execute: (widgetId: number) => void;
  reset: (widgetId: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

/** `true` cuando hay una site key configurada y, por tanto, el reto está activo. */
export function isCaptchaConfigured(): boolean {
  return Boolean(SITE_KEY);
}

let scriptPromise: Promise<void> | null = null;

/** Inyecta el script de reCAPTCHA una sola vez. */
function loadScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(
      new CaptchaError('reCAPTCHA solo está disponible en el navegador.'),
    );
  }
  if (window.grecaptcha) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new CaptchaError('No se pudo cargar reCAPTCHA.'));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

// El reto actualmente en curso. El widget se renderiza una sola vez con
// callbacks fijos que resuelven/rechazan la promesa pendiente.
let pending: { resolve: () => void; reject: (e: CaptchaError) => void } | null =
  null;

function settle(fn: 'resolve' | 'reject', error?: CaptchaError) {
  const current = pending;
  pending = null;
  if (!current) return;
  if (fn === 'resolve') current.resolve();
  else current.reject(error ?? new CaptchaError('La verificación falló.'));
}

let widgetId: number | null = null;

/** Renderiza (una vez) el widget invisible y devuelve su id. */
function ensureWidget(): Promise<number> {
  return loadScript().then(
    () =>
      new Promise<number>((resolve, reject) => {
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) {
          reject(new CaptchaError('reCAPTCHA no está disponible.'));
          return;
        }
        grecaptcha.ready(() => {
          if (widgetId !== null) {
            resolve(widgetId);
            return;
          }
          let container = document.getElementById(HOST_ID);
          if (!container) {
            container = document.createElement('div');
            container.id = HOST_ID;
            document.body.appendChild(container);
          }
          try {
            widgetId = grecaptcha.render(container, {
              sitekey: SITE_KEY as string,
              size: 'invisible',
              badge: 'bottomright',
              callback: () => settle('resolve'),
              'error-callback': () =>
                settle('reject', new CaptchaError('reCAPTCHA falló. Intenta de nuevo.')),
              'expired-callback': () =>
                settle(
                  'reject',
                  new CaptchaError('La verificación expiró. Intenta de nuevo.'),
                ),
            });
            resolve(widgetId);
          } catch {
            reject(new CaptchaError('No se pudo inicializar reCAPTCHA.'));
          }
        });
      }),
  );
}

/**
 * Ejecuta el reto reCAPTCHA. Resuelve cuando se obtiene un token (humano
 * verificado) y rechaza con `CaptchaError` si falla, expira o se cancela.
 * Si no hay site key configurada, resuelve de inmediato (verificación omitida).
 */
export async function executeCaptcha(): Promise<void> {
  if (!isCaptchaConfigured()) return;

  const id = await ensureWidget();
  const grecaptcha = window.grecaptcha;
  if (!grecaptcha) {
    throw new CaptchaError('reCAPTCHA no está disponible.');
  }

  // Si ya había un reto pendiente (p. ej. doble clic), cancélalo.
  if (pending) settle('reject', new CaptchaError('Verificación cancelada.'));

  await new Promise<void>((resolve, reject) => {
    pending = { resolve, reject };
    try {
      grecaptcha.reset(id);
      grecaptcha.execute(id);
    } catch {
      settle('reject', new CaptchaError('No se pudo ejecutar reCAPTCHA.'));
    }
  });
}
