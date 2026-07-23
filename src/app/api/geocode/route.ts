import { NextRequest, NextResponse } from "next/server";

type PhotonFeature = {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    postcode?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
  };
};

function formatAddress(feature: PhotonFeature) {
  const properties = feature.properties ?? {};
  const street = [properties.street ?? properties.name, properties.housenumber]
    .filter(Boolean)
    .join(" ");
  const city = [properties.postcode, properties.city ?? properties.district]
    .filter(Boolean)
    .join(" ");

  return [street, city, properties.state, properties.country]
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(", ");
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const endpoint = new URL("https://photon.komoot.io/api/");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("lang", "it");
  endpoint.searchParams.set("limit", "5");
  endpoint.searchParams.set("countrycode", "IT");

  try {
    const response = await fetch(endpoint, {
      headers: { "User-Agent": "ilmioinvito.com address search" },
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error("Geocoding service unavailable");
    }

    const data = (await response.json()) as { features?: PhotonFeature[] };
    const suggestions = (data.features ?? [])
      .map(formatAddress)
      .filter(Boolean)
      .filter((address, index, addresses) => addresses.indexOf(address) === index);

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] }, { status: 200 });
  }
}
