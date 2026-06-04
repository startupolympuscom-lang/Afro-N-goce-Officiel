import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

interface HeatmapLayerProps {
  points: [number, number, number][]; // [lat, lng, intensity]
  radius?: number;
  blur?: number;
  maxZoom?: number;
  max?: number;
  gradient?: Record<number, string>;
}

export function HeatmapLayer({ points, radius = 25, blur = 15, maxZoom = 18, max = 1.0, gradient }: HeatmapLayerProps) {
  const map = useMap();
  const layerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !(L as any).heatLayer) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    layerRef.current = (L as any).heatLayer(points, {
      radius,
      blur,
      maxZoom,
      max,
      gradient
    });

    layerRef.current.addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, points, radius, blur, maxZoom, max, gradient]);

  return null;
}
