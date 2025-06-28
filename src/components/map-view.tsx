'use client';

import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { Card, CardContent } from '@/components/ui/card';

export function MapView() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const position = { lat: 18.1096, lng: -77.2975 };

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
              defaultCenter={position}
              defaultZoom={9}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId="ivalu_map"
            />
          </APIProvider>
        </div>
      </CardContent>
    </Card>
  );
}
