"use client";

import { SectionWrapper } from "../section-wrapper";
import "./download.css";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useSettings } from '@/app/contexts/settings-context';
import { getProxiedImageUrl } from '@/lib/proxy';

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox";

import { DownloadIcon, MoveUpRight, InfoIcon, SlidersVertical, Loader, Eye, ThumbsUp, DotIcon } from "lucide-react";

interface DownloadProps {
  active?: boolean;
}

interface VideoDetails {
  title: string;
  description: string;
  channelTitle: string;
  channelUrl: string;
  thumbnail: string;
  viewCount: number;
  likeCount: number;
  duration: number;
  publishedAt: string;
  formats: Array<{
    format_id: string;
    height?: number;
    quality: string;
    ext: string;
    format_note?: string;
    vcodec?: string;
    acodec?: string;
    abr?: number;
  }>;
}

export function Download({ active }: DownloadProps) {
  const { settings, updateSettings } = useSettings();
  const [isLoading, setIsLoading] = useState(false);
  const { resolvedTheme } = useTheme(); // Add this line

  // Set default background color based on theme
  const defaultBgColor = resolvedTheme === "light" ? "#e2e2e2" : "#1f1f1f";
  const [avgColor, setAvgColor] = useState(defaultBgColor);


  const [videoUrl, setVideoUrl] = useState("");
  const [downloadButtonActive, setDownloadButtonActive] = useState(false);
  const [downloadButtonLoading, setDownloadButtonLoading] = useState(false);
  const [infoButtonActive, setInfoButtonActive] = useState(false);
  const [videoTitle, setVideoTitle] = useState("Video Title");
  const [videoDescription, setVideoDescription] = useState("lorem ipsum dolor sit amet consectetur...");
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "loading" | "ready" | "downloading" | "complete">("idle");
  const [downloadedPath, setDownloadedPath] = useState<string | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string | null>(null);

  // Get preferences from settings
  const typePreference = settings.main?.type || 'mp3';
  const previewPreference = settings.main?.preview || 'image';

  // Update handlers
  const handleTypeChange = (value: string) => {
    updateSettings('main', {
      ...settings.main,
      type: value
    });
  };

  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Track the latest request
  const requestIdRef = useRef(0);

  // Update avgColor when theme changes and no image is loaded
  useEffect(() => {
    if (!imageLoaded) {
      setAvgColor(resolvedTheme === "light" ? "#e2e2e2" : "#1f1f1f");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedTheme]);

  // Helper to check if a string is a valid YouTube video or playlist URL
  function isValidYouTubeUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      if (
        parsed.hostname === "www.youtube.com" ||
        parsed.hostname === "youtube.com" ||
        parsed.hostname === "m.youtube.com"
      ) {
        // Must have a video id
        if (parsed.pathname === "/watch" && parsed.searchParams.has("v")) {
          return true;
        }
        // Playlist only (optional: allow /playlist?list=...)
        if (parsed.pathname === "/playlist" && parsed.searchParams.has("list")) {
          return true;
        }
        // Video with playlist
        if (parsed.pathname === "/watch" && parsed.searchParams.has("v") && parsed.searchParams.has("list")) {
          return true;
        }
      }
      // youtu.be short links
      if (
        parsed.hostname === "youtu.be" &&
        parsed.pathname.length > 1
      ) {
        return true;
      }
    } catch {
      // Not a valid URL
      return false;
    }
    return false;
  }

  // Helper to clean a YouTube URL to only include the video id (?v=)
  function cleanYouTubeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      if (
        (parsed.hostname === "www.youtube.com" ||
          parsed.hostname === "youtube.com" ||
          parsed.hostname === "m.youtube.com") &&
        parsed.pathname === "/watch" &&
        parsed.searchParams.has("v")
      ) {
        // Only keep the v param
        const clean = new URL("https://www.youtube.com/watch");
        clean.searchParams.set("v", parsed.searchParams.get("v")!);
        return clean.toString();
      }
      // youtu.be short links: leave as is
      if (parsed.hostname === "youtu.be" && parsed.pathname.length > 1) {
        return url;
      }
      // Otherwise, return original
      return url;
    } catch {
      return url;
    }
  }

  const handleURLChange = (url: string) => {
    setVideoUrl(url);
    setImageLoaded(false);
    setDownloadStatus(url ? "loading" : "idle");
    setSelectedFormatId(null); // Reset selected format when URL changes

    if (url && isValidYouTubeUrl(url)) {
      // Clean the URL to remove playlist/list params
      const cleanedUrl = cleanYouTubeUrl(url);

      setIsLoading(true);
      setDownloadButtonLoading(true); // <--- Add this line
      setAvgColor(defaultBgColor);
      setDownloadButtonActive(false);
      setInfoButtonActive(false);

      setVideoTitle("Loading...");
      setVideoDescription("Loading video details...");

      requestIdRef.current += 1;
      const thisRequestId = requestIdRef.current;

      if (typeof window !== 'undefined') {
        window.api.send("videoInfo", cleanedUrl, thisRequestId);
      }
    } else {
      setDownloadButtonActive(false);
      setInfoButtonActive(false);
      setVideoDetails(null);
      setVideoTitle("Video Title");
      setVideoDescription("");
      setAvgColor(defaultBgColor); // <-- Reset color immediately
      setIsLoading(false);
      setDownloadButtonLoading(false); // <--- Add this line
      setImageLoaded(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const errorHandler = (error: string, responseRequestId?: number) => {
        // Only handle error if it's for the latest request
        if (responseRequestId !== undefined && responseRequestId !== requestIdRef.current) return;
        setVideoDetails(null);
        setDownloadButtonActive(false);
        setInfoButtonActive(false);
        setIsLoading(false);
        setDownloadButtonLoading(false); // <--- Add this line
        setImageLoaded(false);
        toast.error(error);
      };

      const responseHandler = (details: VideoDetails, responseRequestId?: number) => {
        // Only handle response if it's for the latest request
        if (responseRequestId !== undefined && responseRequestId !== requestIdRef.current) return;
        if (!videoUrl) {
          setVideoDetails(null);
          setDownloadButtonActive(false);
          setInfoButtonActive(false);
          setIsLoading(false);
          setDownloadButtonLoading(false); // <--- Add this line
          setImageLoaded(false);
          return;
        }
        if (details && details.title) {
          console.log('=== FRONTEND FORMAT DEBUG ===');
          console.log('Received video details:', details);
          console.log(`Total formats received: ${details.formats ? details.formats.length : 0}`);
          
          if (details.formats) {
            console.log('All formats:');
            details.formats.forEach((f, i) => {
              console.log(`  ${i + 1}. ${f.quality} - ID: ${f.format_id} - Height: ${f.height} - Ext: ${f.ext} - VCodec: ${f.vcodec} - Note: "${f.format_note}"`);
            });
            
            const videoFormats = details.formats.filter(f => f.height && f.vcodec);
            console.log(`Video formats (filtered): ${videoFormats.length}`);
            videoFormats.forEach((f, i) => {
              console.log(`  Video ${i + 1}. ${f.quality} - ID: ${f.format_id} - Height: ${f.height}`);
            });
            
            // Check for duplicates by height
            const heightCounts: Record<number, number> = {};
            videoFormats.forEach(f => {
              if (f.height) {
                heightCounts[f.height] = (heightCounts[f.height] || 0) + 1;
              }
            });
            console.log('Height counts:', heightCounts);
            const duplicateHeights = Object.entries(heightCounts).filter(([height, count]) => (count as number) > 1);
            if (duplicateHeights.length > 0) {
              console.log('🚨 DUPLICATE HEIGHTS DETECTED:', duplicateHeights);
            } else {
              console.log('✅ No duplicate heights found');
            }
          }
          console.log('=== END FRONTEND FORMAT DEBUG ===\n');
          
          setVideoDetails(details);
          setDownloadStatus("ready");
          setVideoTitle(details.title || "Video Title");
          setVideoDescription(details.description || "No description available");
          setIsLoading(false);
          setDownloadButtonLoading(false); // <--- Add this line
          setDownloadButtonActive(true);
          setInfoButtonActive(true);
          
          // Set default format based on type preference
          if (details.formats && details.formats.length > 0) {
            if (typePreference === 'mp3') {
              // For MP3, we don't need to select a specific format, yt-dlp will handle it
              setSelectedFormatId(null);
            } else {
              // For video, find a good quality format (720p if available, otherwise highest)
              const videoFormats = details.formats.filter(f => f.height && f.vcodec);
              if (videoFormats.length > 0) {
                const preferred720p = videoFormats.find(f => f.height === 720);
                setSelectedFormatId(preferred720p ? preferred720p.format_id : videoFormats[0].format_id);
              }
            }
          }
        } else {
          setDownloadStatus("idle");
          setVideoDetails(null);
          setDownloadButtonActive(false);
          setInfoButtonActive(false);
          setIsLoading(false);
          setDownloadButtonLoading(false); // <--- Add this line
          setImageLoaded(false);
          toast.error("Invalid video data received");
        }
      };

      window.api.receive("videoInfoError", errorHandler);
      window.api.receive("videoInfoResponse", responseHandler);

      return () => {
        if (window.api.removeListener) {
          window.api.removeListener("videoInfoError", errorHandler);
          window.api.removeListener("videoInfoResponse", responseHandler);
        }
      };
    }
  }, [videoUrl]);

  const getAverageColor = (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return "#1f1f1f";

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0, g = 0, b = 0;

    for (let i = 0; i < data.length; i += 4) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
    }

    const pixelCount = data.length / 4;
    r = Math.floor(r / pixelCount);
    g = Math.floor(g / pixelCount);
    b = Math.floor(b / pixelCount);

    return `rgb(${r}, ${g}, ${b})`;
  };

  // Update handleImageLoad to check videoUrl before setting state
  const handleImageLoad = async (url: string, requestId: number) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = getProxiedImageUrl(url);

      img.onload = () => {
        // Only set color if this is the latest request and videoUrl is not empty
        if (requestIdRef.current !== requestId || !videoUrl) return;
        const avgColor = getAverageColor(img);
        setAvgColor(avgColor);
        setImageLoaded(true);
      };
    } catch (error) {
      setImageLoaded(false);
    }
  };

  // Update the response handler to check videoUrl before updating state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const responseHandler = (details: VideoDetails, responseRequestId?: number) => {
        // Only handle response if it's for the latest request and videoUrl is not empty
        if (responseRequestId !== requestIdRef.current || !videoUrl) return;
        if (details && details.title) {
          setVideoDetails(details);
          setDownloadStatus("ready");
          setVideoTitle(details.title || "Video Title");
          setVideoDescription(details.description || "No description available");
          setIsLoading(false);
          setDownloadButtonLoading(false);
          setDownloadButtonActive(true);
          setInfoButtonActive(true);
          
          // Set default format based on type preference
          if (details.formats && details.formats.length > 0) {
            if (typePreference === 'mp3') {
              // For MP3, we don't need to select a specific format, yt-dlp will handle it
              setSelectedFormatId(null);
            } else {
              // For video, find a good quality format (720p if available, otherwise highest)
              const videoFormats = details.formats.filter(f => f.height && f.vcodec);
              if (videoFormats.length > 0) {
                const preferred720p = videoFormats.find(f => f.height === 720);
                setSelectedFormatId(preferred720p ? preferred720p.format_id : videoFormats[0].format_id);
              }
            }
          }

          // Use the proxied image URL and pass the requestId
          if (details.thumbnail) {
            handleImageLoad(details.thumbnail, requestIdRef.current);
          }
        } else {
          setDownloadStatus("idle");
          setVideoDetails(null);
          setDownloadButtonActive(false);
          setInfoButtonActive(false);
          setIsLoading(false);
          setDownloadButtonLoading(false);
          setImageLoaded(false);
          toast.error("Invalid video data received");
        }
      };

      window.api.receive("videoInfoResponse", responseHandler);

      return () => {
        if (window.api.removeListener) {
          window.api.removeListener("videoInfoResponse", responseHandler);
        }
      };
    }
  }, [videoUrl]);

  function roundNumber(num: number): string {
    if (num >= 1_000_000_000) {
      return `${Math.floor(num / 1_000_000_000)}B+`;
    } else if (num >= 1_000_000) {
      return `${Math.floor(num / 1_000_000)}M+`;
    } else if (num >= 1_000) {
      return `${Math.floor(num / 1_000)}K+`;
    } else {
      return num.toString();
    }
  }

  function commaNumber(num: number): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="w-full h-full flex flex-row absolute" suppressHydrationWarning>
      <SectionWrapper active={active}>
        <main className="flex flex-col w-full h-full gap-4 p-4 pl-0 pt-0">
          <div className="main-wrapper flex flex-row gap-4 min-h-0 grow">
            
            <div className="w-full h-full flex flex-col gap-4">

              <div className="sent-wrapper border border-input p-4 rounded-md shadow-sm bg w-full h-full overflow-hidden min-h-0 bg-input/30 box-border flex flex-col">
                <div className="section-title-wrapper flex flex-row items-center justify-between gap-2 mb-4 flex-shrink-0">
                  <div className="section-title-icon-wrapper flex flex-row items-center gap-2">
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading-title"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="section-title text-lg font-medium"
                        >
                          Loading...
                        </motion.div>
                      ) : !isLoading && videoDetails ? (
                        <motion.div
                          key={videoDetails.title}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className="section-title text-lg font-medium"
                        >
                          {videoDetails.title}
                        </motion.div>
                      ) : (
                        !isLoading && !videoDetails && (
                          <motion.div
                            key="default-title"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.25 }}
                            className="section-title text-lg font-medium"
                          >
                            Video Title
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>

                    {videoDetails && !isLoading ? (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key="dot"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.25 }}
                      >
                        <DotIcon className="opacity-20" />
                      </motion.div>
                    </AnimatePresence>
                    ) : null}


                    <AnimatePresence mode="wait">
                      {videoDetails && !isLoading ? (
                        <motion.div
                          key="badges"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.25 }}
                          className="flex gap-2"
                        >
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                            <Badge variant={'outline'} className="hover:bg-input transition-all cursor-default" style={{ height: "fit-content"}}>
                              <Eye/>
                              {roundNumber(videoDetails.viewCount)}
                            </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>{commaNumber(videoDetails.viewCount)} views</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                            <Badge variant={'outline'} className="hover:bg-input transition-all cursor-default" style={{ height: "fit-content"}}>
                              <ThumbsUp />
                              {roundNumber(videoDetails.likeCount)}
                            </Badge>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">
                              <p>{commaNumber(videoDetails.likeCount)} likes</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>


                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                    <div>
                      <motion.div
                        layoutId="info-modal"
                        onClick={() => setOpen(true)}
                        whileHover={{ backgroundColor: "#fff1" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`${!infoButtonActive ? '!opacity-50 pointer-events-none' : ''} cursor-pointer rounded-xl p-2 flex-shrink-0 project-modal`}
                      >
                        <div className="gap-2 flex flex-col">
                          <InfoIcon size={20} />
                        </div>
                      </motion.div>
                      <AnimatePresence>
                        {open && (
                          <motion.div
                            
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setOpen(false)}
                            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/25 backdrop-blur rounded-tl-[7px]"
                          >
                            <motion.div
                              layoutId="info-modal"
                              onClick={e => e.stopPropagation()}
                              initial={{ scale: 0.95 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0.95 }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              className="dark:bg-[#0a0a0a] bg-[#e2e2e2] rounded-2xl p-8 max-w-[600px] w-[90vw] max-h-[60vh] shadow-2xl overflow-auto project-modal project-modal-open"
                            >
                              <div className="w-full flex items-start gap-4 flex-col justify-between">
                                {videoDetails && (
                                  <motion.div className="flex items-start gap-4 flex-col justify-between relative w-full wrap-break-word">
                                    <h2 className="w-full text-2xl font-medium">{videoDetails.title}</h2>
                                    <span className="opacity-50 whitespace-pre-wrap">
                                      {videoDetails.description.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                          {line}
                                          <br />
                                        </React.Fragment>
                                      ))}
                                    </span>

                                      <div className="flex gap-2">
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger>
                                            <Badge variant={'outline'} className="hover:bg-input transition-all cursor-default" style={{ height: "fit-content"}}>
                                              <Eye/>
                                              {roundNumber(videoDetails.viewCount)}
                                            </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                              <p>{commaNumber(videoDetails.viewCount)} views</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>

                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger>
                                            <Badge variant={'outline'} className="hover:bg-input transition-all cursor-default" style={{ height: "fit-content"}}>
                                              <ThumbsUp />
                                              {roundNumber(videoDetails.likeCount)}
                                            </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent side="bottom">
                                              <p>{commaNumber(videoDetails.likeCount)} likes</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>

                                    <a 
                                      className="whitespace-nowrap group" 
                                      href={videoDetails.channelUrl} 
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <span className="group-hover:underline">{videoDetails.channelTitle}</span>
                                      <MoveUpRight 
                                        className="inline-block ml-1 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" 
                                        size={16} 
                                      />
                                    </a>
                                  </motion.div>
                                )}
                              </div>
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                </div>

                <div 
                  className="flex-1 overflow-hidden rounded-[10px] min-h-0 flex items-center justify-center transition-colors duration-700"
                  style={{ backgroundColor: avgColor }}
                >
                  <AnimatePresence mode="wait">
                    {downloadStatus === "downloading" ? (
                      <motion.div
                        key="downloading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex flex-col items-center justify-center h-full w-full"
                      >
                        <Loader className="animate-spin mb-4" />
                        <div className="text-lg font-semibold mb-2">Downloading...</div>
                        <div className="opacity-60">Please wait while your video is being downloaded.</div>
                      </motion.div>
                    ) : downloadStatus === "complete" ? (
                      <motion.div
                        key="complete"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="flex flex-col items-center justify-center h-full w-full p-8"
                      >
                        <div className="text-3xl font-bold mb-2 text-center">Download Complete</div>
                        <div className="opacity-60 w-full mb-4 text-center">
                          {settings.downloads.useTempPath ? (
                            <div className="opacity-60 w-full text-center">
                              File has been saved, put in a new link to download another.
                            </div>
                          ) : (
                            <div className="opacity-60 w-full text-center">
                              File has been saved to {downloadedPath || "the selected path"}, put in a new link to download another.
                            </div>
                          )}
                        </div>
                        <div className="flex flex-row gap-4">
                          <Button
                            onClick={() => {
                              if (downloadedPath && window.api?.openFile) {
                                window.api.openFile(downloadedPath);
                              }
                            }}
                            disabled={!downloadedPath}
                          >
                            Open File Location
                          </Button>
                        </div>
                      </motion.div>
                    ) : isLoading ? (
                      <motion.div 
                        key="loading"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-center text-muted-foreground animate-pulse"
                      >
                        <p className="text-sm">Loading video details...</p>
                      </motion.div>
                    ) : videoDetails && videoUrl ? (
                      <motion.div 
                        key="video"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: imageLoaded ? 1 : 0, scale: imageLoaded ? 1 : 0.95 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="w-fit overflow-hidden rounded-[10px] flex justify-center items-center p-8"
                      >
                        <motion.img
                          initial={{ opacity: 0 }}
                          animate={{ opacity: imageLoaded ? 1 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="rounded-[10px] max-h-[320px] w-full h-full object-contain"
                          style={{ filter: "drop-shadow(0 0 10px rgba(0, 0, 0, 0.5))" }}
                          src={videoDetails.thumbnail ? getProxiedImageUrl(videoDetails.thumbnail) : ''}
                          alt={videoDetails.title}
                          crossOrigin="anonymous"
                          onLoad={(e) => {
                            const img = e.target as HTMLImageElement;
                            const color = getAverageColor(img);
                            setAvgColor(color);
                            setImageLoaded(true);
                          }}
                        />
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="waiting"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="text-center text-muted-foreground"
                      >
                        <p className="text-sm">Waiting for video URL...</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
            
              </div>

                {/* <div className="w-full border bg-input/30 border-input group rounded-md shadow-sm p-2 px-3 flex flex-row gap-4 items-center">
                  <span>0:00</span>
                  <div className="w-full h-[5px] bg-input rounded relative">
                    <div className="w-[20%] bg-white h-[5px] rounded absolute flex items-center justify-end">
                      <div className="h-[10px] w-[10px] scale-0 group-hover:opacity-100 group-hover:scale-100 hover:scale-120 transition-all opacity-0 rounded aboslute right-0 bg-white translate-x-[5px]"></div>
                    </div>
                  </div>
                  <span>3:43</span>
                </div> */}

            </div>


            <div className="prefs-wrapper border border-input p-4 rounded-md shadow-sm bg h-full overflow-y-auto min-h-0 bg-input/30 w-[550px] flex flex-col">
              <div className="section-title-wrapper flex flex-row items-center gap-2 border-b pb-2 mb-4">
                <div className="section-title-icon">
                  <SlidersVertical size={18} />
                </div>
                <div className="section-title text-lg font-medium">Configure</div>
              </div>
              <div className="prefs overflow-y-auto box-border flex flex-col gap-4">
                <div className="prefs-item">
                  <div className="prefs-item-content">
                    <div className="prefs-title-wrapper">
                      <div className="prefs-item-title !text-foreground">Type</div>
                      <div className="prefs-item-desc !text-foreground/50">Change the type of download.</div>
                    </div>
                    <div className="prefs-item-value">
                      <Select value={typePreference} onValueChange={handleTypeChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Type</SelectLabel>
                            <SelectItem value="mp4">MP4</SelectItem>
                            <SelectItem value="mp3">MP3</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

{typePreference === 'mp4' && (
                  <div className="prefs-item">
                    <div className="prefs-item-content">
                      <div className="prefs-title-wrapper">
                        <div className="prefs-item-title !text-foreground">Video Quality</div>
                        <div className="prefs-item-desc !text-foreground/50">Select the video quality for download.</div>
                      </div>
                      <div className="prefs-item-value">
                        <Select 
                          value={selectedFormatId || ""} 
                          onValueChange={setSelectedFormatId}
                          disabled={!videoDetails || !videoDetails.formats || videoDetails.formats.length === 0}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={videoDetails ? "Select quality" : "Load video first"} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Available Video Qualities</SelectLabel>
                              {videoDetails && videoDetails.formats && (
                                // Show video formats for MP4 only
                                videoDetails.formats
                                  .filter(f => f.height && f.vcodec)
                                  .map((format) => (
                                    <SelectItem key={format.format_id} value={format.format_id}>
                                      {format.quality}
                                    </SelectItem>
                                  ))
                              )}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {!settings.downloads.useTempPath && (
                  <div className="prefs-item">
                    <div className="prefs-item-content">
                      <div className="prefs-title-wrapper">
                        <div className="prefs-item-title !text-foreground">Download Path</div>
                        <div className="prefs-item-desc !text-foreground/50">Change the default download path.</div>
                      </div>
                      <div className="prefs-item-value">
                        <Select
                          value={settings.downloads.paths.find(p => p.active)?.name || settings.downloads.paths[0]?.name}
                          onValueChange={(selectedName) => {
                            // Set only the selected path as active
                            const newPaths = settings.downloads.paths.map(p => ({
                              ...p,
                              active: p.name === selectedName
                            }));
                            updateSettings('downloads', { paths: newPaths });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select path" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Download Path</SelectLabel>
                              {settings.downloads.paths.map((p) => (
                                <SelectItem key={p.name} value={p.name}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show this section only if Soundpad extension is enabled */}
                {settings.soundpad.enabled && (
                  <div className="prefs-item">
                    <div className="prefs-item-content">
                      <div className="prefs-title-wrapper">
                        <div className="prefs-item-title !text-foreground">Add To Soundpad</div>
                        <div className="prefs-item-desc !text-foreground/50">Automatically add downloaded audio to Soundpad.</div>
                      </div>
                      <div className="prefs-item-value">
                        <Checkbox
                          className="size-6"
                          checked={!!settings.main?.addToSoundpad}
                          onCheckedChange={(checked) => {
                            updateSettings('main', {
                              ...settings.main,
                              addToSoundpad: checked
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* <div className="prefs-item">
                  <div className="prefs-item-content">
                    <div className="prefs-title-wrapper">
                      <div className="prefs-item-title">Preview</div>
                      <div className="prefs-item-desc">Change the in app preview.</div>
                    </div>
                    <div className="prefs-item-value">
                      <Select value={previewPreference} onValueChange={(value) => setPreviewPreference(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Preview Preference</SelectLabel>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div> */}

              </div>
            </div>


          </div>

          <div className="input-wrapper w-full flex flex-row gap-4 items-center shrink-0 grow-0">
            <Input 
              type="text" 
              placeholder="YouTube Video URL..." 
              className="flex-1 min-w-0 h-10" 
              onChange={(e) => handleURLChange(e.target.value)}
            />
            <Button
              disabled={!downloadButtonActive || downloadButtonLoading || isLoading}
              className="h-full aspect-square relative"
            >
              <AnimatePresence mode="wait">
                {(downloadButtonLoading || isLoading) ? (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Loader className="opacity-50" />
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="download"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: downloadButtonActive ? 1 : 0.5, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={async () => {
                      if (videoDetails && videoUrl) {
                        setDownloadButtonLoading(true);
                        setDownloadStatus("downloading");
                        setAvgColor(defaultBgColor); // <-- Reset background color here

                        // Get the active path from settings
                        const activePathObj = settings.downloads.paths.find(p => p.active);
                        const outputPath = activePathObj?.path || settings.downloads.paths[0]?.path || "";

                        if (!outputPath) {
                          toast.error("No download path set in settings.");
                          setDownloadButtonLoading(false);
                          return;
                        }

                        let timeoutId: NodeJS.Timeout | null = null;

                        // Listen for download result (success or error)
                        const handleDownloadResponse = (result: string | boolean) => {
                          if (timeoutId) clearTimeout(timeoutId);
                          setDownloadButtonLoading(false);
                          if (typeof result === "string" && result) {
                            setDownloadedPath(result); // Save the path
                            setDownloadStatus("complete");
                            // if using soundpad have seperate logic
                            if (settings.main?.addToSoundpad && settings.soundpad.enabled) {
                              const filePath = result;
                              const port = settings.soundpad.port || 8866; // Default to 8866 if not set
                              
                              const addSoundToSoundpad = async (filePath: string, port: number) => {
                                const res = await window.api.invoke('addToSoundpad', filePath, port)
                                if ('error' in res && res.error) {
                                  // now throw in renderer, which you already .catch below
                                  throw new Error(res.error)
                                }
                                console.log(`[Soundpad] Added sound: ${filePath}. Server response:`, res.data)
                                return res.data
                              }

                              addSoundToSoundpad(filePath, Number(port))
                                .then(() => toast.success("Download complete and added to Soundpad"))
                                .catch((error: any) => {
                                  let msg = error.message || error
                                  if (msg.includes("503")) {
                                    msg = "Soundpad is not running."
                                  }
                                  toast.error(`Download complete, but failed to add to Soundpad: ${msg}`);
                                });
                            } else {
                              toast.success("Download complete");
                            }
                            
                          } else if (result === null) {
                            // User cancelled the save dialog
                            setDownloadStatus("ready");
                            toast.warning("Download cancelled by user.");
                          } else {
                            setDownloadStatus("ready");
                            toast.error("Download failed.");
                          }
                          if (window.api && window.api.removeListener) {
                            window.api.removeListener("downloadResponse", handleDownloadResponse);
                            window.api.removeListener("downloadError", handleDownloadError);
                          }
                        };
                        const handleDownloadError = (error: string) => {
                          if (timeoutId) clearTimeout(timeoutId);
                          setDownloadButtonLoading(false);
                          setDownloadStatus("ready");
                          toast.error(error || "Download failed.");
                          if (window.api && window.api.removeListener) {
                            window.api.removeListener("downloadResponse", handleDownloadResponse);
                            window.api.removeListener("downloadError", handleDownloadError);
                          }
                        };

                        if (window.api && window.api.receive) {
                          window.api.receive("downloadResponse", handleDownloadResponse);
                          window.api.receive("downloadError", handleDownloadError);
                        }

                        // Set an hour timeout
                        timeoutId = setTimeout(() => {
                          setDownloadButtonLoading(false);
                          toast.error("Download timed out after an hour.");
                          if (window.api && window.api.removeListener) {
                            window.api.removeListener("downloadResponse", handleDownloadResponse);
                            window.api.removeListener("downloadError", handleDownloadError);
                          }
                        }, 60 * 60 * 1000);

                        window.api.send(
                          "downloadVideo",
                          videoUrl,
                          outputPath,
                          settings.main?.type || 'mp3',
                          selectedFormatId,
                          settings.downloads?.useTempPath 
                        );
                      } else {
                        toast.error("No valid video details available to download.");
                      }
                    }}
                  >
                    <DownloadIcon />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </main>
      </SectionWrapper>
    </div>
  );
}