<template>
	<div class="app-container">
		<AppHeader />

		<ControlPanel :devices="devices" :is-connected="isConnected" :is-reading="isReading" :status="status"
			@scan-devices="handleScanDevices" @connect-device="handleConnectDevice" @start-reading="handleStartReading"
			@stop-reading="handleStopReading" />

		<StatusBar :status="status" :is-connected="isConnected" :last-update="lastUpdate" />

		<DataDisplay v-if="isReading" :channels="channels" />

		<RawDataWindow v-if="!isReading" ref="rawDataWindow" />
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import AppHeader from './components/AppHeader.vue'
import ControlPanel from './components/ControlPanel.vue'
import StatusBar from './components/StatusBar.vue'
import DataDisplay from './components/DataDisplay.vue'
import RawDataWindow from './components/RawDataWindow.vue'

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

interface SBUSData {
	channels: number[]
	microseconds: number[]
	timestamp: string
}

// 响应式数据
const devices = ref<DeviceInfo[]>([])
const isConnected = ref(false)
const isReading = ref(false)
const status = ref('未连接')
const lastUpdate = ref('')
const channels = ref<number[]>(Array(16).fill(0))
const microseconds = ref<number[]>(Array(16).fill(1500))
const rawDataWindow = ref()

// 设备管理方法
const handleScanDevices = async () => {
	status.value = '扫描设备中...'
	try {
		const result = await window.ipcRenderer.invoke('scan-devices')
		if (result.success) {
			devices.value = result.devices
			status.value = `找到 ${devices.value.length} 个设备`
		} else {
			status.value = `扫描失败: ${result.error}`
		}
	} catch (error) {
		status.value = `扫描出错: ${(error as Error).message}`
	}
}

const handleConnectDevice = async (portPath: string) => {
	status.value = '连接中...'
	try {
		const result = await window.ipcRenderer.invoke('connect-device', portPath)
		if (result.success) {
			isConnected.value = true
			status.value = '已连接'
		} else {
			status.value = `连接失败: ${result.error}`
		}
	} catch (error) {
		status.value = `连接出错: ${(error as Error).message}`
	}
}

const handleStartReading = async () => {
	status.value = '开始读取数据...'
	try {
		const result = await window.ipcRenderer.invoke('start-reading')
		if (result.success) {
			isReading.value = true
			status.value = '正在读取数据...'
		} else {
			status.value = `开始读取失败: ${result.error}`
		}
	} catch (error) {
		status.value = `开始读取出错: ${(error as Error).message}`
	}
}

const handleStopReading = async () => {
	status.value = '停止读取...'
	try {
		await window.ipcRenderer.invoke('stop-reading')
		isReading.value = false
		isConnected.value = false
		status.value = '已断开连接'
		lastUpdate.value = ''
	} catch (error) {
		status.value = `停止读取出错: ${(error as Error).message}`
	}
}

// SBUS数据处理
const handleSBUSData = (data: SBUSData) => {
	channels.value = data.channels
	microseconds.value = data.microseconds
	lastUpdate.value = data.timestamp
}

const handleRawData = (data: Buffer) => {
	if (rawDataWindow.value) {
		rawDataWindow.value.addData(data)
	}
}

// 生命周期
onMounted(() => {
	window.ipcRenderer.onSBUSData(handleSBUSData)
	window.ipcRenderer.onRawData(handleRawData)
	handleScanDevices()
})

onUnmounted(() => {
	window.ipcRenderer.removeDataListener()
})
</script>

<style scoped>
.app-container {
	/* max-width: 1200px; */
	margin: 0 auto;
	/* padding: 20px; */
	font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
	background-color: #f5f5f5;
	min-height: 100vh;
}
</style>