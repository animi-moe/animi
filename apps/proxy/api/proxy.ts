export const config = { runtime: "edge" };

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const imageUrl = url.searchParams.get("url");

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": req.headers.get("origin") || "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (!imageUrl) {
    return new Response("Missing url", { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://anilist.co/",
      },
    });

    if (!response.ok) {
      return new Response(`Upstream error: ${response.status}`, { status: response.status });
    }

    const contentType = response.headers.get("Content-Type") || "";
    if (!contentType.startsWith("image/")) {
      return new Response("Upstream did not return an image", { status: 502 });
    }

    const origin = req.headers.get("origin") || "";
    const allowedEnv = process.env.ALLOWED_ORIGINS || "https://boards.animi.moe,https://animi.moe";
    const envOrigins = allowedEnv.split(",").map((o) => o.trim());
    const isLocalhost =
      origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:");

    const defaultOrigin = envOrigins[0] || "https://boards.animi.moe";
    const corsOrigin = envOrigins.includes(origin) || isLocalhost ? origin : defaultOrigin;

    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
