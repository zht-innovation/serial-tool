import { app, BrowserWindow, ipcMain } from 'electron'
import { SerialPort } from 'serialport';
// import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path, { dirname } from 'node:path'

// const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { SBUSParser } from './sbus'
import { DeviceManager } from './device';

const deviceManager = new DeviceManager();
const sbusParser = new SBUSParser();

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let curPort: SerialPort | null
let isReading = false;

function createWindow() {
    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
        webPreferences: {
            nodeIntegration: true,
            nodeIntegrationInWorker: true,
            preload: path.join(__dirname, 'preload.mjs'),
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }
}

function setupSerialPortIPC() {
    ipcMain.handle('scan-devices', async () => {
        try {
            const devices = await deviceManager.scanSerialPorts();
            return { success: true, devices };
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    })

    ipcMain.handle('connect-device', async (_, portPath: string) => {
        try {
            if (curPort) {
                curPort.close();
            }

            curPort = new SerialPort({
                path: portPath,
                baudRate: 100000,
                dataBits: 8,
                parity: 'even',
                stopBits: 2
            })

            return new Promise((resolve) => {
                curPort!.on('open', () => {
                    console.log(`已连接到 ${portPath}`);
                    resolve({ success: true });
                });

                curPort!.on('error', (error) => {
                    resolve({ success: false, error: error.message });
                })
            })
        } catch (error) {
            return { success: false, error: (error as Error).message };
        }
    })

    ipcMain.handle('start-reading', async () => {
        if (!curPort) {
            return { success: false, error: '未连接设备' };
        }

        isReading = true;
        curPort.on('data', (data: Buffer) => {
            // 发送原始数据
            win?.webContents.send('raw-data', Array.from(data))
            
            // 解析SBUS数据
            const packets = sbusParser.addData(data);
            for (const channels of packets) {
                const microseconds = sbusParser.channelsToMicroseconds(channels);
                win?.webContents.send('sbus-data', {
                    channels,
                    microseconds,
                    timestamp: new Date().toLocaleTimeString() 
                })
            }
        })

        return { success: true };
    })

    ipcMain.handle('stop-reading', async () => {
        isReading = false;
        if (curPort) {
            curPort.removeAllListeners('data');
            curPort.close();
            curPort = null;
        }
        return { success: true };
    })
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

setupSerialPortIPC();
app.whenReady().then(createWindow)
