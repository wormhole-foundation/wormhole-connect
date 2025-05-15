import createCache from '@emotion/cache';

export default function createEmotionCache() {
  const insertionPoint = typeof window !== 'undefined'
    ? document.querySelector<HTMLMetaElement>('meta[name="emotion-insertion-point"]')
    : undefined;

  return createCache({
    key: 'wormhole-connect',
    prepend: true,
    ...(insertionPoint && { insertionPoint }),
  });
}