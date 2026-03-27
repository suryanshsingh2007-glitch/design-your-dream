import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutPanelTop, MoveRight, Ruler } from "lucide-react";

export interface PlacementItem {
  item: string;
  position: string;
  direction: string;
  distance_from_other_items: string;
  reason: string;
}

export interface LayoutResult {
  placement_plan: PlacementItem[];
}

interface LayoutDisplayProps {
  data: LayoutResult;
}

const LayoutDisplay: React.FC<LayoutDisplayProps> = ({ data }) => {
  return (
    <Card className="shadow-card border-border/60 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <LayoutPanelTop className="w-5 h-5 text-primary" />
          Placement Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.placement_plan.map((p, i) => (
          <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/40 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-display font-semibold text-foreground">{p.item}</h4>
              <Badge variant="outline" className="text-xs font-normal">
                #{i + 1}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground/80">Position:</span> {p.position}
              </p>
              <p className="text-muted-foreground flex items-center gap-1">
                <MoveRight className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium text-foreground/80">Facing:</span> {p.direction}
              </p>
              <p className="text-muted-foreground flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium text-foreground/80">Spacing:</span> {p.distance_from_other_items}
              </p>
            </div>

            <p className="text-sm text-muted-foreground pt-1 border-t border-border/30">
              <span className="font-medium text-foreground/80">Why:</span> {p.reason}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LayoutDisplay;
