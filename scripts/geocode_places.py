from __future__ import annotations

import json
import time
from pathlib import Path
from urllib.parse import quote
from urllib.request import Request, urlopen

queries = [
    ("hotel", "Mercure Warszawa Grand, Krucza 28, Warszawa, Poland"),
    ("elektrownia-powisle", "Elektrownia Powiśle, Dobra 42, Warszawa, Poland"),
    ("urban-outfitters", "Urban Outfitters, Dobra 42, Warszawa, Poland"),
    ("tk-maxx", "TK Maxx, Marszalkowska 104/122, Warszawa, Poland"),
    ("zlote-tarasy", "Zlote Tarasy, Zlota 59, Warszawa, Poland"),
    ("balagan", "Balagan Flagship Store, Mysia 3, Warszawa, Poland"),
    ("hala-koszyki", "Hala Koszyki, Koszykowa 63, Warszawa, Poland"),
    ("presidential-palace", "Presidential Palace in Warsaw, Krakowskie Przedmiescie 48/50, Warszawa, Poland"),
    ("viva-cuba", "Viva Cuba Dance Studio, Marszalkowska 115, Warszawa, Poland"),
    ("centrum-praskie-koneser", "Centrum Praskie Koneser, Warszawa, Poland"),
]

results = []
for place_id, query in queries:
    url = f"https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=pl&q={quote(query)}"
    request = Request(url, headers={"User-Agent": "warsaw-trip-dashboard/0.1 (local planning tool)"})
    with urlopen(request, timeout=30) as response:
        payload = json.load(response)
    if payload:
        item = payload[0]
        results.append({
            "id": place_id,
            "query": query,
            "display_name": item.get("display_name"),
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
            "osm_type": item.get("osm_type"),
            "osm_id": item.get("osm_id"),
        })
    else:
        results.append({"id": place_id, "query": query, "error": "no result"})
    time.sleep(1.1)

Path("tmp").mkdir(exist_ok=True)
Path("tmp/geocoded-places.json").write_text(json.dumps(results, indent=2), encoding="utf-8")
print(json.dumps(results, indent=2))
