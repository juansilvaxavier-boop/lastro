import "server-only";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

/** Geocodificacao gratuita via Nominatim (OpenStreetMap) — sem chave de API. */
export async function buscarCoordenadas(consulta: string): Promise<Coordenadas | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", consulta);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": "LastroCRM/1.0 (sistema interno de imobiliaria)",
      "Accept-Language": "pt-BR",
    },
  });
  if (!res.ok) return null;

  const resultados = (await res.json()) as { lat: string; lon: string }[];
  if (!Array.isArray(resultados) || resultados.length === 0) return null;

  const latitude = Number(resultados[0].lat);
  const longitude = Number(resultados[0].lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  return { latitude, longitude };
}
