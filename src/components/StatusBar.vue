<template>
	<div class="status-bar">
		<div class="status-section">
			<div class="status-indicator" :class="statusClass"></div>
			<span class="status-text" :class="statusClass">{{ status }}</span>
		</div>

		<div class="update-section" v-if="lastUpdate">
			<span class="update-text">最后更新: {{ lastUpdate }}</span>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
	status: string
	isConnected: boolean
	lastUpdate: string
}

const props = defineProps<Props>()

const statusClass = computed(() => ({
	'connected': props.isConnected,
	'disconnected': !props.isConnected
}))
</script>

<style lang="less" scoped>
.status-bar {
	background: white;
	padding: 15px 20px;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	margin-bottom: 20px;
	display: flex;
	justify-content: space-between;
	align-items: center;
	.status-section {
		display: flex;
		align-items: center;
		gap: 10px;
		.status-indicator {
			width: 14px;
			height: 14px;
			border-radius: 50%;
			transition: background-color 0.3s ease;
		}
		.status-indicator.connected {
			background-color: #27ae60;
			box-shadow: 0 0 8px rgba(39, 174, 96, 0.4);
		}
		
		.status-indicator.disconnected {
			background-color: #e74c3c;
			box-shadow: 0 0 8px rgba(231, 76, 60, 0.4);
		}
		
		.status-text {
			font-weight: 600;
			font-size: 16px;
			transition: color 0.3s ease;
		}

		.status-text.connected {
			color: #27ae60;
		}
		
		.status-text.disconnected {
			color: #e74c3c;
		}
	}
	.update-section {
		color: #7f8c8d;
		font-size: 16px;
		.update-text {
			font-family: 'Courier New', monospace;
		}
	}
}
</style>