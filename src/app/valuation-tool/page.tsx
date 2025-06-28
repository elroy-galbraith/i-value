import { ValuationTool } from "@/components/valuation-form";
import { Wrench } from "lucide-react";

export default function ValuationToolPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <Wrench className="h-8 w-8" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Valuation Tool</h2>
          <p className="text-muted-foreground">
            Follow the steps to generate a property valuation report.
          </p>
        </div>
      </div>
      <ValuationTool />
    </div>
  );
}
