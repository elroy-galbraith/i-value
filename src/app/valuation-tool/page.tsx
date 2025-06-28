import { ValuationFormWrapper } from "@/components/valuation-form";
import { Wrench } from "lucide-react";
import React from "react";

export default function ValuationToolPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Wrench className="h-8 w-8" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Valuation Tool</h2>
          <p className="text-muted-foreground">
            Enter property details to begin valuation.
          </p>
        </div>
      </div>
      <React.Suspense fallback={<div>Loading form...</div>}>
        <ValuationFormWrapper />
      </React.Suspense>
    </div>
  );
}