const { app, globalShortcut, dialog, ipcMain, session } = require('electron');
const { createMainWindow } = require('./window');
const CONFIG = require('./config');
const https = require('https');

let mainWindow;

/**
 * Vérifie la connexion Internet
 */
function checkInternetConnection(callback) {
    https.get('https://www.google.com', (res) => {
        callback(true);
    }).on('error', (err) => {
        callback(false);
    });
}

/**
 * Affiche une erreur et ferme l'application
 */
function showErrorAndExit() {
    dialog.showErrorBox('Erreur de connexion', 'Aucune connexion Internet détectée. Veuillez vérifier votre connexion réseau et redémarrer l’application.');
    app.quit();
}

/**
 * Gère la déconnexion et la redirection vers la page de login
 */
ipcMain.handle('logout-user', async () => {
    try {
        const defaultSession = session.defaultSession;
        await defaultSession.clearStorageData();
        console.log('🧼 Session et cookies effacés');

        if (mainWindow) {
            mainWindow.loadURL('https://unlim-cloud.web.app/login');
        }
    } catch (err) {
        console.error('❌ Erreur pendant la déconnexion :', err);
    }
});

/**
 * Initialise l'application et crée la fenêtre principale.
 */
function initializeApp() {
    checkInternetConnection((isConnected) => {
        if (!isConnected) {
            showErrorAndExit();
            return;
        }

        app.commandLine.appendSwitch('enable-widevine-cdm');
        app.commandLine.appendSwitch('widevine-cdm-path', CONFIG.WIDEVINE_PATH);
        app.commandLine.appendSwitch('widevine-cdm-version', CONFIG.WIDEVINE_VERSION);

        app.whenReady().then(() => {
            mainWindow = createMainWindow();
            registerShortcuts();

            if (!globalShortcut.isRegistered('F5')) {
                console.error('❌ Échec de l’enregistrement du raccourci F5');
            }
        });

        app.on('window-all-closed', handleWindowClose);
        app.on('activate', handleActivate);
        app.on('will-quit', () => {
            globalShortcut.unregisterAll();
        });
    });
}

/**
 * Gère la fermeture de l'application selon la plateforme.
 */
function handleWindowClose() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
}

/**
 * Gère l'événement `activate` sur macOS.
 */
function handleActivate() {
    if (!mainWindow) {
        mainWindow = createMainWindow();
    }
}

/**
 * Enregistre les raccourcis clavier globaux.
 */
function registerShortcuts() {
    globalShortcut.register('F5', () => {
        if (mainWindow) {
            console.log('🔄 F5 pressé → Simulation de Ctrl+R');
            mainWindow.webContents.reload();
        }
    });
}

// Lancer l'application
initializeApp();
