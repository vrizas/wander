import { badGateway } from '../../common/http-error.js';

export interface Region {
  id: string;
  name: string;
}

const TTL_MS = 24 * 60 * 60 * 1000;

export class RegionsClient {
  private cache = new Map<string, { at: number; data: Region[] }>();
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  provinces() {
    return this.fetchList('provinces.json');
  }

  regencies(provinceId: string) {
    return this.fetchList(`regencies/${provinceId}.json`);
  }

  private async fetchList(path: string): Promise<Region[]> {
    const hit = this.cache.get(path);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

    let data: unknown;
    try {
      const res = await fetch(`${this.baseUrl}/${path}`, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = await res.json();
    } catch (e) {
      if (hit) return hit.data;
      throw badGateway(`Regions API unavailable: ${(e as Error).message}`);
    }
    if (!Array.isArray(data) || !data.every((r) => typeof r?.id === 'string' && typeof r?.name === 'string')) {
      throw badGateway('Unrecognized response format from the regions API');
    }
    const clean = data.map((r) => ({ id: r.id as string, name: r.name as string }));
    this.cache.set(path, { at: Date.now(), data: clean });
    return clean;
  }
}
