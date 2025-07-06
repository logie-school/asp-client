import { SectionWrapper } from "../section-wrapper";
import { useSettings } from "@/app/contexts/settings-context";
import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { FileAudioIcon, FileVideoIcon, FolderIcon, SearchIcon } from "lucide-react";

interface GalleryProps {
  active?: boolean;
}

interface FileItem {
  name: string;
  fullName: string;
  extension: string;
  type: 'audio' | 'video';
  size: number;
  modified: Date;
  path: string;
}

interface PathFiles {
  pathName: string;
  pathLocation: string;
  files: FileItem[];
  error?: string;
}

export function Gallery({ active }: GalleryProps) {
  const { settings } = useSettings();
  const [pathFiles, setPathFiles] = useState<PathFiles[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const loadFilesFromPaths = async (showLoading = true) => {
    if (!settings.downloads?.paths) return;
    
    if (showLoading) {
      setLoading(true);
    }
    
    const results: PathFiles[] = [];

    for (const pathEntry of settings.downloads.paths) {
      try {
        if (window.api?.invoke) {
          const result = await window.api.invoke('list-files-in-path', pathEntry.path);
          // Only add paths that don't have errors (i.e., paths that exist and are accessible)
          if (!result.error) {
            results.push({
              pathName: pathEntry.name,
              pathLocation: pathEntry.path,
              files: result.files || [],
              error: result.error
            });
          }
        }
      } catch (error) {
        // Skip paths that throw errors - don't add them to results
        continue;
      }
    }

    // Compare with current state to see if there are changes
    const hasChanges = JSON.stringify(results) !== JSON.stringify(pathFiles);
    
    if (hasChanges) {
      setPathFiles(results);
    }
    
    if (showLoading) {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (active) {
      // Initial load with loading indicator
      loadFilesFromPaths(true);
      
      // Set up auto-refresh every second without loading indicator
      const interval = setInterval(() => loadFilesFromPaths(false), 1000);
      return () => clearInterval(interval);
    }
  }, [active, settings.downloads?.paths]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Search algorithm that filters and scores files based on relevance
  const filteredPathFiles = useMemo(() => {
    if (!searchTerm.trim()) {
      return pathFiles;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const searchWords = searchLower.split(/\s+/);

    return pathFiles.map(pathFile => {
      const filteredFiles = pathFile.files
        .map(file => {
          let score = 0;
          const fileName = file.name.toLowerCase();
          const extension = file.extension.toLowerCase();
          const type = file.type.toLowerCase();

          // Exact match gets highest score
          if (fileName === searchLower) {
            score += 100;
          }
          
          // File name starts with search term
          if (fileName.startsWith(searchLower)) {
            score += 50;
          }

          // File name contains search term
          if (fileName.includes(searchLower)) {
            score += 25;
          }

          // Check each search word
          searchWords.forEach(word => {
            if (fileName.includes(word)) {
              score += 10;
            }
            if (extension.includes(word)) {
              score += 5;
            }
            if (type.includes(word)) {
              score += 5;
            }
          });

          // Fuzzy matching - check for partial character matches
          let fuzzyScore = 0;
          for (let i = 0; i < searchLower.length; i++) {
            if (fileName.includes(searchLower[i])) {
              fuzzyScore += 1;
            }
          }
          score += fuzzyScore * 0.5;

          return { ...file, searchScore: score };
        })
        .filter(file => file.searchScore > 0)
        .sort((a, b) => b.searchScore - a.searchScore);

      return {
        ...pathFile,
        files: filteredFiles
      };
    }).filter(pathFile => pathFile.files.length > 0);
  }, [pathFiles, searchTerm]);

  const totalFiles = pathFiles.reduce((sum, pathFile) => sum + pathFile.files.length, 0);
  const filteredTotalFiles = filteredPathFiles.reduce((sum, pathFile) => sum + pathFile.files.length, 0);

  return (
    <div className="w-full h-full flex flex-row absolute">
      <SectionWrapper active={active}>
        <div className="w-full h-full flex flex-col p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FolderIcon className="opacity-50" size={20} />
              <h2 className="text-lg font-medium">Gallery</h2>
              <Badge variant="secondary">{totalFiles} files</Badge>
              {searchTerm && (
                <Badge variant="outline" className="text-xs">
                  Filtered
                </Badge>
              )}
            </div>
            
            {/* Search Input - Always Visible */}
            <div className="relative w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" size={16} />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto space-y-6">
            {filteredPathFiles.length === 0 && !loading && !searchTerm && (
              <div className="flex items-center justify-center h-full">
                <span className="opacity-50">No download paths configured</span>
              </div>
            )}

            {filteredPathFiles.length === 0 && !loading && searchTerm && (
              <div className="flex items-center justify-center h-full">
                <span className="opacity-50">No files found matching "{searchTerm}"</span>
              </div>
            )}

            {loading && (
              <div className="flex items-center justify-center h-full">
                <span className="opacity-50">Loading files...</span>
              </div>
            )}

            {filteredPathFiles.map((pathFile, index) => (
              <div key={index} className="space-y-3">
                {/* Path Header */}
                <div className="flex items-center gap-2 border-b pb-2">
                  {/* <FolderIcon size={16} className="opacity-50" /> */}
                  <span className="font-medium">{pathFile.pathName}</span>
                  <Badge variant="outline" className="text-xs">
                    {pathFile.files.length} files
                  </Badge>
                </div>

                {/* Files List */}
                {pathFile.files.length === 0 && (
                  <div className="text-center py-8 opacity-50">
                    No audio or video files found in this directory
                  </div>
                )}

                {pathFile.files.length > 0 && (
                  <div className="space-y-2">
                    {pathFile.files.map((file, fileIndex) => (
                      <div
                        key={fileIndex}
                        className="flex items-center gap-3 p-3 bg-input/30 rounded-md hover:bg-input/50 transition-colors"
                      >
                        {/* File Type Icon */}
                        <div className="flex-shrink-0">
                          {file.type === 'audio' ? (
                            <FileAudioIcon size={20} className="text-blue-500" />
                          ) : (
                            <FileVideoIcon size={20} className="text-purple-500" />
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{file.name}</div>
                          <div className="flex items-center gap-2 text-sm opacity-70">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                file.type === 'audio' ? 'text-blue-500 border-blue-500/30' : 'text-purple-500 border-purple-500/30'
                              }`}
                            >
                              {file.extension.toUpperCase().slice(1)}
                            </Badge>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                        </div>

                        {/* File Actions */}
                        <div className="flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.api?.openFile) {
                                window.api.openFile(file.path);
                              }
                            }}
                          >
                            Open
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {index < filteredPathFiles.length - 1 && <Separator />}
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
}