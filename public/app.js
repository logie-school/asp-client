let isLoaded = false;




let tabContents = {};
let tabCounter = 0;
let tabs = JSON.parse(localStorage.getItem('tabs')) || [];

function showNotification(message, type = 'info', duration = 5000) {

  actualDuration = duration + 500;

  const notificationContainer = document.getElementById('notificationContainer');
  
  let color, colorLight, timerColor;

  const notification = document.createElement('div');
  notification.className = 'notification';
  
  const messageElem = document.createElement('span');
  messageElem.className = 'message';
  messageElem.textContent = message;
  
  const iconElem = document.createElement('i');
  switch (type) {
      case 'warning':
          color = '#FFA500';
          colorLight = '#FFA50011';
          timerColor = '#FFA500';
          iconElem.className = 'fi fi-rr-triangle-warning';
          break;
      case 'success':
          color = '#28a745';
          colorLight = '#28a74511';
          timerColor = '#28a745';
          iconElem.className = 'fi fi-rr-check';
          break;
      case 'error':
          color = '#FF0000';
          colorLight = '#FF000011';
          timerColor = '#FF0000';
          iconElem.className = 'fi fi-rr-octagon-xmark';
          break;
      case 'info':
      default:
          color = '#007bff';
          colorLight = '#007bff11';
          timerColor = '#007bff';
          iconElem.className = 'fi fi-rr-info';
          break;
  }
  
  iconElem.style.color = color;
  notification.style.color = color;
  notification.style.borderColor = color;
  notification.style.backgroundColor = colorLight;
  notification.style.borderColor = color;
  notification.style.setProperty('--timer-color', timerColor); // Set CSS variable
  notification.style.setProperty('--timer-time', `${duration}ms`); // Set CSS variable with 'ms' unit

  notification.appendChild(iconElem);
  notification.appendChild(messageElem);
  notificationContainer.appendChild(notification);
  
  setTimeout(() => {
      notification.className = 'notification-fadein notification';
  }, 10);

  setTimeout(() => {
      notification.className = 'notification-fadeout notification';
  }, actualDuration - 500);

  setTimeout(() => {
      notificationContainer.removeChild(notification);
  }, actualDuration);
}

