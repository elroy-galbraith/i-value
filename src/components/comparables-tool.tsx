"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { selectComparables, type SelectComparablesInput } from "@/ai/flows/select-comparables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ListOrdered, Sparkles } from "lucide-react";

const formSchema = z.object({
  propertyDescription: z.string().min(10, "Please provide a more detailed property description."),
  marketData: z.string().min(10, "Please provide more detailed market data."),
});

export function ComparablesTool() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[] | null>(null);
  const { toast } = useToast();

  const form = useForm<SelectComparablesInput>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      propertyDescription: "",
      marketData: "",
    },
  });

  const onSubmit: SubmitHandler<SelectComparablesInput> = async (data) => {
    setLoading(true);
    setResults(null);
    try {
      const response = await selectComparables(data);
      setResults(response.comparableProperties);
    } catch (error) {
      console.error("Error selecting comparables:", error);
      toast({
        variant: "destructive",
        title: "An error occurred",
        description: "Failed to fetch comparable properties. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Input Data</CardTitle>
              <CardDescription>
                Provide details about the subject property and the current market conditions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="propertyDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., 10-story, 100,000 sqft Class A office building in downtown Metropolis, built in 2015, 95% occupancy..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="marketData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Market Data</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Recent office sales in Metropolis CBD range from $500-$650/sqft. Vacancy rates are at 8% and trending down..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Find Comparables
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Comparable Properties</CardTitle>
          <CardDescription>
            AI-ranked properties based on explainability.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Analyzing data...</p>
            </div>
          )}
          {!loading && !results && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ListOrdered className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Your results will be displayed here.
              </p>
            </div>
          )}
          {results && (
            <ol className="list-decimal list-inside space-y-3">
              {results.map((item, index) => (
                <li key={index} className="p-3 bg-secondary/50 rounded-md border">
                  {item}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
