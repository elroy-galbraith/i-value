
'use server';

import { z } from 'zod';

const EstimateValueInputSchema = z.object({
  sqft: z.number(),
  rooms: z.number(),
  bathroom: z.number(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  aes_score: z.number(),
  property_type: z.string(),
});
export type EstimateValueInput = z.infer<typeof EstimateValueInputSchema>;

const FindSimilarInputSchema = EstimateValueInputSchema.extend({
    price: z.number(),
    min_price: z.number(),
    max_price: z.number(),
    parish: z.string().optional(),
});
export type FindSimilarInput = z.infer<typeof FindSimilarInputSchema>;


export async function estimatePropertyValue(payload: EstimateValueInput) {
  try {
    const response = await fetch("https://ml-endpoints.aeontsolutions.com/v1/property-relative-value/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Error response body:", errorBody);
      throw new Error(`HTTP error! status: ${response.status}. Body: ${errorBody}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error in estimatePropertyValue:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to fetch property value estimation: ${error.message}`);
    }
    throw new Error("Failed to fetch property value estimation.");
  }
}

export async function findSimilarProperties(payload: FindSimilarInput) {
    try {
      // The `find-similar` endpoint might expect different field names.
      // Let's align the payload with more common naming conventions.
      const apiPayload = {
        ...payload,
        bedrooms: payload.rooms,
        bathrooms: payload.bathroom,
      };
      // @ts-ignore - Deleting properties for API alignment
      delete apiPayload.rooms;
      // @ts-ignore - Deleting properties for API alignment
      delete apiPayload.bathroom;

      const response = await fetch("https://ml-endpoints.aeontsolutions.com/v1/similar-properties/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiPayload),
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Error response body:", errorBody);
        throw new Error(`HTTP error! status: ${response.status}. Body: ${errorBody}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error in findSimilarProperties:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to fetch similar properties: ${error.message}`);
      }
      throw new Error("Failed to fetch similar properties.");
    }
}
