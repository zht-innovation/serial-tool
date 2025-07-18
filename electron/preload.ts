import { ipcRenderer, contextBridge } from 'electron'

export interface SBUSData {
	channels: number[];
	timestamp: string;
}

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
	on(...args: Parameters<typeof ipcRenderer.on>) {
		const [channel, listener] = args
		return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
	},
	off(...args: Parameters<typeof ipcRenderer.off>) {
		const [channel, ...omit] = args
		return ipcRenderer.off(channel, ...omit)
	},
	send(...args: Parameters<typeof ipcRenderer.send>) {
		const [channel, ...omit] = args
		return ipcRenderer.send(channel, ...omit)
	},
	invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
		const [channel, ...omit] = args
		return ipcRenderer.invoke(channel, ...omit)
	},

	// You can expose other APTs you need here.
	// devices management
	scanDevices: () => ipcRenderer.invoke('scan-devices'),
	connectDevice: (portPath: string) => ipcRenderer.invoke('connect-device', portPath),
	startReading: () => ipcRenderer.invoke('start-reading'),
	stopReading: () => ipcRenderer.invoke('stop-reading'),
	onSBUSData: (callback: (data: SBUSData) => void) => {
		ipcRenderer.on('sbus-data', (_, data) => callback(data as SBUSData))
	},
	onRawData: (callback: (data: Buffer) => void) => {
		ipcRenderer.on('raw-data', (_, data) => callback(Buffer.from(data)))
	},
	removeDataListener: () => {
		ipcRenderer.removeAllListeners('sbus-data')
		ipcRenderer.removeAllListeners('raw-data')
	}
})
