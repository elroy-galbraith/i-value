'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { MapMouseEvent, MapCameraChangedEvent } from '@vis.gl/react-google-maps';
import { PlaceAutocomplete } from './place-autocomplete';

export function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const initialPosition = { lat: 18.1096, lng: -77.2975 }; // Jamaica
  const router = useRouter();
  const [selectedPosition, setSelectedPosition] = useState<google.maps.LatLngLiteral | null>(null);

  const [center, setCenter] = useState(initialPosition);
  const [zoom, setZoom] = useState(9);

  const handleMapClick = async (event: MapMouseEvent) => {
    if (!event.detail.latLng) return;
    const latLng = event.detail.latLng;
    setSelectedPosition(latLng);

    const geocoder = new window.google.maps.Geocoder();
    await geocoder.geocode({ location: latLng }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const address = results[0].formatted_address;
        router.push(`/valuation-tool?address=${encodeURIComponent(address)}&lat=${latLng.lat}&lng=${latLng.lng}`);
      } else {
        console.error('Geocoder failed due to: ' + status);
        router.push(`/valuation-tool?lat=${latLng.lat}&lng=${latLng.lng}`);
      }
    });
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.location) {
      const newCenter = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setCenter(newCenter);
      setZoom(15);
    }
  };

  const handleCameraChange = (ev: MapCameraChangedEvent) => {
    setZoom(ev.detail.zoom);
    setCenter(ev.detail.center);
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
        <APIProvider apiKey={apiKey} libraries={['places']}>
          <div className='mb-4'>
            <PlaceAutocomplete onPlaceSelect={handlePlaceSelect} />
          </div>
          <div className="h-[60vh] w-full rounded-lg overflow-hidden">
            <Map
              center={center}
              zoom={zoom}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId="ivalu_map"
              onClick={handleMapClick}
              onCameraChanged={handleCameraChange}
            >
              {selectedPosition && <AdvancedMarker position={selectedPosition} />}
            </Map>
          </div>
        </APIProvider>
        <div className="text-center text-muted-foreground pt-2">
          Search for a location, then click the map to select a property.
        </div>
      </CardContent>
    </Card>
  );
}
