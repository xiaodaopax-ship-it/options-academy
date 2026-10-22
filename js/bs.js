// Black-Scholes pricing, Greeks and implied volatility.
// All inputs: S spot, K strike, T years, r risk-free (decimal), sigma vol (decimal), q dividend yield (decimal).
(function (root) {
  'use strict';
  const OA = (root.OA = root.OA || {});

  // Abramowitz & Stegun 7.1.26, max abs error ~1.5e-7
  function erf(x) {
    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741,
      a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
    const t = 1 / (1 + p * x);
    const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
    return sign * y;
  }
  const normCdf = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
  const normPdf = (x) => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

  function intrinsic(type, S, K) {
    return type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
  }

  function d1d2(S, K, T, r, sigma, q) {
    const sd = sigma * Math.sqrt(T);
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / sd;
    return [d1, d1 - sd];
  }

  function price(type, S, K, T, r, sigma, q = 0) {
    if (T <= 0) return intrinsic(type, S, K);
    S = Math.max(S, 1e-9);
    sigma = Math.max(sigma, 1e-6);
    const [d1, d2] = d1d2(S, K, T, r, sigma, q);
    const dq = Math.exp(-q * T), dr = Math.exp(-r * T);
    if (type === 'call') return S * dq * normCdf(d1) - K * dr * normCdf(d2);
    return K * dr * normCdf(-d2) - S * dq * normCdf(-d1);
  }

  // theta per calendar day, vega per 1 vol point, rho per 1 rate point
  function greeks(type, S, K, T, r, sigma, q = 0) {
    if (T <= 0) {
      const itm = type === 'call' ? S > K : S < K;
      return { delta: itm ? (type === 'call' ? 1 : -1) : 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
    }
    S = Math.max(S, 1e-9);
    sigma = Math.max(sigma, 1e-6);
    const sqT = Math.sqrt(T);
    const [d1, d2] = d1d2(S, K, T, r, sigma, q);
    const dq = Math.exp(-q * T), dr = Math.exp(-r * T);
    const pdf = normPdf(d1);
    const gamma = (dq * pdf) / (S * sigma * sqT);
    const vega = (S * dq * pdf * sqT) / 100;
    const decay = -(S * dq * pdf * sigma) / (2 * sqT);
    if (type === 'call') {
      return {
        delta: dq * normCdf(d1),
        gamma,
        theta: (decay - r * K * dr * normCdf(d2) + q * S * dq * normCdf(d1)) / 365,
        vega,
        rho: (K * T * dr * normCdf(d2)) / 100,
      };
    }
    return {
      delta: dq * (normCdf(d1) - 1),
      gamma,
      theta: (decay + r * K * dr * normCdf(-d2) - q * S * dq * normCdf(-d1)) / 365,
      vega,
      rho: (-K * T * dr * normCdf(-d2)) / 100,
    };
  }

  // Bisection; returns NaN when the price is outside the model's attainable range.
  function impliedVol(type, P, S, K, T, r, q = 0) {
    if (!(T > 0) || !(P > 0)) return NaN;
    let lo = 1e-4, hi = 5;
    if (P < price(type, S, K, T, r, lo, q) - 1e-9 || P > price(type, S, K, T, r, hi, q)) return NaN;
    for (let i = 0; i < 100; i++) {
      const mid = (lo + hi) / 2;
      if (price(type, S, K, T, r, mid, q) > P) hi = mid;
      else lo = mid;
      if (hi - lo < 1e-7) break;
    }
    return (lo + hi) / 2;
  }

  OA.bs = { erf, normCdf, normPdf, intrinsic, price, greeks, impliedVol };
})(typeof window !== 'undefined' ? window : globalThis);
