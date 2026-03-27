import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle, Layout, Armchair } from "lucide-react";

export interface RoomAnalysis {
  room_type: string;
  objects: string[];
  layout_description: string;
  current_style: string;
  problems: string[];
}

interface AnalysisDisplayProps {
  data: RoomAnalysis;
}

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ data }) => {
  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="shadow-soft border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="w-5 h-5 text-primary" />
            Room Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Room type & style */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-sm capitalize">
              {data.room_type}
            </Badge>
            <Badge variant="outline" className="text-sm capitalize">
              {data.current_style} style
            </Badge>
          </div>

          {/* Objects detected */}
          <div>
            <h4 className="text-sm font-medium text-foreground/80 mb-2 flex items-center gap-1.5">
              <Armchair className="w-4 h-4" /> Detected Objects
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {data.objects.map((obj, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal bg-muted/60">
                  {obj}
                </Badge>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div>
            <h4 className="text-sm font-medium text-foreground/80 mb-1.5 flex items-center gap-1.5">
              <Layout className="w-4 h-4" /> Layout
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.layout_description}
            </p>
          </div>

          {/* Problems */}
          {data.problems.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground/80 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-destructive" /> Issues Found
              </h4>
              <ul className="space-y-1.5">
                {data.problems.map((p, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                    {p}
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

export default AnalysisDisplay;