document.addEventListener('DOMContentLoaded', (event) => {
  console.log('DOM fully loaded and parsed');

  const closeBtn = document.getElementById('closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.api.send('closeApp');
    });
  }

  const maximizeBtn = document.getElementById('maximizeBtn');
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      window.api.send('maximizeApp');
    });
  }

  const minimizeBtn = document.getElementById('minimizeBtn');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      window.api.send('minimizeApp');
    });
  }

  document.querySelectorAll('.sidebar-button').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-button').forEach(btn => {
        btn.classList.remove('sidebar-button-active');
        btn.querySelector('.sidebar-button-active-indicator').classList.remove('sidebar-button-active-indicator-active');
      });
      button.classList.add('sidebar-button-active');
      button.querySelector('.sidebar-button-active-indicator').classList.add('sidebar-button-active-indicator-active');

      // Update active section
      const sectionId = button.getAttribute('section-id-link');
      document.querySelectorAll('section').forEach(section => {
        section.classList.remove('active-section');
      });
      const activeSection = document.getElementById(sectionId);
      if (activeSection) {
        activeSection.classList.add('active-section');
      }
    });
  });

  document.querySelectorAll('.toolbar-dropdown-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', (event) => {
      const dropdownContent = wrapper.querySelector('.dropdown-content');
      const isActive = dropdownContent.classList.contains('dropdown-content-active');

      document.querySelectorAll('.dropdown-content').forEach(content => {
        content.classList.remove('dropdown-content-active');
        content.parentElement.classList.remove('toolbar-dropdown-wrapper-active');
      });

      if (!isActive) {
        dropdownContent.classList.add('dropdown-content-active');
        wrapper.classList.add('toolbar-dropdown-wrapper-active');
      }
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.toolbar-dropdown-wrapper')) {
      document.querySelectorAll('.dropdown-content').forEach(content => {
        content.classList.remove('dropdown-content-active');
        content.parentElement.classList.remove('toolbar-dropdown-wrapper-active');
      });
    }
  });

  // Function to save the current state of tabs and tabCounter to localStorage
  function saveTabsState() {
    localStorage.setItem('tabs', JSON.stringify(tabs));
    localStorage.setItem('tabCounter', tabCounter);
  }

  // Function to load the tabs state and tabCounter from localStorage
  function loadTabsState() {
    const savedTabs = JSON.parse(localStorage.getItem('tabs')) || [];
    const savedTabCounter = localStorage.getItem('tabCounter');
    if (savedTabCounter !== null) {
      tabCounter = parseInt(savedTabCounter, 10);
    }
    if (savedTabs.length > 0) {
      savedTabs.forEach(tab => {
        addTab(tab.id, tab.name, tab.filePath, tab.tabContent, tab.isTemp);
      });
      const savedActiveTabId = localStorage.getItem('activeTabId');
      if (savedActiveTabId) {
        setActiveTab(savedActiveTabId);
      }
    } else {
      window.setMonacoText('--no tabs open, click the "+" to open a new tab or load a file via the file explorer or load file button');
    }
    scrollToActiveTab();

    isLoaded = true;
  }

  // Function to add a new tab
  function addTab(id, name, filePath, tabContent, isTemp = false) {
    let tabsWrapper = document.querySelector('.tabs-wrapper');
    let tabsElement = document.querySelector('.tabs');

    // Create the .tabs element if it doesn't exist
    if (!tabsElement) {
        tabsElement = document.createElement('div');
        tabsElement.classList.add('tabs');
        tabsWrapper.appendChild(tabsElement);
    }

    // Store the tab content in the global object
    tabContents[id] = tabContent;

    let newTabHTML = `
        <div class="tab" data-tab-id="${id}" data-file-path="${filePath}" ${isTemp ? 'data-temp-tab="true"' : ''}>
            <div class="tab-name pr-8">${name}</div>
        </div>
    `;
    tabsElement.insertAdjacentHTML('beforeend', newTabHTML);

    tabsWrapper.scrollLeft = tabsElement.scrollWidth;

    // Attach a click listener to the newly created tab
    let createdTab = tabsElement.querySelector(`.tab[data-tab-id="${id}"]`);
    createdTab.addEventListener('click', (e) => {
        // Only set tab active if NOT clicking the close button
        if (!e.target.closest('.tab-close')) {
            setActiveTab(id);
        }
    });

    // Ensure close button only triggers the close logic and not setActiveTab
    let closeButton = createdTab.querySelector('.tab-close');
    if (closeButton) {
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent the click event from bubbling to the tab's click listener
            let closedTab = e.currentTarget.closest('.tab');
            let wasActive = closedTab.classList.contains('active');

            closeTab(closeButton);

            // If the closed tab was active, make the next tab (or last tab) active
            if (wasActive) {
                let nextTab = closedTab.nextElementSibling;
                if (nextTab) {
                    setActiveTab(nextTab.dataset.tabId);
                } else {
                    let remainingTabs = tabsElement.querySelectorAll('.tab');
                    if (remainingTabs.length) {
                        setActiveTab(remainingTabs[remainingTabs.length - 1].dataset.tabId);
                    }
                }
            }
        });
    }
}


  // Function to create a new file tab
  window.newFileTab = async function(filePath, fileName) {
    tabCounter++; // Ensure tabCounter is unique for each tab
    try {
      const content = await window.api.invoke('readFile', filePath);
  
      // Check if a tab with the same filePath already exists
      const existingTab = tabs.find(tab => tab.filePath === filePath);
      if (existingTab) {
        console.warn(`Tab for file "${filePath}" already exists. Switching to it.`);
        setActiveTab(existingTab.id);
        return;
      }
  
      // Add the new tab to the UI
      addTab(tabCounter, fileName, filePath, content, false);
  
      // Add the new tab to the tabs array with a unique ID
      tabs.push({
        id: tabCounter,
        name: fileName,
        filePath,
        tabContent: content,
        isTemp: false
      });
  
      // Set the new tab as active
      setActiveTab(tabCounter);
  
      // Update the editor content after the tab is set as active
      window.setMonacoText(content);
  
      // Save the updated tabs state to localStorage
      localStorage.setItem('tabs', JSON.stringify(tabs));
      localStorage.setItem('activeTabId', tabCounter);
    } catch (err) {
      console.error('Error reading file:', err);
      showNotification('Error reading file', 'error', 5000);
    }
  
    saveTabsState();
  };
  
  window.newTab = function () {
    if (!isLoaded) {
      console.warn('Cannot create a new tab until everything is fully loaded.');
      return;
    }
  
    tabCounter++;
    const tabName = `new tab`;
    const tabContent = `-- ${tabName}`;
  
    // Add the new tab to the tabs array
    tabs.push({ id: tabCounter, name: tabName, filePath: '', tabContent, isTemp: true });
  
    // Add the new tab to the UI
    addTab(tabCounter, tabName, '', tabContent, true);
  
    // Set the new tab as active
    setActiveTab(tabCounter);
  
    // Save the tabs state to localStorage
    localStorage.setItem('tabs', JSON.stringify(tabs));
    localStorage.setItem('activeTabId', tabCounter);
    saveTabsState();
  };

  window.setActiveTab = function(tabId) {
    console.log('Setting active tab:', tabId);
  
    // Remove the active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active-tab'));
  
    // Add the active class to the selected tab
    const activeTab = document.querySelector(`.tab[data-tab-id="${tabId}"]`);
    if (activeTab) {
      activeTab.classList.add('active-tab');
  
      // Find the tab data for the selected tab
      const tabData = tabs.find(tab => tab.id == tabId);
      if (tabData) {
        // Set the editor content to the selected tab's content
        const contentToSet = tabData.tabContent || ''; // Ensure empty tabs are handled
        window.setMonacoText(contentToSet);
      } else {
        console.error('No tab data found for the active tab.');
      }
  
      // Save the active tab ID to localStorage
      localStorage.setItem('activeTabId', tabId);
    } else {
      console.error('No active tab found.');
      // If no active tab is found, clear the editor
      window.setMonacoText('--no tabs open, click the "+" to open a new tab or load a file via the file explorer or load file button');
    }
  };

  // Modified closeTab function to use saveTabsState
  window.closeTab = function(tabElement) {
    if (!tabElement) {
      console.error('No tab element provided.');
      return;
    }
  
    let tabId = tabElement.getAttribute('data-tab-id');
    let wasActive = tabElement.classList.contains('active-tab');
    let nextTab = getNextTabToActivate(tabId);
  
    tabElement.remove();
    tabs = tabs.filter(t => t.id != tabId);
  
    if (!tabs.length) {
      tabCounter = 0;
    }
  
    localStorage.setItem('tabs', JSON.stringify(tabs));
    localStorage.setItem('tabCounter', tabCounter);
    saveTabsState();
  
    if (wasActive && nextTab) {
      setActiveTab(nextTab.getAttribute('data-tab-id'));
    } else if (!tabs.length) {
      checkTabs();
    }
  };

  // Function to get the next tab to activate
  function getNextTabToActivate(closedTabId) {
    let tabs = document.querySelectorAll('.tab');
    let closedTabIndex = Array.from(tabs).findIndex(tab => tab.getAttribute('data-tab-id') === closedTabId);

    if (closedTabIndex >= 0 && closedTabIndex < tabs.length - 1) {
      return tabs[closedTabIndex + 1];
    } else if (closedTabIndex > 0) {
      return tabs[closedTabIndex - 1];
    }
    return null;
  }

  // New tab switching code
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (event) => {
      if (!event.target.closest('.tab-close')) {
        handleTabClick(event);
      }
    });
  });

  function handleTabClick(event) {
    if (!event.target.closest('.tab-close')) {
      const tab = event.currentTarget;
      const tabId = tab.getAttribute('data-tab-id');
      setActiveTab(tabId);
    }
  }

  function scrollToActiveTab() {
    const activeTab = document.querySelector('.active-tab');
    if (activeTab) {
      const tabsWrapper = document.querySelector('.tabs-wrapper');
      const tabLeft = activeTab.offsetLeft;
      const tabRight = tabLeft + activeTab.offsetWidth;
      const wrapperLeft = tabsWrapper.scrollLeft;
      const wrapperRight = wrapperLeft + tabsWrapper.clientWidth;

      if (tabLeft < wrapperLeft) {
        tabsWrapper.scrollLeft = tabLeft;
      } else if (tabRight > wrapperRight) {
        tabsWrapper.scrollLeft = tabRight - tabsWrapper.clientWidth;
      }
    }
  }

  document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 't') {
        event.preventDefault();
        newTab();
    // } else if (event.ctrlKey && event.key === 'w') {
    //     event.preventDefault();
    //     // Notify the main process about Ctrl+W
    //     window.api.send('ctrlWPressed');
    } else if (event.ctrlKey && event.key === 'Tab') {
        event.preventDefault();
        navigateTabs(event.shiftKey ? -1 : 1);
    } else if (event.key === 'F2') {
        event.preventDefault();
        const activeTab = document.querySelector('.active-tab');
        if (activeTab) {
            renameTab(activeTab);
        } else {
            console.error('No active tab found.');
        }
    }
});

