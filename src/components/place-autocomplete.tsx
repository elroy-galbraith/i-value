'use client';

import { Input } from '@/components/ui/input';
import { useEffect, useRef } from 'react';

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
}

export function PlaceAutocomplete({ onPlaceSelect }: PlaceAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputRef.current || !window.google || !window.google.maps.places) {
      return;
    }

    const autocomplete = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: ['geocode', 'establishment'],
        componentRestrictions: { country: 'jm' },
        fields: ['geometry', 'name', 'formatted_address'],
      }
    );

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place && place.geometry && place.geometry.location) {
        onPlaceSelect(place);
      }
    });

    const preventSubmit = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
      }
    };
    inputRef.current.addEventListener('keydown', preventSubmit);

    return () => {
      if (window.google) {
        window.google.maps.event.removeListener(listener);
      }
      inputRef.current?.removeEventListener('keydown', preventSubmit);
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
