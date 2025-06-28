'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MapMouseEvent } from '@vis.gl/react-google-maps';

export function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const initialPosition = { lat: 18.1096, lng: -77.2975 }; // Jamaica
  const router = useRouter();
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const handleMapClick = async (event: MapMouseEvent) => {
    if (!event.detail.latLng) return;
    const latLng = event.detail.latLng;
    setSelectedPosition(latLng);

    const geocoder = new window.google.maps.Geocoder();
    await geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        router.push(`/valuation-tool?address=${encodeURIComponent(address)}`);
      } else {
        console.error('Geocoder failed due to: ' + status);
        // Fallback with lat/lng if geocoding fails
        router.push(`/valuation-tool?lat=${latLng.lat}&lng=${latLng.lng}`);
      }
    });
  };

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>Google Maps API key is not configured.</p>
            <p>Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your .env file.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-2">
        <div className="h-[60vh] w-full rounded-lg overflow-hidden">
          <APIProvider apiKey={apiKey}>
            <Map
              defaultCenter={initialPosition}
              defaultZoom={9}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId="ivalu_map"
              onClick={handleMapClick}
            >
              {selectedPosition && <AdvancedMarker position={selectedPosition} />}
            </Map>
          </APIProvider>
        </div>
        <div className="text-center text-muted-foreground pt-2">
          Click on the map to select a property location.
        </div>
      </CardContent>
    </Card>
  );
}