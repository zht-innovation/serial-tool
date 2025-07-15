<template>
	<div class="control-panel">
		<div class="control-row">
			<button class="btn btn-success" @click="handleConnect" :disabled="!selectedDevice || isConnected">
				连接
			</button>
			
			<select v-model="selectedDevice" class="device-select" :disabled="devices.length === 0 || isConnected"
				@change="onDeviceChange">
				<option value="">请选择设备</option>
				<option v-for="device in devices" :key="device.path" :value="device.path">
					{{ device.path }} - {{ device.friendlyName || device.manufacturer || '未知设备' }}
				</option>
			</select>
		
			<button class="btn btn-primary" @click="$emit('scanDevices')" :disabled="isScanning">
				{{ isScanning ? '扫描中...' : '扫描设备' }}
			</button>
		</div>

		<div class="control-row">
			<button class="btn btn-info" @click="$emit('startReading')" :disabled="!isConnected || isReading">
				开始读取
			</button>

			<button class="btn btn-danger" @click="$emit('stopReading')" :disabled="!isReading">
				停止读取
			</button>

			<div class="usb-devices-info" v-if="usbDevices.length > 0">
				<span class="usb-label">USB设备: {{ usbDevices.length }}个</span>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface DeviceInfo {
	path: string
	manufacturer?: string
	serialNumber?: string
	pnpId?: string
	locationId?: string
	productId?: string
	vendorId?: string
	friendlyName?: string
}

interface Props {
	devices: DeviceInfo[]
	isConnected: boolean
	isReading: boolean
	status: string
}

interface Emits {
	(e: 'scanDevices'): void
	(e: 'connectDevice', portPath: string): void
	(e: 'startReading'): void
	(e: 'stopReading'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedDevice = ref('')

const isScanning = computed(() => props.status.includes('扫描'))

const usbDevices = computed(() =>
	props.devices.filter(device =>
		device.pnpId?.includes('USB') ||
		device.manufacturer?.toLowerCase().includes('usb') ||
		device.friendlyName?.toLowerCase().includes('usb')
	)
)

const onDeviceChange = () => {
	// 设备选择变化时的处理
}

const handleConnect = () => {
	if (selectedDevice.value) {
		emit('connectDevice', selectedDevice.value)
	}
}
</script>

<style lang="less" scoped>
.control-panel {
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;
	.control-row {
		display: flex;
		flex-direction: row-reverse;
		gap: 20px;
		align-items: center;
		margin-bottom: 15px;
		flex-wrap: wrap;
		&:last-child {
			margin-bottom: 0;
		}
		.btn {
			border: none;
			padding: 10px 20px;
			border-radius: 5px;
			cursor: pointer;
			font-size: 18px;
			font-weight: 500;
			transition: all 0.3s ease;
			min-width: 130px;
		}
		.btn:disabled {
			opacity: 0.6;
			cursor: not-allowed;
		}

		.device-select {
			padding: 10px;
			border: 1px solid #ddd;
			border-radius: 5px;
			font-size: 18px;
			min-width: 300px;
			background-color: white;
		}

		.device-select:disabled {
			background-color: #f8f9fa;
			opacity: 0.6;
		}

		.usb-devices-info {
			margin-left: auto;
			padding: 8px 12px;
			background-color: #e8f5e8;
			border-radius: 4px;
			border: 1px solid #c3e6c3;
			.usb-label {
				font-size: 16px;
				color: #27ae60;
				font-weight: 500;
			}
		}
	}
}

.btn-primary {
	background-color: #3498db;
	color: white;
}

.btn-primary:hover:not(:disabled) {
	background-color: #2980b9;
}

.btn-success {
	background-color: #27ae60;
	color: white;
}

.btn-success:hover:not(:disabled) {
	background-color: #229954;
}

.btn-info {
	background-color: #17a2b8;
	color: white;
}

.btn-info:hover:not(:disabled) {
	background-color: #138496;
}

.btn-danger {
	background-color: #e74c3c;
	color: white;
}

.btn-danger:hover:not(:disabled) {
	background-color: #c0392b;
}
</style>