import "server-only";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const RAIO_METROS = 15000;

interface ElementoOverpass {
  tags?: { name?: string };
}

/**
 * Busca nomes de bairros/distritos (place=suburb|neighbourhood|quarter|hamlet)
 * num raio ao redor de uma coordenada, via Overpass API (OpenStreetMap) —
 * gratuito, sem chave. Retorna apenas nomes distintos, sem coordenadas (as
 * coordenadas de cada bairro sao buscadas depois, um a um, pela geocodificacao
 * ja existente em /api/localizacoes/[id]/geocodificar).
 */
export async function buscarNomesBairrosProximos(latitude: number, longitude: number): Promise<string[]> {
  const query = `[out:json][timeout:25];
(
  node(around:${RAIO_METROS},${latitude},${longitude})["place"~"^(suburb|neighbourhood|quarter|hamlet)$"];
  way(around:${RAIO_METROS},${latitude},${longitude})["place"~"^(suburb|neighbourhood|quarter|hamlet)$"];
  relation(around:${RAIO_METROS},${latitude},${longitude})["place"~"^(suburb|neighbourhood|quarter|hamlet)$"];
);
out tags;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass respondeu ${res.status}`);

  const data = (await res.json()) as { elements?: ElementoOverpass[] };
  const nomes = (data.elements ?? [])
    .map((el) => el.tags?.name?.trim())
    .filter((nome): nome is string => !!nome);

  return [...new Set(nomes)].sort((a, b) => a.localeCompare(b));
}
