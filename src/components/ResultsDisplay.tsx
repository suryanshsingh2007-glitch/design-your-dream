import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette, Sofa, Lightbulb, IndianRupee, CheckCircle2, AlertTriangle } from "lucide-react";

export interface DesignResult {
  room_type: string;
  color_palette: { color: string; hex: string }[];
  furniture: {
    item: string;
    estimated_price: string;
    placement: string;
    reason: string;
  }[];
  layout_tips: string[];
  budget_summary: {
    total_estimated_cost: string;
    budget_status: "within" | "exceeded";
    savings_tips: string[];
  };
}

interface ResultsDisplayProps {
  data: DesignResult;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ data }) => {
  const isWithinBudget = data.budget_summary.budget_status === "within";

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Color Palette */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Palette className="w-5 h-5 text-primary" />
            Color Palette
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {data.color_palette.map((c, i) => (
              <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
                <div
                  className="w-8 h-8 rounded-md border border-border shadow-sm"
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{c.color}</p>
                  <p className="text-xs text-muted-foreground font-mono">{c.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Furniture */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sofa className="w-5 h-5 text-primary" />
            Furniture Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.furniture.map((f, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/40">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-display font-semibold text-foreground">{f.item}</h4>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {f.estimated_price}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium text-foreground/80">Placement:</span> {f.placement}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground/80">Why:</span> {f.reason}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Layout Tips */}
      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-primary" />
            Layout Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.layout_tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Budget Summary */}
      <Card
        className={`shadow-card border ${
          isWithinBudget ? "border-accent/40 bg-accent/5" : "border-destructive/40 bg-destructive/5"
        }`}
      >
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <IndianRupee className="w-5 h-5 text-primary" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Estimated Total</span>
            <span className="font-display text-xl font-bold text-foreground">
              {data.budget_summary.total_estimated_cost}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isWithinBudget ? (
              <Badge className="bg-accent text-accent-foreground gap-1">
                <CheckCircle2 className="w-3 h-3" /> Within Budget
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="w-3 h-3" /> Budget Exceeded
              </Badge>
            )}
          </div>
          {data.budget_summary.savings_tips.length > 0 && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Savings Tips
              </p>
              <ul className="space-y-1">
                {data.budget_summary.savings_tips.map((tip, i) => (
                  <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                    <span className="text-accent">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ResultsDisplay;
