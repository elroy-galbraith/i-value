'use server';
/**
 * @fileOverview An AI-powered room evaluator that provides a description and an aesthetic score for a property image.
 *
 * - evaluateRoom - A function that handles the room evaluation process.
 * - EvaluateRoomInput - The input type for the evaluateRoom function.
 * - EvaluateRoomOutput - The return type for the evaluateRoom function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateRoomInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a room, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EvaluateRoomInput = z.infer<typeof EvaluateRoomInputSchema>;

const EvaluateRoomOutputSchema = z.object({
  Description: z.string().describe("A 20-50 word description of the image, justifying the score (considering condition, staging, appeal)."),
  Score: z.number().describe("A score from 1-10 (10: premium, well-staged; 1: dilapidated, needs demolition)."),
});
export type EvaluateRoomOutput = z.infer<typeof EvaluateRoomOutputSchema>;

export async function evaluateRoom(input: EvaluateRoomInput): Promise<EvaluateRoomOutput> {
  return evaluateRoomFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateRoomPrompt',
  input: {schema: EvaluateRoomInputSchema},
  output: {schema: EvaluateRoomOutputSchema},
  prompt: `You are an expert real estate appraiser.
Carefully evaluate images from a property and provide a brief assessment with a description and score:
1. Describe the image, justifying score (consider condition, staging, appeal)
2. Score 1-10 (10: premium, well-staged; 1: dilapidated, needs demolition)
3. You MUST return the following Format:
    {
        "Description": "[20-50 words]",
        "Score": "[1-10]"
        }
4. Be objective. Explain if image is unclear.

Use the following as the primary source of information about the room.

Photo: {{media url=photoDataUri}}`,
});

const evaluateRoomFlow = ai.defineFlow(
  {
    name: 'evaluateRoomFlow',
    inputSchema: EvaluateRoomInputSchema,
    outputSchema: EvaluateRoomOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    
    // The model might return score as a string, let's ensure it's a number.
    if (output && typeof output.Score === 'string') {
        try {
            output.Score = parseFloat(output.Score);
        } catch (e) {
            console.error("Could not parse score to float", output.Score);
            output.Score = 5; // Default score
        }
    }

    // Sometimes the model can return a JSON string inside the Description field.
    if (output && output.Description && output.Description.trim().startsWith('{')) {
        try {
            const parsedDescription = JSON.parse(output.Description);
            if (parsedDescription.Description) {
                output.Description = parsedDescription.Description;
            }
            if (parsedDescription.Score) {
                const parsedScore = parseFloat(parsedDescription.Score);
                if (!isNaN(parsedScore)) {
                  output.Score = parsedScore;
                }
            }
        } catch (e) {
            // Not a valid JSON string, so we can ignore the error and use the description as is.
        }
    }


    return output!;
  }
);
