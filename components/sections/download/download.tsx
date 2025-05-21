"use client";

import { SectionWrapper } from "../section-wrapper";
import "./download.css";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
import { Checkbox } from "@/components/ui/checkbox";

import { DownloadIcon, MoveUpRight, InfoIcon, SlidersVertical, Loader } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const defaultBgColor = "#1f1f1f"; // Define default background color
  const [avgColor, setAvgColor] = useState(defaultBgColor);
  
  const [videoUrl, setVideoUrl] = useState("");
  const [downloadButtonActive, setDownloadButtonActive] = useState(false);
  const [videoTitle, setVideoTitle] = useState("Video Title");
  const [videoDescription, setVideoDescription] = useState("lorem ipsum dolor sit amet consectetur...");
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [downloadPreference, setDownloadPreference] = useState("medium");
  const [typePreference, setTypePreference] = useState("mp3");
  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleURLChange = (url: string) => {
    setVideoUrl(url);
    
    if (url) {
      setIsLoading(true);
      setAvgColor(defaultBgColor);
      setDownloadButtonActive(false); // Reset while loading
      if (typeof window !== 'undefined') {
        console.log("Sending URL to main process:", url);
        window.api.send("videoInfo", url);
      }
    } else {
      setDownloadButtonActive(false);
      setVideoDetails(null);
      setVideoTitle("Video Title"); // Reset title
      setVideoDescription(""); // Reset description
      setAvgColor(defaultBgColor);
      setIsLoading(false);
    }
  };

  // Move window-dependent code into useEffect
  useEffect(() => {
    // Set up event listeners when component mounts
    if (typeof window !== 'undefined') {
      // Clean up previous listeners
      const errorHandler = (error: string) => {
        console.error("Error fetching video info:", error);
        toast.error(error);
        setVideoDetails(null);
        setDownloadButtonActive(false);
        setIsLoading(false);
      };

      const responseHandler = (details: VideoDetails) => {
        console.log("Video Info received:", details);
        if (details && details.title) { // Add validation for required fields
          setVideoDetails(details);
          setVideoTitle(details.title || "Video Title");
          setVideoDescription(details.description || "No description available");
          setIsLoading(false);
          setDownloadButtonActive(true); // Set active after successful response
        } else {
          toast.error("Invalid video data received");
          setVideoDetails(null);
          setDownloadButtonActive(false);
          setIsLoading(false);
        }
      };

      window.api.receive("videoInfoError", errorHandler);
      window.api.receive("videoInfoResponse", responseHandler);

      return () => {
        // Remove listeners if possible
        if (window.api.removeListener) {
          window.api.removeListener("videoInfoError", errorHandler);
          window.api.removeListener("videoInfoResponse", responseHandler);
        }
      };
    }
  }, []); // Empty dependency array means this runs once on mount

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

  const getProxiedImageUrl = (url: string) => {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  };

  return (
    <div className="w-full h-full flex flex-row absolute" suppressHydrationWarning>
      <SectionWrapper active={active}>
        <main className="flex flex-col w-full h-full gap-4 p-4 pl-0 pt-0">
          <div className="main-wrapper flex flex-row gap-4 min-h-0 grow">
            
            <div className="sent-wrapper border border-input p-4 rounded-md shadow-sm bg w-full h-full overflow-hidden min-h-0 bg-input/30 box-border flex flex-col">
              <div className="section-title-wrapper flex flex-row items-center justify-between gap-2 mb-4 flex-shrink-0">
                <div className="section-title-icon-wrapper flex flex-row items-center gap-2">
                  <div className="section-title text-lg font-medium">{videoTitle}</div>
                </div>
                  <div>
                    <motion.div
                      layoutId="info-modal"
                      onClick={() => setOpen(true)}
                      whileHover={{ backgroundColor: "#fff1" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="cursor-pointer rounded-xl p-2 shadow-md flex-shrink-0 project-modal"
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
                            className="bg-[#0a0a0a] rounded-2xl p-8 max-w-[600px] w-[90vw] max-h-[60vh] shadow-2xl overflow-auto project-modal project-modal-open"
                          >
                            <div className="flex items-start gap-4 flex-col justify-between">
                              {videoDetails && (
                                <motion.div className="flex items-start gap-4 flex-col justify-between">
                                  <h2 className="text-2xl font-medium">{videoDetails.title}</h2>
                                  <span className="opacity-50 whitespace-pre-wrap">
                                    {videoDetails.description.split('\n').map((line, i) => (
                                      <React.Fragment key={i}>
                                        {line}
                                        <br />
                                      </React.Fragment>
                                    ))}
                                  </span>
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


            <div className="prefs-wrapper border border-input p-4 rounded-md shadow-sm bg h-full overflow-y-auto min-h-0 bg-input/30 max-w-[350px] flex flex-col">
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
                      <div className="prefs-item-title">Type</div>
                      <div className="prefs-item-desc">Change the quality of the downloaded video.</div>
                    </div>
                    <div className="prefs-item-value">
                      <Select value={typePreference} onValueChange={(value) => setTypePreference(value)}>
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
                      <div className="prefs-item-title">Quality</div>
                      <div className="prefs-item-desc">Change the quality of the downloaded video.</div>
                    </div>
                    <div className="prefs-item-value">
                      <Select value={downloadPreference} onValueChange={(value) => setDownloadPreference(value)}>
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
              disabled={!downloadButtonActive}
              className="h-full aspect-square relative"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
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