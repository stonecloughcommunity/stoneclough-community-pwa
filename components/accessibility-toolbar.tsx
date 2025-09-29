"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accessibility, Type, Eye, Contrast, MousePointer, Volume2, Settings, RotateCcw, Palette } from "lucide-react"

interface AccessibilitySettings {
  fontSize: number
  highContrast: boolean
  reducedMotion: boolean
  largeButtons: boolean
  screenReader: boolean
  colorTheme: "default" | "high-contrast" | "dark" | "yellow-black"
  cursorSize: number
  soundEnabled: boolean
}

export function AccessibilityToolbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 100,
    highContrast: false,
    reducedMotion: false,
    largeButtons: false,
    screenReader: false,
    colorTheme: "default",
    cursorSize: 100,
    soundEnabled: true,
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("accessibility-settings")
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        applySettings(parsed)
      } catch (error) {
        console.error("Error loading accessibility settings:", error)
      }
    }
  }, [])

  // Save settings to localStorage and apply them
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    localStorage.setItem("accessibility-settings", JSON.stringify(updatedSettings))
    applySettings(updatedSettings)
  }

  // Apply settings to the document
  const applySettings = (settings: AccessibilitySettings) => {
    const root = document.documentElement

    // Font size
    root.style.setProperty("--accessibility-font-scale", `${settings.fontSize / 100}`)

    // High contrast
    if (settings.highContrast) {
      root.classList.add("high-contrast")
    } else {
      root.classList.remove("high-contrast")
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add("reduced-motion")
    } else {
      root.classList.remove("reduced-motion")
    }

    // Large buttons
    if (settings.largeButtons) {
      root.classList.add("large-buttons")
    } else {
      root.classList.remove("large-buttons")
    }

    // Color theme
    root.setAttribute("data-accessibility-theme", settings.colorTheme)

    // Cursor size
    root.style.setProperty("--cursor-scale", `${settings.cursorSize / 100}`)

    // Screen reader announcements
    if (settings.screenReader) {
      root.classList.add("screen-reader-enabled")
    } else {
      root.classList.remove("screen-reader-enabled")
    }
  }

  const resetSettings = () => {
    const defaultSettings: AccessibilitySettings = {
      fontSize: 100,
      highContrast: false,
      reducedMotion: false,
      largeButtons: false,
      screenReader: false,
      colorTheme: "default",
      cursorSize: 100,
      soundEnabled: true,
    }
    updateSettings(defaultSettings)
  }

  const announceChange = (message: string) => {
    if (settings.screenReader) {
      const announcement = document.createElement("div")
      announcement.setAttribute("aria-live", "polite")
      announcement.setAttribute("aria-atomic", "true")
      announcement.className = "sr-only"
      announcement.textContent = message
      document.body.appendChild(announcement)
      setTimeout(() => document.body.removeChild(announcement), 1000)
    }
  }

  return (
    <>
      {/* Floating Accessibility Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              size="lg"
              className="rounded-full w-14 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg"
              aria-label="Open accessibility settings"
            >
              <Accessibility className="w-6 h-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end" side="top">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Accessibility className="w-5 h-5 mr-2" />
                    Accessibility
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetSettings}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Reset all accessibility settings"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Font Size */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Type className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium">Text Size: {settings.fontSize}%</Label>
                  </div>
                  <Slider
                    value={[settings.fontSize]}
                    onValueChange={([value]) => {
                      updateSettings({ fontSize: value })
                      announceChange(`Text size changed to ${value} percent`)
                    }}
                    min={75}
                    max={200}
                    step={25}
                    className="w-full"
                    aria-label="Adjust text size"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Small</span>
                    <span>Normal</span>
                    <span>Large</span>
                    <span>Extra Large</span>
                  </div>
                </div>

                {/* Color Theme */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium">Color Theme</Label>
                  </div>
                  <Select
                    value={settings.colorTheme}
                    onValueChange={(value: AccessibilitySettings["colorTheme"]) => {
                      updateSettings({ colorTheme: value })
                      announceChange(`Color theme changed to ${value}`)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="high-contrast">High Contrast</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="yellow-black">Yellow on Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Cursor Size */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <MousePointer className="w-4 h-4 text-blue-600" />
                    <Label className="text-sm font-medium">Cursor Size: {settings.cursorSize}%</Label>
                  </div>
                  <Slider
                    value={[settings.cursorSize]}
                    onValueChange={([value]) => {
                      updateSettings({ cursorSize: value })
                      announceChange(`Cursor size changed to ${value} percent`)
                    }}
                    min={100}
                    max={300}
                    step={50}
                    className="w-full"
                    aria-label="Adjust cursor size"
                  />
                </div>

                {/* Toggle Options */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Contrast className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="high-contrast" className="text-sm font-medium">
                        High Contrast
                      </Label>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => {
                        updateSettings({ highContrast: checked })
                        announceChange(`High contrast ${checked ? "enabled" : "disabled"}`)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="reduced-motion" className="text-sm font-medium">
                        Reduce Motion
                      </Label>
                    </div>
                    <Switch
                      id="reduced-motion"
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => {
                        updateSettings({ reducedMotion: checked })
                        announceChange(`Reduced motion ${checked ? "enabled" : "disabled"}`)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MousePointer className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="large-buttons" className="text-sm font-medium">
                        Large Buttons
                      </Label>
                    </div>
                    <Switch
                      id="large-buttons"
                      checked={settings.largeButtons}
                      onCheckedChange={(checked) => {
                        updateSettings({ largeButtons: checked })
                        announceChange(`Large buttons ${checked ? "enabled" : "disabled"}`)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="screen-reader" className="text-sm font-medium">
                        Screen Reader Support
                      </Label>
                    </div>
                    <Switch
                      id="screen-reader"
                      checked={settings.screenReader}
                      onCheckedChange={(checked) => {
                        updateSettings({ screenReader: checked })
                        announceChange(`Screen reader support ${checked ? "enabled" : "disabled"}`)
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Volume2 className="w-4 h-4 text-blue-600" />
                      <Label htmlFor="sound-enabled" className="text-sm font-medium">
                        Sound Feedback
                      </Label>
                    </div>
                    <Switch
                      id="sound-enabled"
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => {
                        updateSettings({ soundEnabled: checked })
                        announceChange(`Sound feedback ${checked ? "enabled" : "disabled"}`)
                      }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-500 text-center">
                    Settings are saved automatically and persist across sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>
      </div>

      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50 focus:z-50"
      >
        Skip to main content
      </a>
    </>
  )
}
