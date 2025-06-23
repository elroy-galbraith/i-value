import { ComparablesTool } from "@/components/comparables-tool";
import { BrainCircuit } from "lucide-react";

export default function ComparablesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center gap-4">
        <BrainCircuit className="h-8 w-8" />
        <div>
          <h2 className="text-3xl font-bold tracking-tight">AI Comparable Selection</h2>
          <p className="text-muted-foreground">
            Use our AI-powered tool to find and score comparable properties based on explainability.
          </p>
        </div>
      </div>
      <ComparablesTool />
    </div>
  );
}