// Listen for the 'ctrlWPressed' event from the main process
window.api.receive('ctrlWPressed', () => {
    closeActiveTab();

    const contextMenu = document.getElementById('contextMenu');
    if (contextMenu) {
        contextMenu.style.opacity = '0';
        contextMenu.style.pointerEvents = 'none';
        contextMenu.style.transform = 'translateY(10px)';
    }
});

  function navigateTabs(direction) {
    const tabs = Array.from(document.querySelectorAll('.tab'));
    const activeTab = document.querySelector('.active-tab');
    let newIndex = tabs.findIndex(tab => tab === activeTab) + direction;

    if (newIndex >= tabs.length) {
      newIndex = 0;
    } else if (newIndex < 0) {
      newIndex = tabs.length - 1;
    }

    setActiveTab(tabs[newIndex].getAttribute('data-tab-id'));
  }

  document.querySelector('.tabs-wrapper').addEventListener('wheel', function(event) {
    event.preventDefault();
    this.scrollLeft += event.deltaY;
  });

  // Function to check if there are any tabs open
  function checkTabs() {
    console.log('Checking tabs');
    // if no tabs are open show the default message
    if (!document.querySelector('.tab')) {    
      window.setMonacoText('--no tabs open, click the "+" to open a new tab or load a file via the file explorer or load file button');
    }
  }


  // Call the function on page load to check the initial state
  window.addEventListener('load', () => {
    loadTabsState();
    checkTabs();
  });

  // Listen for config update status messages
  window.api.receive('configUpdateStatus', (status) => {
    if (status === 'success') {
      showNotification('Updated script directory', 'info', 5000);
    } else if (status === 'failure') {
      showNotification('Failed to update script directory', 'error', 5000);
    }
  });
});

