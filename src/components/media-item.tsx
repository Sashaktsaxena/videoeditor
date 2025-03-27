"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

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

interface MediaItemProps {
  element: MediaElement
  isSelected: boolean
  isVisible: boolean
  onClick: () => void
  onDragEnd: (x: number, y: number) => void
  onResize: (width: number, height: number) => void
}

export default function MediaItem({ element, isSelected, isVisible, onClick, onDragEnd, onResize }: MediaItemProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [position, setPosition] = useState({ x: element.x, y: element.y })
  const [dimensions, setDimensions] = useState({ width: element.width, height: element.height })
  const elementRef = useRef<HTMLDivElement>(null)

  // Update position when element props change
  useEffect(() => {
    setPosition({ x: element.x, y: element.y })
    setDimensions({ width: element.width, height: element.height })
  }, [element.x, element.y, element.width, element.height])

  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (elementRef.current) {
      const rect = elementRef.current.getBoundingClientRect()
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }

    setIsDragging(true)
    onClick()
  }

  // Handle mouse down for resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    onClick()
  }

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x
        const newY = e.clientY - dragOffset.y
        setPosition({ x: newX, y: newY })
      } else if (isResizing) {
        if (elementRef.current) {
          const rect = elementRef.current.getBoundingClientRect()
          const newWidth = Math.max(50, e.clientX - rect.left)
          const newHeight = Math.max(50, e.clientY - rect.top)
          setDimensions({ width: newWidth, height: newHeight })
        }
      }
    }

    const handleMouseUp = () => {
      if (isDragging) {
        onDragEnd(position.x, position.y)
        setIsDragging(false)
      }
      if (isResizing) {
        onResize(dimensions.width, dimensions.height)
        setIsResizing(false)
      }
    }

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, isResizing, dragOffset, position, dimensions, onDragEnd, onResize])

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={elementRef}
      className={cn("absolute cursor-move", isSelected && "outline outline-2 outline-primary")}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        zIndex: isSelected ? 10 : 1,
      }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      {element.type === "image" ? (
        <img
          src={element.src || "/placeholder.svg"}
          alt="Media"
          className="w-full h-full object-cover"
          draggable={false}
        />
      ) : (
        <video src={element.src} className="w-full h-full object-cover" autoPlay={false} loop muted />
      )}

      {/* Resize handle */}
      {isSelected && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-primary cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  )
}

