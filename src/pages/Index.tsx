import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Home, ScanEye, Palette, Sofa, LayoutPanelTop } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import AnalysisDisplay, { type RoomAnalysis } from "@/components/AnalysisDisplay";
import ResultsDisplay, { type DesignResult } from "@/components/ResultsDisplay";
import PaletteDisplay, { type PaletteResult } from "@/components/PaletteDisplay";
import FurnitureDisplay, { type FurnitureResult } from "@/components/FurnitureDisplay";
import LayoutDisplay, { type LayoutResult } from "@/components/LayoutDisplay";

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Study", "Dining Room", "Balcony", "Hall"];
const STYLES = ["Modern", "Minimal", "Luxury", "Scandinavian", "Industrial", "Bohemian", "Traditional Indian", "Contemporary"];
const LIGHTING = ["Bright Natural Light", "Low Natural Light", "Mostly Artificial", "Mixed Lighting"];
const SIZES = ["Small (< 100 sq ft)", "Medium (100–200 sq ft)", "Large (200–400 sq ft)", "Very Large (400+ sq ft)"];

const Index = () => {
  const [roomType, setRoomType] = useState("");
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [objects, setObjects] = useState("");
  const [lighting, setLighting] = useState("");
  const [size, setSize] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paletteLoading, setPaletteLoading] = useState(false);
  const [furnitureLoading, setFurnitureLoading] = useState(false);
  const [layoutLoading, setLayoutLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RoomAnalysis | null>(null);
  const [result, setResult] = useState<DesignResult | null>(null);
  const [paletteResult, setPaletteResult] = useState<PaletteResult | null>(null);
  const [furnitureResult, setFurnitureResult] = useState<FurnitureResult | null>(null);
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null);
  const [dimensions, setDimensions] = useState("");
  const { toast } = useToast();

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
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
      const matchedRoom = ROOM_TYPES.find((r) => r.toLowerCase() === data.room_type.toLowerCase());
      if (matchedRoom) setRoomType(matchedRoom);
      const matchedStyle = STYLES.find((s) => data.current_style.toLowerCase().includes(s.toLowerCase()));
      if (matchedStyle) setStyle(matchedStyle);
      if (data.objects.length > 0) setObjects(data.objects.join(", "));
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
      if (imageFile) image_base64 = await fileToBase64(imageFile);
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-room`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ room_type: roomType, style, budget, objects: objects || undefined, image_base64 }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Analysis failed");
      }
      setResult(await resp.json());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGetPalette = async () => {
    if (!roomType || !style) {
      toast({ title: "Missing fields", description: "Please select room type and style.", variant: "destructive" });
      return;
    }
    setPaletteLoading(true);
    setPaletteResult(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-palette`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            room_type: roomType,
            style,
            budget: budget || undefined,
            lighting: lighting || undefined,
            size: size || undefined,
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Palette suggestion failed");
      }
      setPaletteResult(await resp.json());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setPaletteLoading(false);
    }
  };

  const handleGetFurniture = async () => {
    if (!roomType || !style || !budget) {
      toast({ title: "Missing fields", description: "Please fill in room type, style, and budget.", variant: "destructive" });
      return;
    }
    setFurnitureLoading(true);
    setFurnitureResult(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/suggest-furniture`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ room_type: roomType, style, budget }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Furniture suggestion failed");
      }
      setFurnitureResult(await resp.json());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setFurnitureLoading(false);
    }
  };

  const handleGetLayout = async () => {
    if (!roomType) {
      toast({ title: "Missing fields", description: "Please select a room type.", variant: "destructive" });
      return;
    }
    setLayoutLoading(true);
    setLayoutResult(null);
    try {
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/plan-layout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            room_type: roomType,
            objects: objects || undefined,
            dimensions: dimensions || undefined,
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Layout planning failed");
      }
      setLayoutResult(await resp.json());
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setLayoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-subtle">
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
        {/* Image Upload (shared) */}
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

            {imageFile && !analysis && (
              <Button
                onClick={handleAnalyzeImage}
                disabled={analyzing}
                variant="outline"
                className="w-full h-11 text-sm font-medium border-primary/30 hover:bg-primary/5"
              >
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing image...</>
                ) : (
                  <><ScanEye className="w-4 h-4" /> Analyze Image First</>
                )}
              </Button>
            )}

            {analysis && <AnalysisDisplay data={analysis} />}

            {/* Shared inputs: room type, style, budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Room Type</Label>
                <Select value={roomType} onValueChange={setRoomType}>
                  <SelectTrigger><SelectValue placeholder="Select room type" /></SelectTrigger>
                  <SelectContent>
                    {ROOM_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Design Style</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger><SelectValue placeholder="Select style" /></SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Budget (₹)</Label>
                <Input type="number" placeholder="e.g. 50000" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Objects in Room</Label>
                <Input placeholder="e.g. sofa, table, TV" value={objects} onChange={(e) => setObjects(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Design vs Palette */}
        <Tabs defaultValue="design" className="animate-fade-in">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="design" className="gap-1.5 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">Full</span> Design
            </TabsTrigger>
            <TabsTrigger value="palette" className="gap-1.5 text-xs sm:text-sm">
              <Palette className="w-4 h-4" /> Colors
            </TabsTrigger>
            <TabsTrigger value="furniture" className="gap-1.5 text-xs sm:text-sm">
              <Sofa className="w-4 h-4" /> Furniture
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-1.5 text-xs sm:text-sm">
              <LayoutPanelTop className="w-4 h-4" /> Layout
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="mt-4 space-y-6">
            <Button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="w-full h-12 text-base font-medium gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating recommendations...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Get Design Recommendations</>
              )}
            </Button>
            {result && <ResultsDisplay data={result} />}
          </TabsContent>

          <TabsContent value="palette" className="mt-4 space-y-4">
            {/* Extra palette inputs */}
            <Card className="shadow-soft border-border/60">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Lighting Condition</Label>
                    <Select value={lighting} onValueChange={setLighting}>
                      <SelectTrigger><SelectValue placeholder="Select lighting" /></SelectTrigger>
                      <SelectContent>
                        {LIGHTING.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground font-medium">Room Size</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent>
                        {SIZES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGetPalette}
              disabled={paletteLoading}
              className="w-full h-12 text-base font-medium gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity"
              size="lg"
            >
              {paletteLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating palette...</>
              ) : (
                <><Palette className="w-5 h-5" /> Get Color Palette</>
              )}
            </Button>
            {paletteResult && <PaletteDisplay data={paletteResult} />}
          </TabsContent>

          <TabsContent value="furniture" className="mt-4 space-y-4">
            <Button
              onClick={handleGetFurniture}
              disabled={furnitureLoading}
              className="w-full h-12 text-base font-medium gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity"
              size="lg"
            >
              {furnitureLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Finding furniture...</>
              ) : (
                <><Sofa className="w-5 h-5" /> Get Furniture Suggestions</>
              )}
            </Button>
            {furnitureResult && <FurnitureDisplay data={furnitureResult} />}
          </TabsContent>

          <TabsContent value="layout" className="mt-4 space-y-4">
            <Card className="shadow-soft border-border/60">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">Room Dimensions (optional)</Label>
                  <Input
                    placeholder="e.g. 12ft × 10ft"
                    value={dimensions}
                    onChange={(e) => setDimensions(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleGetLayout}
              disabled={layoutLoading}
              className="w-full h-12 text-base font-medium gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity"
              size="lg"
            >
              {layoutLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Planning layout...</>
              ) : (
                <><LayoutPanelTop className="w-5 h-5" /> Get Placement Plan</>
              )}
            </Button>
            {layoutResult && <LayoutDisplay data={layoutResult} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
