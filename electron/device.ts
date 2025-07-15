import { SerialPort } from 'serialport';

export interface DeviceInfo {
	path: string; // serial port path
	manufacturer?: string; // manufacturer of the device
	serialNumber?: string; // serial number of the device	
	pnpId?: string; // Plug and Play ID
	locationId?: string; // location ID of the device
	productId?: string; // product ID of the device
	vendorId?: string; // vendor ID of the device
	friendlyName?: string; // user-friendly name of the device
}

export class DeviceManager {
	async scanSerialPorts(): Promise<DeviceInfo[]> {
		try {
			const ports = await SerialPort.list();
			
			return ports.map(port => ({
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
			console.error('扫描串口设备失败:', error);
			throw error;
		}
	}

	filterUSBDevices(devices: DeviceInfo[]): DeviceInfo[] {
		return devices.filter(device => 
			device.pnpId?.includes('USB') ||
			device.manufacturer?.toLowerCase().includes('usb') ||
			device.friendlyName?.toLowerCase().includes('usb')
		);
	}
}