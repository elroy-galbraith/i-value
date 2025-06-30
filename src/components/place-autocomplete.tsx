'use client';

import { Input } from '@/components/ui/input';
import { useEffect, useRef } from 'react';

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export function PlaceAutocomplete({ onPlaceSelect }: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let autocomplete: google.maps.places.Autocomplete | null = null;
    let placeChangedListener: google.maps.MapsEventListener | null = null;
    
    const preventSubmit = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    };
    
    const initAutocomplete = () => {
      if (inputRef.current && window.google && window.google.maps && window.google.maps.places) {
        autocomplete = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['geocode', 'establishment'],
            componentRestrictions: { country: 'jm' },
            fields: ['geometry', 'name', 'formatted_address'],
          }
        );

        placeChangedListener = autocomplete.addListener('place_changed', () => {
          const place = autocomplete?.getPlace();
          if (place && place.geometry && place.geometry.location) {
            onPlaceSelect(place);
          }
        });
        
        inputRef.current.addEventListener('keydown', preventSubmit);
        return true;
      }
      return false;
    };

    // Poll until the google maps script is loaded.
    const intervalId = setInterval(() => {
      if (initAutocomplete()) {
        clearInterval(intervalId);
      }
    }, 200);

    return () => {
      clearInterval(intervalId);
      if (placeChangedListener) {
        placeChangedListener.remove();
      }
      if (inputRef.current) {
        inputRef.current.removeEventListener('keydown', preventSubmit);
      }
    };
  }, [onPlaceSelect]);

  return (
    <Input
      ref={inputRef}
      placeholder="Search for a location in Jamaica..."
      type="text"
    />
  );
}
