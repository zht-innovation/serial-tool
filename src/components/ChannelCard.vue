<template>
	<div class="channel-card" :class="cardClass">
		<div class="channel-header">
			<span class="channel-label">CH{{ channelNumber }}</span>
			<span class="channel-type">{{ typeLabel }}</span>
		</div>

		<div class="channel-value">
			{{ formattedValue }}
		</div>

		<div class="channel-progress">
			<div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
		</div>

		<div class="channel-range">
			{{ rangeText }}
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
	channelNumber: number
	value: number
	maxValue: number
	minValue?: number
	type: 'raw' | 'microseconds'
}

const props = defineProps<Props>()

const minVal = computed(() => props.minValue || 0)

const typeLabel = computed(() =>
	props.type === 'raw' ? 'RAW' : 'μs'
)

const formattedValue = computed(() =>
	props.type === 'microseconds' ? `${props.value}μs` : props.value.toString()
)

const progressPercentage = computed(() => {
	const range = props.maxValue - minVal.value
	const currentVal = props.value - minVal.value
	return Math.max(0, Math.min(100, (currentVal / range) * 100))
})

const rangeText = computed(() =>
	`${minVal.value} - ${props.maxValue}`
)

const cardClass = computed(() => ({
	'card-raw': props.type === 'raw',
	'card-microseconds': props.type === 'microseconds',
	'card-active': props.value > minVal.value
}))
</script>

<style lang="less" scoped>
.channel-card {
	background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
	border: 1px solid #dee2e6;
	border-radius: 8px;
	padding: 15px;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;
}

.channel-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.card-active {
	border-color: #3498db;
}

.card-raw.card-active {
	background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.card-microseconds.card-active {
	background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
}

.channel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 10px;
}

.channel-label {
	font-weight: bold;
	color: #2c3e50;
	font-size: 16px;
}

.channel-type {
	font-size: 15px;
	color: #7f8c8d;
	background-color: #ecf0f1;
	padding: 2px 6px;
	border-radius: 3px;
}

.channel-value {
	font-size: 1.8em;
	font-weight: bold;
	color: #2980b9;
	font-family: 'Courier New', monospace;
	text-align: center;
	margin-bottom: 10px;
}

.channel-progress {
	background-color: #ecf0f1;
	height: 17px;
	border-radius: 7px;
	overflow: hidden;
	margin-bottom: 8px;
}

.progress-bar {
	height: 100%;
	background: linear-gradient(90deg, #3498db 0%, #2ecc71 50%, #f39c12 100%);
	transition: width 0.3s ease;
	border-radius: 2px;
}

.channel-range {
	font-size: 15px;
	color: #95a5a6;
	text-align: center;
	font-family: 'Courier New', monospace;
}
</style>