// Ensure this code is added after the Monaco editor is initialized

// Assuming `window.editor` is your Monaco editor instance
window.editor.onDidChangeModelContent(() => {
  const activeTab = document.querySelector('.active-tab');
  if (!activeTab) {
    console.error('No active tab found.');
    return;
  }

  const tabId = activeTab.getAttribute('data-tab-id');
  const tabData = tabs.find(tab => tab.id == tabId);
  if (!tabData) {
    console.error('No tab data found for the active tab.');
    return;
  }

  // Get the updated content from the Monaco editor
  const updatedContent = window.editor.getValue();

  // Only update the tab's content if it has changed
  if (tabData.tabContent !== updatedContent) {
    tabData.tabContent = updatedContent;

    // Save the updated `tabs` array to localStorage
    localStorage.setItem('tabs', JSON.stringify(tabs));

    console.log(`Updated content for tab ID ${tabId} saved to localStorage.`);
  }
});

function closeActiveTab() {
  const activeTab = document.querySelector('.active-tab');
  if (activeTab) {
    closeTab(activeTab); // Pass the active tab element directly
  } else {
    console.error('No active tab found.');
  }
}

// resize script area
document.addEventListener('DOMContentLoaded', () => {
  const resizableBox = document.getElementById('scriptsExplorerWrapper');
  const minWidth = 200;
  const maxWidth = 440;

  if (!resizableBox) {
      console.error('Element with ID "scriptsExplorerWrapper" not found.');
      return;
  }

  let isResizing = false;

  resizableBox.addEventListener('mousedown', (e) => {
      // Check if the click is within the ::after area
      const boxRect = resizableBox.getBoundingClientRect();
      if (e.clientX >= boxRect.right - 10 && e.clientX <= boxRect.right) {
          isResizing = true;
          document.body.style.cursor = 'ew-resize';
      }
  });

  document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX - resizableBox.getBoundingClientRect().left;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
          resizableBox.style.minWidth = `${newWidth}px`;
          resizableBox.style.width = `${newWidth}px`;
          window.editor.layout();
          checkWidth()
      }
  });

  document.addEventListener('mouseup', () => {
      isResizing = false;
      document.body.style.cursor = 'default';
  });

  // checker for script buttons box width
  const scriptsButtons = document.querySelector('.scripts-buttons');

  function checkWidth() {
    if (scriptsButtons.offsetWidth < 543) {
        scriptsButtons.classList.add('script-buttons-small');
        scriptsButtons.querySelectorAll('.scripts-button').forEach(child => {
            child.classList.remove('dont-show-tooltip');
        });
    } else {
        scriptsButtons.classList.remove('script-buttons-small');
        scriptsButtons.querySelectorAll('.scripts-button').forEach(child => {
            child.classList.add('dont-show-tooltip');
        });
    }
  }

  // Initial check
  checkWidth();

  // Check on window resize
  window.addEventListener('resize', checkWidth);
});

