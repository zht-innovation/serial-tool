var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { app, BrowserWindow, ipcMain } from "electron";
import { SerialPort } from "serialport";
import { fileURLToPath } from "node:url";
import path, { dirname } from "node:path";
class SBUSParser {
  constructor() {
    __publicField(this, "START_BYTE", 15);
    __publicField(this, "END_BYTE", 0);
    __publicField(this, "PACKET_LENGTH", 25);
    __publicField(this, "NUM_CHANNELS", 16);
    __publicField(this, "BIT_NUM_EVERY_CHANNEL", 11);
    __publicField(this, "buffer", []);
  }
  addData(data) {
    for (const byte of data) {
      this.buffer.push(byte);
    }
    const packets = [];
    while (this.buffer.length >= this.PACKET_LENGTH) {
      const startIndex = this.buffer.indexOf(this.START_BYTE);
      if (startIndex === -1) {
        this.buffer = [];
        break;
      }
      if (startIndex > 0) {
        this.buffer = this.buffer.slice(startIndex);
      }
      if (this.buffer.length < this.PACKET_LENGTH) {
        break;
      }
      if (this.buffer[this.PACKET_LENGTH - 1] === this.END_BYTE) {
        const packetData = this.buffer.slice(0, this.PACKET_LENGTH);
        const channels = this.parsePacket(packetData);
        if (channels) {
          packets.push(channels);
        }
        this.buffer = this.buffer.slice(this.PACKET_LENGTH);
      } else {
        this.buffer = this.buffer.slice(1);
      }
    }
    return packets;
  }
  parsePacket(packet) {
    if (packet.length !== this.PACKET_LENGTH || packet[0] !== this.START_BYTE || packet[this.PACKET_LENGTH - 1] !== this.END_BYTE) {
      return null;
    }
    const channelData = packet.slice(1, 23);
    const channels = new Array(this.NUM_CHANNELS).fill(0);
    try {
      let bitOffset = 0;
      for (let ch = 0; ch < this.NUM_CHANNELS; ch++) {
        let value = 0;
        for (let bit = 0; bit < this.BIT_NUM_EVERY_CHANNEL; bit++) {
          const byteIndex = Math.floor((bitOffset + bit) / 8);
          const bitIndex = (bitOffset + bit) % 8;
          if (byteIndex < channelData.length) {
            if (channelData[byteIndex] & 1 << bitIndex) {
              value |= 1 << bit;
            }
          }
        }
        channels[ch] = value;
        bitOffset += this.BIT_NUM_EVERY_CHANNEL;
      }
      return channels;
    } catch (error) {
      console.error("Error parsing SBUS packet:", error);
      return null;
    }
  }
  channelsToMicroseconds(channels) {
    if (channels.length !== this.NUM_CHANNELS) {
      throw new Error("Invalid channels length");
    }
    return channels.map((channel) => {
      const usValue = Math.round(1e3 + (channel - 172) * (2e3 - 1e3) / (1811 - 172));
      return Math.max(1e3, Math.min(2e3, usValue));
    });
  }
}
class DeviceManager {
  async scanSerialPorts() {
    try {
      const ports = await SerialPort.list();
      return ports.map((port) => ({
        path: port.path,
        manufacturer: port.manufacturer,
        serialNumber: port.serialNumber,
        pnpId: port.pnpId,
        locationId: port.locationId,
        productId: port.productId,
        vendorId: port.vendorId,
        friendlyName: port.friendlyName
      }));
    } catch (error) {
      console.error("扫描串口设备失败:", error);
      throw error;
    }
  }
  filterUSBDevices(devices) {
    return devices.filter(
      (device) => {
        var _a, _b, _c;
        return ((_a = device.pnpId) == null ? void 0 : _a.includes("USB")) || ((_b = device.manufacturer) == null ? void 0 : _b.toLowerCase().includes("usb")) || ((_c = device.friendlyName) == null ? void 0 : _c.toLowerCase().includes("usb"));
      }
    );
  }
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const deviceManager = new DeviceManager();
const sbusParser = new SBUSParser();
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let curPort;
let dataBuffer = [];
let bufferTimer = null;
const BUFFER_FLUSH_INTERVAL = 25;
let lastSBUSData = null;
let sbusUpdateTimer = null;
const SBUS_UPDATE_INTERVAL = 50;
function flushDataBuffer() {
  if (dataBuffer.length > 0 && win) {
    win.webContents.send("raw-data", [...dataBuffer]);
    dataBuffer = [];
  }
  bufferTimer = null;
}
function flushSBUSData() {
  if (lastSBUSData && win) {
    win.webContents.send("sbus-data", {
      channels: lastSBUSData,
      timestamp: (/* @__PURE__ */ new Date()).toLocaleTimeString()
    });
    lastSBUSData = null;
  }
}
function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      nodeIntegration: true,
      nodeIntegrationInWorker: true,
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
function setupSerialPortIPC() {
  ipcMain.handle("scan-devices", async () => {
    try {
      const devices = await deviceManager.scanSerialPorts();
      return { success: true, devices };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("connect-device", async (_, portPath) => {
    try {
      if (curPort) {
        curPort.close();
      }
      curPort = new SerialPort({
        path: portPath,
        baudRate: 1e5,
        dataBits: 8,
        parity: "even",
        stopBits: 2
      });
      return new Promise((resolve) => {
        curPort.on("open", () => {
          console.log(`已连接到 ${portPath}`);
          resolve({ success: true });
        });
        curPort.on("error", (error) => {
          resolve({ success: false, error: error.message });
        });
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
  ipcMain.handle("start-reading", async () => {
    if (!curPort) {
      return { success: false, error: "未连接设备" };
    }
    if (!sbusUpdateTimer) {
      sbusUpdateTimer = setInterval(flushSBUSData, SBUS_UPDATE_INTERVAL);
    }
    curPort.on("data", (data) => {
      dataBuffer.push(...Array.from(data));
      if (!bufferTimer) {
        bufferTimer = setInterval(flushDataBuffer, BUFFER_FLUSH_INTERVAL);
      }
      const packets = sbusParser.addData(data);
      if (packets.length > 0) {
        lastSBUSData = packets[packets.length - 1];
      }
    });
    return { success: true };
  });
  ipcMain.handle("stop-reading", async () => {
    if (curPort) {
      curPort.removeAllListeners("data");
      curPort.close();
      curPort = null;
    }
    if (bufferTimer) {
      clearInterval(bufferTimer);
      bufferTimer = null;
    }
    if (sbusUpdateTimer) {
      clearInterval(sbusUpdateTimer);
      sbusUpdateTimer = null;
    }
    dataBuffer = [];
    lastSBUSData = null;
    return { success: true };
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
setupSerialPortIPC();
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
