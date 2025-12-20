/**
 * LP CATALOGOS - Share Module
 * Funcionalidades de compartilhamento usando Web Share API
 */

const CatalogShare = {
    /**
     * Check if Web Share API is available
     */
    isSupported() {
        return navigator.share !== undefined;
    },

    /**
     * Check if file sharing is supported
     */
    canShareFiles() {
        return navigator.canShare !== undefined;
    },

    /**
     * Convert catalog data to Blob (handles both ArrayBuffer and base64)
     * @param {Object} catalog - The catalog object
     * @returns {Blob}
     */
    catalogToBlob(catalog) {
        if (!catalog || !catalog.data) return null;

        const data = catalog.data;

        try {
            // Handle ArrayBuffer or ArrayBuffer-like (from IndexedDB)
            if (data instanceof ArrayBuffer ||
                (data && data.byteLength !== undefined && data.constructor && data.constructor.name === 'ArrayBuffer')) {
                return new Blob([data], { type: catalog.type || 'application/pdf' });
            }

            // Handle Uint8Array
            if (data instanceof Uint8Array) {
                return new Blob([data], { type: catalog.type || 'application/pdf' });
            }

            // Handle base64 Data URL (legacy format)
            if (typeof data === 'string' && data.startsWith('data:')) {
                return this.dataURLToBlob(data);
            }

            // Try to handle any object with byteLength (generic binary data)
            if (data && typeof data.byteLength === 'number') {
                return new Blob([new Uint8Array(data)], { type: catalog.type || 'application/pdf' });
            }

            return null;
        } catch (error) {
            console.error('Erro ao converter catálogo para blob:', error);
            return null;
        }
    },

    /**
     * Share a catalog using native share dialog
     * @param {Object} catalog - The catalog object to share
     */
    async share(catalog) {
        if (!catalog || !catalog.data) {
            throw new Error('Catálogo inválido');
        }

        const fileName = catalog.fileName || `${catalog.name}.pdf`;

        // Try Capacitor native sharing first (for Android app)
        if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform && Capacitor.isNativePlatform()) {
            try {
                const { Filesystem, Share } = Capacitor.Plugins;

                if (Filesystem && Share) {
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
                    }

                    if (base64Data) {
                        // Save file to cache
                        const result = await Filesystem.writeFile({
                            path: fileName,
                            data: base64Data,
                            directory: 'CACHE'
                        });

                        // Share the file
                        await Share.share({
                            title: catalog.name,
                            text: `Confira o catálogo: ${catalog.name}`,
                            url: result.uri,
                            dialogTitle: 'Compartilhar PDF'
                        });

                        return { success: true, method: 'native' };
                    }
                }
            } catch (error) {
                console.log('Compartilhamento nativo falhou:', error);
                // Fall through to web fallback
            }
        }

        // Fallback: Web Share API
        const blob = this.catalogToBlob(catalog);
        if (!blob) {
            throw new Error('Erro ao processar catálogo');
        }

        const file = new File([blob], fileName, { type: 'application/pdf' });

        // Check if we can share files
        if (this.canShareFiles() && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: catalog.name,
                    text: `Confira o catálogo: ${catalog.name}`,
                    files: [file]
                });
                return { success: true, method: 'native' };
            } catch (error) {
                if (error.name === 'AbortError') {
                    return { success: false, cancelled: true };
                }
                console.log('Compartilhamento nativo falhou, usando download');
            }
        }

        // Fallback: Share without file (text only)
        if (this.isSupported()) {
            try {
                await navigator.share({
                    title: catalog.name,
                    text: `📄 Catálogo: ${catalog.name}\n\nCompartilhado via LP CATALOGOS`
                });
                return { success: true, method: 'text' };
            } catch (error) {
                if (error.name === 'AbortError') {
                    return { success: false, cancelled: true };
                }
            }
        }

        // Final fallback: Download
        this.download(catalog);
        return { success: true, method: 'download' };
    },

    /**
     * Download a catalog as a file
     * @param {Object} catalog - The catalog object to download
     */
    download(catalog) {
        const blob = this.catalogToBlob(catalog);
        if (!blob) {
            console.error('Erro ao processar catálogo para download');
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = catalog.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    },

    /**
     * Convert a data URL to a Blob
     * @param {string} dataURL - The data URL
     * @returns {Blob}
     */
    dataURLToBlob(dataURL) {
        const parts = dataURL.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    },

    /**
     * Copy a message to clipboard
     * @param {string} text - Text to copy
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Erro ao copiar:', error);
            return false;
        }
    }
};