async function changeDirectory(newPath) {
  closeChangeDirectoryOverlay();
  window.api.send('validateFetchFileExplorer', newPath);
  document.getElementById('changeDirectoryInput').value = '';
}

async function openFolderDialog() {
  const selectedFolder = await window.api.invoke('openFolderDialog');
  if (selectedFolder) {
    document.getElementById('changeDirectoryInput').value = selectedFolder;
  }
}

window.api.receive('sendNotif', (message, type, duration) => {
  showNotification(message, type, duration);
});

function clearScriptsExplorerSearch() {
  document.getElementById('scriptsExplorerSearch').value = '';
  handleSearch('')
}

function refreshFileExplorer() {
  window.api.invoke('refreshFileExplorer');
}

function clearEditor() {
  window.setMonacoText("-- cleared editor, can't be undone");
}

window.clearEditor = clearEditor;


function viewSection(sectionId) {
  document.querySelectorAll('.sidebar-button').forEach(button => {
    button.classList.remove('sidebar-button-active');
    button.querySelector('.sidebar-button-active-indicator').classList.remove('sidebar-button-active-indicator-active');
  });

  const button = document.querySelector(`.sidebar-button[section-id-link="${sectionId}"]`);
  if (button) {
    button.classList.add('sidebar-button-active');
    button.querySelector('.sidebar-button-active-indicator').classList.add('sidebar-button-active-indicator-active');
  }

  document.querySelectorAll('section').forEach(section => {
    section.classList.remove('active-section');
  });

  const activeSection = document.getElementById(sectionId);
  if (activeSection) {
    activeSection.classList.add('active-section');
  }
}

// Expose the function to the global scope
window.viewSection = viewSection;



let isEditingTab = false;

// document.addEventListener('mousedown', function(event) {
//   const tabName = event.target.closest('.tab-name');
//   const tab = event.target.closest('.tab');

//   if (tabName && tab && !isEditingTab) {
//     const wasActive = tab.classList.contains('active-tab');

//     tab.addEventListener('click', function handleClick() {
//       if (wasActive) {
//         console.log('Clicked on a .tab-name inside an active .tab');
//         // Your logic here

//         // Add renaming functionality
//         const currentName = tabName.textContent;
//         const input = document.createElement('input');
//         input.type = 'text';
//         input.value = currentName;
//         input.classList.add('tab-rename-input');

