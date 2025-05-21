import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { CircleXIcon, SaveIcon, SquarePen, CheckIcon, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface TabProps {
  id: number;
  name: string;
  isActive: boolean;
  setActiveTab: (id: number) => void;
  renamingTabId: number | null;
  setRenamingTabId: (id: number | null) => void;
  onCloseTab: (id: number) => void; // Add onCloseTab prop
  isFileTab?: boolean;
}

export function Tab({
  id,
  name,
  isActive,
  setActiveTab,
  renamingTabId,
  setRenamingTabId,
  onCloseTab,
  isFileTab,
}: TabProps) {
  const [tabName, setTabName] = useState(name);
  const [originalName, setOriginalName] = useState(name); // Store the original name
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const updateTabInLocalStorage = (newName: string) => {
    const tabs = JSON.parse(localStorage.getItem("tabs") || "[]");
    const updatedTabs = tabs.map((tab: any) =>
      tab.id === id ? { ...tab, name: newName } : tab
    );
    localStorage.setItem("tabs", JSON.stringify(updatedTabs));
  };

  const handleRename = (newName: string) => {
    if (newName.trim() === "") {
      setTabName(originalName); // Revert to the original name if empty
    } else {
      setTabName(newName);
      setOriginalName(newName); // Update the original name
      updateTabInLocalStorage(newName); // Update localStorage
    }
    setRenamingTabId(null); // Stop renaming
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        renamingTabId === id &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        handleRename(tabName);
      }
    };

    if (renamingTabId === id) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [renamingTabId, tabName, id]);

  return isClient ? (
    <ContextMenu>
      <ContextMenuTrigger
        onContextMenu={(e) => {
          setActiveTab(id); // Switch to the active tab on right-click
        }}
        onMouseDown={(e) => {
          if (e.button === 1) {
            // Middle mouse button clicked
            onCloseTab(id);
          }
        }}
      >
        <div className="flex">
          <div
            className={`hover:bg-muted cursor-pointer transition-all select-none h-8 border-2 border-muted rounded-md p-1 flex items-center gap-2 pl-3 pr-3 bg-muted/50 ${
              isActive ? "!bg-white !text-black !border-white" : ""
            }
            ${renamingTabId === id ? "!pr-1" : ""}
            `}
            onClick={() => setActiveTab(id)}
            suppressHydrationWarning
          >
            {renamingTabId === id ? (
              <div className="flex items-center gap-2 w-[100px]">
                <input
                  ref={inputRef}
                  type="text"
                  value={tabName}
                  onChange={(e) => setTabName(e.target.value)}
                  onBlur={() => handleRename(tabName)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(tabName);
                    if (e.key === "Escape") {
                      setTabName(originalName);
                      setRenamingTabId(null);
                    }
                  }}
                  className="w-full bg-transparent border-none outline-none"
                  autoFocus
                />
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                      <div
                        onClick={() => handleRename(tabName)}
                        className="hover:bg-gray-200 p-1 rounded"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                    <p>submit</p>
                    </TooltipContent>
                </Tooltip>
                </TooltipProvider>
              </div>
            ) : (
              tabName
            )}
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuLabel className="flex justify-center items-center gap-3">
          <span className="font-medium">{tabName}</span>
          <div className="w-[3px] h-[3px] bg-white/50 rounded-full"></div>
          <TooltipProvider>
            <Tooltip disableHoverableContent>
                <TooltipTrigger>
                    <span className="opacity-50 text-xs">{id}</span>
                </TooltipTrigger>
                <TooltipContent>
                <p>id</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        </ContextMenuLabel>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => {
            setRenamingTabId(id); // Start renaming this tab
          }}
        >
          <SquarePen />
          rename
        </ContextMenuItem>
        <ContextMenuItem>
          <SaveIcon />
          save as
        </ContextMenuItem>
        <ContextMenuItem
          className="group hover:!bg-red-500/10 hover:!text-red-500"
          onClick={() => onCloseTab(id)} // Call onCloseTab when clicked
        >
        {isFileTab ? (
          <>
            <CircleXIcon className="group-hover:text-red-500 text-muted-foreground" />
            close
          </>
        ) : (
          <>
            <Trash2 className="group-hover:text-red-500 text-muted-foreground" />
            delete
          </>
        )}

        </ContextMenuItem>
        <ContextMenuSeparator />
        <div className="flex justify-center items-center">
          <span className="italic opacity-50 text-xs m-1 select-none">{isFileTab ? "file tab" : "temporary tab"}</span>
        </div>
      </ContextMenuContent>
    </ContextMenu>
  ) : null;
}