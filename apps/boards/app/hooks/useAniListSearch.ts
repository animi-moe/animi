import { useEffect, useRef, useState } from "react";

import { BOARD_CONFIG } from "@/hooks/boardConfig";
import { AniListItem } from "@/types/board";

export function useAniListSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AniListItem[]>([]);
  const [category, setCategory] = useState(BOARD_CONFIG.search.defaultCategory);

  const preloadedImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  const perPageCount = BOARD_CONFIG.search.perPage;

  const [nameFormat, setNameFormat] = useState<"default" | "lastfirst" | "native">("default");

  const formatCharacterName = (
    nameObj: { full?: string; native?: string; first?: string; last?: string },
    mode: string,
  ) => {
    switch (mode) {
      case "native":
        return nameObj.native || nameObj.full || "";
      case "lastfirst":
        if (nameObj.last && nameObj.first) return `${nameObj.last} ${nameObj.first}`;
        return nameObj.full || "";
      case "default":
      default:
        return nameObj.full || "";
    }
  };

  const QUERY_CONFIGS: Record<string, { field: string; query: string }> = {
    Characters: {
      field: "characters",
      query: `query ($search: String) { Page(perPage: 50) { characters(search: $search) { name { full native first last } image { large } } } }`,
    },
    Anime: {
      field: "media",
      query: `query ($search: String) { Page(perPage: 50) { media(search: $search, type: ANIME) { title { english romaji } coverImage { large } } } }`,
    },
    Manga: {
      field: "media",
      query: `query ($search: String) { Page(perPage: 50) { media(search: $search, type: MANGA) { title { english romaji } coverImage { large } } } }`,
    },
    Staff: {
      field: "staff",
      query: `query ($search: String) { Page(perPage: 50) { staff(search: $search) { name { full native } image { large } } } }`,
    },
  };

  const preloadImages = (normalized: AniListItem[]) => {
    const newUrls = new Set(normalized.flatMap((c) => c.images));
    for (const [url] of preloadedImagesRef.current) {
      if (!newUrls.has(url)) preloadedImagesRef.current.delete(url);
    }

    for (const char of normalized) {
      const url = char.images[char.activeImageIndex];
      if (url && !preloadedImagesRef.current.has(url)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = url;
        preloadedImagesRef.current.set(url, img);
      }
    }
  };

  async function searchAniList() {
    if (!query) return;

    const config = QUERY_CONFIGS[category];

    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: config.query,
        variables: { search: query },
      }),
    });

    const result = await response.json();
    const rawData = (result.data?.Page?.[config.field] as Record<string, unknown>[]) ?? [];

    const normalized: AniListItem[] = rawData.map((item) => {
      const isMedia = category === "Anime" || category === "Manga";

      const titleObj = item.title as { english?: string; romaji?: string } | undefined;
      const nameObj = item.name as
        { full?: string; native?: string; first?: string; last?: string } | undefined;
      const coverImgObj = item.coverImage as { large?: string } | undefined;
      const imgObj = item.image as { large?: string } | undefined;

      const imageUrl = isMedia ? coverImgObj?.large || "" : imgObj?.large || "";
      return {
        name: isMedia
          ? titleObj?.english || titleObj?.romaji || ""
          : formatCharacterName(nameObj || {}, nameFormat),
        images: imageUrl ? [imageUrl] : [],
        activeImageIndex: 0,
      };
    });

    preloadImages(normalized);
    setResults(normalized);
  }

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      searchAniList();
    }, BOARD_CONFIG.search.debounceTimeMs);

    return () => clearTimeout(delayDebounceFn);
  }, [query, category]);

  return {
    query,
    setQuery,
    results,
    setResults,
    category,
    setCategory,
    searchAniList,
    nameFormat,
    setNameFormat,
  };
}
