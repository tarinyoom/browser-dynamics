function kernel(r: number, invH: number): number {
  const norm = 10 * invH * invH / (7 * Math.PI);

  const q = r * invH;

  if (q >= 2) return 0;
  if (q < 1) {
    return norm * (1 - 1.5 * q * q + 0.75 * q * q * q);
  } else {
    const term = 2 - q;
    return norm * 0.25 * term * term * term;
  }

}

export { kernel }
