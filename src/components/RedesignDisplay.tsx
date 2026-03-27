import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, ArrowRight } from "lucide-react";

interface RedesignDisplayProps {
  originalImage: string;
  redesignedImage: string;
  description?: string;
}

const RedesignDisplay: React.FC<RedesignDisplayProps> = ({
  originalImage,
  redesignedImage,
  description,
}) => {
  const [showOriginal, setShowOriginal] = useState(false);

  return (
    <Card className="shadow-card border-border/60 animate-slide-up overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="w-5 h-5 text-primary" />
          Room Redesign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Before / After toggle */}
        <div className="flex items-center gap-2">
          <Badge
            variant={showOriginal ? "secondary" : "default"}
            className="cursor-pointer select-none"
            onClick={() => setShowOriginal(false)}
          >
            Redesigned
          </Badge>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
          <Badge
            variant={showOriginal ? "default" : "secondary"}
            className="cursor-pointer select-none"
            onClick={() => setShowOriginal(true)}
          >
            Original
          </Badge>
        </div>

        <div className="relative rounded-lg overflow-hidden shadow-card">
          <img
            src={showOriginal ? originalImage : redesignedImage}
            alt={showOriginal ? "Original room" : "Redesigned room"}
            className="w-full h-auto max-h-[500px] object-contain bg-muted/30 transition-opacity duration-300"
          />
        </div>

        {/* Side by side on larger screens */}
        <div className="hidden sm:grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Before</p>
            <div className="rounded-lg overflow-hidden border border-border/40">
              <img src={originalImage} alt="Original" className="w-full h-48 object-cover" />
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">After</p>
            <div className="rounded-lg overflow-hidden border border-primary/30">
              <img src={redesignedImage} alt="Redesigned" className="w-full h-48 object-cover" />
            </div>
          </div>
        </div>

        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/30">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RedesignDisplay;
