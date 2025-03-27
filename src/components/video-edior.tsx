"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Upload, Play, Pause, SkipBack, SkipForward, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import MediaItem from "@/components/media-item"

interface MediaElement {
  id: string
  type: "image" | "video"
  src: string
  width: number
  height: number
  x: number
  y: number
  startTime: number
  endTime: number
}

export default function VideoEditor() {
  const [mediaElements, setMediaElements] = useState<MediaElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(60) // Default 60 seconds timeline
  const fileInputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const selectedMedia = mediaElements.find((m) => m.id === selectedElement)

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    const isVideo = file.type.startsWith("video/")
    const isImage = file.type.startsWith("image/")

    if (!isVideo && !isImage) {
      alert("Please upload a valid image or video file")
      return
    }

    const url = URL.createObjectURL(file)

    // Create a new media element
    const newElement: MediaElement = {
      id: `media-${Date.now()}`,
      type: isVideo ? "video" : "image",
      src: url,
      width: 320,
      height: 240,
      x: 100,
      y: 100,
      startTime: 0,
      endTime: isVideo ? 30 : 10, // Default 10s for images, 30s for videos
    }

    setMediaElements((prev) => [...prev, newElement])
    setSelectedElement(newElement.id)

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Update media properties
  const updateMediaProperty = (id: string, property: keyof MediaElement, value: any) => {
    setMediaElements((prev) => prev.map((element) => (element.id === id ? { ...element, [property]: value } : element)))
  }

  // Handle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      setIsPlaying(false)
    } else {
      startPlaybackTimer()
    }
  }

  // Start playback timer (extracted to a separate function)
  const startPlaybackTimer = () => {
    timerRef.current = setInterval(() => {
      setCurrentTime((prev) => {
        const newTime = prev + 0.1
        if (newTime >= duration) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          setIsPlaying(false)
          return 0
        }
        return newTime
      })
    }, 100)
    setIsPlaying(true)
  }

  // Reset playback
  const resetPlayback = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setCurrentTime(0)
    setIsPlaying(false)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      // Cleanup object URLs
      mediaElements.forEach((element) => {
        URL.revokeObjectURL(element.src)
      })
    }
  }, [mediaElements])

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar */}
      <div className="w-72 border-r border-border bg-card p-4 flex flex-col">
        <h2 className="text-xl font-bold mb-4">Media Editor</h2>

        {/* Add Media Section */}
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2">Add Media</h3>
          <div
            className="border-2 border-dashed border-muted-foreground/20 rounded-lg p-6 text-center mb-4 hover:bg-accent/50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Upload a File</p>
            <p className="text-xs text-muted-foreground mt-1">Drag & drop or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Properties Section - Only shown when media is selected */}
        {selectedMedia && (
          <div className="flex-1 overflow-auto">
            <h3 className="text-md font-semibold mb-2">Properties</h3>
            <div className="space-y-4">
              {/* Dimensions */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={selectedMedia.width}
                    onChange={(e) => updateMediaProperty(selectedMedia.id, "width", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={selectedMedia.height}
                    onChange={(e) => updateMediaProperty(selectedMedia.id, "height", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Position */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="x-position">X Position</Label>
                  <Input
                    id="x-position"
                    type="number"
                    value={selectedMedia.x}
                    onChange={(e) => updateMediaProperty(selectedMedia.id, "x", Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label htmlFor="y-position">Y Position</Label>
                  <Input
                    id="y-position"
                    type="number"
                    value={selectedMedia.y}
                    onChange={(e) => updateMediaProperty(selectedMedia.id, "y", Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Timing */}
              <div>
                <Label htmlFor="start-time">Start Time (seconds)</Label>
                <Input
                  id="start-time"
                  type="number"
                  min="0"
                  max={selectedMedia.endTime}
                  step="0.1"
                  value={selectedMedia.startTime}
                  onChange={(e) => updateMediaProperty(selectedMedia.id, "startTime", Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="end-time">End Time (seconds)</Label>
                <Input
                  id="end-time"
                  type="number"
                  min={selectedMedia.startTime}
                  max={duration}
                  step="0.1"
                  value={selectedMedia.endTime}
                  onChange={(e) => updateMediaProperty(selectedMedia.id, "endTime", Number(e.target.value))}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Canvas */}
        <div className="flex-1 relative bg-black overflow-hidden">
          {mediaElements.map((element) => (
            <MediaItem
              key={element.id}
              element={element}
              isSelected={element.id === selectedElement}
              isVisible={currentTime >= element.startTime && currentTime <= element.endTime}
              onClick={() => setSelectedElement(element.id)}
              onDragEnd={(x, y) => {
                updateMediaProperty(element.id, "x", x)
                updateMediaProperty(element.id, "y", y)
              }}
              onResize={(width, height) => {
                updateMediaProperty(element.id, "width", width)
                updateMediaProperty(element.id, "height", height)
              }}
              currentTime={currentTime}
              isTimelinePlaying={isPlaying}
              // Add a prop to restart the timer if it's not running
              restartTimer={isPlaying ? undefined : startPlaybackTimer}
            />
          ))}
        </div>

        {/* Timeline Controls */}
        <div className="h-24 border-t border-border bg-card p-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={resetPlayback}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={togglePlayback}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentTime(duration)}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-sm font-mono">
              {currentTime.toFixed(1)}s / {duration.toFixed(1)}s
            </div>
            <Button variant="outline" size="icon">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>

          {/* Timeline Slider */}
          <div className="mt-4">
            <Slider
              value={[currentTime]}
              max={duration}
              step={0.1}
              onValueChange={(value) => {
                setCurrentTime(value[0])
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0s</span>
              <span>{(duration / 4).toFixed(0)}s</span>
              <span>{(duration / 2).toFixed(0)}s</span>
              <span>{((duration * 3) / 4).toFixed(0)}s</span>
              <span>{duration.toFixed(0)}s</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}