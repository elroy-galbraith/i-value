
"use client";

import { useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useEffect, useState, MouseEventHandler } from "react";
import Image from "next/image";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Sparkles, Building, Search, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parishes } from "@/lib/data";

const valuationSchema = z.object({
  address: z.string().optional(),
  propertyType: z.string().min(1, "Property type is required"),
  sqft: z.coerce.number().min(1, "Square footage is required"),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  parish: z.string().optional(),
  aes_score: z.coerce.number().min(0).max(10),
  images: z.any().optional(),
});

type ValuationFormValues = z.infer<typeof valuationSchema>;

interface EvaluatedImage {
  url: string;
  description: string;
  score: number;
}

// Helper to parse price strings like "$1,500,000" into numbers
const parsePrice = (priceStr: string) => {
  return parseFloat(priceStr.replace(/[^0-9.-]+/g, ""));
};

export function ValuationTool() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("evaluate");
  const [loading, setLoading] = useState({ evaluate: false, estimate: false, find: false });
  
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [evaluatedImages, setEvaluatedImages] = useState<EvaluatedImage[]>([]);
  const [estimationResult, setEstimationResult] = useState<any>(null);
  const [similarProperties, setSimilarProperties] = useState<any>(null);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      address: "",
      propertyType: "",
      sqft: 0,
      bedrooms: 0,
      bathrooms: 0,
      parish: "",
      aes_score: 5, // Default aesthetic score
    },
  });

  useEffect(() => {
    const address = searchParams.get("address") || "";
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    if (latParam && lngParam) {
      setLat(parseFloat(latParam));
      setLng(parseFloat(lngParam));
    }
    form.reset({ ...form.getValues(), address });
  }, [searchParams, form]);

  useEffect(() => {
    return () => {
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedFiles(files);
      setImagePreviews(files.map(file => URL.createObjectURL(file)));
    }
  };

  const handleEvaluate: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast({ variant: "destructive", title: "No images selected", description: "Please upload at least one image to evaluate." });
      return;
    }
    setLoading(prev => ({ ...prev, evaluate: true }));
    setEvaluationResult(null);
    setEvaluatedImages([]);

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append("images", file));
    formData.append("user_id", "user-123");
    formData.append("eval_id", `eval-${Date.now()}`);

    try {
      const response = await fetch("https://ml-endpoints.aeontsolutions.com/v1/room-evaluator/", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      
      setEvaluationResult(result);
      const newImages = result.public_urls.map((url: string, index: number) => ({
        url: url,
        description: Array.isArray(result.descriptions) ? result.descriptions[index] : result.descriptions,
        score: result.average_score,
      }));
      setEvaluatedImages(newImages);

      form.setValue("aes_score", parseFloat(result.average_score.toFixed(2)));
      toast({ title: "Evaluation Complete", description: `Average aesthetic score: ${result.average_score.toFixed(2)}` });
    } catch (error) {
      console.error("Room evaluation error:", error);
      toast({ variant: "destructive", title: "Evaluation Failed", description: "Could not evaluate the room images." });
    } finally {
      setLoading(prev => ({ ...prev, evaluate: false }));
    }
  };

  const handleScoreChange = (index: number, newScoreString: string) => {
    const newScore = parseFloat(newScoreString);
    if (isNaN(newScore)) return;

    const updatedImages = [...evaluatedImages];
    const clampedScore = Math.max(0, Math.min(10, newScore));
    updatedImages[index].score = clampedScore;
    setEvaluatedImages(updatedImages);

    const newAverage = updatedImages.reduce((acc, img) => acc + img.score, 0) / updatedImages.length;
    form.setValue("aes_score", parseFloat(newAverage.toFixed(2)));
  };

  const handleDescriptionChange = (index: number, newDescription: string) => {
    const updatedImages = [...evaluatedImages];
    updatedImages[index].description = newDescription;
    setEvaluatedImages(updatedImages);
  };
  
  const handleEstimate: SubmitHandler<ValuationFormValues> = async (data) => {
    setLoading(prev => ({ ...prev, estimate: true }));
    setEstimationResult(null);

    const payload = {
      sqft: data.sqft,
      rooms: data.bedrooms,
      bathroom: data.bathrooms,
      latitude: lat,
      longitude: lng,
      aes_score: data.aes_score,
      property_type: data.propertyType,
    };

    try {
      const response = await fetch("https://ml-endpoints.aeontsolutions.com/v1/property-relative-value/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setEstimationResult(result);
      toast({ title: "Estimation Complete", description: `Median estimated price: ${result.median_price}` });
      setActiveTab("similar");
    } catch (error) {
      console.error("Value estimation error:", error);
      toast({ variant: "destructive", title: "Estimation Failed", description: "Could not estimate property value." });
    } finally {
      setLoading(prev => ({ ...prev, estimate: false }));
    }
  };

  const handleFindSimilar = async () => {
    const data = form.getValues();
    if (!estimationResult) {
      toast({ variant: "destructive", title: "Missing Data", description: "Please complete the estimation step first." });
      return;
    }
    if (!data.parish) {
      toast({
        variant: "destructive",
        title: "Parish Required",
        description: "Please select a location on the map or choose a parish from the dropdown.",
      });
      return;
    }
    setLoading(prev => ({ ...prev, find: true }));
    setSimilarProperties(null);

    const payload = {
        sqft: data.sqft,
        rooms: data.bedrooms,
        bathroom: data.bathrooms,
        latitude: lat,
        longitude: lng,
        aes_score: data.aes_score,
        property_type: data.propertyType,
        price: parsePrice(estimationResult.median_price),
        min_price: parsePrice(estimationResult.min_price),
        max_price: parsePrice(estimationResult.max_price),
        parish: data.parish,
    };

    try {
        const response = await fetch("https://ml-endpoints.aeontsolutions.com/v1/similar-properties/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setSimilarProperties(result);
    } catch (error) {
        console.error("Find similar properties error:", error);
        toast({ variant: "destructive", title: "Failed to Find Comparables", description: "Could not find similar properties." });
    } finally {
        setLoading(prev => ({ ...prev, find: false }));
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="evaluate">1. Evaluate Room</TabsTrigger>
            <TabsTrigger value="estimate" disabled={!evaluationResult}>2. Estimate Value</TabsTrigger>
            <TabsTrigger value="similar" disabled={!estimationResult}>3. Find Comps</TabsTrigger>
          </TabsList>
          
          <TabsContent value="evaluate">
            <Card>
              <CardHeader>
                <CardTitle>Room Evaluator</CardTitle>
                <CardDescription>Upload images of a room to get an AI-generated aesthetic score and description.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="image-upload">Property Images</Label>
                  <div className="relative">
                    <Input id="image-upload" type="file" multiple onChange={handleFileChange} className="w-full h-full absolute inset-0 opacity-0 cursor-pointer" />
                    <label htmlFor="image-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted rounded-lg cursor-pointer hover:bg-muted/50">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                      </div>
                    </label>
                  </div>
                  {imagePreviews.length > 0 && (
                    <div className="pt-4">
                      <p className="text-sm font-medium mb-2">Selected Image(s) Preview:</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="relative aspect-square">
                            <Image src={preview} alt={`Preview of selected file ${index + 1}`} fill className="rounded-md object-cover" data-ai-hint="interior room" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <FormDescription>
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected.`
                      : "Upload one or more images."}
                  </FormDescription>
                </div>
                <Button onClick={handleEvaluate} type="button" disabled={loading.evaluate}>
                  {loading.evaluate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Evaluate Room
                </Button>
              </CardContent>
              
              {loading.evaluate && (
                <CardContent className="flex items-center justify-center py-6">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Evaluating images...</p>
                </CardContent>
              )}

              {evaluationResult && !loading.evaluate && (
                <CardContent>
                  <CardTitle className="text-xl mb-4">Evaluation Results</CardTitle>
                  <div className="space-y-4">
                    <p><strong>Average Aesthetic Score:</strong> {(form.watch('aes_score') || 0).toFixed(2)} / 10</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {evaluatedImages.map((image, index) => (
                        <Card key={index}>
                          <CardHeader className="p-0">
                            <Image src={image.url} alt={`Room image ${index + 1}`} width={400} height={300} className="rounded-t-lg object-cover aspect-video" data-ai-hint="interior room" />
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <div>
                              <Label htmlFor={`description-${index}`} className="text-sm font-medium">Description</Label>
                              <Textarea
                                id={`description-${index}`}
                                value={image.description}
                                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                className="mt-1"
                                rows={4}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`score-${index}`} className="text-sm font-medium">Aesthetic Score</Label>
                              <Input
                                id={`score-${index}`}
                                type="number"
                                value={image.score}
                                onChange={(e) => handleScoreChange(index, e.target.value)}
                                step="0.1"
                                min="0"
                                max="10"
                                className="mt-1"
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="estimate">
          <Card>
              <CardHeader>
              <CardTitle>Property Details</CardTitle>
              <CardDescription>Fill in the information below for the selected property.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
              <FormField control={form.control} name="address" render={({ field }) => ( <FormItem> <FormLabel>Property Address</FormLabel> <FormControl><Input placeholder="123 Main St, Kingston, Jamaica" {...field} /></FormControl> <FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField control={form.control} name="propertyType" render={({ field }) => (<FormItem><FormLabel>Property Type</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl><SelectContent><SelectItem value="House">House</SelectItem><SelectItem value="Apartment">Apartment</SelectItem><SelectItem value="Townhouse">Townhouse</SelectItem><SelectItem value="Commercial">Commercial</SelectItem><SelectItem value="Land">Vacant Land</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="parish" render={({ field }) => (<FormItem><FormLabel>Parish</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select parish" /></SelectTrigger></FormControl><SelectContent>{parishes.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="sqft" render={({ field }) => (<FormItem><FormLabel>Square Footage</FormLabel><FormControl><Input type="number" placeholder="e.g., 2000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="bedrooms" render={({ field }) => (<FormItem><FormLabel>Bedrooms</FormLabel><FormControl><Input type="number" placeholder="e.g., 3" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="bathrooms" render={({ field }) => (<FormItem><FormLabel>Bathrooms</FormLabel><FormControl><Input type="number" placeholder="e.g., 2" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField control={form.control} name="aes_score" render={({ field }) => (<FormItem><FormLabel>Aesthetic Score</FormLabel><FormControl><Input type="number" step="0.1" {...field} readOnly /></FormControl><FormDescription>Score from evaluation step (0-10).</FormDescription><FormMessage /></FormItem>)} />
              </div>
              <Button onClick={form.handleSubmit(handleEstimate)} type="button" disabled={loading.estimate}>
                  {loading.estimate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building className="mr-2 h-4 w-4" />}
                  Estimate Value
              </Button>
              </CardContent>
              {estimationResult && (
              <CardContent>
                  <CardTitle className="text-xl mb-4">Price Estimation</CardTitle>
                  <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-sm text-muted-foreground">Minimum</p><p className="text-2xl font-bold">{estimationResult.min_price}</p></div>
                  <div><p className="text-sm text-primary">Median</p><p className="text-3xl font-bold text-primary">{estimationResult.median_price}</p></div>
                  <div><p className="text-sm text-muted-foreground">Maximum</p><p className="text-2xl font-bold">{estimationResult.max_price}</p></div>
                  </div>
              </CardContent>
              )}
          </Card>
          </TabsContent>

          <TabsContent value="similar">
          <Card>
              <CardHeader>
              <CardTitle>Find Similar Properties</CardTitle>
              <CardDescription>Based on the property details and estimation, find comparable properties.</CardDescription>
              </CardHeader>
              <CardContent>
              <Button onClick={handleFindSimilar} type="button" disabled={loading.find}>
                  {loading.find ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Find Comparables
              </Button>
              </CardContent>
              {loading.find && (
                <CardContent className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Searching for comparables...</p>
                </CardContent>
              )}
              {similarProperties && (
                  <CardContent className="space-y-6">
                      <div>
                          <CardTitle className="text-xl mb-4">Similar Properties</CardTitle>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {similarProperties.similar_properties.map((prop: any, index: number) => (
                                  <Card key={index}>
                                      <CardHeader><CardTitle className="text-base">{prop.title}</CardTitle></CardHeader>
                                      <CardContent className="text-sm space-y-1">
                                          <p><strong>Price:</strong> {prop.price}</p>
                                          <p><strong>Location:</strong> {prop.location}</p>
                                          <a href={prop.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center">
                                              View Listing <ArrowRight className="ml-1 h-4 w-4" />
                                          </a>
                                      </CardContent>
                                  </Card>
                              ))}
                          </div>
                      </div>
                      <div>
                          <CardTitle className="text-xl mb-4">Relevant Google Search Results</CardTitle>
                          <div className="space-y-3">
                              {similarProperties.google_search_results.map((result: any, index: number) => (
                                  <Card key={index} className="p-4">
                                      <a href={result.link} target="_blank" rel="noopener noreferrer">
                                          <h3 className="font-semibold text-primary hover:underline">{result.title}</h3>
                                          <p className="text-xs text-green-700">{result.displayed_link}</p>
                                          <p className="text-sm text-muted-foreground mt-1">{result.snippet}</p>
                                      </a>
                                  </Card>
                              ))}
                          </div>
                      </div>
                  </CardContent>
              )}
          </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}
