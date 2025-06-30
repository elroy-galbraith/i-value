import { MapView } from "@/components/map-view";
import { Map as MapIcon } from "lucide-react";

export default function MapPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <MapIcon className="h-8 w-8" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Interactive Map</h2>
          <p className="text-muted-foreground">
            Search for a location, then click the map to select a property.
          </p>
        </div>
      </div>
      <MapView />
    </div>
  );
}
