import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Spin } from "antd";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibreWorkerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";

const geocodeCache = new Map();
let geocodingQueue = Promise.resolve();
let lastGeocodingRequestAt = 0;

export function geocodeAddress(address, signal) {
  const fullAddress = `${address}, Челябинск, Россия`;
  const cacheKey = fullAddress.toLocaleLowerCase("ru-RU");
  if (geocodeCache.has(cacheKey)) {
    return Promise.resolve(geocodeCache.get(cacheKey));
  }

  const request = geocodingQueue.then(async () => {
    if (signal?.aborted) {
      throw new DOMException("Geocoding was cancelled", "AbortError");
    }

    const delay = 1100 - (Date.now() - lastGeocodingRequestAt);
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (signal?.aborted) {
      throw new DOMException("Geocoding was cancelled", "AbortError");
    }

    lastGeocodingRequestAt = Date.now();
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({
      q: fullAddress,
      format: "jsonv2",
      limit: "1",
      countrycodes: "ru",
      "accept-language": "ru",
    });
    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new Error(`OpenStreetMap returned HTTP ${response.status}`);
    }

    const results = await response.json();
    const result = results[0];
    const coordinates = result
      ? { lat: Number(result.lat), lng: Number(result.lon) }
      : null;
    geocodeCache.set(cacheKey, coordinates);
    return coordinates;
  });

  geocodingQueue = request.catch(() => {});
  return request;
}

export async function searchAddressSuggestions(query, signal) {
  if (!query || query.trim().length < 3) return [];
  const fullQuery = `${query.trim()}, Челябинск`;
  
  return geocodingQueue.then(async () => {
    if (signal?.aborted) return [];

    const delay = 1100 - (Date.now() - lastGeocodingRequestAt);
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (signal?.aborted) return [];

    lastGeocodingRequestAt = Date.now();
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.search = new URLSearchParams({
      q: fullQuery,
      format: "jsonv2",
      limit: "5",
      countrycodes: "ru",
      "accept-language": "ru",
      addressdetails: "1",
    });

    try {
      const response = await fetch(url, {
        signal,
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return [];

      const data = await response.json();
      return data.map((item) => {
        const road = item.address?.road || "";
        const house = item.address?.house_number || "";
        const shortName = road ? `${road}${house ? `, ${house}` : ""}` : item.name || item.display_name;

        return {
          value: shortName,
          label: (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontWeight: 600 }}>{shortName}</span>
              <span style={{ fontSize: "11px", color: "#8a96aa" }}>{item.display_name}</span>
            </div>
          ),
        };
      });
    } catch {
      return [];
    }
  });
}

export async function fetchRouteDistance(fromAddress, toAddress) {
  if (!fromAddress || !toAddress) return null;
  try {
    const [fromLoc, toLoc] = await Promise.all([
      geocodeAddress(fromAddress),
      geocodeAddress(toAddress),
    ]);
    if (!fromLoc || !toLoc) return null;

    const coordinates = `${fromLoc.lng},${fromLoc.lat};${toLoc.lng},${toLoc.lat}`;
    const url = new URL(
      `https://router.project-osrm.org/route/v1/driving/${coordinates}`,
    );
    url.search = new URLSearchParams({
      overview: "false",
      steps: "false",
    });
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    return data.routes?.[0]?.distance || null;
  } catch {
    return null;
  }
}

