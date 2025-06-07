import { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Ellipsis, PencilIcon, Trash2, Circle, CheckIcon, TriangleAlertIcon, CircleXIcon, FolderOpenIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type PathEntry = { name: string; path: string };
type PathListProps = {
  paths: PathEntry[];
  onRemove: (idx: number) => void;
  onRename?: (idx: number, newName: string) => void;
};

export function PathList({ paths, onRemove, onRename }: PathListProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>("");
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [statuses, setStatuses] = useState<Record<number, boolean | null>>({});

  // Check path existence on mount, when paths change, and every second
  useEffect(() => {
    let cancelled = false;
    let interval: NodeJS.Timeout;

    async function checkStatuses() {
      const newStatuses: Record<number, boolean | null> = {};
      for (let i = 0; i < paths.length; i++) {
        try {
          if (window.api?.invoke) {
            const exists = await window.api.invoke("validate-path", paths[i].path);
            if (!cancelled) newStatuses[i] = !!exists;
          } else {
            newStatuses[i] = null;
          }
        } catch {
          newStatuses[i] = null;
        }
      }
      if (!cancelled) setStatuses(newStatuses);
    }

    checkStatuses();
    interval = setInterval(checkStatuses, 1000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [paths]);

  const handleOpenEdit = (idx: number) => {
    setOpenIdx(null); // close dropdown
    setEditIdx(idx);
    setEditName(paths[idx].name);
  };

  const handleDialogClose = () => {
    setEditIdx(null);
    setEditName("");
    // Return focus to the trigger button
    if (triggerRefs.current[openIdx ?? 0]) {
      triggerRefs.current[openIdx ?? 0]?.focus();
    }
  };

  const handleRename = () => {
    if (onRename && editIdx !== null) {
      // Only update the name, not the path
      onRename(editIdx, editName.trim());
    }
    handleDialogClose();
  };

  return (
    <div className="w-full border-1 border-input bg-input/30 p-4 flex transition-all rounded-[10px] flex-col gap-4">
      <Table className="rounded-[10px] overflow-hidden">
        <TableHeader>
          <TableRow className="pointer-events-none">
            <TableHead>Status</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paths.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No paths added yet.
              </TableCell>
            </TableRow>
          ) : (
            paths.map((item, idx) => (
              <TableRow key={idx} className="text-foreground/50">
                <TableCell>
                  <Tooltip disableHoverableContent>
                    <TooltipTrigger asChild>
                        {statuses[idx] === true ? (
                          <CheckIcon size={16} className="text-green-500" />
                        ) : statuses[idx] === false ? (
                          <TriangleAlertIcon size={16} className="text-amber-500" />
                        ) : (
                          <CircleXIcon size={16} className="text-red-500" />
                        )}
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {statuses[idx] === true
                          ? "Path exists"
                          : statuses[idx] === false
                          ? "Path does not exist, one will be created on first download"
                          : "Error, you should delete this path"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.path}</TableCell>
                <TableCell>
                  <DropdownMenu
                    open={openIdx === idx}
                    onOpenChange={(open) => setOpenIdx(open ? idx : null)}
                  >
                    <DropdownMenuTrigger asChild>
                      <Button
                        ref={el => { triggerRefs.current[idx] = el; }}
                        variant="ghost"
                      >
                        <Ellipsis />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleOpenEdit(idx)}>
                        <PencilIcon />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        window.api?.invoke?.('open-path', item.path);
                      }}>
                        <FolderOpenIcon /> Open in Explorer
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="group hover:!bg-red-500/10"
                        onClick={() => onRemove(idx)}
                      >
                        <Trash2 className="group-hover:text-red-500 text-muted-foreground" />
                        <span className="group-hover:text-red-500">Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <span className="text-[12px] text-foreground/50 w-full text-center">Status indicates if the path is valid or doesn't exist yet, hover on the status icon for more information.</span>

      {/* Only render Dialog when editing */}
      {editIdx !== null && (
        <Dialog open={true} onOpenChange={open => { if (!open) handleDialogClose(); }}>
          <DialogContent aria-describedby="rename-desc">
            <DialogHeader>
              <DialogTitle>Rename Download Path</DialogTitle>
            </DialogHeader>
            <div id="rename-desc" className="sr-only">
              Enter a new name for your download path.
            </div>
            <Input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              autoFocus
              placeholder="Enter new name"
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                onClick={handleRename}
                disabled={!editName.trim()}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default PathList;