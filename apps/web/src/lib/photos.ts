const px = (id: number, w: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`;

export function withWidth(url: string, w: number) {
  try {
    const u = new URL(url);
    if (u.hostname !== 'images.pexels.com') return url;
    u.searchParams.set('w', String(w));
    return u.toString();
  } catch {
    return url;
  }
}

export const PRODUCT_FALLBACK = px(533442, 700);

export const PHOTOS = {
  hero: { src: px(39559877, 1800), credit: 'Terrance Barksdale', id: 39559877 },
  simple: { src: px(27516985, 1000), credit: 'José Martin Segura Benites', id: 27516985 },
  arrivals: { src: px(8114129, 1000), credit: 'Annushka Ahuja', id: 8114129 },
  her: { src: px(26954378, 900), credit: 'José Martin Segura Benites', id: 26954378 },
  him: { src: px(13408246, 900), credit: 'Betül Balcı', id: 13408246 },
  running: { src: px(8454901, 800), credit: 'Mikhail Nilov', id: 8454901 },
  casual: { src: px(4296075, 800), credit: 'Lappen Fashion', id: 4296075 },
  slides: { src: px(9267585, 800), credit: 'Denys Mikhalevych', id: 9267585 },
} as const;
