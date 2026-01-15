"use client";

import React, { useState, useCallback } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone, type FileRejection, type FileWithPath } from "react-dropzone";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Upload,
  Image as ImageIcon,
  Crop,
  Type,
  Wand2,
  Loader2,
  RefreshCw,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  buildTransformationUrl,
  uploadToImageKit,
  type ImageKitTransformation,
  type GravityValue,
} from "@/lib/imagekit";

// Form validation schema
const transformationSchema = z.object({
  aspectRatio: z.string(),
  customWidth: z.number().min(100).max(2000),
  customHeight: z.number().min(100).max(2000),
  smartCropFocus: z.string(),
  textOverlay: z.string().optional(),
  textFontSize: z.number().min(12).max(200),
  textColor: z.string(),
  textPosition: z.string(),
  backgroundRemoved: z.boolean(),
  dropShadow: z.boolean(),
});

type TransformationFormData = z.infer<typeof transformationSchema>;

type ImageKitUploadData = {
  url: string;
  fileId: string;
  name: string;
  width: number;
  height: number;
  size: number;
};

type ImageSelectData = {
  url: string;
  originalUrl?: string;
  fileId?: string;
  name?: string;
  width?: number;
  height?: number;
};

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (data: ImageSelectData) => void;
  title?: string;
}

type AspectRatio = {
  label: string;
  value: string;
  width?: number;
  height?: number;
};

const ASPECT_RATIOS: AspectRatio[] = [
  { label: "Original", value: "original" },
  { label: "Square (1:1)", value: "1:1", width: 400, height: 400 },
  { label: "Landscape (16:9)", value: "16:9", width: 800, height: 450 },
  { label: "Portrait (4:5)", value: "4:5", width: 400, height: 500 },
  { label: "Story (9:16)", value: "9:16", width: 450, height: 800 },
  { label: "Custom", value: "custom" },
];

const SMART_CROP_OPTIONS = [
  { label: "Auto", value: "auto" },
  { label: "Face", value: "face" },
  { label: "Center", value: "center" },
  { label: "Top", value: "top" },
  { label: "Bottom", value: "bottom" },
];

const TEXT_POSITIONS = [
  { label: "Center", value: "center" },
  { label: "Top Left", value: "north_west" },
  { label: "Top Right", value: "north_east" },
  { label: "Bottom Left", value: "south_west" },
  { label: "Bottom Right", value: "south_east" },
  { label: "top", value: "north" },
  { label: "bottom", value: "south" },
  { label: "left", value: "west" },
  { label: "right", value: "east" },
];

