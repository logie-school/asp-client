import { useEffect, useState } from 'react';
import { Tree, NodeModel } from "@minoru/react-dnd-treeview";
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import "./styles.css"; // Your custom styles file

// Extend the Window interface to include handleSearch and newFileTab
declare global {
  interface Window {
    handleSearch: (query: string) => void;
    newFileTab: (filePath: string, fileName: string) => void;
    setActiveTab: (id: string) => void;
    refreshFileExplorer: () => void; // Add this line
  }
}

interface FileNode {
  text: string;
  droppable: boolean;
  path: string; // Add the path attribute
  children: FileNode[];
}

const App = () => {
  const [treeData, setTreeData] = useState<NodeModel[]>([]);
  const [filteredData, setFilteredData] = useState<NodeModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.api.receive('updateFileExplorer', (fileTree: FileNode[]) => {
      const formatData = (nodes: FileNode[], parentId = 0): NodeModel[] => {
        let result: NodeModel[] = [];
        nodes.forEach((node, index) => {
          const id = parentId * 100 + index + 1;
          result.push({
            id,
            parent: parentId,
            text: node.text,
            droppable: node.droppable,
            data: { path: node.path } // Add the path to the data attribute
          });
          if (node.children.length > 0) {
            result = result.concat(formatData(node.children, id));
          }
        });
        return result;
      };
      const formattedData = formatData(fileTree);
      setTreeData(formattedData);
      setFilteredData(formattedData);
      setLoading(false); // Set loading to false after data is fetched
    });

    window.api.receive('updateFileExplorerError', (errorMessage: string) => {
      console.error(errorMessage);
      setLoading(false);
    });

    window.api.send('initialValidateFetchFileExplorer', null);
  }, []);

  const handleSearch = (query: string) => {
    if (!treeData) return;
    const filterData = (nodes: NodeModel[]): NodeModel[] => {
      return nodes.filter(node => node.text.toLowerCase().includes(query.toLowerCase()));
    };
    setFilteredData(filterData(treeData));
  };

  useEffect(() => {
    const searchInput = document.getElementById('scriptsExplorerSearch');
    if (searchInput) {
      const handleSearchEvent = (event: Event) => {
        const query = (event.target as HTMLInputElement).value;
        handleSearch(query);
      };
      searchInput.addEventListener('input', handleSearchEvent);
      return () => {
        searchInput.removeEventListener('input', handleSearchEvent);
      };
    }
  }, [treeData]);

  window.handleSearch = handleSearch;

  useEffect(() => {
    // window.refreshFileExplorer = () => {
    //   setLoading(true);
    //   window.api.send('validateFetchFileExplorer', null);
    // };
  }, []);

  const handleDrop = (newTree: NodeModel[]) => {
    setTreeData(newTree);
    setFilteredData(newTree);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div>
        {loading ? ( // Conditionally render loading message or file tree
          <div 
            style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", opacity: 0.5 }}
          >
            Loading...
          </div>
        ) : (
          <Tree
            tree={filteredData}
            rootId={0}
            render={(node: NodeModel, { depth, isOpen, onToggle }) => (
              <div
                className={`tree-node ${!node.droppable ? "file" : ""}`} // Apply class only to files (non-droppable nodes)
                style={{ marginLeft: depth * 8, display: "flex", alignItems: "center" }}
                onClick={() => {
                  if (node.droppable) {
                    onToggle();
                  } else {
                    const filePath = (node.data as { path: string }).path; // Cast node.data to the correct type
                    console.log(filePath); // Log the absolute path when a file is clicked
                    
                    // Extract the file name from the file path using regex
                    const fileNameMatch = filePath.match(/[^\\/]+$/);
                    const fileName = fileNameMatch ? fileNameMatch[0] : 'Untitled';

                    // Check if the tab is already open
                    const existingTab = Array.from(document.querySelectorAll('.tab')).find(tab => tab.getAttribute('data-file-path') === filePath);
                    if (existingTab) {
                      // Set the existing tab as active
                      const tabId = existingTab.getAttribute('data-tab-id') || '';
                      window.setActiveTab(tabId);
                    } else {
                      // Create a new tab with the file path and file name
                      window.newFileTab(filePath, fileName);
                    }

                    window.loadFileContent(filePath); // Load the file content into Monaco editor
                  }
                }} // Toggle folder open/close if it's a folder
                draggable="false" // Disable dragging
              >
                {/* Folder toggle icon and text */}
                {node.droppable && (
                  <span
                    className={`toggle-icon file-expand-icon iconsax ${isOpen ? "open" : ""}`}
                    style={{ marginRight: 8 }}
                    icon-name="chevron-right"
                    draggable="false" // Disable dragging
                  >
                  </span>
                )}
                <span className="node-text" draggable="false">{node.text}</span>
              </div>
            )}
            dragPreviewRender={(monitorProps) => {
              const node = monitorProps.item as NodeModel;
              return <div>{node.text}</div>;
            }}
            onDrop={handleDrop}
          />
        )}
      </div>
    </DndProvider>
  );
};

export default App;