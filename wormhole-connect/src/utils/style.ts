import { Theme } from '@mui/material';

type Class = string | false;

export const joinClass = (classes: Class[]): string => {
  return classes.filter((c) => !!c).join(' ');
};

export const NO_INPUT = '—';

export const OPACITY = {
  0: '00',
  5: '0C',
  7: '0F',
  10: '19',
  15: '26',
  20: '33',
  25: '3F',
  30: '4C',
  35: '59',
  40: '66',
  45: '72',
  50: '7F',
  55: '8C',
  60: '99',
  65: 'A5',
  70: 'B2',
  75: 'BF',
  80: 'CC',
  85: 'D8',
  90: 'E5',
  95: 'F2',
  100: 'FF',
};

export const LINK = (theme: Theme) => ({
  color: theme.palette.text.primary,
  textDecoration: 'underline',
  margin: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
});

export const CENTER = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const ROW = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

export const ROW_BETWEEN = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const COL_CENTER = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '8px',
};

export const ICON = {
  width: '40px',
  height: '40px',
  ...CENTER,
  cursor: 'pointer',
};

export const ERROR_BORDER = (theme: any) => ({
  border: `1px solid ${theme.palette.error[800] + OPACITY[50]}`,
});

export const changeOpacity = (
  color: string,
  opacity: keyof typeof OPACITY,
): string => {
  if (color.length === 7) return color + OPACITY[opacity];
  if (color.length === 9) return color.slice(0, 7) + OPACITY[opacity];
  return color;
};