export default function OrderMap({ from, to, onRouteCalculated }) {
  const mapContainer = useRef(null);
  const addressKey = JSON.stringify([from, to]);
  const [mapState, setMapState] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [routeState, setRouteState] = useState(null);

  const stateIsCurrent = mapState?.addressKey === addressKey;
  const locations = stateIsCurrent
    ? mapState.locations
    : { from: null, to: null };
  const loading = Boolean(from || to) && !stateIsCurrent;
  const error = stateIsCurrent ? mapState.error : "";
  const points = useMemo(
    () => [locations.from, locations.to].filter(Boolean),
    [locations.from, locations.to],
  );
  const routeKey = JSON.stringify([addressKey, locations.from, locations.to]);
  const routeIsCurrent = routeState?.key === routeKey;
  const route = routeIsCurrent ? routeState.route : null;
  const routeLoading = points.length === 2 && !routeIsCurrent;
  const currentMapError =
    mapError?.addressKey === addressKey ? mapError.message : "";

  useEffect(() => {
    const controller = new AbortController();

    if (!from && !to) {
      return () => controller.abort();
    }

    async function loadLocations() {
      try {
        const [fromLocation, toLocation] = await Promise.all([
          from ? geocodeAddress(from, controller.signal) : null,
          to ? geocodeAddress(to, controller.signal) : null,
        ]);
        if (!controller.signal.aborted) {
          setMapState({
            addressKey,
            locations: { from: fromLocation, to: toLocation },
            error: "",
          });
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setMapState({
            addressKey,
            locations: { from: null, to: null },
            error: `Не удалось загрузить адреса: ${requestError.message}`,
          });
        }
      }
    }

    loadLocations();
    return () => controller.abort();
  }, [addressKey, from, to]);

  useEffect(() => {
    if (loading || error || points.length !== 2) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadRoute() {
      try {
        const coordinates = points
          .map(({ lng, lat }) => `${lng},${lat}`)
          .join(";");
        const url = new URL(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}`,
        );
        url.search = new URLSearchParams({
          overview: "full",
          geometries: "geojson",
          steps: "false",
        });
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`OSRM вернул HTTP ${response.status}`);
        }

        const result = await response.json();
        const routeResult = result.routes?.[0];
        if (
          result.code !== "Ok" ||
          !routeResult?.geometry?.coordinates?.length
        ) {
          throw new Error(
            result.message ||
              "Не удалось построить автомобильный маршрут между адресами",
          );
        }

        if (!controller.signal.aborted) {
          setRouteState({
            key: routeKey,
            route: routeResult.geometry,
            distance: routeResult.distance,
            duration: routeResult.duration,
            error: "",
          });

          if (onRouteCalculated) {
            onRouteCalculated({
              distance: routeResult.distance,
              duration: routeResult.duration,
            });
          }
        }
      } catch (requestError) {
        if (!controller.signal.aborted) {
          setRouteState({
            key: routeKey,
            route: null,
            error: `Не удалось построить маршрут: ${requestError.message}`,
          });
        }
      }
    }

    loadRoute();
    return () => controller.abort();
  }, [error, loading, points, routeKey, onRouteCalculated]);

  useEffect(() => {
    if (
      loading ||
      error ||
      routeLoading ||
      points.length === 0 ||
      !mapContainer.current
    ) {
      return undefined;
    }

    let map;
    let cancelled = false;

    import("maplibre-gl")
      .then(({ Map: MapLibreMap, Marker, Popup, setWorkerUrl }) => {
        if (cancelled) {
          return;
        }

        setWorkerUrl(maplibreWorkerUrl);
        setMapError(null);
        map = new MapLibreMap({
          container: mapContainer.current,
          style:
            import.meta.env.VITE_MAP_STYLE_URL ||
            "https://tiles.openfreemap.org/styles/liberty",
          center: [points[0].lng, points[0].lat],
          zoom: 14,
          attributionControl: true,
        });

        map.once("load", () => {
          if (cancelled) {
            return;
          }

          let routeOverlay;
          if (route) {
            routeOverlay = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            routeOverlay.classList.add("order-map-route-overlay");
            routeOverlay.setAttribute("aria-hidden", "true");
            const routePath = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            routePath.setAttribute("class", "order-map-route-line");
            routeOverlay.append(routePath);
            mapContainer.current.append(routeOverlay);

            const updateRouteOverlay = () => {
              const { width, height } = map
                .getContainer()
                .getBoundingClientRect();
              routeOverlay.setAttribute("width", String(width));
              routeOverlay.setAttribute("height", String(height));
              routeOverlay.setAttribute("viewBox", `0 0 ${width} ${height}`);
              const pathData = route.coordinates
                .map(([longitude, latitude], index) => {
                  const { x, y } = map.project([longitude, latitude]);
                  return `${index === 0 ? "M" : "L"}${x},${y}`;
                })
                .join(" ");
              routePath.setAttribute("d", pathData);
            };

            map.on("move", updateRouteOverlay);
            map.on("resize", updateRouteOverlay);
            updateRouteOverlay();
            map.once("remove", () => routeOverlay.remove());
          }

          points.forEach((point, index) => {
            const markerElement = document.createElement("div");
            markerElement.className = `order-map-marker ${index === 0 ? "map-marker-start" : "map-marker-end"}`;
            new Marker({ element: markerElement })
              .setLngLat([point.lng, point.lat])
              .setPopup(
                new Popup({ offset: 18 }).setText(
                  `${index === 0 ? "Откуда" : "Куда"}: ${index === 0 ? from : to}`,
                ),
              )
              .addTo(map);
          });

          const boundsCoordinates =
            route?.coordinates || points.map(({ lng, lat }) => [lng, lat]);
          const bounds = boundsCoordinates.reduce(
            ([southWest, northEast], [longitude, latitude]) => [
              [
                Math.min(southWest[0], longitude),
                Math.min(southWest[1], latitude),
              ],
              [
                Math.max(northEast[0], longitude),
                Math.max(northEast[1], latitude),
              ],
            ],
            [
              [Infinity, Infinity],
              [-Infinity, -Infinity],
            ],
          );
          if (boundsCoordinates.length > 1) {
            map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
          }
        });
      })
      .catch((loadError) => {
        if (!cancelled) {
          setMapError({
            addressKey,
            message: `Не удалось загрузить карту: ${loadError.message}`,
          });
        }
      });

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [addressKey, error, from, loading, points, route, routeLoading, to]);

  return (
    <Card className="panel-card order-map-card">
      <h3>Карта доставки</h3>
      {loading && (
        <div className="order-map-message">
          <Spin /> <span>Ищем адреса на карте…</span>
        </div>
      )}
      {error && (
        <div className="order-map-message order-map-error">{error}</div>
      )}
      {currentMapError && (
        <div className="order-map-message order-map-error">
          {currentMapError}
        </div>
      )}
      {routeLoading && (
        <div className="order-map-message">
          <Spin /> <span>Прокладываем автомобильный маршрут…</span>
        </div>
      )}
      {routeIsCurrent && routeState.error && (
        <div className="order-map-message order-map-error">
          {routeState.error}
        </div>
      )}
      {routeIsCurrent && route && (
        <div className="order-map-message">
          Автомобильный маршрут: {(routeState.distance / 1000).toFixed(1)} км ·
          около {Math.round(routeState.duration / 60)} мин
        </div>
      )}
      {!loading && !error && points.length === 0 && (
        <div className="order-map-message">
          {!from && !to
            ? "Адреса заказа не указаны."
            : "Не удалось найти адреса. Проверьте, что указаны адреса в Челябинске."}
        </div>
      )}
      {!loading && !error && points.length > 0 && (
        <>
          {(locations.from === null || locations.to === null) && (
            <div className="order-map-message">
              Один из адресов не найден. Проверьте написание адреса в заказе.
            </div>
          )}
          <div className="order-map" ref={mapContainer} />
          <div className="order-map-legend">
            {locations.from && (
              <span>
                <i className="map-legend-start" />
                Откуда
              </span>
            )}
            {locations.to && (
              <span>
                <i className="map-legend-end" />
                Куда
              </span>
            )}
          </div>
        </>
      )}
    </Card>
  );
}