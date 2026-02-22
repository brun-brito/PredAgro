import { useCallback, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import type { FeatureGroup as LeafletFeatureGroup } from 'leaflet';
import { geoJSON } from 'leaflet';
import { area as turfArea } from '@turf/turf';
import type { FieldGeometry } from '../../types/domain';
import styles from './FieldMapEditor.module.css';

interface FieldMapEditorProps {
  geometry: FieldGeometry | null;
  onGeometryChange: (geometry: FieldGeometry | null, areaHa: number | null) => void;
  center?: [number, number] | null;
}

const defaultCenter: [number, number] = [-14.235, -51.9253];
const defaultZoom = 4;

function computeAreaHa(geometry: FieldGeometry) {
  const areaSquareMeters = turfArea(geometry as never);
  return Number((areaSquareMeters / 10000).toFixed(4));
}

function MapViewController({ geometry, center }: { geometry: FieldGeometry | null; center?: [number, number] | null }) {
  const map = useMap();
  const lastGeometryRef = useRef<FieldGeometry | null>(null);

  useEffect(() => {
    const hadGeometry = Boolean(lastGeometryRef.current);
    lastGeometryRef.current = geometry;

    if (geometry && !hadGeometry) {
      const feature = {
        type: 'Feature',
        geometry,
        properties: {},
      };
      const bounds = geoJSON(feature as never).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24] });
      }
      return;
    }

    if (!geometry && center) {
      map.setView(center, 12);
    }
  }, [geometry, center, map]);

  return null;
}

export function FieldMapEditor({ geometry, onGeometryChange, center }: FieldMapEditorProps) {
  const featureGroupRef = useRef<LeafletFeatureGroup>(null);

  const handleCreated = useCallback(
    (event: any) => {
      const featureGroup = featureGroupRef.current;

      if (featureGroup) {
        featureGroup.clearLayers();
        featureGroup.addLayer(event.layer as never);
      }

      const geo = event.layer.toGeoJSON().geometry as FieldGeometry;
      const areaHa = computeAreaHa(geo);

      onGeometryChange(geo, areaHa);
    },
    [onGeometryChange]
  );

  const handleEdited = useCallback(
    (event: any) => {
      const layers = event.layers.getLayers() as Array<{ toGeoJSON: () => { geometry: FieldGeometry } }>;

      if (layers.length === 0) {
        return;
      }

      const geo = layers[0].toGeoJSON().geometry as FieldGeometry;
      const areaHa = computeAreaHa(geo);

      onGeometryChange(geo, areaHa);
    },
    [onGeometryChange]
  );

  const handleDeleted = useCallback(() => {
    onGeometryChange(null, null);
  }, [onGeometryChange]);

  return (
    <div className={styles.wrapper}>
      <MapContainer className={styles.map} center={center ?? defaultCenter} zoom={defaultZoom} scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewController geometry={geometry} center={center} />
        <FeatureGroup ref={featureGroupRef}>
          <EditControl
            position="topright"
            onCreated={handleCreated}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            draw={{
              rectangle: false,
              polyline: false,
              circle: false,
              circlemarker: false,
              marker: false,
              polygon: true,
            }}
          />
          {geometry && <GeoJSON data={geometry as never} />}
        </FeatureGroup>
      </MapContainer>
      {geometry && <p className={styles.helperText}>Área delimitada carregada. Você pode editar o polígono.</p>}
    </div>
  );
}
