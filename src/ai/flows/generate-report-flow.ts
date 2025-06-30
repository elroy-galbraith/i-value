'use server';
/**
 * @fileOverview An AI-powered valuation report generator following IVS standards.
 *
 * - generateReport - A function that handles the valuation report generation process.
 * - GenerateReportInput - The input type for the generateReport function.
 * - GenerateReportOutput - The return type for the generateReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const PropertyDetailsSchema = z.object({
  address: z.string().optional(),
  propertyType: z.string(),
  sqft: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  parish: z.string().optional(),
});

const EvaluatedImageSchema = z.object({
  url: z.string(),
  description: z.string(),
  score: z.number(),
});

const EstimationResultSchema = z.object({
  min_price: z.string(),
  median_price: z.string(),
  max_price: z.string(),
});

const SimilarPropertySchema = z.object({
  title: z.string(),
  price: z.string(),
  location: z.string(),
  link: z.string(),
});

const GoogleSearchResultSchema = z.object({
    title: z.string(),
    link: z.string(),
    displayed_link: z.string(),
    snippet: z.string(),
});

const SimilarPropertiesSchema = z.object({
    similar_properties: z.array(SimilarPropertySchema),
    google_search_results: z.array(GoogleSearchResultSchema),
});


export const GenerateReportInputSchema = z.object({
  propertyDetails: PropertyDetailsSchema,
  evaluatedImages: z.array(EvaluatedImageSchema),
  aestheticScore: z.number(),
  estimationResult: EstimationResultSchema,
  similarProperties: SimilarPropertiesSchema,
});
export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;

export const GenerateReportOutputSchema = z.object({
  report: z.string().describe('The generated valuation report in Markdown format.'),
});
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(input: GenerateReportInput): Promise<GenerateReportOutput> {
  return generateReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateReportPrompt',
  input: {schema: GenerateReportInputSchema},
  output: {schema: GenerateReportOutputSchema},
  prompt: `You are a certified real estate appraiser tasked with creating a valuation report that complies with the International Valuation Standards (IVS).

Based on the data provided below, generate a comprehensive valuation report. The report should be in Markdown format and must include the following sections, clearly titled with Markdown headings (e.g., '## Scope of Work'):

(a) **Scope of Work**: Describe the work performed, including the extent of inspection (visual, based on provided images), the nature of the property, and the currency of the valuation (USD). Reference IVS 101 Scope of Work.
(b) **Intended Use**: State that the report is for estimation purposes to inform the client.
(c) **Intended Users**: Identify the client as the intended user.
(d) **Purpose of Valuation**: State the purpose is to determine the market value of the property.
(e) **Valuation Approach(es) Adopted**: Describe the approaches adopted. Mention the Sales Comparison Approach (using similar properties and Google search results) and the Cost Approach (implicitly considered via property details like sqft).
(f) **Valuation Method(s) Applied**: Explain the methods applied, including AI-driven aesthetic evaluation and algorithmic price estimation.
(g) **Key Inputs Used**: Summarize the key data points used in the valuation. This includes property address, type, size, room count, aesthetic evaluation scores and descriptions, price estimations, and comparable property data.
(h) **Assumptions**: State the key assumptions, such as the accuracy of the provided data, the representativeness of the comparable properties, and the market conditions remaining stable.
(i) **Valuation Conclusion**: Provide a conclusion of value, referencing the estimated price range (min, median, max). Justify the conclusion based on the property's characteristics, its aesthetic score, and the comparable market data.
(j) **Date of Report**: State the current date as the date of the report.

Here is the data for the subject property:

**Property Details:**
- Address: {{{propertyDetails.address}}}
- Parish: {{{propertyDetails.parish}}}
- Property Type: {{{propertyDetails.propertyType}}}
- Square Footage: {{{propertyDetails.sqft}}} sqft
- Bedrooms: {{{propertyDetails.bedrooms}}}
- Bathrooms: {{{propertyDetails.bathrooms}}}

**Aesthetic Evaluation:**
- Average Score: {{aestheticScore}} / 10
- Image-specific evaluations:
{{#each evaluatedImages}}
- Image:
  - Score: {{this.score}}
  - Description: "{{this.description}}"
{{/each}}

**Price Estimation:**
- Minimum Estimated Price: {{{estimationResult.min_price}}}
- Median Estimated Price: {{{estimationResult.median_price}}}
- Maximum Estimated Price: {{{estimationResult.max_price}}}

**Comparable Market Data:**
- Similar Properties Found:
{{#each similarProperties.similar_properties}}
  - Title: {{this.title}}
  - Price: {{this.price}}
  - Location: {{this.location}}
  - Link: {{this.link}}
{{/each}}
- Relevant Google Search Results:
{{#each similarProperties.google_search_results}}
  - Title: {{this.title}}
  - Snippet: {{this.snippet}}
  - Link: {{this.link}}
{{/each}}

Generate the report now.`,
});

const generateReportFlow = ai.defineFlow(
  {
    name: 'generateReportFlow',
    inputSchema: GenerateReportInputSchema,
    outputSchema: GenerateReportOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
