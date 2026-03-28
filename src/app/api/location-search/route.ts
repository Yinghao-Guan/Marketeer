import { NextRequest, NextResponse } from "next/server";

interface PhotonFeature {
  properties: {
    osm_id: number;
    osm_type: string;
    osm_key: string;
    name?: string;
    state?: string;
    country?: string;
  };
}

interface LocationResult {
  id: string;
  displayName: string;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&lang=en`;
    const res = await fetch(url);

    if (!res.ok) {
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const features: PhotonFeature[] = data.features ?? [];

    // prefer cities/regions/boundaries over streets and buildings
    const placeFeatures = features.filter(
      (f) => f.properties.osm_key === "place" || f.properties.osm_key === "boundary"
    );

    const filtered = placeFeatures.length > 0 ? placeFeatures : features;

    // deduplicate display names so the dropdown doesn't show the same text twice
    const seen = new Set<string>();
    const results: LocationResult[] = [];

    for (const f of filtered) {
      const { osm_type, osm_id, name, state, country } = f.properties;

      // build display name from non-empty, non-duplicate parts
      const parts: string[] = [];
      if (name) parts.push(name);
      if (state && state !== name) parts.push(state);
      if (country && country !== name && country !== state) parts.push(country);

      const displayName = parts.join(", ");
      if (!displayName || seen.has(displayName)) continue;
      seen.add(displayName);

      results.push({
        id: `${osm_type}-${osm_id}`,
        displayName,
      });

      if (results.length >= 5) break;
    }

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
