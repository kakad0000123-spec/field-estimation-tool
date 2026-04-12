/** Format number to 2 decimal places */
export function fmt2(n: number): string {
  return n.toFixed(2);
}

/** Format number to 1 decimal place */
export function fmt1(n: number): string {
  return n.toFixed(1);
}

/** Format currency with comma separator */
export function fmtCurrency(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}