export default function ImageUploadModal({
  isOpen,
  onClose,
  onImageSelect,
  title = "Upload & Transform Image",
}: ImageUploadModalProps) {
  const [uploadedImage, setUploadedImage] = useState<ImageKitUploadData | null>(
    null
  );
  const [transformedImage, setTransformedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isTransforming, setIsTransforming] = useState<boolean>(false);
  const [isImageReady, setIsImageReady] = useState<boolean>(false);
  const [transformationError, setTransformationError] = useState<string | null>(null);
  const [hasAppliedTransformations, setHasAppliedTransformations] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"upload" | "transform">("upload");

  const form = useForm<TransformationFormData>({
    resolver: zodResolver(transformationSchema),
    defaultValues: {
      aspectRatio: "original",
      customWidth: 800,
      customHeight: 600,
      smartCropFocus: "auto",
      textOverlay: "",
      textFontSize: 50,
      textColor: "#ffffff",
      textPosition: "center",
      backgroundRemoved: false,
      dropShadow: false,
    },
  });

  const { watch, setValue, reset } = form;
  const watchedValues = watch();

  // Reset applied flag when transformation settings change
  React.useEffect(() => {
    if (hasAppliedTransformations) {
      // Reset the flag when user changes any transformation settings after applying
      setHasAppliedTransformations(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    watchedValues.backgroundRemoved,
    watchedValues.dropShadow,
    watchedValues.textOverlay,
    watchedValues.aspectRatio,
    watchedValues.customWidth,
    watchedValues.customHeight,
    watchedValues.smartCropFocus,
    watchedValues.textFontSize,
    watchedValues.textColor,
    watchedValues.textPosition,
  ]);

  // Handle file upload
  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileName = `post-image-${Date.now()}-${file.name}`;
      const result = await uploadToImageKit(file, fileName);

      if (result.success && result.data) {
        setUploadedImage(result.data);
        const imageUrl = result.data?.url;
        setTransformedImage(imageUrl ? imageUrl : null);
        setIsImageReady(true);
        setTransformationError(null);
        setHasAppliedTransformations(false);
        setActiveTab("transform");
        toast.success("Image uploaded successfully!");
      } else if (!result.success) {
        toast.error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp", ".gif"],
    },
    multiple: false,
  });

  // Apply transformations
  const applyTransformations = async () => {
    if (!uploadedImage || isTransforming) return;

    // Clear previous error and mark image as not ready
    setTransformationError(null);
    setIsImageReady(false);
    setIsTransforming(true);

    try {
      const transformationChain: ImageKitTransformation[] = [];

      // Aspect ratio and resizing
      if (watchedValues.aspectRatio !== "original") {
        const ratio = ASPECT_RATIOS.find(
          (r) => r.value === watchedValues.aspectRatio
        );
        if (ratio && ratio.width && ratio.height) {
          transformationChain.push({
            width: ratio.width,
            height: ratio.height,
            focus: watchedValues.smartCropFocus,
          });
        } else if (watchedValues.aspectRatio === "custom") {
          transformationChain.push({
            width: watchedValues.customWidth,
            height: watchedValues.customHeight,
            focus: watchedValues.smartCropFocus,
          });
        }
      }

      // Background removal
      if (watchedValues.backgroundRemoved) {
        transformationChain.push({ effect: "removedotbg" });
      }

      // Drop shadow (only works with transparent background)
      if (watchedValues.dropShadow && watchedValues.backgroundRemoved) {
        transformationChain.push({ effect: "dropshadow" });
      }

      // Text overlay
      if (watchedValues.textOverlay?.trim()) {
        transformationChain.push({
          overlayText: watchedValues.textOverlay,
          overlayTextFontSize: watchedValues.textFontSize,
          overlayTextColor: (watchedValues.textColor || "#ffffff").replace(
            "#",
            ""
          ),
          gravity: watchedValues.textPosition as GravityValue,
          overlayTextPadding: 10,
        });
      }

      // Apply transformations
      console.log("Transformation chain:", transformationChain);
      const transformedUrl = buildTransformationUrl(
        uploadedImage.url,
        transformationChain
      );
      console.log("Original URL:", uploadedImage.url);
      console.log("Transformed URL:", transformedUrl);

      // Preload the transformed image to ensure it's ready
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          // Image loaded successfully, wait a bit more for ImageKit processing
          setTimeout(() => {
            setTransformedImage(transformedUrl);
            setIsImageReady(true);
            setIsTransforming(false);
            setHasAppliedTransformations(true);
            setTransformationError(null);
            toast.success("Transformations applied!");
            resolve();
          }, 500);
        };
        img.onerror = () => {
          setIsTransforming(false);
          setIsImageReady(false);
          setHasAppliedTransformations(false);
          const errorMsg = "Failed to load transformed image. Please try again.";
          setTransformationError(errorMsg);
          toast.error(errorMsg);
          reject(new Error(errorMsg));
        };
        img.src = transformedUrl;
      });
    } catch (error) {
      console.error("Transformation error:", error);
      setIsTransforming(false);
      setIsImageReady(false);
      const errorMsg = error instanceof Error ? error.message : "Image transformation failed. Please try again.";
      setTransformationError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Check if any transformations are selected
  const hasActiveTransformations = () => {
    return !!(
      watchedValues.backgroundRemoved ||
      watchedValues.dropShadow ||
      watchedValues.textOverlay?.trim() ||
      watchedValues.aspectRatio !== "original"
    );
  };

  // Reset transformations
  const resetTransformations = () => {
    if (isTransforming) return; // Prevent reset during transformation
    reset();
    setTransformedImage(uploadedImage?.url || null);
    setIsImageReady(true);
    setTransformationError(null);
    setHasAppliedTransformations(false);
  };

  // Handle image selection
  const handleSelectImage = () => {
    if (transformedImage) {
      onImageSelect({
        url: transformedImage,
        originalUrl: uploadedImage?.url,
        fileId: uploadedImage?.fileId,
        name: uploadedImage?.name,
        width: uploadedImage?.width,
        height: uploadedImage?.height,
      });
      onClose();
      resetForm();
    }
  };

  // Reset form
  const resetForm = () => {
    setUploadedImage(null);
    setTransformedImage(null);
    setIsImageReady(false);
    setIsTransforming(false);
    setTransformationError(null);
    setHasAppliedTransformations(false);
    setActiveTab("upload");
    reset();
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-6xl !h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
          <DialogDescription>
            Upload an image and apply AI-powered transformations
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "upload" | "transform")
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 p-1 bg-[#0B0D10] rounded-xl border border-[#1F2228] h-auto">
            <TabsTrigger 
              value="upload"
              className="!text-[#EDEEF0] !font-medium data-[state=active]:!bg-gradient-to-b data-[state=active]:!from-[#F9FAFB] data-[state=active]:!to-[#D4D4D8] data-[state=active]:!text-[#0B0D10] data-[state=active]:!shadow-sm data-[state=active]:!font-semibold hover:!text-white hover:!bg-[#111318]/50 data-[state=active]:!border-transparent !border-transparent transition-all duration-200 py-2.5"
            >
              Upload
            </TabsTrigger>
            <TabsTrigger 
              value="transform"
              disabled={!uploadedImage}
              className="!text-[#EDEEF0] !font-medium data-[state=active]:!bg-gradient-to-b data-[state=active]:!from-[#F9FAFB] data-[state=active]:!to-[#D4D4D8] data-[state=active]:!text-[#0B0D10] data-[state=active]:!shadow-sm data-[state=active]:!font-semibold hover:!text-white hover:!bg-[#111318]/50 data-[state=active]:!border-transparent !border-transparent transition-all duration-200 py-2.5 disabled:!opacity-50 disabled:!cursor-not-allowed disabled:!text-[#6B7280]"
            >
              Transform
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-[#9CA3AF] bg-[#111318]/50"
                  : "border-[#1F2228] hover:border-[#9CA3AF]/50"
              }`}
            >
              <input {...getInputProps()} />

              {isUploading ? (
                <div className="space-y-4">
                  <Loader2 className="h-12 w-12 mx-auto animate-spin text-[#D1D5DB]" />
                  <p className="text-[#EDEEF0] font-medium">Uploading image...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="h-12 w-12 mx-auto text-[#9CA3AF]" />
                  <div>
                    <p className="text-lg text-[#EDEEF0] font-medium">
                      {isDragActive
                        ? "Drop the image here"
                        : "Drag & drop an image here"}
                    </p>
                    <p className="text-sm text-[#A1A1AA] mt-2">
                      or click to select a file (JPG, PNG, WebP, GIF - Max 10MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {uploadedImage && (
              <div className="text-center space-y-4">
                <Badge
                  variant="secondary"
                  className="bg-zinc-800/50 text-[#A1A1AA] border-zinc-700"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Image uploaded successfully!
                </Badge>
                <div className="text-sm text-slate-400">
                  {uploadedImage.width} × {uploadedImage.height} •{" "}
                  {Math.round(uploadedImage.size / 1024)}KB
                </div>
                <Button
                  onClick={() => setActiveTab("transform")}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Start Transforming
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="transform" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto">
              {/* Transformation Controls */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Wand2 className="h-5 w-5 mr-2" />
                    AI Transformations
                  </h3>

                  {/* Background Removal */}
                  <div className={`p-4 bg-[#111318] rounded-lg border border-[#1F2228] ${isTransforming ? "opacity-50 pointer-events-none" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[#EDEEF0] font-medium">
                        Remove Background
                      </Label>
                      <Button
                        type="button"
                        variant={
                          watchedValues.backgroundRemoved
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        disabled={isTransforming}
                        onClick={() =>
                          setValue(
                            "backgroundRemoved",
                            !watchedValues.backgroundRemoved
                          )
                        }
                      >
                        {watchedValues.backgroundRemoved ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-[#9CA3AF]">
                      AI-powered background removal
                    </p>
                  </div>

                  {/* Drop Shadow */}
                  <div className={`p-4 bg-[#111318] rounded-lg border border-[#1F2228] ${isTransforming ? "opacity-50 pointer-events-none" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-[#EDEEF0] font-medium">
                        Drop Shadow
                      </Label>
                      <Button
                        type="button"
                        variant={
                          watchedValues.dropShadow ? "default" : "outline"
                        }
                        size="sm"
                        disabled={isTransforming || !watchedValues.backgroundRemoved}
                        onClick={() =>
                          setValue("dropShadow", !watchedValues.dropShadow)
                        }
                      >
                        {watchedValues.dropShadow ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-[#9CA3AF]">
                      {watchedValues.backgroundRemoved
                        ? "Add realistic shadow"
                        : "Requires background removal"}
                    </p>
                  </div>
                </div>

                {/* Aspect Ratio & Cropping */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Crop className="h-5 w-5 mr-2" />
                    Resize & Crop
                  </h3>

                  <div className={`space-y-3 ${isTransforming ? "opacity-50 pointer-events-none" : ""}`}>
                    <Label className="text-[#EDEEF0]">Aspect Ratio</Label>
                    <Select
                      value={watchedValues.aspectRatio}
                      onValueChange={(value) => setValue("aspectRatio", value)}
                      disabled={isTransforming}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASPECT_RATIOS.map((ratio) => (
                          <SelectItem key={ratio.value} value={ratio.value}>
                            {ratio.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {watchedValues.aspectRatio === "custom" && (
                    <div className={`grid grid-cols-2 gap-3 ${isTransforming ? "opacity-50 pointer-events-none" : ""}`}>
                      <div>
                        <Label className="text-[#EDEEF0]">Width</Label>
                        <Input
                          type="number"
                          value={watchedValues.customWidth}
                          onChange={(e) =>
                            setValue(
                              "customWidth",
                              parseInt(e.target.value) || 800
                            )
                          }
                          min="100"
                          max="2000"
                          disabled={isTransforming}
                        />
                      </div>
                      <div>
                        <Label className="text-[#EDEEF0]">Height</Label>
                        <Input
                          type="number"
                          value={watchedValues.customHeight}
                          onChange={(e) =>
                            setValue(
                              "customHeight",
                              parseInt(e.target.value) || 600
                            )
                          }
                          min="100"
                          max="2000"
                          disabled={isTransforming}
                        />
                      </div>
                    </div>
                  )}

                  {watchedValues.aspectRatio !== "original" && (
                    <div className={`space-y-3 ${isTransforming ? "opacity-50 pointer-events-none" : ""}`}>
                      <Label className="text-[#EDEEF0]">Smart Crop Focus</Label>
                      <Select
                        value={watchedValues.smartCropFocus}
                        onValueChange={(value) =>
                          setValue("smartCropFocus", value)
                        }
                        disabled={isTransforming}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SMART_CROP_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Text Overlay */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center">
                    <Type className="h-5 w-5 mr-2" />
                    Text Overlay
                  </h3>

                  <div className={`space-y-3 ${isTransforming ? "opacity-50 pointer-events-none" : ""}`}>
                    <Label className="text-[#EDEEF0]">Text</Label>
                    <Textarea
                      value={watchedValues.textOverlay}
                      onChange={(e) => setValue("textOverlay", e.target.value)}
                      placeholder="Enter text to overlay..."
                      rows={3}
                      disabled={isTransforming}
                    />
                  </div>

                  {watchedValues.textOverlay && (
                    <div className={isTransforming ? "opacity-50 pointer-events-none" : ""}>
                      <div className="space-y-3">
                        <Label className="text-[#EDEEF0]">
                          Font Size: {watchedValues.textFontSize}px
                        </Label>
                        <Slider
                          value={[watchedValues.textFontSize || 50]}
                          onValueChange={(value) =>
                            setValue("textFontSize", value[0] ?? 50)
                          }
                          max={200}
                          min={12}
                          step={2}
                          className="w-full"
                          disabled={isTransforming}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div className="space-y-2">
                          <Label className="text-[#EDEEF0]">Text Color</Label>
                          <Input
                            type="color"
                            value={watchedValues.textColor}
                            onChange={(e) =>
                              setValue("textColor", e.target.value)
                            }
                            disabled={isTransforming}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[#EDEEF0]">Position</Label>
                          <Select
                            value={watchedValues.textPosition}
                            onValueChange={(value) =>
                              setValue("textPosition", value)
                            }
                            disabled={isTransforming}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TEXT_POSITIONS.map((position) => (
                                <SelectItem
                                  key={position.value}
                                  value={position.value}
                                >
                                  {position.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={applyTransformations}
                    disabled={isTransforming}
                    variant={"primary"}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTransforming ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4 mr-2" />
                    )}
                    Apply Transformations
                  </Button>

                  <Button 
                    onClick={resetTransformations} 
                    variant="outline"
                    disabled={isTransforming}
                    className="disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Image Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-[#EDEEF0] flex items-center">
                  <ImageIcon className="h-5 w-5 mr-2 text-[#9CA3AF]" />
                  Preview
                </h3>

                {/* Loading State - Show when transforming */}
                {isTransforming && (
                  <div className="bg-[#111318] rounded-lg p-12 border border-[#1F2228] flex flex-col items-center justify-center min-h-[300px]">
                    <Loader2 className="h-12 w-12 animate-spin text-[#9CA3AF] mb-4" />
                    <p className="text-[#EDEEF0] font-medium text-lg mb-2">
                      Image is transforming...
                    </p>
                    <p className="text-[#9CA3AF] text-sm">
                      This may take a few seconds
                    </p>
                  </div>
                )}

                {/* Error State */}
                {transformationError && !isTransforming && (
                  <div className="bg-[#111318] rounded-lg p-6 border border-[#1F2228]">
                    <div className="flex items-start space-x-3">
                      <X className="h-5 w-5 text-[#9CA3AF] mt-0.5" />
                      <div>
                        <p className="text-[#EDEEF0] font-medium mb-1">
                          Transformation Failed
                        </p>
                        <p className="text-[#9CA3AF] text-sm">
                          {transformationError}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Preview - Only show when ready and not transforming */}
                {transformedImage && !isTransforming && isImageReady && (
                  <div className="relative">
                    <div className="bg-[#111318] rounded-lg p-4 border border-[#1F2228]">
                      <img
                        src={transformedImage}
                        alt="Transformed preview"
                        className="w-full h-auto max-h-96 object-contain rounded-lg mx-auto"
                        onError={() => {
                          setIsImageReady(false);
                          const errorMsg = "Failed to load transformed image";
                          setTransformationError(errorMsg);
                          toast.error(errorMsg);
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Action Buttons - Only show when image is ready */}
                {uploadedImage && transformedImage && isImageReady && !isTransforming && (
                  <div className="text-center space-y-4">
                    {/* Show message if transformations are selected but not applied */}
                    {hasActiveTransformations() && !hasAppliedTransformations ? (
                      <div className="bg-[#111318] rounded-lg p-4 border border-[#1F2228] mb-4">
                        <p className="text-[#EDEEF0] font-medium mb-1">
                          Apply transformations first
                        </p>
                        <p className="text-sm text-[#9CA3AF]">
                          You have selected AI transformations. Please click "Apply Transformations" to see the result before using this image.
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-[#9CA3AF]">
                        Current image URL ready for use
                      </div>
                    )}

                    <div className="flex gap-3 justify-center">
                      <Button
                        onClick={handleSelectImage}
                        disabled={!!(isTransforming || (hasActiveTransformations() && !hasAppliedTransformations))}
                        className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Use This Image
                      </Button>

                      <Button
                        onClick={handleClose}
                        variant="outline"
                        className="border-[#1F2228] text-[#A1A1AA] hover:bg-[#16181D] hover:text-[#EDEEF0]"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}