import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Simple in-memory cache per server instance
const CACHE_TTL_MS = 60_000; // 60s
const CACHE = new Map<string, { expiry: number; payload: unknown }>();

function getCache(key: string) {
  const entry = CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    CACHE.delete(key);
    return null;
  }
  return entry.payload;
}
function setCache(key: string, payload: unknown, ttlMs = CACHE_TTL_MS) {
  CACHE.set(key, { payload, expiry: Date.now() + ttlMs });
}

function ipfsToHttp(uri: string): string {
  if (!uri) return "";
  return uri.startsWith("ipfs://")
    ? `https://gateway.pinata.cloud/ipfs/${uri.slice(7)}`
    : uri;
}

// Algonode testnet indexer
function getIndexerBase() {
  // Future: make this dynamic by env or by NEXT_PUBLIC_ALGOD_SERVER
  return "https://testnet-idx.algonode.cloud";
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const address = (searchParams.get("address") || "").trim();
    if (!address) return NextResponse.json({ items: [], reason: "missing_address" });

    const cacheKey = `algo-wallet-nfts:${address}`;
    const cached = getCache(cacheKey);
    if (cached) return NextResponse.json(cached);

    const idx = getIndexerBase();

    // 1) Get account asset holdings
    const acctUrl = `${idx}/v2/accounts/${address}`;
    const acctRes = await fetch(acctUrl, { next: { revalidate: 10 } });
    if (!acctRes.ok) return NextResponse.json({ items: [], reason: `indexer_http_${acctRes.status}` });
    const acct = await acctRes.json();

    type Holding = { assetId?: number; amount?: number };
    const holdings: Holding[] = Array.isArray(acct?.account?.assets)
      ? (acct.account.assets as Holding[])
      : [];

    // Keep ASAs the wallet actually holds (amount > 0)
    const assetIds = holdings
      .filter((h) => typeof h?.assetId === "number" && (h?.amount ?? 0) > 0)
      .map((h) => h.assetId as number);

    // Limit to a reasonable number
    const uniqueIds = Array.from(new Set(assetIds)).slice(0, 40);

    // 2) For each asset, fetch params and filter to ARC-3 (url ends with #arc3)
    const items: { image: string; time?: number }[] = [];

    const chunk = async <T, U>(arr: T[], n: number, fn: (v: T) => Promise<U>) => {
      const out: U[] = [];
      for (let i = 0; i < arr.length; i += n) {
        const part = arr.slice(i, i + n);
        const res = await Promise.all(part.map(fn));
        out.push(...res);
      }
      return out;
    };

    await chunk(uniqueIds, 6, async (id) => {
      try {
        const aUrl = `${idx}/v2/assets/${id}`;
        const aRes = await fetch(aUrl, { next: { revalidate: 30 } });
        if (!aRes.ok) return null as unknown as void;
        const a = await aRes.json();
        const params = a?.asset?.params || {};
        const url: string = typeof params?.url === "string" ? params.url : "";
        // ARC-3 requires url ...#arc3
        if (!url || !/#arc3$/i.test(url)) return null as unknown as void;
        const metaUri = url.split("#")[0];
        const metaHttp = ipfsToHttp(metaUri);
        const mRes = await fetch(metaHttp, { next: { revalidate: 300 } });
        if (!mRes.ok) return null as unknown as void;
        const meta = await mRes.json().catch(() => null);
        const img = ipfsToHttp(String(meta?.image || ""));
        if (!img) return null as unknown as void;
        items.push({ image: img });
      } catch {}
      return null as unknown as void;
    });

    const payload = { items, count: items.length };
    setCache(cacheKey, payload);
    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json({ items: [], error: (e as Error)?.message || "unknown" }, { status: 500 });
  }
}
