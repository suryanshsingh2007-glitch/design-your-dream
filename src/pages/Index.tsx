import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Home, ScanEye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import AnalysisDisplay, { type RoomAnalysis } from "@/components/AnalysisDisplay";
import ResultsDisplay, { type DesignResult } from "@/components/ResultsDisplay";

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Study", "Dining Room", "Balcony", "Hall"];
const STYLES = ["Modern", "Minimal", "Luxury", "Scandinavian", "Industrial", "Bohemian", "Traditional Indian", "Contemporary"];

const Index = () => {
  const [roomType, setRoomType] = useState("");
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [objects, setObjects] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [result, setResult] = useState<DesignResult | null>(null);
  const { toast } = useToast();

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleAnalyzeImage = async () => {
    if (!imageFile) {
      toast({ title: "No image", description: "Please upload a room photo first.", variant: "destructive" });
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);

    try {
      const image_base64 = await fileToBase64(imageFile);
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ image_base64 }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Image analysis failed");
      }

      const data: RoomAnalysis = await resp.json();
      setAnalysis(data);

      // Auto-fill form fields from analysis
      const matchedRoom = ROOM_TYPES.find(
        (r) => r.toLowerCase() === data.room_type.toLowerCase()
      );
      if (matchedRoom) setRoomType(matchedRoom);

      const matchedStyle = STYLES.find(
        (s) => data.current_style.toLowerCase().includes(s.toLowerCase())
      );
      if (matchedStyle) setStyle(matchedStyle);

      if (data.objects.length > 0) {
        setObjects(data.objects.join(", "));
      }

      toast({ title: "Analysis complete", description: "Room details detected and form auto-filled." });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGetRecommendations = async () => {
    if (!roomType || !style || !budget) {
      toast({ title: "Missing fields", description: "Please fill in room type, style, and budget.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      let image_base64: string | undefined;
      if (imageFile) {
        image_base64 = await fileToBase64(imageFile);
      }

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-room`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            room_type: roomType,
            style,
            budget,
            objects: objects || undefined,
            image_base64,
          }),
        }
      );

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Analysis failed");
      }

      const data: DesignResult = await resp.json();
      setResult(data);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="p-2 rounded-lg gradient-warm">
            <Home className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground tracking-tight">Interior AI</h1>
            <p className="text-xs text-muted-foreground">Smart design recommendations for your space</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Input Form */}
        <Card className="shadow-soft border-border/60 animate-fade-in">
          <CardContent className="p-6 space-y-6">
            <ImageUpload
              onImageSelect={(file, preview) => {
                setImageFile(file);
                setImagePreview(preview);
                setAnalysis(null);
              }}
              preview={imagePreview}
              onClear={() => {
                setImageFile(null);
                setImagePreview(null);
                setAnalysis(null);
              }}
            />

            {/* Analyze Image button */}
            {imageFile && !analysis && (
              <Button
                onClick={handleAnalyzeImage}
                disabled={analyzing}
                variant="outline"
                className="w-full h-11 text-sm font-medium border-primary/30 hover:bg-primary/5"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing image...
                  </>
                ) : (
                  <>
                    <ScanEye className="w-4 h-4" />
                    Analyze Image First
                  </>
                )}
              </Button>
            )}

            {/* Analysis results */}
            {analysis && <AnalysisDisplay data={analysis} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Room Type</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select room type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Design Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Budget (₹)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-foreground font-medium">Objects in Room</Label>
                <Input
                  placeholder="e.g. sofa, table, TV"
                  value={objects}
                  onChange={(e) => setObjects(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="w-full h-12 text-base font-medium gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Get Design Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && <ResultsDisplay data={result} />}
      </main>
    </div>
  );
};

export default Index;
