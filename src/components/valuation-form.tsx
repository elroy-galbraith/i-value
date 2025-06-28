"use client";

import { useSearchParams } from "next/navigation";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { Upload, Wrench } from "lucide-react";

const valuationSchema = z.object({
  address: z.string().min(1, "Address is required"),
  propertyType: z.string().min(1, "Property type is required"),
  bedrooms: z.coerce.number().int().min(0, "Bedrooms must be a positive number"),
  bathrooms: z.coerce.number().int().min(0, "Bathrooms must be a positive number"),
  images: z.any().optional(),
});

type ValuationFormValues = z.infer<typeof valuationSchema>;

// This wrapper is needed because useSearchParams can only be used in a Client Component,
// and we wrap it in Suspense on the page.
export function ValuationFormWrapper() {
  return <ValuationForm />;
}

function ValuationForm() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") || "";
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<ValuationFormValues>({
    resolver: zodResolver(valuationSchema),
    defaultValues: {
      address: "",
      propertyType: "",
      bedrooms: 0,
      bathrooms: 0,
    },
  });

  useEffect(() => {
    let initialAddress = address;
    if (!initialAddress && lat && lng) {
      initialAddress = `Latitude: ${lat}, Longitude: ${lng}`;
    }
    form.reset({ ...form.getValues(), address: initialAddress });
  }, [address, lat, lng, form]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const onSubmit: SubmitHandler<ValuationFormValues> = (data) => {
    console.log("Form submitted:", { ...data, images: selectedFiles });
    // Here you would typically handle the form submission, e.g., upload files and save data.
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Details</CardTitle>
        <CardDescription>
          Fill in the information below for the selected property.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Kingston, Jamaica" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FormField
                control={form.control}
                name="propertyType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="house">House</SelectItem>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="townhouse">Townhouse</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="land">Vacant Land</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bedrooms</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bathrooms</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 2" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Images</FormLabel>
                  <FormControl>
                     <div className="relative">
                        <Input id="image-upload" type="file" multiple onChange={handleFileChange} className="w-full h-full absolute inset-0 opacity-0 cursor-pointer" />
                        <label htmlFor="image-upload" className="flex items-center justify-center w-full h-32 border-2 border-dashed border-muted rounded-lg cursor-pointer hover:bg-muted/50">
                           <div className="text-center">
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                              <p className="mt-2 text-sm text-muted-foreground">Click to upload or drag and drop</p>
                           </div>
                        </label>
                     </div>
                  </FormControl>
                  <FormDescription>
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file(s) selected: ${selectedFiles.map(f => f.name).join(', ')}`
                      : "You can upload multiple images of the property."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit">
              <Wrench className="mr-2 h-4 w-4" />
              Start Valuation
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}