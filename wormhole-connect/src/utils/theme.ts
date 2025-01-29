// This code was written by Claude <3

export function mixHsl(
  hsl1: [number, number, number],
  hsl2: [number, number, number],
  ratio: number,
): [number, number, number] {
  return [
    hsl1[0] + (hsl2[0] - hsl1[0]) * ratio,
    hsl1[1] + (hsl2[1] - hsl1[1]) * ratio,
    hsl1[2] + (hsl2[2] - hsl1[2]) * ratio,
  ];
}

export function mixRgb(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
  ratio: number,
): [number, number, number] {
  const hsl1 = rgbToHsl(rgb1[0], rgb1[1], rgb1[2]);
  const hsl2 = rgbToHsl(rgb2[0], rgb2[1], rgb2[2]);
  const hsl = mixHsl(hsl1, hsl2, ratio);
  return hslToRgb(hsl[0], hsl[1], hsl[2]);
}

export function mixHex(color1: string, color2: string, ratio: number): string {
  const rgb1 = hexToHsl(color1);
  const rgb2 = hexToHsl(color2);
  const hsl = mixHsl(rgb1, rgb2, ratio);
  return hslToHex(...hsl);
}

export function rgbToHsl(
  r: number,
  g: number,
  b: number,
): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h, s, l];
}

export function hslToRgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [r * 255, g * 255, b * 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(r) + toHex(g) + toHex(b);
}

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16),
  ];
}

export function hexToHsl(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHsl(r, g, b);
}

export function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex(r, g, b);
}

export function lighten(color: string, background: string, amount: number) {
  let [h, s] = hexToHsl(color);
  let [, , l] = hexToHsl(background);
  return hslToHex(h, s, l > 0.5 ? l - amount : l + amount);
}

export function opacify(color: string, opacity: number) {
  let [r, g, b] = hexToRgb(color);
  return `rgba(${r},${g},${b},${opacity})`;
}
