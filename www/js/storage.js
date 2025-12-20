/**
 * LP CATALOGOS - Storage Module
 * Gerenciamento de arquivos PDF e pastas usando IndexedDB
 */

const CatalogStorage = {
    DB_NAME: 'LPCatalogos',
    DB_VERSION: 2,
    STORE_NAME: 'catalogs',
    FOLDERS_STORE: 'folders',
    db: null,

    /**
     * Initialize the database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

            request.onerror = () => {
                console.error('Erro ao abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB inicializado com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const oldVersion = event.oldVersion;

                // Create catalogs store if doesn't exist
                if (!db.objectStoreNames.contains(this.STORE_NAME)) {
                    const store = db.createObjectStore(this.STORE_NAME, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('folderId', 'folderId', { unique: false });

                    console.log('Object store catalogs criado');
                } else if (oldVersion < 2) {
                    // Add folderId index to existing store
                    const transaction = event.target.transaction;
                    const store = transaction.objectStore(this.STORE_NAME);
                    if (!store.indexNames.contains('folderId')) {
                        store.createIndex('folderId', 'folderId', { unique: false });
                    }
                }

                // Create folders store
                if (!db.objectStoreNames.contains(this.FOLDERS_STORE)) {
                    const foldersStore = db.createObjectStore(this.FOLDERS_STORE, {
                        keyPath: 'id',
                        autoIncrement: true
                    });

                    foldersStore.createIndex('name', 'name', { unique: false });
                    foldersStore.createIndex('createdAt', 'createdAt', { unique: false });

                    console.log('Object store folders criado');
                }
            };
        });
    },

    // ========================================
    // FOLDER METHODS
    // ========================================

    /**
     * Add a new folder
     * @param {string} name - The folder name
     * @returns {Promise<Object>} - The created folder object
     */
    async addFolder(name) {
        return new Promise((resolve, reject) => {
            const folder = {
                name: name.trim(),
                createdAt: new Date().toISOString()
            };

            try {
                const transaction = this.db.transaction([this.FOLDERS_STORE], 'readwrite');
                const store = transaction.objectStore(this.FOLDERS_STORE);
                const request = store.add(folder);

                request.onsuccess = () => {
                    folder.id = request.result;
                    resolve(folder);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Get all folders
     * @returns {Promise<Array>} - Array of folder objects
     */
    async getAllFolders() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.FOLDERS_STORE], 'readonly');
                const store = transaction.objectStore(this.FOLDERS_STORE);
                const request = store.getAll();

                request.onsuccess = () => {
                    const folders = request.result.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    );
                    resolve(folders);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Get a folder by ID
     * @param {number} id - The folder ID
     * @returns {Promise<Object>} - The folder object
     */
    async getFolderById(id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.FOLDERS_STORE], 'readonly');
                const store = transaction.objectStore(this.FOLDERS_STORE);
                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Update a folder's name
     * @param {number} id - The folder ID
     * @param {string} name - The new name
     * @returns {Promise<Object>} - The updated folder object
     */
    async updateFolder(id, name) {
        return new Promise(async (resolve, reject) => {
            try {
                const folder = await this.getFolderById(id);
                if (!folder) {
                    reject(new Error('Pasta não encontrada'));
                    return;
                }

                folder.name = name.trim();

                const transaction = this.db.transaction([this.FOLDERS_STORE], 'readwrite');
                const store = transaction.objectStore(this.FOLDERS_STORE);
                const request = store.put(folder);

                request.onsuccess = () => {
                    resolve(folder);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Delete a folder (moves all catalogs back to root)
     * @param {number} id - The folder ID
     * @returns {Promise<void>}
     */
    async deleteFolder(id) {
        return new Promise(async (resolve, reject) => {
            try {
                // First, move all catalogs in this folder to root
                const catalogs = await this.getByFolder(id);
                for (const catalog of catalogs) {
                    await this.moveCatalog(catalog.id, null);
                }

                // Then delete the folder
                const transaction = this.db.transaction([this.FOLDERS_STORE], 'readwrite');
                const store = transaction.objectStore(this.FOLDERS_STORE);
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    // ========================================
    // CATALOG METHODS
    // ========================================

    /**
     * Add a new PDF file
     * @param {File} file - The PDF file to store
     * @param {number|null} folderId - Optional folder ID
     * @returns {Promise<Object>} - The stored catalog object
     */
    async addFile(file, folderId = null) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = async () => {
                const catalog = {
                    name: file.name.replace(/\.pdf$/i, ''),
                    fileName: file.name,
                    size: file.size,
                    type: file.type || 'application/pdf',
                    // Store as ArrayBuffer for better performance with large files
                    data: reader.result,
                    folderId: folderId,
                    createdAt: new Date().toISOString()
                };

                try {
                    const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                    const store = transaction.objectStore(this.STORE_NAME);
                    const request = store.add(catalog);

                    request.onsuccess = () => {
                        catalog.id = request.result;
                        resolve(catalog);
                    };

                    request.onerror = () => {
                        reject(request.error);
                    };
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(reader.error);
            };

            // Read as ArrayBuffer for better performance with large files
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Get blob URL for a catalog (for display in iframe)
     * @param {Object} catalog - The catalog object with data
     * @returns {string} - Blob URL for display
     */
    getBlobUrl(catalog) {
        if (!catalog || !catalog.data) {
            console.error('Catálogo ou dados inválidos');
            return null;
        }

        let blob;
        const data = catalog.data;

        try {
            // Handle ArrayBuffer or ArrayBuffer-like (from IndexedDB)
            if (data instanceof ArrayBuffer ||
                (data && data.byteLength !== undefined && data.constructor && data.constructor.name === 'ArrayBuffer')) {
                blob = new Blob([data], { type: catalog.type || 'application/pdf' });
            }
            // Handle Uint8Array
            else if (data instanceof Uint8Array) {
                blob = new Blob([data], { type: catalog.type || 'application/pdf' });
            }
            // Handle base64 Data URL (legacy format)
            else if (typeof data === 'string' && data.startsWith('data:')) {
                const byteString = atob(data.split(',')[1]);
                const mimeType = data.split(',')[0].split(':')[1].split(';')[0];
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                blob = new Blob([ab], { type: mimeType });
            }
            // Try to handle any object with byteLength (generic binary data)
            else if (data && typeof data.byteLength === 'number') {
                blob = new Blob([new Uint8Array(data)], { type: catalog.type || 'application/pdf' });
            }
            // Unknown format
            else {
                console.error('Formato de dados desconhecido:', typeof data, data);
                return null;
            }

            return URL.createObjectURL(blob);
        } catch (error) {
            console.error('Erro ao criar blob URL:', error);
            return null;
        }
    },

    /**
     * Revoke a blob URL (call when done using it)
     * @param {string} url - The blob URL to revoke
     */
    revokeBlobUrl(url) {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    },

    /**
     * Get all catalogs (without file data for performance)
     * @returns {Promise<Array>} - Array of catalog metadata
     */
    async getAll() {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.getAll();

                request.onsuccess = () => {
                    // Return catalogs sorted by creation date (newest first)
                    const catalogs = request.result.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    );
                    resolve(catalogs);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Get catalogs by folder
     * @param {number|null} folderId - The folder ID (null for root)
     * @returns {Promise<Array>} - Array of catalog metadata
     */
    async getByFolder(folderId) {
        const all = await this.getAll();
        return all.filter(catalog => {
            if (folderId === null) {
                return catalog.folderId === null || catalog.folderId === undefined;
            }
            return catalog.folderId === folderId;
        });
    },

    /**
     * Get a single catalog by ID
     * @param {number} id - The catalog ID
     * @returns {Promise<Object>} - The catalog object with file data
     */
    async getById(id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.get(id);

                request.onsuccess = () => {
                    resolve(request.result);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Move a catalog to a folder
     * @param {number} catalogId - The catalog ID
     * @param {number|null} folderId - The target folder ID (null for root)
     * @returns {Promise<Object>} - The updated catalog object
     */
    async moveCatalog(catalogId, folderId) {
        return new Promise(async (resolve, reject) => {
            try {
                const catalog = await this.getById(catalogId);
                if (!catalog) {
                    reject(new Error('Catálogo não encontrado'));
                    return;
                }

                catalog.folderId = folderId;

                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.put(catalog);

                request.onsuccess = () => {
                    resolve(catalog);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Delete a catalog by ID
     * @param {number} id - The catalog ID
     * @returns {Promise<void>}
     */
    async delete(id) {
        return new Promise((resolve, reject) => {
            try {
                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.delete(id);

                request.onsuccess = () => {
                    resolve();
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Rename a catalog
     * @param {number} id - The catalog ID
     * @param {string} newName - The new name for the catalog
     * @returns {Promise<Object>} - The updated catalog object
     */
    async renameCatalog(id, newName) {
        return new Promise(async (resolve, reject) => {
            try {
                const catalog = await this.getById(id);
                if (!catalog) {
                    reject(new Error('Catálogo não encontrado'));
                    return;
                }

                catalog.name = newName.trim();
                catalog.fileName = newName.trim() + '.pdf';

                const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
                const store = transaction.objectStore(this.STORE_NAME);
                const request = store.put(catalog);

                request.onsuccess = () => {
                    resolve(catalog);
                };

                request.onerror = () => {
                    reject(request.error);
                };
            } catch (error) {
                reject(error);
            }
        });
    },

    /**
     * Search catalogs by name
     * @param {string} query - Search query
     * @param {number|null} folderId - Optional folder filter
     * @returns {Promise<Array>} - Array of matching catalogs
     */
    async search(query, folderId = undefined) {
        let catalogs = await this.getAll();

        // Filter by folder if specified
        if (folderId !== undefined) {
            catalogs = catalogs.filter(catalog => {
                if (folderId === null) {
                    return catalog.folderId === null || catalog.folderId === undefined;
                }
                return catalog.folderId === folderId;
            });
        }

        const lowerQuery = query.toLowerCase();
        return catalogs.filter(catalog =>
            catalog.name.toLowerCase().includes(lowerQuery)
        );
    },

    /**
     * Format file size for display
     * @param {number} bytes - File size in bytes
     * @returns {string} - Formatted size string
     */
    formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    },

    /**
     * Format date for display
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date string
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;

        // Less than 24 hours
        if (diff < 86400000) {
            return 'Hoje';
        }

        // Less than 48 hours
        if (diff < 172800000) {
            return 'Ontem';
        }

        // Less than 7 days
        if (diff < 604800000) {
            const days = Math.floor(diff / 86400000);
            return `${days} dias atrás`;
        }

        // Default format
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short'
        });
    }
};
