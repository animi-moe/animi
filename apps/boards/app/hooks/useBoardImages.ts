import { useRef, useState } from "react";
export function useBoardImages() {
  const imageStore = useRef(new Map<string, Blob>());
  const storeImage = (blob: Blob): string => {
    const id = `img:${crypto.randomUUID()}`;
    imageStore.current.set(id, blob);
    return id;
  };

  const objectUrlCache = useRef(new Map<string, string>());
  const [, setTick] = useState(0);

  const resolveImage = (imageKey: string): string | null => {
    if (!imageKey?.startsWith("img:")) return imageKey;

    const blob = imageStore.current.get(imageKey);
    if (!blob) return null;

    if (objectUrlCache.current.has(imageKey)) {
      return objectUrlCache.current.get(imageKey)!;
    }

    const url = URL.createObjectURL(blob);
    objectUrlCache.current.set(imageKey, url);

    setTimeout(() => setTick((t) => t + 1), 0);

    return url;
  };
  const setImage = (key: string, blob: Blob) => {
    imageStore.current.set(key, blob);
    setTick((t) => t + 1);
  };
  const clearImages = () => {
    imageStore.current.clear();
    objectUrlCache.current.clear();
  };
  const getImageEntries = () => Array.from(imageStore.current.entries());
  return {
    storeImage,
    resolveImage,
    setImage,
    clearImages,
    getImageEntries,
  };
}
