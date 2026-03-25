/**
 * Rate limiter simples em memória por IP.
 *
 * Para produção com múltiplas instâncias, substituir por Redis
 * (ex: rate-limiter-flexible com RedisStore).
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterOptions {
  /** Número máximo de requisições permitidas na janela */
  maxRequests: number;
  /** Janela de tempo em milissegundos */
  windowMs: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;

    // Limpeza periódica de entradas expiradas (a cada 60s)
    const cleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now >= entry.resetAt) {
          this.store.delete(key);
        }
      }
    }, 60_000);

    // Não impedir o processo de encerrar
    if (cleanup.unref) {
      cleanup.unref();
    }
  }

  /**
   * Verifica se o IP pode prosseguir. Retorna true se permitido, false se bloqueado.
   */
  check(ip: string): { allowed: boolean; retryAfterMs: number } {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || now >= entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (entry.count >= this.maxRequests) {
      return { allowed: false, retryAfterMs: entry.resetAt - now };
    }

    entry.count += 1;
    return { allowed: true, retryAfterMs: 0 };
  }
}

/**
 * Extrai o IP do cliente a partir dos headers da requisição.
 * Usa x-forwarded-for (primeiro IP da cadeia) ou fallback para "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for pode conter múltiplos IPs: "client, proxy1, proxy2"
    const firstIp = forwarded.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "unknown";
}
