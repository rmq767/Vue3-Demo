/** 确定性伪随机，保证同一 seed 下地形与地物每次刷新都一致 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 供 SimplexNoise 用固定种子重建置换表 */
export function seededRandom(seed: number): { random: () => number } {
  const next = mulberry32(seed);
  return { random: next };
}
