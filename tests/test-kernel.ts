import { describe, it, expect } from "vitest";
import { kernel, dKernel } from "../src/kernel";

// Helper: numerical scan over [a,b] with step
function scan(a: number, b: number, step: number): number[] {
  const out: number[] = [];
  for (let x = a; x <= b + 1e-15; x += step) out.push(x);
  return out;
}

// Range of possible smoothing (inverse) smoothing radii to test
const INVHS = [0.5, 1, 2, 4];

describe("Kernel properties", () => {
  describe.each(INVHS)("invH=%p", (invH) => {
    it("Support test", () => {
      const h = 1 / invH;
      const step = h / 200;

      for (const r of scan(0, h - 1e-8, step)) {
        const w = kernel(r, invH);
        expect(w).toBeGreaterThan(0);
      }

      for (const r of scan(h, 3 * h, step)) {
        const w = kernel(r, invH);
        expect(w).toBe(0);
      }
    });

    it("Strictly decreasing over support test", () => {
      const h = 1 / invH;
      const rs = scan(0, 2 * h, h / 2000);

      const w0 = kernel(0, invH);
      expect(w0).toBeGreaterThan(0);

      let prev = w0;
      for (let i = 1; i < rs.length; i++) {
        const w = kernel(rs[i], invH);
        expect(w).toBeLessThanOrEqual(prev + 1e-12);
        prev = w;
      }
    });

    it("Derivative consistency test", () => {
      const h = 1 / invH;
      const delta = h / 200000;
      const rs = scan(5 * delta, h - 5 * delta, h / 4000);

      for (const r of rs) {
        const wPlus  = kernel(r + delta, invH);
        const wMinus = kernel(r - delta, invH);
        const fd = (wPlus - wMinus) / (2 * delta);

        const d = dKernel(r, invH);

        const atol = 1e-8 * Math.pow(invH, 3);
        const rtol = 5e-4;
        const tol = Math.max(atol, rtol * Math.max(1e-16, Math.abs(d), Math.abs(fd)));

        expect(Math.abs(fd - d)).toBeLessThanOrEqual(tol);
      }
    });

    it("2D normalization test", () => {
      const h = 1 / invH;
      const boxHalf = Math.max(1, 2.0 * h);
      const N = 401; // odd number so we include the origin
      const step = (2 * boxHalf) / (N - 1);
      let riemann = 0;

      for (let i = 0; i < N; i++) {
        const x = -boxHalf + i * step;
        for (let j = 0; j < N; j++) {
          const y = -boxHalf + j * step;
          const r = Math.hypot(x, y);
          riemann += kernel(r, invH) * (step * step);
        }
      }

      expect(riemann).toBeGreaterThan(1.0 - 1e-8);
      expect(riemann).toBeLessThan(1.0 + 1e-8);
    });
  });
});
