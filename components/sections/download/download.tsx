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

  // Get preferences from settings
  const downloadPreference = settings.main?.quality || 'medium';
  const typePreference = settings.main?.type || 'mp3';
  const previewPreference = settings.main?.preview || 'image';

  // Update handlers
  const handleQualityChange = (value: string) => {
    updateSettings('main', {
      ...settings.main,
      quality: value
    });
  };

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
      setAvgColor(defaultBgColor);
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
          setVideoDetails(details);
          setVideoTitle(details.title || "Video Title");
          setVideoDescription(details.description || "No description available");
          setIsLoading(false);
          setDownloadButtonLoading(false); // <--- Add this line
          setDownloadButtonActive(true);
          setInfoButtonActive(true);
        } else {
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

  // Replace the existing getProxiedImageUrl function with our imported one
  const handleImageLoad = async (url: string) => {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = getProxiedImageUrl(url);
      
      img.onload = () => {
        const avgColor = getAverageColor(img);
        setAvgColor(avgColor);
        setImageLoaded(true);
      };
    } catch (error) {
      console.error('Error loading image:', error);
      setImageLoaded(false);
    }
  };

  // Update the response handler to use the proxy
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const responseHandler = (details: VideoDetails, responseRequestId?: number) => {
        if (responseRequestId === requestIdRef.current) {
          setVideoDetails(details);
          setVideoTitle(details.title);
          setVideoDescription(details.description);
          setDownloadButtonActive(true);
          setInfoButtonActive(true);
          setIsLoading(false);
          setDownloadButtonLoading(false);
          
          // Use the proxied image URL
          if (details.thumbnail) {
            handleImageLoad(details.thumbnail);
          }
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
                    {isLoading ? (
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
                      <div className="prefs-item-desc !text-foreground/50">Change the quality of the downloaded video.</div>
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

                <div className="prefs-item">
                  <div className="prefs-item-content">
                    <div className="prefs-title-wrapper">
                      <div className="prefs-item-title !text-foreground">Quality</div>
                      <div className="prefs-item-desc !text-foreground/50">Change the quality of the downloaded video.</div>
                    </div>
                    <div className="prefs-item-value">
                      <Select value={downloadPreference} onValueChange={handleQualityChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Download Quality</SelectLabel>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

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
                        const handleDownloadResponse = (result: boolean) => {
                          if (timeoutId) clearTimeout(timeoutId);
                          setDownloadButtonLoading(false);
                          if (result) {
                            toast.success("Download complete!");
                          } else {
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
                          settings.main?.quality || 'medium'
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