//         tabName.textContent = '';
//         tabName.appendChild(input);
//         input.focus();
//         isEditingTab = true;

//         const cancelRename = () => {
//           tabName.textContent = currentName;
//           input.removeEventListener('blur', handleBlur);
//           input.removeEventListener('keydown', handleKeyDown);
//           isEditingTab = false;
//         };

//         const handleBlur = () => {
//           const newName = input.value.trim();
//           if (newName && newName !== currentName) {
//             tabName.textContent = newName;
//             updateTabNameInLocalStorage(tab.dataset.tabId, newName);
//           } else if (!newName) {
//             showNotification("tab name can't be empty", 'warning', 3000);
//             cancelRename();
//           } else {
//             tabName.textContent = currentName;
//           }
//           isEditingTab = false;
//         };

//         const handleKeyDown = (event) => {
//           if (event.key === 'Enter') {
//             input.blur();
//           } else if (event.key === 'Escape') {
//             cancelRename();
//           }
//         };

//         input.addEventListener('blur', handleBlur);
//         input.addEventListener('keydown', handleKeyDown);
//       }
//       tab.removeEventListener('click', handleClick);
//     });
//   }
// });

function updateTabNameInLocalStorage(tabId, newName) {
  const tabData = tabs.find(tab => tab.id == tabId);
  if (tabData) {
    tabData.name = newName;
    localStorage.setItem('tabs', JSON.stringify(tabs));
  }
}

function loadFile() {
  window.api.invoke('loadFile');
}

window.loadFile = loadFile;

window.api.receive('loadFileContent', (filePath) => {
  console.log('loadFileContent', filePath);
  // Extract the file name from the file path using regex
  const fileNameMatch = filePath.match(/[^\\/]+$/);
  const fileName = fileNameMatch ? fileNameMatch[0] : filePath; // Use the matched file name or fallback to the full path
  window.newFileTab(filePath, fileName, true); // Use the file name for the new tab
  loadFileContent(filePath);
});

function executeScript() {
  // Retrieve PIDs from localStorage
  const pidRaw = localStorage.getItem('pids');
  const pids = JSON.parse(pidRaw); // Parse the PIDs from localStorage

  if (!pids || !Array.isArray(pids) || pids.length === 0) {
    showNotification('Please set valid PIDs in settings.', 'error', 5000);
    console.error('PIDs are missing or invalid in localStorage.');
    return;
  }

  // Get data content from active editor and print it
  const activeTab = document.querySelector('.active-tab');
  if (!activeTab) {
    showNotification('No active tab found.', 'error', 5000);
    console.error('No active tab found.');
    return;
  }

  const tabId = activeTab.getAttribute('data-tab-id');
  const tabData = tabs.find(tab => tab.id == tabId);
  if (!tabData) {
    showNotification('No tab data found.', 'error', 5000);
    console.error('No tab data found.');
    return;
  }

  const scriptContent = tabData.tabContent;
  console.log('Executing script:', scriptContent);
  console.log('PIDs:', pids); // Log all PIDs

  // Send the script content and all PIDs to the main process
  window.api.send('executeScript', scriptContent, pids);
  showNotification('Executing script...', 'info', 5000);
}

window.api.receive('updateId', (newPids) => {
  console.log('Received PIDs from main process:', newPids);

  // Ensure newPids is an array before storing it
  if (Array.isArray(newPids)) {
    localStorage.setItem('pids', JSON.stringify(newPids));
    console.log('Updated PIDs in localStorage:', newPids);
  } else {
    console.error('Received PIDs are not in array format:', newPids);
    // Optionally, wrap it in an array if needed
    localStorage.setItem('pids', JSON.stringify([newPids]));
    console.log('Stored PIDs as an array in localStorage:', [newPids]);
  }
});




// Handle right-click on tabs
const tabsWrapper = document.querySelector('.tabs-wrapper');
let activeContextMenu = document.getElementById('contextMenu'); // Reference to the existing context menu

