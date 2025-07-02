
"use client";

import { useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import React, { useEffect, useState, MouseEventHandler } from "react";
import Image from "next/image";
import jsPDF from "jspdf";
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
import { Loader2, Upload, Sparkles, Building, Search, ArrowRight, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parishes } from "@/lib/data";
import { evaluateRoom } from "@/ai/flows/evaluate-room-flow";
import { generateReport } from "@/ai/flows/generate-report-flow";
import { MapView } from "@/components/map-view";
import { estimatePropertyValue, findSimilarProperties } from "@/services/property-api";


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

interface EstimationResult {
  min_price: string;
  median_price: string;
  max_price: string;
}

// Helper to parse price strings like "$1,500,000" into numbers
const parsePrice = (priceStr: string) => {
  return parseFloat(priceStr.replace(/[^0-9.-]+/g, ""));
};

// Helper function to fetch an image and convert it to Base64
const toDataURL = (url: string) =>
  fetch(url)
    .then((response) => response.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );


export function ValuationTool() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("evaluate");
  const [loading, setLoading] = useState({ 
    evaluate: false, 
    estimate: false, 
    find: false,
    report: false,
    pdf: false,
  });
  
  const [evaluatedImages, setEvaluatedImages] = useState<EvaluatedImage[]>([]);
  const [estimationResult, setEstimationResult] = useState<EstimationResult | null>(null);
  const [similarProperties, setSimilarProperties] = useState<any>(null);
  const [report, setReport] = useState<string | null>(null);

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

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleEvaluate: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      toast({ variant: "destructive", title: "No images selected", description: "Please upload at least one image to evaluate." });
      return;
    }
    setLoading(prev => ({ ...prev, evaluate: true }));
    setEvaluatedImages([]);

    try {
      const evaluationPromises = selectedFiles.map(async (file, index) => {
        const dataUri = await fileToDataUri(file);
        const result = await evaluateRoom({ photoDataUri: dataUri });
        
        return {
          url: imagePreviews[index], // Use the preview URL we already have
          description: result.Description,
          score: result.Score,
        };
      });

      const results = await Promise.all(evaluationPromises);
      setEvaluatedImages(results);

      if (results.length > 0) {
        const totalScore = results.reduce((acc, img) => acc + img.score, 0);
        const averageScore = totalScore / results.length;
        form.setValue("aes_score", parseFloat(averageScore.toFixed(2)));
        toast({ title: "Evaluation Complete", description: `Average aesthetic score: ${averageScore.toFixed(2)}` });
      } else {
        toast({ variant: "destructive", title: "Evaluation Failed", description: "No images were successfully evaluated." });
      }
    } catch (error) {
      console.error("Room evaluation error with Genkit:", error);
      toast({ variant: "destructive", title: "Evaluation Failed", description: "An AI error occurred during image evaluation." });
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
      const result = await estimatePropertyValue(payload);
      setEstimationResult(result);
      toast({ title: "Estimation Complete", description: `Median estimated price: ${result.median_price}` });
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
        const result = await findSimilarProperties(payload);
        setSimilarProperties(result);
        const numProps = result?.similar_properties?.length || 0;
        toast({ title: "Search Complete", description: `Found ${numProps} comparable properties.` });

    } catch (error) {
        console.error("Find similar properties error:", error);
        toast({
            variant: "default",
            title: "No Comparables Found",
            description: "No similar properties were found. You can still proceed to generate the report.",
        });
        setSimilarProperties({
            similar_properties: [],
            google_search_results: [],
        });
    } finally {
        setLoading(prev => ({ ...prev, find: false }));
        setActiveTab("report");
    }
  };

  const handleGenerateReport = async () => {
    if (!estimationResult || !similarProperties) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please complete all previous steps before generating a report.",
      });
      return;
    }

    setLoading((prev) => ({ ...prev, report: true }));
    setReport(null);

    try {
      const data = form.getValues();
      const reportInput = {
        propertyDetails: {
          address: data.address,
          propertyType: data.propertyType,
          sqft: Number(data.sqft),
          bedrooms: Number(data.bedrooms),
          bathrooms: Number(data.bathrooms),
          parish: data.parish,
        },
        evaluatedImages: evaluatedImages,
        aestheticScore: data.aes_score,
        estimationResult: estimationResult,
        similarProperties: similarProperties,
      };
      
      const response = await generateReport(reportInput as any);
      setReport(response.report);
      toast({ title: "Report Generated Successfully" });

    } catch (error) {
      console.error("Report generation error:", error);
      toast({
        variant: "destructive",
        title: "Report Generation Failed",
        description: "An AI error occurred while generating the report.",
      });
    } finally {
      setLoading((prev) => ({ ...prev, report: false }));
    }
  };

  const handleDownloadPdf = async () => {
    if (!report || !lat || !lng || !estimationResult) {
      toast({
        variant: 'destructive',
        title: 'Cannot generate PDF',
        description:
          'Please ensure a report has been generated and property details are complete.',
      });
      return;
    }
    setLoading((prev) => ({ ...prev, pdf: true }));

    try {
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      let currentY = margin;

      const addWrappedText = (
        text: string,
        options: {
          x: number;
          fontSize: number;
          fontStyle: 'normal' | 'bold';
          maxWidth: number;
          align?: 'left' | 'center' | 'right';
        }
      ) => {
        doc.setFontSize(options.fontSize);
        doc.setFont('helvetica', options.fontStyle);

        const splitText = doc.splitTextToSize(text, options.maxWidth);
        const textHeight = doc.getTextDimensions(splitText).h;

        if (currentY + textHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }

        doc.text(splitText, options.x, currentY, { align: options.align });
        currentY += textHeight + 4; // a bit of padding
      };

      // 1. Title
      addWrappedText('Valuation Report', {
        x: pageWidth / 2,
        fontSize: 18,
        fontStyle: 'bold',
        maxWidth: pageWidth - margin * 2,
        align: 'center',
      });
      addWrappedText(form.getValues('address') || 'N/A', {
        x: pageWidth / 2,
        fontSize: 12,
        fontStyle: 'normal',
        maxWidth: pageWidth - margin * 2,
        align: 'center',
      });
      currentY += 5;

      // 2. Map Image
      addWrappedText('Property Location', {
        x: margin,
        fontSize: 14,
        fontStyle: 'bold',
        maxWidth: pageWidth - margin * 2,
        align: 'left',
      });
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x400&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${apiKey}`;

      try {
        const mapDataUrl = await toDataURL(mapUrl);
        const mapWidth = pageWidth - margin * 2;
        const mapHeight = (mapWidth / 600) * 400; // Maintain aspect ratio
        if (currentY + mapHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.addImage(mapDataUrl, 'JPEG', margin, currentY, mapWidth, mapHeight);
        currentY += mapHeight + 10;
      } catch (error) {
        console.error('Failed to load map image for PDF', error);
        addWrappedText('Map image could not be loaded.', {
          x: margin,
          fontSize: 11,
          fontStyle: 'normal',
          maxWidth: pageWidth - margin * 2,
          align: 'left',
        });
      }

      // 3. Property Images & Descriptions
      doc.addPage();
      currentY = margin;
      addWrappedText('Property Images & Evaluation', {
        x: margin,
        fontSize: 14,
        fontStyle: 'bold',
        maxWidth: pageWidth - margin * 2,
        align: 'left',
      });

      for (const image of evaluatedImages) {
        try {
          const imgDataUrl = await toDataURL(image.url);
          const imgWidth = pageWidth - margin * 2;
          const imgProps = doc.getImageProperties(imgDataUrl);
          const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

          if (currentY + imgHeight + 20 > pageHeight - margin) { // +20 for text buffer
            doc.addPage();
            currentY = margin;
          }

          doc.addImage(imgDataUrl, 'JPEG', margin, currentY, imgWidth, imgHeight);
          currentY += imgHeight + 5;

          const descriptionText = `Aesthetic Score: ${image.score}/10\n\n${image.description}`;
          addWrappedText(descriptionText, {
            x: margin,
            fontSize: 11,
            fontStyle: 'normal',
            maxWidth: pageWidth - margin * 2,
            align: 'left',
          });
          currentY += 5; // Extra padding between images
        } catch (error) {
          console.error('Failed to load property image for PDF', error);
          addWrappedText(
            `Image could not be loaded. Description: ${image.description}`,
            {
              x: margin,
              fontSize: 11,
              fontStyle: 'normal',
              maxWidth: pageWidth - margin * 2,
              align: 'left',
            }
          );
        }
      }

      // 4. IVS Report Text
      doc.addPage();
      currentY = margin;
      addWrappedText('IVS Compliant Report', {
        x: margin,
        fontSize: 14,
        fontStyle: 'bold',
        maxWidth: pageWidth - margin * 2,
        align: 'left',
      });
      
      const splitReport = doc.splitTextToSize(report, pageWidth - margin * 2);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lineHeight = doc.getLineHeight() / doc.internal.scaleFactor;
      for (const line of splitReport) {
        if (currentY + lineHeight > pageHeight - margin) {
          doc.addPage();
          currentY = margin;
        }
        doc.text(line, margin, currentY);
        currentY += lineHeight;
      }
      
      doc.save(`Valuation-Report-${form.getValues('address')?.replace(/ /g, '_') || 'property'}.pdf`);

    } catch (error) {
      console.error("PDF Generation Error: ", error);
      toast({
        variant: 'destructive',
        title: 'PDF Generation Failed',
        description: 'An unexpected error occurred while creating the PDF.',
      });
    } finally {
      setLoading((prev) => ({ ...prev, pdf: false }));
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Column - Map */}
      <div className="lg:w-1/2 lg:min-h-[800px]">
        <MapView />
      </div>
      
      {/* Right Column - Form and Tabs */}
      <div className="lg:w-1/2">
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="evaluate">1. Evaluate Room</TabsTrigger>
                <TabsTrigger value="estimate" disabled={evaluatedImages.length === 0}>2. Estimate Value</TabsTrigger>
                <TabsTrigger value="similar" disabled={!estimationResult}>3. Find Comps</TabsTrigger>
                <TabsTrigger value="report" disabled={!similarProperties}>4. Generate Report</TabsTrigger>
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

                {evaluatedImages.length > 0 && !loading.evaluate && (
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
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <Label className="text-sm text-muted-foreground">Minimum</Label>
                        <Input
                          value={estimationResult.min_price}
                          onChange={(e) => setEstimationResult(prev => prev ? { ...prev, min_price: e.target.value } : null)}
                          className="mt-1 text-2xl font-bold text-center bg-transparent border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="text-center">
                        <Label className="text-sm text-primary">Median</Label>
                        <Input
                          value={estimationResult.median_price}
                          onChange={(e) => setEstimationResult(prev => prev ? { ...prev, median_price: e.target.value } : null)}
                          className="mt-1 text-3xl font-bold text-primary text-center bg-transparent border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
                      <div className="text-center">
                        <Label className="text-sm text-muted-foreground">Maximum</Label>
                        <Input
                          value={estimationResult.max_price}
                          onChange={(e) => setEstimationResult(prev => prev ? { ...prev, max_price: e.target.value } : null)}
                          className="mt-1 text-2xl font-bold text-center bg-transparent border-none shadow-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                      </div>
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
            <TabsContent value="report">
              <Card>
                <CardHeader>
                  <CardTitle>Generate Valuation Report</CardTitle>
                  <CardDescription>
                    Generate a comprehensive IVS-compliant valuation report based on all collected data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleGenerateReport} type="button" disabled={loading.report}>
                    {loading.report ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Generate Report
                  </Button>
                </CardContent>

                {loading.report && (
                  <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Generating your report...</p>
                  </CardContent>
                )}

                {report && (
                  <CardContent>
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                      <CardTitle className="text-xl">Valuation Report</CardTitle>
                      <Button onClick={handleDownloadPdf} type="button" disabled={loading.pdf}>
                          {loading.pdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                          Download PDF
                      </Button>
                    </div>
                    <div className="bg-secondary/30 p-4 rounded-md border">
                        <pre className="whitespace-pre-wrap font-body text-sm text-foreground">
                            {report}
                        </pre>
                    </div>
                  </CardContent>
                )}
              </Card>
            </TabsContent>
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}
