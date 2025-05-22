"use client";

import { SectionWrapper } from "../section-wrapper";
import "./download.css";

import React, { useEffect, useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(false);
  const defaultBgColor = "#1f1f1f";
  const [avgColor, setAvgColor] = useState(defaultBgColor);

  const [videoUrl, setVideoUrl] = useState("");
  const [downloadButtonActive, setDownloadButtonActive] = useState(false);
  const [infoButtonActive, setInfoButtonActive] = useState(false);
  const [videoTitle, setVideoTitle] = useState("Video Title");
  const [videoDescription, setVideoDescription] = useState("lorem ipsum dolor sit amet consectetur...");
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);

  // Load from localStorage or use default values
  const [downloadPreference, setDownloadPreference] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("downloadPreference") || "medium";
    }
    return "medium";
  });
  const [typePreference, setTypePreference] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("typePreference") || "mp3";
    }
    return "mp3";
  });

  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Track the latest request
  const requestIdRef = useRef(0);

  // Save preferences to localStorage when they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("downloadPreference", downloadPreference);
    }
  }, [downloadPreference]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("typePreference", typePreference);
    }
  }, [typePreference]);

  const handleURLChange = (url: string) => {
    setVideoUrl(url);
    setImageLoaded(false);

    if (url) {
      setIsLoading(true);
      setAvgColor(defaultBgColor);
      setDownloadButtonActive(false);
      setInfoButtonActive(false);

      // Set loading state for title and description
      setVideoTitle("Loading...");
      setVideoDescription("Loading video details...");

      // Increment requestId for each new request
      requestIdRef.current += 1;
      const thisRequestId = requestIdRef.current;

      if (typeof window !== 'undefined') {
        window.api.send("videoInfo", url, thisRequestId);
      }
    } else {
      setDownloadButtonActive(false);
      setInfoButtonActive(false);
      setVideoDetails(null);
      setVideoTitle("Video Title");
      setVideoDescription("");
      setAvgColor(defaultBgColor);
      setIsLoading(false);
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
          setImageLoaded(false);
          return;
        }
        if (details && details.title) {
          setVideoDetails(details);
          setVideoTitle(details.title || "Video Title");
          setVideoDescription(details.description || "No description available");
          setIsLoading(false);
          setDownloadButtonActive(true);
          setInfoButtonActive(true);
        } else {
          setVideoDetails(null);
          setDownloadButtonActive(false);
          setInfoButtonActive(false);
          setIsLoading(false);
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

  const getProxiedImageUrl = (url: string) => {
    return `/api/proxy?url=${encodeURIComponent(url)}`;
  };

  function roundNumber(num: number): string {
    if (num >= 1_000_000_000) {
      return `${Math.floor(num / 1_000_000_000)}b`;
    } else if (num >= 1_000_000) {
      return `${Math.floor(num / 1_000_000)}m`;
    } else if (num >= 1_000) {
      return `${Math.floor(num / 1_000)}k`;
    } else {
      return num.toString();
    }
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
                          <DotIcon className="opacity-20 mr-2" />
                          <Badge variant={'outline'} style={{ height: "fit-content"}}>
                            <Eye/>
                            {roundNumber(videoDetails.viewCount)}
                          </Badge>
                          <Badge variant={'outline'} style={{ height: "fit-content"}}>
                            <ThumbsUp />
                            {roundNumber(videoDetails.likeCount)}
                          </Badge>
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
                        className={`${!infoButtonActive ? '!opacity-50 pointer-events-none' : ''} cursor-pointer rounded-xl p-2 shadow-md flex-shrink-0 project-modal`}
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
                                  <motion.div className="flex items-start gap-4 flex-col justify-between relative">
                                    <h2 className="text-2xl font-medium">{videoDetails.title}</h2>
                                    <span className="opacity-50 whitespace-pre-wrap">
                                      {videoDetails.description.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                          {line}
                                          <br />
                                        </React.Fragment>
                                      ))}
                                    </span>

                                      <div className="flex gap-2">
                                      <Badge variant={'outline'} style={{ height: "fit-content"}}>
                                        <Eye/>
                                        {roundNumber(videoDetails.viewCount)}
                                      </Badge>
                                      <Badge variant={'outline'} style={{ height: "fit-content"}}>
                                        <ThumbsUp />
                                        {roundNumber(videoDetails.likeCount)}
                                      </Badge>
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

                <div className="w-full border bg-input/30 border-input group rounded-md shadow-sm p-2 flex flex-row gap-4 items-center">
                  <span>0:00</span>
                  <div className="w-full h-[5px] bg-input rounded relative">
                    <div className="w-[20%] bg-white h-[5px] rounded absolute flex items-center justify-end">
                      <div className="h-[10px] w-[10px] scale-0 group-hover:opacity-100 group-hover:scale-100 hover:scale-120 transition-all opacity-0 rounded aboslute right-0 bg-white translate-x-[5px]"></div>
                    </div>
                  </div>
                  <span>3:43</span>
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
                    onClick={() => {toast('test')}}
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