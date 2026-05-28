export function getLuminance(hex) {
  const rgb = hex.startsWith("#") ? hex.slice(1) : hex;
  const r = parseInt(rgb.slice(0, 2), 16) / 255;
  const g = parseInt(rgb.slice(2, 4), 16) / 255;
  const b = parseInt(rgb.slice(4, 6), 16) / 255;

  const [rl, gl, bl] = [r, g, b].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4),
  );

  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function getContrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1) + 0.05;
  const l2 = getLuminance(hex2) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

export function isAccessible(hex, background = "#1e293b") {
  return getContrastRatio(hex, background) >= 4.5;
}
