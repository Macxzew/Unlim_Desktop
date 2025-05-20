const electron = require('electron');

if (electron.contextBridge && electron.ipcRenderer) {
    electron.contextBridge.exposeInMainWorld('electronAPI', {
        observeUploadingStatus: () => {
            const uploadingSelector = 'a[title="Uploading"]';
            const elementsToRemove = ['Gallery', 'Library'];

            const cleanUnwantedLinks = () => {
                elementsToRemove.forEach(title => {
                    const el = document.querySelector(`a[title="${title}"]`);
                    if (el) {
                        el.remove();
                        console.log(`🧼 Removed element with title="${title}"`);
                    }
                });
            };

            const renameOpenButtons = () => {
                const spans = document.querySelectorAll('span.text');
                spans.forEach(span => {
                    if (span.textContent.trim() === 'Open') {
                        span.textContent = 'Download';
                        console.log('✏️ Renamed "Open" to "Download"');
                    }
                });
            };

            const showProgressBar = () => {
                if (!document.getElementById('upload-progress-bar')) {
                    const bar = document.createElement('div');
                    bar.id = 'upload-progress-bar';
                    bar.style.position = 'fixed';
                    bar.style.top = '0';
                    bar.style.left = '0';
                    bar.style.width = '100%';
                    bar.style.height = '3px';
                    bar.style.backgroundColor = '#0088cc';
                    bar.style.zIndex = '999999';
                    bar.style.animation = 'uploadingBarAnim 2s linear infinite';
                    document.body.appendChild(bar);

                    const style = document.createElement('style');
                    style.textContent = `
                        @keyframes uploadingBarAnim {
                            0% { transform: translateX(-100%); }
                            50% { transform: translateX(0%); }
                            100% { transform: translateX(100%); }
                        }
                        #upload-progress-bar {
                            transform: translateX(-100%);
                        }
                    `;
                    document.head.appendChild(style);
                }
            };

            const hideProgressBar = () => {
                const bar = document.getElementById('upload-progress-bar');
                if (bar) bar.remove();
            };

            const disableFilesLinkUntilProfileLoaded = () => {
                const filesLink = document.querySelector('a[title="Files"]');
                if (filesLink) {
                    filesLink.style.pointerEvents = 'none';
                    filesLink.style.opacity = '0.5';
                }

                const observer = new MutationObserver(() => {
                    const profileImage = document.querySelector(
                        'img[src^="blob:"][class*="rounded-full"]'
                    );
                    if (profileImage) {
                        setTimeout(() => {
                            const stillThere = document.querySelector(
                                'img[src^="blob:"][class*="rounded-full"]'
                            );
                            if (stillThere) {
                                let attempts = 0;
                                const maxAttempts = 3;

                                const interval = setInterval(() => {
                                    const link = document.querySelector('a[title="Files"]');
                                    if (link && link.style.pointerEvents === 'none') {
                                        link.style.pointerEvents = 'auto';
                                        link.style.opacity = '1';
                                        console.log(`🔁 Attempt ${attempts + 1}: Files button re-enabled`);
                                    }

                                    attempts++;
                                    if (link && link.style.pointerEvents === 'auto') {
                                        // Ajouter bouton logout
                                        const parentDiv = stillThere.parentElement;
                                        if (parentDiv && !document.getElementById('logout-btn')) {
                                            const logoutBtn = document.createElement('button');
                                            logoutBtn.id = 'logout-btn';
                                            logoutBtn.textContent = '👋';
                                            logoutBtn.style.marginLeft = '10px';
                                            logoutBtn.style.padding = '4px 8px';
                                            logoutBtn.style.border = 'none';
                                            logoutBtn.style.borderRadius = '6px';
                                            logoutBtn.style.color = 'white';
                                            logoutBtn.style.cursor = 'pointer';
                                            logoutBtn.style.transition = 'opacity 0.2s';

                                            logoutBtn.onmouseenter = () => logoutBtn.style.opacity = '0.8';
                                            logoutBtn.onmouseleave = () => logoutBtn.style.opacity = '1';

                                            logoutBtn.onclick = () => {
                                                electron.ipcRenderer.invoke('logout-user');
                                            };

                                            parentDiv.appendChild(logoutBtn);
                                        }

                                        // Clic auto
                                        link.click();
                                        console.log('🖱️ Simulated click on "Files" button');

                                        clearInterval(interval);
                                        observer.disconnect();
                                    } else if (attempts >= maxAttempts) {
                                        console.warn('⚠️ Max attempts reached to enable Files button');
                                        clearInterval(interval);
                                        observer.disconnect();
                                    }
                                }, 1000); // check toutes les 1s
                            }
                        }, 1500);
                    }
                });

                observer.observe(document.body, { childList: true, subtree: true });
            };

            const check = () => {
                cleanUnwantedLinks();
                renameOpenButtons();
                disableFilesLinkUntilProfileLoaded();
                const isUploading = !!document.querySelector(uploadingSelector);
                if (isUploading) {
                    showProgressBar();
                } else {
                    hideProgressBar();
                }

                electron.ipcRenderer.send('uploading-status', isUploading);
            };

            const observer = new MutationObserver(check);
            observer.observe(document.body, {
                childList: true,
                subtree: true,
            });

            window.addEventListener('DOMContentLoaded', check);
        }
    });
} else {
    console.error('❌ contextBridge or ipcRenderer not available in preload.');
}