if (!activeContextMenu) {
  // Create the context menu if it doesn't exist
  activeContextMenu = document.createElement('div');
  activeContextMenu.id = 'contextMenu';
  activeContextMenu.classList.add('context-menu');
  activeContextMenu.style.position = 'absolute';
  activeContextMenu.style.display = 'flex';
  activeContextMenu.style.flexDirection = 'column';
  activeContextMenu.style.backgroundColor = '#0a0a0a';
  activeContextMenu.style.opacity = '0';
  activeContextMenu.style.pointerEvents = 'none';
  activeContextMenu.style.transition = 'opacity 0.2s, transform 0.2s';
  activeContextMenu.style.border = '1px solid #ffffff11';
  activeContextMenu.style.color = '#ffffff';
  activeContextMenu.style.zIndex = '1000';
  activeContextMenu.style.boxShadow = '0 0 20px 1px rgba(0, 0, 0, 0.2)';
  activeContextMenu.style.padding = '10px';
  activeContextMenu.style.borderRadius = '5px';
  activeContextMenu.style.transform = 'translateY(10px)';
  document.body.appendChild(activeContextMenu);
}

tabsWrapper.addEventListener('contextmenu', (event) => {
  const tab = event.target.closest('.tab');
  if (tab) {
    event.preventDefault();

    // Set the right-clicked tab as active
    const tabId = tab.getAttribute('data-tab-id');
    setActiveTab(tabId);

    // Fade out the context menu
    activeContextMenu.style.opacity = '0';
    activeContextMenu.style.pointerEvents = 'none';
    activeContextMenu.style.transform = 'translateY(10px)';

    // Wait 100ms before updating the position and content
    setTimeout(() => {
      // Update the context menu content
      const tabName = tab.querySelector('.tab-name').textContent;
      const tabId = tab.getAttribute('data-tab-id');

      // Retrieve the tab data from the global `tabs` array
      const tabData = tabs.find(t => t.id == tabId);
      const isTemp = tabData ? tabData.isTemp : true; // Default to true if tab data is not found

      // Generate the context menu content based on `isTemp`
      activeContextMenu.innerHTML = `
        <div class="rcm-tab-wrapper">
            <div class="rcm-tab-header">
                <div class="rcm-tab-name">${tabName}</div>
                <div class="rcm-tab-separator"></div>
                <div class="rcm-tab-id" data-tooltip="tab id">${tabId}</div>
            </div>
            <div class="rcm-tab-actions">
                <div class="rcm-tab-action" id="rcm-tab-rename">
                    <i class="sidebar-button-icon iconsax" icon-name="edit-2"></i>
                    <div class="rcm-tab-action-text">rename</div>
                </div>
                <div class="rcm-tab-action" id="rcm-tab-save" onclick="saveFile()">
                    <i class="sidebar-button-icon iconsax" icon-name="document-code-1"></i>
                    <div class="rcm-tab-action-text">save as</div>
                </div>
                <div class="rcm-tab-action" id="rcm-tab-${isTemp ? 'delete' : 'close'}" onclick="closeActiveTab()" ${isTemp ? 'data-tooltip="cant be undone"' : ''}>
                    <i class="sidebar-button-icon iconsax" icon-name="${isTemp ? 'trash' : 'x-circle'}"></i>
                    <div class="rcm-tab-action-text">${isTemp ? 'delete' : 'close'}</div>
                </div>
            </div>
            <div class="rcm-tab-type">
              ${isTemp ? 'temporary tab' : 'file tab'}
            </div>
        </div>`;

      // Calculate the position of the context menu
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const menuRect = activeContextMenu.getBoundingClientRect();

      let left = event.pageX + 10;
      let top = event.pageY + 10;

      // Adjust the position to prevent the menu from going offscreen
      if (left + menuRect.width > viewportWidth - 10) {
        left = viewportWidth - menuRect.width - 10;
      }
      if (top + menuRect.height > viewportHeight - 10) {
        top = viewportHeight - menuRect.height - 10;
      }

      // Update the position of the context menu
      activeContextMenu.style.left = `${left}px`;
      activeContextMenu.style.top = `${top}px`;

      // Fade in the context menu
      setTimeout(() => {
        activeContextMenu.style.opacity = '1';
        activeContextMenu.style.pointerEvents = 'all';
        activeContextMenu.style.transform = 'translateY(0)';
      }, 10);

      // Add event listeners for context menu actions
      const renameButton = activeContextMenu.querySelector('#rcm-tab-rename');
      renameButton.addEventListener('click', () => {
        renameTab(tab);
        hideContextMenu();
      });

      const deleteOrCloseButton = activeContextMenu.querySelector(`#rcm-tab-${isTemp ? 'delete' : 'close'}`);
      deleteOrCloseButton.addEventListener('click', () => {
        const activeTabCloseBtn = tab.querySelector('.tab-close');
        if (activeTabCloseBtn) {
          closeTab(activeTabCloseBtn);
        }
        hideContextMenu();
      });
    }, 100);

    // Hide the context menu on click elsewhere
    const hideContextMenu = () => {
      activeContextMenu.style.opacity = '0';
      activeContextMenu.style.pointerEvents = 'none';
      activeContextMenu.style.transform = 'translateY(10px)';
    };

    document.addEventListener('click', (event) => {
      if (!event.target.closest('#contextMenu')) {
        hideContextMenu();
      }
    }, { once: true });
  }
});



