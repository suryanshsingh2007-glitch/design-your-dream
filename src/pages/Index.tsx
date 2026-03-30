import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Home, ScanEye, Palette, Sofa, LayoutPanelTop, ImageIcon } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import AnalysisDisplay, { type RoomAnalysis } from "@/components/AnalysisDisplay";
import ResultsDisplay, { type DesignResult } from "@/components/ResultsDisplay";
import PaletteDisplay, { type PaletteResult } from "@/components/PaletteDisplay";
import FurnitureDisplay, { type FurnitureResult } from "@/components/FurnitureDisplay";
import LayoutDisplay, { type LayoutResult } from "@/components/LayoutDisplay";
import RedesignDisplay from "@/components/RedesignDisplay";

const ROOM_TYPES = ["Living Room", "Bedroom", "Kitchen", "Bathroom", "Study", "Dining Room", "Balcony", "Hall"];
const STYLES = ["Modern", "Minimal", "Luxury", "Scandinavian", "Industrial", "Bohemian", "Traditional Indian", "Contemporary"];
const LIGHTING = ["Bright Natural Light", "Low Natural Light", "Mostly Artificial", "Mixed Lighting"];
const SIZES = ["Small (< 100 sq ft)", "Medium (100–200 sq ft)", "Large (200–400 sq ft)", "Very Large (400+ sq ft)"];
const PERSONAS = ["Student", "Bachelor", "Young Couple", "Family with Kids", "Senior Citizen", "Working Professional"];
const CLIMATES = ["Hot & Humid (Mumbai, Chennai)", "Hot & Dry (Delhi, Jaipur)", "Cold (Shimla, Darjeeling)", "Moderate (Bangalore, Pune)", "Coastal (Goa, Kochi)"];
const CITIES = ["Mumbai", "Delhi NCR", "Bangalore", "Chennai", "Hyderabad", "Pune", "Kolkata", "Ahmedabad", "Jaipur", "Lucknow", "Tier-2 City", "Tier-3 City"];

