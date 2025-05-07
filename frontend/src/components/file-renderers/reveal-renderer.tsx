"use client";

import React, { useState } from "react";
import { CodeRenderer } from "./code-renderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Monitor, Code, ExternalLink, Maximize, SkipBack, SkipForward } from "lucide-react";

interface RevealRendererProps {
  content: string;
  previewUrl: string;
  className?: string;
}

export function RevealRenderer({ content, previewUrl, className }: RevealRendererProps) {
  // Default to 'presentation' mode
  const [viewMode, setViewMode] = useState<'presentation' | 'code'>('presentation');
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  // Functions to control the presentation
  const nextSlide = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage('next', '*');
    }
  };

  const prevSlide = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage('prev', '*');
    }
  };

  const fullScreen = () => {
    iframeRef.current?.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  };

  // Set up message listener for iframe communication
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Handle any messages from the Reveal.js presentation
      if (event.data && event.data.type === 'reveal') {
        console.log('Received message from Reveal.js:', event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className={cn("w-full h-full flex flex-col", className)}>
      {/* Content area */}
      <div className="flex-1 min-h-0 relative">
        {/* View mode toggle and controls */}
        <div className="absolute left-2 top-2 z-10 flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90",
              viewMode === 'presentation' && "bg-background/90"
            )}
            onClick={() => setViewMode('presentation')}
          >
            <Monitor className="h-4 w-4" />
            Presentation
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90",
              viewMode === 'code' && "bg-background/90"
            )}
            onClick={() => setViewMode('code')}
          >
            <Code className="h-4 w-4" />
            Code
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
            onClick={() => window.open(previewUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            Open
          </Button>
        </div>

        {/* Presentation controls */}
        {viewMode === 'presentation' && (
          <div className="absolute right-2 top-2 z-10 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={prevSlide}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={nextSlide}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90"
              onClick={fullScreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        )}

        {viewMode === 'presentation' ? (
          <div className="absolute inset-0">
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Reveal.js Presentation"
              className="w-full h-full border-0"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              allow="fullscreen"
            />
          </div>
        ) : (
          <div className="absolute inset-0">
            <CodeRenderer
              content={content}
              language="html"
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
