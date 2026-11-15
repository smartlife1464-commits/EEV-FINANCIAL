/**
 * Normalise une animation Lottie écrite à la main pour lottie-web :
 *  - chaque calque reçoit ses points d'entrée/sortie (ip/op/st) — sans eux, lottie-web masque le calque
 *    (« display: none ») et l'animation apparaît vide ;
 *  - chaque image clé reçoit des poignées d'interpolation (i/o) requises pour l'animation.
 */
export function normalizeLottie<T extends Record<string, any>>(animation: T): T {
  const clone = JSON.parse(JSON.stringify(animation));

  const fixKeyframes = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(fixKeyframes);
      return;
    }
    if (node.a === 1 && Array.isArray(node.k)) {
      node.k.forEach((kf: any, idx: number) => {
        if (kf && typeof kf === 'object' && 't' in kf && idx < node.k.length - 1) {
          const dim = Array.isArray(kf.s) ? kf.s.length : 1;
          if (!kf.i) kf.i = { x: Array(dim).fill(0.667), y: Array(dim).fill(1) };
          if (!kf.o) kf.o = { x: Array(dim).fill(0.333), y: Array(dim).fill(0) };
        }
      });
    }
    Object.values(node).forEach(fixKeyframes);
  };

  const fixLayers = (layers: any[] | undefined) => {
    for (const layer of layers || []) {
      if (layer.ip === undefined) layer.ip = clone.ip ?? 0;
      if (layer.op === undefined) layer.op = clone.op ?? 300;
      if (layer.st === undefined) layer.st = 0;
      if (layer.bm === undefined) layer.bm = 0;
    }
  };

  fixLayers(clone.layers);
  for (const asset of clone.assets || []) fixLayers(asset.layers);
  fixKeyframes(clone.layers);
  return clone;
}
