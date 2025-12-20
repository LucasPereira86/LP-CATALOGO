/**
 * LP CATALOGOS - Main Application
 */

const App = {
    catalogs: [],
    folders: [],
    currentCatalog: null,
    currentFolder: null,
    editingFolder: null,
    deferredPrompt: null,

    // DOM Elements
    elements: {
        dropZone: null,
        emptyState: null,
        folderGrid: null,
        catalogGrid: null,
        uploadBtn: null,
        fileInput: null,
        newFolderBtn: null,
        searchToggle: null,
        searchBar: null,
        searchInput: null,
        clearSearch: null,
        breadcrumb: null,
        breadcrumbRoot: null,
        breadcrumbSeparator: null,
        breadcrumbCurrent: null,
        modal: null,
        modalTitle: null,
        pdfViewer: null,
        closeModal: null,
        moveBtn: null,
        shareBtn: null,
        deleteBtn: null,
        confirmDeleteOverlay: null,
        confirmDeleteName: null,
        cancelDeleteBtn: null,
        confirmDeleteBtn: null,
        folderModalOverlay: null,
        folderModal: null,
        folderModalTitle: null,
        folderNameInput: null,
        cancelFolderBtn: null,
        saveFolderBtn: null,
        moveModalOverlay: null,
        moveModal: null,
        moveModalContent: null,
        closeMoveModal: null,
        folderOptionsOverlay: null,
        folderOptions: null,
        renameFolderBtn: null,
        deleteFolderBtn: null,
        toastContainer: null,
        installPrompt: null,
        confirmInstall: null,
        dismissInstall: null
    },

    /**
     * Initialize the application
     */
    async init() {
        // Get DOM elements
        this.cacheElements();

        // Initialize storage
        await CatalogStorage.init();

        // Load data
        await this.loadFolders();
        await this.loadCatalogs();

        // Setup event listeners
        this.setupEventListeners();

        // Setup PWA
        this.setupPWA();

        // Setup share receiver (for receiving PDFs from other apps)
        this.setupShareReceiver();

        console.log('LP CATALOGOS inicializado');
    },



    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            dropZone: document.getElementById('dropZone'),
            emptyState: document.getElementById('emptyState'),
            folderGrid: document.getElementById('folderGrid'),
            catalogGrid: document.getElementById('catalogGrid'),
            uploadBtn: document.getElementById('uploadBtn'),
            fileInput: document.getElementById('fileInput'),
            newFolderBtn: document.getElementById('newFolderBtn'),
            searchToggle: document.getElementById('searchToggle'),
            searchBar: document.getElementById('searchBar'),
            searchInput: document.getElementById('searchInput'),
            clearSearch: document.getElementById('clearSearch'),
            breadcrumb: document.getElementById('breadcrumb'),
            breadcrumbRoot: document.getElementById('breadcrumbRoot'),
            breadcrumbSeparator: document.getElementById('breadcrumbSeparator'),
            breadcrumbCurrent: document.getElementById('breadcrumbCurrent'),
            modal: document.getElementById('pdfModal'),
            modalTitle: document.getElementById('modalTitle'),
            pdfViewer: document.getElementById('pdfViewer'),
            closeModal: document.getElementById('closeModal'),
            moveBtn: document.getElementById('moveBtn'),
            shareBtn: document.getElementById('shareBtn'),
            deleteBtn: document.getElementById('deleteBtn'),
            confirmDeleteOverlay: document.getElementById('confirmDeleteOverlay'),
            confirmDeleteName: document.getElementById('confirmDeleteName'),
            cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
            confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
            folderModalOverlay: document.getElementById('folderModalOverlay'),
            folderModal: document.getElementById('folderModal'),
            folderModalTitle: document.getElementById('folderModalTitle'),
            folderNameInput: document.getElementById('folderNameInput'),
            cancelFolderBtn: document.getElementById('cancelFolderBtn'),
            saveFolderBtn: document.getElementById('saveFolderBtn'),
            moveModalOverlay: document.getElementById('moveModalOverlay'),
            moveModal: document.getElementById('moveModal'),
            moveModalContent: document.getElementById('moveModalContent'),
            closeMoveModal: document.getElementById('closeMoveModal'),
            folderOptionsOverlay: document.getElementById('folderOptionsOverlay'),
            folderOptions: document.getElementById('folderOptions'),
            renameFolderBtn: document.getElementById('renameFolderBtn'),
            deleteFolderBtn: document.getElementById('deleteFolderBtn'),
            toastContainer: document.getElementById('toastContainer'),
            installPrompt: document.getElementById('installPrompt'),
            confirmInstall: document.getElementById('confirmInstall'),
            dismissInstall: document.getElementById('dismissInstall'),
            confirmDeleteFolderOverlay: document.getElementById('confirmDeleteFolderOverlay'),
            confirmDeleteFolderName: document.getElementById('confirmDeleteFolderName'),
            cancelDeleteFolderBtn: document.getElementById('cancelDeleteFolderBtn'),
            confirmDeleteFolderBtn: document.getElementById('confirmDeleteFolderBtn'),
            // PDF Options
            pdfOptionsOverlay: document.getElementById('pdfOptionsOverlay'),
            pdfOptionsTitle: document.getElementById('pdfOptionsTitle'),
            viewPdfBtn: document.getElementById('viewPdfBtn'),
            sharePdfBtn: document.getElementById('sharePdfBtn'),
            movePdfBtn: document.getElementById('movePdfBtn'),
            deletePdfBtn: document.getElementById('deletePdfBtn'),
            // Rename PDF Modal
            renamePdfModalOverlay: document.getElementById('renamePdfModalOverlay'),
            renamePdfInput: document.getElementById('renamePdfInput'),
            cancelRenamePdfBtn: document.getElementById('cancelRenamePdfBtn'),
            saveRenamePdfBtn: document.getElementById('saveRenamePdfBtn')
        };
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Upload button
        this.elements.uploadBtn.addEventListener('click', () => {
            this.elements.fileInput.click();
        });

        // File input change
        this.elements.fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
            e.target.value = ''; // Reset input
        });

        // Drag and drop
        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.add('active');
        });

        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('dragleave', (e) => {
            if (e.relatedTarget === null || !document.contains(e.relatedTarget)) {
                this.elements.dropZone.classList.remove('active');
            }
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.elements.dropZone.classList.remove('active');
            this.handleFiles(e.dataTransfer.files);
        });

        // New folder button
        this.elements.newFolderBtn.addEventListener('click', () => {
            this.openFolderModal();
        });

        // Folder modal
        this.elements.cancelFolderBtn.addEventListener('click', () => {
            this.closeFolderModal();
        });

        this.elements.saveFolderBtn.addEventListener('click', () => {
            this.saveFolder();
        });

        this.elements.folderModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.folderModalOverlay) {
                this.closeFolderModal();
            }
        });

        this.elements.folderNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveFolder();
            }
        });

        // Breadcrumb navigation
        this.elements.breadcrumbRoot.addEventListener('click', () => {
            this.goToRoot();
        });

        // Search toggle
        this.elements.searchToggle.addEventListener('click', () => {
            this.elements.searchBar.classList.toggle('active');
            if (this.elements.searchBar.classList.contains('active')) {
                this.elements.searchInput.focus();
            }
        });

        // Search input
        this.elements.searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        // Clear search
        this.elements.clearSearch.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this.handleSearch('');
        });

        // Modal close
        this.elements.closeModal.addEventListener('click', () => {
            this.closeViewer();
        });

        // Move button
        this.elements.moveBtn.addEventListener('click', () => {
            this.openMoveModal();
        });

        // Close move modal
        this.elements.closeMoveModal.addEventListener('click', () => {
            this.closeMoveModal();
        });

        this.elements.moveModalOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.moveModalOverlay) {
                this.closeMoveModal();
            }
        });

        // Share button
        this.elements.shareBtn.addEventListener('click', () => {
            this.shareCatalog();
        });

        // Delete button - opens confirm modal
        this.elements.deleteBtn.addEventListener('click', () => {
            this.openConfirmDelete();
        });

        // Confirm delete modal
        this.elements.cancelDeleteBtn.addEventListener('click', () => {
            this.closeConfirmDelete();
        });

        this.elements.confirmDeleteBtn.addEventListener('click', () => {
            this.confirmDeleteCatalog();
        });

        this.elements.confirmDeleteOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.confirmDeleteOverlay) {
                this.closeConfirmDelete();
            }
        });

        // Folder options
        this.elements.folderOptionsOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.folderOptionsOverlay) {
                this.closeFolderOptions();
            }
        });

        this.elements.renameFolderBtn.addEventListener('click', () => {
            this.closeFolderOptions();
            this.openFolderModal(this.editingFolder);
        });

        this.elements.deleteFolderBtn.addEventListener('click', () => {
            this.closeFolderOptions();
            this.openConfirmDeleteFolder(this.editingFolder);
        });

        // Confirm delete folder modal
        this.elements.cancelDeleteFolderBtn.addEventListener('click', () => {
            this.closeConfirmDeleteFolder();
        });

        this.elements.confirmDeleteFolderBtn.addEventListener('click', () => {
            this.confirmDeleteFolder();
        });

        this.elements.confirmDeleteFolderOverlay.addEventListener('click', (e) => {
            if (e.target === this.elements.confirmDeleteFolderOverlay) {
                this.closeConfirmDeleteFolder();
            }
        });

        // Handle back button
        window.addEventListener('popstate', () => {
            if (this.elements.modal.classList.contains('active')) {
                this.closeViewer();
            } else if (this.currentFolder !== null) {
                this.goToRoot();
            }
        });

        // Install prompt buttons
        this.elements.confirmInstall.addEventListener('click', () => {
            this.installApp();
        });

        this.elements.dismissInstall.addEventListener('click', () => {
            this.elements.installPrompt.classList.remove('active');
            localStorage.setItem('installDismissed', 'true');
        });

        // PDF Options modal - with safety checks
        if (this.elements.pdfOptionsOverlay) {
            this.elements.pdfOptionsOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.pdfOptionsOverlay) {
                    this.closePdfOptions();
                }
            });
        }

        // Helper function to add touch and click support
        const addTouchClick = (element, handler) => {
            if (!element) return;

            let touchMoved = false;

            element.addEventListener('touchstart', () => {
                touchMoved = false;
            }, { passive: true });

            element.addEventListener('touchmove', () => {
                touchMoved = true;
            }, { passive: true });

            element.addEventListener('touchend', (e) => {
                if (!touchMoved) {
                    e.preventDefault();
                    handler();
                }
            });

            element.addEventListener('click', (e) => {
                // Only handle click if not a touch device or if touch didn't work
                if (!('ontouchend' in window)) {
                    handler();
                }
            });
        };

        addTouchClick(this.elements.viewPdfBtn, () => {
            this.closePdfOptions();
            if (this.selectedCatalogId) {
                this.openPdfInNewTab(this.selectedCatalogId);
            }
        });

        addTouchClick(this.elements.sharePdfBtn, async () => {
            this.closePdfOptions();
            if (this.selectedCatalogId) {
                const catalog = await CatalogStorage.getById(this.selectedCatalogId);
                if (catalog) {
                    this.currentCatalog = catalog;
                    await this.shareCatalog();
                }
            }
        });

        addTouchClick(this.elements.movePdfBtn, async () => {
            this.closePdfOptions();
            if (this.selectedCatalogId) {
                const catalog = await CatalogStorage.getById(this.selectedCatalogId);
                if (catalog) {
                    this.currentCatalog = catalog;
                    this.openMoveModal();
                }
            }
        });

        addTouchClick(this.elements.deletePdfBtn, async () => {
            this.closePdfOptions();
            if (this.selectedCatalogId) {
                const catalog = await CatalogStorage.getById(this.selectedCatalogId);
                if (catalog) {
                    this.currentCatalog = catalog;
                    this.openConfirmDelete();
                }
            }
        });

        // Rename PDF modal event listeners
        if (this.elements.renamePdfModalOverlay) {
            this.elements.renamePdfModalOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.renamePdfModalOverlay) {
                    this.closeRenamePdfModal();
                }
            });
        }

        if (this.elements.cancelRenamePdfBtn) {
            this.elements.cancelRenamePdfBtn.addEventListener('click', () => {
                this.closeRenamePdfModal();
            });
        }

        if (this.elements.saveRenamePdfBtn) {
            this.elements.saveRenamePdfBtn.addEventListener('click', () => {
                this.saveRenamePdf();
            });
        }

        if (this.elements.renamePdfInput) {
            this.elements.renamePdfInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.saveRenamePdf();
                }
            });
        }
    },

    /**
     * Setup PWA functionality
     */
    setupPWA() {
        // Cache update elements
        this.elements.updateBanner = document.getElementById('updateBanner');
        this.elements.updateBtn = document.getElementById('updateBtn');

        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js')
                .then(registration => {
                    console.log('Service Worker registrado:', registration.scope);

                    // Check for updates periodically (every 30 minutes)
                    setInterval(() => {
                        registration.update();
                    }, 30 * 60 * 1000);

                    // Listen for new service worker waiting
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener('statechange', () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    // New version available
                                    this.showUpdateBanner(newWorker);
                                }
                            });
                        }
                    });
                })
                .catch(error => {
                    console.log('Service Worker falhou:', error);
                });

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_ACTIVATED') {
                    console.log('Nova versão ativada:', event.data.version);
                }
            });

            // Handle controller change (when new SW takes over)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                // Reload to get the new version
                window.location.reload();
            });
        }

        // Handle install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;

            // Show install prompt if not dismissed
            if (!localStorage.getItem('installDismissed')) {
                setTimeout(() => {
                    this.elements.installPrompt.classList.add('active');
                }, 3000);
            }
        });

        // Handle successful install
        window.addEventListener('appinstalled', () => {
            this.elements.installPrompt.classList.remove('active');
            this.showToast('App instalado com sucesso!', 'success');
        });
    },

    /**
     * Show update banner
     */
    showUpdateBanner(newWorker) {
        this.pendingWorker = newWorker;
        this.elements.updateBanner.classList.add('active');

        // Handle update button click
        this.elements.updateBtn.addEventListener('click', () => {
            this.applyUpdate();
        }, { once: true });
    },

    /**
     * Apply the pending update
     */
    applyUpdate() {
        if (this.pendingWorker) {
            this.pendingWorker.postMessage({ type: 'SKIP_WAITING' });
        }
        this.elements.updateBanner.classList.remove('active');
    },

    /**
     * Install the app
     */
    async installApp() {
        if (!this.deferredPrompt) return;

        this.elements.installPrompt.classList.remove('active');

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('Usuário aceitou instalar');
        }

        this.deferredPrompt = null;
    },

    /**
     * Setup receiver for PDFs shared from other apps (WhatsApp, Gmail, etc.)
     */
    setupShareReceiver() {
        // Only setup on native platform (Capacitor)
        if (typeof Capacitor === 'undefined' || !Capacitor.isNativePlatform || !Capacitor.isNativePlatform()) {
            console.log('Share receiver: não está em plataforma nativa');
            return;
        }

        const { App, Filesystem } = Capacitor.Plugins;

        if (!App) {
            console.log('Share receiver: plugin App não disponível');
            return;
        }

        // Listen for app URL open events (includes share intents)
        App.addListener('appUrlOpen', async (data) => {
            console.log('App URL opened:', data);

            if (data.url) {
                await this.handleSharedFile(data.url);
            }
        });

        // Check for launch URL (app was opened via share)
        App.getLaunchUrl().then(async (ret) => {
            if (ret && ret.url) {
                console.log('App launched with URL:', ret.url);
                await this.handleSharedFile(ret.url);
            }
        }).catch(err => {
            console.log('No launch URL:', err);
        });

        // Alternative: Listen for state change to check for new intents
        App.addListener('appStateChange', async (state) => {
            if (state.isActive) {
                // Check for pending shared content when app becomes active
                try {
                    const ret = await App.getLaunchUrl();
                    if (ret && ret.url && ret.url !== this.lastProcessedUrl) {
                        this.lastProcessedUrl = ret.url;
                        await this.handleSharedFile(ret.url);
                    }
                } catch (err) {
                    // No pending URL
                }
            }
        });

        console.log('Share receiver configurado');
    },

    /**
     * Handle a shared file URL
     * @param {string} url - The file URL or content URI
     */
    async handleSharedFile(url) {
        try {
            console.log('Processando arquivo compartilhado:', url);

            // Check if it's a PDF by extension or content type
            const isPdf = url.toLowerCase().includes('.pdf') ||
                url.includes('application/pdf') ||
                url.startsWith('content://');

            if (!isPdf && !url.startsWith('content://')) {
                console.log('Arquivo não é PDF:', url);
                return;
            }

            const { Filesystem } = Capacitor.Plugins;

            if (!Filesystem) {
                this.showToast('Erro: plugin Filesystem não disponível', 'error');
                return;
            }

            // For content:// URIs, we need to read the file
            let fileData;
            let fileName = 'arquivo_compartilhado.pdf';

            // Extract filename from URL if possible
            const urlParts = url.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart && lastPart.includes('.pdf')) {
                fileName = decodeURIComponent(lastPart.split('?')[0]);
            }

            try {
                // Try to read the file using Filesystem plugin
                const result = await Filesystem.readFile({
                    path: url
                });

                if (result.data) {
                    // Convert base64 to ArrayBuffer
                    const binaryString = atob(result.data);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Create a File object
                    const file = new File([bytes], fileName, { type: 'application/pdf' });

                    // Add to storage
                    const catalog = await CatalogStorage.addFile(file, this.currentFolder);
                    this.catalogs.unshift(catalog);
                    this.renderCatalogs();
                    this.showToast(`"${catalog.name}" adicionado!`, 'success');
                }
            } catch (readError) {
                console.error('Erro ao ler arquivo:', readError);

                // Fallback: try using fetch for content:// URIs on some devices
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const blob = await response.blob();
                        const file = new File([blob], fileName, { type: 'application/pdf' });

                        const catalog = await CatalogStorage.addFile(file, this.currentFolder);
                        this.catalogs.unshift(catalog);
                        this.renderCatalogs();
                        this.showToast(`"${catalog.name}" adicionado!`, 'success');
                    }
                } catch (fetchError) {
                    console.error('Erro no fallback fetch:', fetchError);
                    this.showToast('Erro ao importar PDF', 'error');
                }
            }
        } catch (error) {
            console.error('Erro ao processar arquivo compartilhado:', error);
            this.showToast('Erro ao processar arquivo', 'error');
        }
    },

    // ========================================
    // FOLDER METHODS
    // ========================================

    /**
     * Load folders from storage
     */
    async loadFolders() {
        try {
            this.folders = await CatalogStorage.getAllFolders();
        } catch (error) {
            console.error('Erro ao carregar pastas:', error);
        }
    },

    /**
     * Render folders to the grid
     */
    renderFolders() {
        const { folderGrid } = this.elements;

        // Only show folders in root level
        if (this.currentFolder !== null) {
            folderGrid.classList.add('hidden');
            folderGrid.innerHTML = '';
            return;
        }

        if (this.folders.length === 0) {
            folderGrid.classList.add('hidden');
            folderGrid.innerHTML = '';
            return;
        }

        folderGrid.classList.remove('hidden');

        folderGrid.innerHTML = this.folders.map(folder => `
            <div class="folder-card" data-id="${folder.id}">
                <div class="folder-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                </div>
                <span class="folder-name" title="${folder.name}">${folder.name}</span>
            </div>
        `).join('');

        // Add click listeners to folder cards
        folderGrid.querySelectorAll('.folder-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = parseInt(card.dataset.id);
                this.openFolder(id);
            });

            // Long press for options (mobile)
            let pressTimer;
            card.addEventListener('touchstart', (e) => {
                pressTimer = setTimeout(() => {
                    e.preventDefault();
                    const id = parseInt(card.dataset.id);
                    this.openFolderOptions(id);
                }, 500);
            });

            card.addEventListener('touchend', () => {
                clearTimeout(pressTimer);
            });

            card.addEventListener('touchmove', () => {
                clearTimeout(pressTimer);
            });

            // Right click for options (desktop)
            card.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const id = parseInt(card.dataset.id);
                this.openFolderOptions(id);
            });
        });
    },

    /**
     * Open a folder
     */
    async openFolder(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;

        this.currentFolder = folderId;
        this.updateBreadcrumb(folder.name);

        // Add history state for back button
        history.pushState({ folder: folderId }, '');

        await this.loadCatalogs();
    },

    /**
     * Go back to root
     */
    async goToRoot() {
        this.currentFolder = null;
        this.updateBreadcrumb(null);
        await this.loadCatalogs();
    },

    /**
     * Update breadcrumb display
     */
    updateBreadcrumb(folderName) {
        const { breadcrumbRoot, breadcrumbSeparator, breadcrumbCurrent } = this.elements;

        if (folderName === null) {
            breadcrumbRoot.classList.add('active');
            breadcrumbSeparator.classList.add('hidden');
            breadcrumbCurrent.classList.add('hidden');
            breadcrumbCurrent.textContent = '';
        } else {
            breadcrumbRoot.classList.remove('active');
            breadcrumbSeparator.classList.remove('hidden');
            breadcrumbCurrent.classList.remove('hidden');
            breadcrumbCurrent.textContent = folderName;
        }
    },

    /**
     * Open folder modal for create/edit
     */
    openFolderModal(folder = null) {
        this.editingFolder = folder ? folder.id : null;
        this.elements.folderModalTitle.textContent = folder ? 'Renomear Pasta' : 'Nova Pasta';
        this.elements.folderNameInput.value = folder ? folder.name : '';
        this.elements.folderModalOverlay.classList.add('active');
        setTimeout(() => {
            this.elements.folderNameInput.focus();
        }, 100);
    },

    /**
     * Close folder modal
     */
    closeFolderModal() {
        this.elements.folderModalOverlay.classList.remove('active');
        this.elements.folderNameInput.value = '';
        this.editingFolder = null;
    },

    /**
     * Save folder (create or update)
     */
    async saveFolder() {
        const name = this.elements.folderNameInput.value.trim();
        if (!name) {
            this.showToast('Digite um nome para a pasta', 'error');
            return;
        }

        try {
            if (this.editingFolder !== null) {
                // Update existing folder
                await CatalogStorage.updateFolder(this.editingFolder, name);
                this.showToast('Pasta renomeada', 'success');
            } else {
                // Create new folder
                await CatalogStorage.addFolder(name);
                this.showToast('Pasta criada', 'success');
            }

            this.closeFolderModal();
            await this.loadFolders();
            this.renderFolders();
        } catch (error) {
            console.error('Erro ao salvar pasta:', error);
            this.showToast('Erro ao salvar pasta', 'error');
        }
    },

    /**
     * Open folder options menu
     */
    openFolderOptions(folderId) {
        const folder = this.folders.find(f => f.id === folderId);
        if (!folder) return;

        this.editingFolder = folder;
        this.elements.folderOptionsOverlay.classList.add('active');
    },

    /**
     * Close folder options menu
     */
    closeFolderOptions() {
        this.elements.folderOptionsOverlay.classList.remove('active');
    },

    /**
     * Open confirm delete folder modal
     */
    openConfirmDeleteFolder(folder) {
        if (!folder) return;
        this.folderToDelete = folder;
        this.elements.confirmDeleteFolderName.textContent = `"${folder.name}"`;
        this.elements.confirmDeleteFolderOverlay.classList.add('active');
    },

    /**
     * Close confirm delete folder modal
     */
    closeConfirmDeleteFolder() {
        this.elements.confirmDeleteFolderOverlay.classList.remove('active');
        this.folderToDelete = null;
    },

    /**
     * Confirm and execute folder deletion
     */
    async confirmDeleteFolder() {
        if (!this.folderToDelete) return;

        const folder = this.folderToDelete;
        this.closeConfirmDeleteFolder();

        try {
            await CatalogStorage.deleteFolder(folder.id);
            this.showToast('Pasta excluída', 'success');
            await this.loadFolders();
            this.renderFolders();
            await this.loadCatalogs();
        } catch (error) {
            console.error('Erro ao excluir pasta:', error);
            this.showToast('Erro ao excluir pasta', 'error');
        }
    },

    // ========================================
    // MOVE MODAL METHODS
    // ========================================

    /**
     * Open move to folder modal
     */
    openMoveModal() {
        if (!this.currentCatalog) return;

        const { moveModalContent } = this.elements;

        // Create folder list
        let html = `
            <button class="move-option ${this.currentCatalog.folderId === null ? 'current' : ''}" data-folder="null">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                <span>Início</span>
                ${this.currentCatalog.folderId === null ? '<span class="current-badge">Atual</span>' : ''}
            </button>
        `;

        for (const folder of this.folders) {
            const isCurrent = this.currentCatalog.folderId === folder.id;
            html += `
                <button class="move-option ${isCurrent ? 'current' : ''}" data-folder="${folder.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    </svg>
                    <span>${folder.name}</span>
                    ${isCurrent ? '<span class="current-badge">Atual</span>' : ''}
                </button>
            `;
        }

        moveModalContent.innerHTML = html;

        // Add click listeners
        moveModalContent.querySelectorAll('.move-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const folderId = btn.dataset.folder === 'null' ? null : parseInt(btn.dataset.folder);
                this.moveCatalogToFolder(folderId);
            });
        });

        this.elements.moveModalOverlay.classList.add('active');
    },

    /**
     * Close move modal
     */
    closeMoveModal() {
        this.elements.moveModalOverlay.classList.remove('active');
    },

    /**
     * Move current catalog to a folder
     */
    async moveCatalogToFolder(folderId) {
        if (!this.currentCatalog) return;

        try {
            await CatalogStorage.moveCatalog(this.currentCatalog.id, folderId);
            this.currentCatalog.folderId = folderId;

            const folderName = folderId === null ? 'Início' : this.folders.find(f => f.id === folderId)?.name;
            this.showToast(`Movido para ${folderName}`, 'success');

            this.closeMoveModal();
            this.closeViewer();
            await this.loadCatalogs();
        } catch (error) {
            console.error('Erro ao mover catálogo:', error);
            this.showToast('Erro ao mover catálogo', 'error');
        }
    },

    // ========================================
    // CATALOG METHODS
    // ========================================

    /**
     * Load catalogs from storage
     */
    async loadCatalogs() {
        try {
            this.catalogs = await CatalogStorage.getByFolder(this.currentFolder);
            this.renderFolders();
            this.renderCatalogs();
        } catch (error) {
            console.error('Erro ao carregar catálogos:', error);
            this.showToast('Erro ao carregar catálogos', 'error');
        }
    },

    /**
     * Handle file uploads
     * @param {FileList} files
     */
    async handleFiles(files) {
        const pdfFiles = Array.from(files).filter(file =>
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        );

        if (pdfFiles.length === 0) {
            this.showToast('Selecione apenas arquivos PDF', 'error');
            return;
        }

        for (const file of pdfFiles) {
            try {
                const catalog = await CatalogStorage.addFile(file, this.currentFolder);
                this.catalogs.unshift(catalog);
                this.showToast(`"${catalog.name}" adicionado`, 'success');
            } catch (error) {
                console.error('Erro ao adicionar arquivo:', error);
                this.showToast(`Erro ao adicionar "${file.name}"`, 'error');
            }
        }

        this.renderCatalogs();
    },

    /**
     * Handle search
     * @param {string} query
     */
    async handleSearch(query) {
        if (query.trim() === '') {
            await this.loadCatalogs();
        } else {
            this.catalogs = await CatalogStorage.search(query, this.currentFolder);
            this.renderCatalogs();
        }
    },

    /**
     * Render catalogs to the grid
     */
    renderCatalogs() {
        const { emptyState, catalogGrid, folderGrid } = this.elements;

        const hasContent = this.catalogs.length > 0 || (this.currentFolder === null && this.folders.length > 0);

        if (!hasContent) {
            emptyState.classList.remove('hidden');
            catalogGrid.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');

        if (this.catalogs.length === 0) {
            catalogGrid.classList.add('hidden');
            return;
        }

        catalogGrid.classList.remove('hidden');

        catalogGrid.innerHTML = this.catalogs.map(catalog => `
            <div class="catalog-card" data-id="${catalog.id}">
                <div class="card-preview">
                    <div class="pdf-icon">
                        <span>PDF</span>
                    </div>
                </div>
                <div class="card-info">
                    <div class="card-title" title="${catalog.name}">${catalog.name}</div>
                    <div class="card-meta">${CatalogStorage.formatSize(catalog.size)} • ${CatalogStorage.formatDate(catalog.createdAt)}</div>
                </div>
            </div>
        `).join('');

        // Add click listeners to cards
        catalogGrid.querySelectorAll('.catalog-card').forEach(card => {
            const id = parseInt(card.dataset.id);
            const name = card.querySelector('.card-title').textContent;

            card.addEventListener('click', () => {
                // On mobile, show options menu
                if (this.isMobile()) {
                    this.openPdfOptions(id, name);
                } else {
                    // On desktop, open viewer directly
                    this.openViewer(id);
                }
            });
        });
    },

    /**
     * Check if device is mobile
     */
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            (window.innerWidth <= 768);
    },

    /**
     * Open PDF viewer
     * @param {number} id - Catalog ID
     */
    async openViewer(id) {
        try {
            const catalog = await CatalogStorage.getById(id);
            if (!catalog) {
                this.showToast('Catálogo não encontrado', 'error');
                return;
            }

            console.log('Abrindo catálogo:', catalog.name);

            this.currentCatalog = catalog;

            // Get blob or create from data
            let blob = null;
            const data = catalog.data;

            // Create blob from data
            if (data instanceof ArrayBuffer || (data && data.byteLength !== undefined)) {
                blob = new Blob([data], { type: 'application/pdf' });
            } else if (data instanceof Uint8Array) {
                blob = new Blob([data], { type: 'application/pdf' });
            } else if (typeof data === 'string' && data.startsWith('data:')) {
                // Convert base64 to blob
                const byteString = atob(data.split(',')[1]);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                blob = new Blob([ab], { type: 'application/pdf' });
            }

            if (!blob) {
                this.showToast('Erro ao carregar PDF', 'error');
                return;
            }

            const blobUrl = URL.createObjectURL(blob);
            this.currentBlobUrl = blobUrl;

            // On mobile, open in new tab (uses native PDF viewer)
            if (this.isMobile()) {
                // Try to open in new tab
                const newWindow = window.open(blobUrl, '_blank');

                if (!newWindow) {
                    // If popup blocked, create download link
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.target = '_blank';
                    link.download = catalog.fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    this.showToast('Abrindo PDF...', 'success');
                }

                // Don't revoke immediately - wait a bit for the new tab to load
                setTimeout(() => {
                    if (this.currentBlobUrl === blobUrl) {
                        URL.revokeObjectURL(blobUrl);
                        this.currentBlobUrl = null;
                    }
                }, 5000);

                return;
            }

            // On desktop, use iframe modal
            this.elements.modalTitle.textContent = catalog.name;
            this.elements.pdfViewer.src = blobUrl;
            this.elements.modal.classList.add('active');

            // Add history state for back button
            history.pushState({ viewer: true }, '');
        } catch (error) {
            console.error('Erro ao abrir catálogo:', error);
            this.showToast('Erro ao abrir catálogo', 'error');
        }
    },

    /**
     * Close PDF viewer
     */
    closeViewer() {
        this.elements.modal.classList.remove('active');
        this.elements.pdfViewer.src = '';

        // Revoke the blob URL to free memory
        if (this.currentBlobUrl) {
            URL.revokeObjectURL(this.currentBlobUrl);
            this.currentBlobUrl = null;
        }

        this.currentCatalog = null;
    },

    /**
     * Open PDF options modal (for mobile)
     */
    openPdfOptions(catalogId, catalogName) {
        this.selectedCatalogId = catalogId;
        if (this.elements.pdfOptionsTitle) {
            this.elements.pdfOptionsTitle.textContent = catalogName;
        }
        if (this.elements.pdfOptionsOverlay) {
            this.elements.pdfOptionsOverlay.classList.add('active');
        }
    },

    /**
     * Close PDF options modal
     */
    closePdfOptions() {
        if (this.elements.pdfOptionsOverlay) {
            this.elements.pdfOptionsOverlay.classList.remove('active');
        }
        this.selectedCatalogId = null;
    },

    /**
     * Handle View PDF button click (inline handler)
     */
    handleViewPdf() {
        this.closePdfOptions();
        if (this.selectedCatalogId) {
            this.openPdfInNewTab(this.selectedCatalogId);
        }
    },

    /**
     * Handle Share PDF button click (inline handler)
     */
    async handleSharePdf() {
        this.closePdfOptions();
        if (this.selectedCatalogId) {
            const catalog = await CatalogStorage.getById(this.selectedCatalogId);
            if (catalog) {
                this.currentCatalog = catalog;
                await this.shareCatalog();
            }
        }
    },

    /**
     * Handle Move PDF button click (inline handler)
     */
    async handleMovePdf() {
        this.closePdfOptions();
        if (this.selectedCatalogId) {
            const catalog = await CatalogStorage.getById(this.selectedCatalogId);
            if (catalog) {
                this.currentCatalog = catalog;
                this.openMoveModal();
            }
        }
    },

    /**
     * Handle Delete PDF button click (inline handler)
     */
    async handleDeletePdf() {
        this.closePdfOptions();
        if (this.selectedCatalogId) {
            const catalog = await CatalogStorage.getById(this.selectedCatalogId);
            if (catalog) {
                this.currentCatalog = catalog;
                this.openConfirmDelete();
            }
        }
    },

    /**
     * Open PDF in new tab (for mobile)
     * Uses Capacitor plugins for native file handling on Android
     */
    async openPdfInNewTab(catalogId) {
        try {
            const catalog = await CatalogStorage.getById(catalogId);
            if (!catalog) {
                this.showToast('Catálogo não encontrado', 'error');
                return;
            }

            this.showToast('Abrindo PDF...', 'success');

            // Convert data to base64
            let base64Data;
            const data = catalog.data;

            if (data instanceof ArrayBuffer || (data && data.byteLength !== undefined)) {
                const bytes = new Uint8Array(data);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                base64Data = btoa(binary);
            } else if (data instanceof Uint8Array) {
                let binary = '';
                for (let i = 0; i < data.length; i++) {
                    binary += String.fromCharCode(data[i]);
                }
                base64Data = btoa(binary);
            } else if (typeof data === 'string' && data.startsWith('data:')) {
                base64Data = data.split(',')[1];
            } else {
                this.showToast('Erro ao carregar PDF', 'error');
                return;
            }

            // Check if Capacitor plugins are available (running as native app)
            if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
                try {
                    const { Filesystem, FileOpener } = Capacitor.Plugins;

                    const fileName = catalog.fileName || `${catalog.name}.pdf`;

                    // Write file to cache directory
                    const result = await Filesystem.writeFile({
                        path: fileName,
                        data: base64Data,
                        directory: 'CACHE'
                    });

                    // Open the file with native app
                    await FileOpener.openFile({
                        path: result.uri,
                        mimeType: 'application/pdf'
                    });

                    return;
                } catch (capError) {
                    console.error('Erro com plugins Capacitor:', capError);
                    // Fall through to web fallback
                }
            }

            // Fallback for web or if Capacitor fails
            const blob = new Blob([Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))], { type: 'application/pdf' });
            const blobUrl = URL.createObjectURL(blob);

            // Try to open in new window/tab
            const newWindow = window.open(blobUrl, '_blank');

            if (!newWindow) {
                // Fallback: create download link
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = catalog.fileName || `${catalog.name}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Revoke after delay
            setTimeout(() => {
                URL.revokeObjectURL(blobUrl);
            }, 5000);
        } catch (error) {
            console.error('Erro ao abrir PDF:', error);
            this.showToast('Erro ao abrir PDF', 'error');
        }
    },

    /**
     * Share current catalog
     */
    async shareCatalog() {
        if (!this.currentCatalog) return;

        try {
            const result = await CatalogShare.share(this.currentCatalog);

            if (result.cancelled) {
                return; // User cancelled, no message needed
            }

            if (result.method === 'download') {
                this.showToast('Download iniciado', 'success');
            } else if (result.success) {
                this.showToast('Compartilhado com sucesso!', 'success');
            }
        } catch (error) {
            console.error('Erro ao compartilhar:', error);
            // Fallback to download
            CatalogShare.download(this.currentCatalog);
            this.showToast('Download iniciado', 'success');
        }
    },

    /**
     * Open rename PDF modal
     * @param {number} catalogId - The catalog ID to rename
     * @param {string} currentName - The current name of the catalog
     */
    openRenamePdfModal(catalogId, currentName) {
        this.renamingCatalogId = catalogId;
        if (this.elements.renamePdfInput) {
            this.elements.renamePdfInput.value = currentName;
        }
        if (this.elements.renamePdfModalOverlay) {
            this.elements.renamePdfModalOverlay.classList.add('active');
            setTimeout(() => {
                this.elements.renamePdfInput.focus();
                this.elements.renamePdfInput.select();
            }, 100);
        }
    },

    /**
     * Close rename PDF modal
     */
    closeRenamePdfModal() {
        if (this.elements.renamePdfModalOverlay) {
            this.elements.renamePdfModalOverlay.classList.remove('active');
        }
        if (this.elements.renamePdfInput) {
            this.elements.renamePdfInput.value = '';
        }
        this.renamingCatalogId = null;
    },

    /**
     * Save the renamed PDF
     */
    async saveRenamePdf() {
        if (!this.renamingCatalogId) return;

        const newName = this.elements.renamePdfInput.value.trim();
        if (!newName) {
            this.showToast('Digite um nome válido', 'error');
            return;
        }

        try {
            await CatalogStorage.renameCatalog(this.renamingCatalogId, newName);
            this.showToast('PDF renomeado', 'success');
            this.closeRenamePdfModal();
            await this.loadCatalogs();
        } catch (error) {
            console.error('Erro ao renomear PDF:', error);
            this.showToast('Erro ao renomear PDF', 'error');
        }
    },

    /**
     * Open confirm delete modal
     */
    openConfirmDelete() {
        if (!this.currentCatalog) return;
        this.elements.confirmDeleteName.textContent = `"${this.currentCatalog.name}"`;
        this.elements.confirmDeleteOverlay.classList.add('active');
    },

    /**
     * Close confirm delete modal
     */
    closeConfirmDelete() {
        this.elements.confirmDeleteOverlay.classList.remove('active');
    },

    /**
     * Confirm and delete current catalog
     */
    async confirmDeleteCatalog() {
        if (!this.currentCatalog) return;

        try {
            const catalogId = this.currentCatalog.id;
            await CatalogStorage.delete(catalogId);
            this.showToast('Catálogo excluído', 'success');
            this.closeConfirmDelete();
            this.closeViewer();
            await this.loadCatalogs();
        } catch (error) {
            console.error('Erro ao excluir:', error);
            this.showToast('Erro ao excluir catálogo', 'error');
            this.closeConfirmDelete();
        }
    },

    /**
     * Show a toast notification
     * @param {string} message
     * @param {string} type - 'success' or 'error'
     */
    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        this.elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Global functions for inline onclick handlers (mobile compatibility)
function handleViewPdf() {
    var catalogId = App.selectedCatalogId;
    App.closePdfOptions();
    if (catalogId) {
        App.openPdfInNewTab(catalogId);
    }
}

function handleSharePdf() {
    var catalogId = App.selectedCatalogId;
    App.closePdfOptions();
    if (catalogId) {
        CatalogStorage.getById(catalogId).then(function (catalog) {
            if (catalog) {
                App.currentCatalog = catalog;
                App.shareCatalog();
            }
        });
    }
}

function handleMovePdf() {
    var catalogId = App.selectedCatalogId;
    App.closePdfOptions();
    if (catalogId) {
        CatalogStorage.getById(catalogId).then(function (catalog) {
            if (catalog) {
                App.currentCatalog = catalog;
                App.openMoveModal();
            }
        });
    }
}

function handleDeletePdf() {
    var catalogId = App.selectedCatalogId;
    App.closePdfOptions();
    if (catalogId) {
        CatalogStorage.getById(catalogId).then(function (catalog) {
            if (catalog) {
                App.currentCatalog = catalog;
                App.openConfirmDelete();
            }
        });
    }
}

function closePdfOptionsModal() {
    App.closePdfOptions();
}

function handleRenamePdf() {
    var catalogId = App.selectedCatalogId;
    App.closePdfOptions();
    if (catalogId) {
        CatalogStorage.getById(catalogId).then(function (catalog) {
            if (catalog) {
                App.openRenamePdfModal(catalogId, catalog.name);
            }
        });
    }
}

/**
 * Global function to receive PDF data from native Android code
 * Called by MainActivity.java when a PDF is shared to the app
 * @param {string} fileName - The PDF file name
 * @param {string} base64Data - The PDF content as base64
 * @param {number} fileSize - The file size in bytes
 */
window.handleReceivedPdf = async function (fileName, base64Data, fileSize) {
    console.log('Received PDF from native:', fileName, 'Size:', fileSize);

    try {
        // Wait for App to be initialized
        if (!App || !App.showToast) {
            console.log('App not ready, waiting...');
            setTimeout(() => {
                window.handleReceivedPdf(fileName, base64Data, fileSize);
            }, 500);
            return;
        }

        // Convert base64 to ArrayBuffer
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Create a File object
        const file = new File([bytes], fileName, { type: 'application/pdf' });

        // Wait for storage to be ready
        if (!CatalogStorage || !CatalogStorage.db) {
            await CatalogStorage.init();
        }

        // Add to storage
        const catalog = await CatalogStorage.addFile(file, App.currentFolder);

        // Update UI
        App.catalogs.unshift(catalog);
        App.renderCatalogs();

        // Show success message
        App.showToast(`"${catalog.name}" adicionado!`, 'success');

        console.log('PDF added successfully:', catalog.name);

    } catch (error) {
        console.error('Error handling received PDF:', error);
        if (App && App.showToast) {
            App.showToast('Erro ao importar PDF', 'error');
        }
    }
};