function renameTab(tab) {
  if (!tab || isEditingTab) {
    console.error('No tab provided or already editing a tab.');
    return;
  }

  const tabName = tab.querySelector('.tab-name');
  if (!tabName) {
    console.error('Tab name element not found.');
    return;
  }

  const currentName = tabName.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.value = currentName;
  input.classList.add('tab-rename-input');

  tabName.textContent = '';
  tabName.appendChild(input);
  input.focus();
  isEditingTab = true;

  const cancelRename = () => {
    tabName.textContent = currentName;
    input.removeEventListener('blur', handleBlur);
    input.removeEventListener('keydown', handleKeyDown);
    isEditingTab = false;
  };

  window.renameTab = renameTab;

  const handleBlur = () => {
    const newName = input.value.trim();
    if (newName && newName !== currentName) {
      tabName.textContent = newName;
      updateTabNameInLocalStorage(tab.getAttribute('data-tab-id'), newName);
    } else if (!newName) {
      showNotification("Tab name can't be empty", 'warning', 3000);
      cancelRename();
    } else {
      tabName.textContent = currentName;
    }
    isEditingTab = false;
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      input.blur();
    } else if (event.key === 'Escape') {
      cancelRename();
    }
  };

  input.addEventListener('blur', handleBlur);
  input.addEventListener('keydown', handleKeyDown);
}

// Example usage in the context menu
const renameButton = activeContextMenu.querySelector('#rcm-tab-rename');
renameButton.addEventListener('click', () => {
  const activeTab = document.querySelector('.active-tab');
  if (activeTab) {
    renameTab(activeTab);
    hideContextMenu();
  } else {
    console.error('No active tab found.');
  }
});


function saveFile() {
  contextMenu = document.getElementById('contextMenu');
  if (contextMenu) {
    contextMenu.style.opacity = '0';
    contextMenu.style.pointerEvents = 'none';
    contextMenu.style.transform = 'translateY(10px)';
  }
  
  const activeTab = document.querySelector('.active-tab');
  if (!activeTab) {
    showNotification('no active tab found.', 'error', 5000);
    console.error('no active tab found.');
    return;
  }

  const tabId = activeTab.getAttribute('data-tab-id');
  const tabData = tabs.find(tab => tab.id == tabId);
  if (!tabData) {
    showNotification('no tab data found.', 'error', 5000);
    console.error('no tab data found.');
    return;
  }

  const tabName = tabData.name; // Keep the tab name as is, preserving spaces
  const content = tabData.tabContent;

  // Send the save request to the main process
  window.api.invoke('saveLuaFile', tabName, content).then(response => {
    if (response.success) {
      showNotification(`file saved successfully: ${response.filePath}`, 'success', 5000);
      refreshFileExplorer()
    } else {
      showNotification(`failed to save file: ${response.message}`, 'error', 5000);
    }
  }).catch(error => {
    console.error('error invoking saveLuaFile:', error);
    showNotification('an error occurred while saving the file.', 'error', 5000);
  });
}