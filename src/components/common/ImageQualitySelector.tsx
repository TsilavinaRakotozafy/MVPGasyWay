import React, { useState } from "react"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Badge } from "../ui/badge"
import { ImageCompressionOptions } from "../../utils/imageCompression"

interface QualityPreset {
  id: string
  name: string
  description: string
  config: ImageCompressionOptions
  badge?: string
}

const QUALITY_PRESETS: QualityPreset[] = [
  {
    id: "ultra",
    name: "Ultra Haute Qualité",
    description: "Meilleure qualité possible (~800KB)",
    config: { maxWidth: 800, maxHeight: 800, quality: 0.98, maxSizeKB: 800 },
    badge: "Premium"
  },
  {
    id: "high", 
    name: "Haute Qualité",
    description: "Excellente qualité (~300KB)",
    config: { maxWidth: 600, maxHeight: 600, quality: 0.92, maxSizeKB: 300 },
    badge: "Recommandé"
  },
  {
    id: "standard",
    name: "Qualité Standard", 
    description: "Bon équilibre (~200KB)",
    config: { maxWidth: 400, maxHeight: 400, quality: 0.85, maxSizeKB: 200 }
  },
  {
    id: "optimized",
    name: "Optimisé Performance",
    description: "Rapide à charger (~100KB)",
    config: { maxWidth: 300, maxHeight: 300, quality: 0.75, maxSizeKB: 100 }
  }
]

interface ImageQualitySelectorProps {
  value?: string
  onChange: (preset: QualityPreset) => void
  className?: string
}

export function ImageQualitySelector({ 
  value = "high", 
  onChange,
  className = ""
}: ImageQualitySelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState(value)
  
  const handleChange = (presetId: string) => {
    setSelectedPreset(presetId)
    const preset = QUALITY_PRESETS.find(p => p.id === presetId)
    if (preset) {
      onChange(preset)
    }
  }

  const currentPreset = QUALITY_PRESETS.find(p => p.id === selectedPreset)

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label>Qualité d'image</Label>
        {currentPreset?.badge && (
          <Badge variant="secondary" className="text-xs">
            {currentPreset.badge}
          </Badge>
        )}
      </div>
      
      <Select value={selectedPreset} onValueChange={handleChange}>
        <SelectTrigger className="bg-input-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {QUALITY_PRESETS.map((preset) => (
            <SelectItem key={preset.id} value={preset.id}>
              <div className="flex flex-col items-start">
                <div className="flex items-center gap-2">
                  <span>{preset.name}</span>
                  {preset.badge && (
                    <Badge variant="outline" className="text-xs">
                      {preset.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground mt-1">
                  {preset.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {currentPreset && (
        <div className="text-muted-foreground space-y-1">
          <p>📐 Taille: {currentPreset.config.maxWidth}x{currentPreset.config.maxHeight}px</p>
          <p>🎨 Qualité: {Math.round((currentPreset.config.quality || 0.85) * 100)}%</p>
          <p>📦 Taille max: {currentPreset.config.maxSizeKB}KB</p>
        </div>
      )}
    </div>
  )
}

export { QUALITY_PRESETS }
export type { QualityPreset }