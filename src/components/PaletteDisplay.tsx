import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";

export interface PaletteColor {
  color: string;
  hex: string;
  usage: string;
  reason: string;
}

export interface PaletteResult {
  palette: PaletteColor[];
}

interface PaletteDisplayProps {
  data: PaletteResult;
}

const PaletteDisplay: React.FC<PaletteDisplayProps> = ({ data }) => {
  return (
    <Card className="shadow-card border-border/60 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="w-5 h-5 text-primary" />
          Suggested Color Palette
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.palette.map((c, i) => (
          <div key={i} className="flex gap-4 p-4 rounded-lg bg-muted/30 border border-border/40">
            <div
              className="w-16 h-16 rounded-lg border border-border shadow-sm shrink-0"
              style={{ backgroundColor: c.hex }}
            />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display font-semibold text-foreground">{c.color}</span>
                <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {c.hex}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">Use on:</span> {c.usage}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground/80">Why:</span> {c.reason}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PaletteDisplay;
