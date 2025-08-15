function kernel(r: number, invH: number): number {
  const norm = 10 * invH * invH / (7 * Math.PI);

  const q = 2.0 * r * invH;

  if (q >= 2) return 0;
  if (q < 1) {
    return norm * (4.0 - 6.0 * q * q + 3.0 * q * q * q);
  } else {
    const term = 2 - q;
    return norm * term * term * term;
  }

}

export { kernel }
