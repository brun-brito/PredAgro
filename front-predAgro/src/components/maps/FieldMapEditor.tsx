import { useCallback, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, GeoJSON } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import type { FeatureGroup as LeafletFeatureGroup } from 'leaflet';
import { area as turfArea } from '@turf/turf';
import type { FieldGeometry } from '../../types/domain';
import styles from './FieldMapEditor.module.css';

interface FieldMapEditorProps {
  geometry: FieldGeometry | null;
  onGeometryChange: (geometry: FieldGeometry | null, areaHa: number | null) => void;
}

const defaultCenter: [number, number] = [-18.9186, -48.2772];

function computeAreaHa(geometry: FieldGeometry) {
  const areaSquareMeters = turfArea(geometry as never);
  return Number((areaSquareMeters / 10000).toFixed(4));
}

export function FieldMapEditor({ geometry, onGeometryChange }: FieldMapEditorProps) {
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
      <MapContainer className={styles.map} center={defaultCenter} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
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