const Index = () => {
  const [roomType, setRoomType] = useState("");
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");
  const [objects, setObjects] = useState("");
  const [lighting, setLighting] = useState("");
  const [size, setSize] = useState("");
  const [persona, setPersona] = useState("");
  const [climate, setClimate] = useState("");
  const [city, setCity] = useState("");
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
  const [redesignLoading, setRedesignLoading] = useState(false);
  const [redesignImage, setRedesignImage] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState("");
  const { toast } = useToast();

  const profileContext = {
    persona: persona || undefined,
    climate: climate || undefined,
    city: city || undefined,
  };

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
          body: JSON.stringify({ room_type: roomType, style, budget, objects: objects || undefined, image_base64, ...profileContext }),
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
            ...profileContext,
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
          body: JSON.stringify({ room_type: roomType, style, budget, ...profileContext }),
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
            ...profileContext,
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

  const handleRedesign = async () => {
    if (!imageFile) {
      toast({ title: "No image", description: "Please upload a room photo to redesign.", variant: "destructive" });
      return;
    }
    if (!style) {
      toast({ title: "Missing style", description: "Please select a design style.", variant: "destructive" });
      return;
    }
    setRedesignLoading(true);
    setRedesignImage(null);
    try {
      const image_base64 = await fileToBase64(imageFile);
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redesign-room`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            image_base64,
            style,
            room_type: roomType || undefined,
            budget_range: budget || undefined,
            ...profileContext,
          }),
        }
      );
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Redesign failed");
      }
      const data = await resp.json();
      setRedesignImage(data.image_url);
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setRedesignLoading(false);
    }
  };


  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg gradient-warm shadow-sm">
              <Home className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display text-foreground">Nestora</h1>
              <p className="text-[11px] text-muted-foreground tracking-wide uppercase">Your Space, Reimagined</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Upload + Form */}
        <Card className="shadow-elevated border-border/40 animate-fade-in overflow-hidden">
          <CardContent className="p-0">
            {/* Image section */}
            <div className="p-5 sm:p-6 border-b border-border/40 bg-muted/20">
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
                  className="w-full mt-4 h-10 text-sm font-medium border-primary/25 hover:bg-primary/5"
                >
                  {analyzing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing image...</>
                  ) : (
                    <><ScanEye className="w-4 h-4" /> Detect Room Details</>
                  )}
                </Button>
              )}

              {analysis && <div className="mt-4"><AnalysisDisplay data={analysis} /></div>}
            </div>

            {/* Form fields */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Room basics */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Room Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Room Type</Label>
                    <Select value={roomType} onValueChange={setRoomType}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {ROOM_TYPES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Style</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select style" /></SelectTrigger>
                      <SelectContent>
                        {STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Budget (₹)</Label>
                    <Input className="h-10" type="number" placeholder="e.g. 50000" value={budget} onChange={(e) => setBudget(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Profile */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your Profile</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Who's it for?</Label>
                    <Select value={persona} onValueChange={setPersona}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select persona" /></SelectTrigger>
                      <SelectContent>
                        {PERSONAS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Climate</Label>
                    <Select value={climate} onValueChange={setClimate}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select climate" /></SelectTrigger>
                      <SelectContent>
                        {CLIMATES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">City</Label>
                    <Select value={city} onValueChange={setCity}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select city" /></SelectTrigger>
                      <SelectContent>
                        {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Optional */}
              <div className="space-y-1.5">
                <Label className="text-foreground text-sm">Existing Objects <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input className="h-10" placeholder="e.g. sofa, table, TV" value={objects} onChange={(e) => setObjects(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="design" className="animate-fade-in">
          <TabsList className="w-full grid grid-cols-5 h-11 bg-card shadow-card border border-border/40">
            <TabsTrigger value="design" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sparkles className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Design</span>
            </TabsTrigger>
            <TabsTrigger value="palette" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Palette className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Colors</span>
            </TabsTrigger>
            <TabsTrigger value="furniture" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Sofa className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Furniture</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LayoutPanelTop className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Layout</span>
            </TabsTrigger>
            <TabsTrigger value="redesign" className="gap-1.5 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ImageIcon className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Redesign</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="mt-5 space-y-4">
            <Button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="w-full h-12 text-sm font-semibold gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
              size="lg"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating recommendations...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Get Design Recommendations</>
              )}
            </Button>
            {result && <ResultsDisplay data={result} />}
          </TabsContent>

          <TabsContent value="palette" className="mt-5 space-y-4">
            <Card className="shadow-card border-border/40">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Lighting</Label>
                    <Select value={lighting} onValueChange={setLighting}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select lighting" /></SelectTrigger>
                      <SelectContent>
                        {LIGHTING.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-foreground text-sm">Room Size</Label>
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger className="h-10"><SelectValue placeholder="Select size" /></SelectTrigger>
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
              className="w-full h-12 text-sm font-semibold gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
              size="lg"
            >
              {paletteLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating palette...</>
              ) : (
                <><Palette className="w-4 h-4" /> Get Color Palette</>
              )}
            </Button>
            {paletteResult && <PaletteDisplay data={paletteResult} />}
          </TabsContent>

          <TabsContent value="furniture" className="mt-5 space-y-4">
            <Button
              onClick={handleGetFurniture}
              disabled={furnitureLoading}
              className="w-full h-12 text-sm font-semibold gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
              size="lg"
            >
              {furnitureLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Finding furniture...</>
              ) : (
                <><Sofa className="w-4 h-4" /> Get Furniture Suggestions</>
              )}
            </Button>
            {furnitureResult && <FurnitureDisplay data={furnitureResult} />}
          </TabsContent>

          <TabsContent value="layout" className="mt-5 space-y-4">
            <Card className="shadow-card border-border/40">
              <CardContent className="p-4">
                <div className="space-y-1.5">
                  <Label className="text-foreground text-sm">Room Dimensions <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input className="h-10" placeholder="e.g. 12ft × 10ft" value={dimensions} onChange={(e) => setDimensions(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <Button
              onClick={handleGetLayout}
              disabled={layoutLoading}
              className="w-full h-12 text-sm font-semibold gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
              size="lg"
            >
              {layoutLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Planning layout...</>
              ) : (
                <><LayoutPanelTop className="w-4 h-4" /> Get Placement Plan</>
              )}
            </Button>
            {layoutResult && <LayoutDisplay data={layoutResult} />}
          </TabsContent>

          <TabsContent value="redesign" className="mt-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload a room photo and select a style to generate a photorealistic redesign.
            </p>
            <Button
              onClick={handleRedesign}
              disabled={redesignLoading}
              className="w-full h-12 text-sm font-semibold gradient-warm border-0 text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
              size="lg"
            >
              {redesignLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Redesigning room...</>
              ) : (
                <><ImageIcon className="w-4 h-4" /> Redesign My Room</>
              )}
            </Button>
            {redesignImage && imagePreview && (
              <RedesignDisplay originalImage={imagePreview} redesignedImage={redesignImage} />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
