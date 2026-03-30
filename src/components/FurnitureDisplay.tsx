import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sofa, ArrowRightLeft, ExternalLink } from "lucide-react";

export interface FurnitureItem {
  item: string;
  price_range: string;
  priority: "high" | "medium" | "low";
  placement: string;
  alternatives: string[];
}

export interface FurnitureResult {
  furniture: FurnitureItem[];
}

interface FurnitureDisplayProps {
  data: FurnitureResult;
}

const priorityColors: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-accent/10 text-accent-foreground border-accent/30",
  low: "bg-muted text-muted-foreground border-border",
};

const shopLinks = (item: string) => [
  { label: "Amazon", url: `https://www.amazon.in/s?k=${encodeURIComponent(item + " furniture")}` },
  { label: "Flipkart", url: `https://www.flipkart.com/search?q=${encodeURIComponent(item + " furniture")}` },
  
];

const FurnitureDisplay: React.FC<FurnitureDisplayProps> = ({ data }) => {
  const sorted = [...data.furniture].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <Card className="shadow-card border-border/60 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sofa className="w-5 h-5 text-primary" />
          Furniture Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sorted.map((f, i) => (
          <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-2">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <h4 className="font-display font-semibold text-foreground">{f.item}</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">
                  {f.price_range}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${priorityColors[f.priority]}`}
                >
                  {f.priority}
                </Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">Placement:</span> {f.placement}
            </p>

            {f.alternatives.length > 0 && (
              <div className="flex items-start gap-2 pt-1">
                <ArrowRightLeft className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Alternatives:</span>{" "}
                  {f.alternatives.join(" · ")}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-1">
              <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
              {shopLinks(f.item).map((link, idx) => (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default FurnitureDisplay;
