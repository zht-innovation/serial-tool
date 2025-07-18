<template>
	<div class="data-display">
		<div class="channels-section">
			<h3>
				<i class="icon">📊</i>
				通道值
			</h3>
			<div class="channels-grid">
				<ChannelCard v-for="(value, index) in displayChannels" :key="`raw-${index}`" :channel-number="index + 1"
					:value="value" :max-value="2047" type="raw" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, computed, watch, ref } from 'vue';
import ChannelCard from './ChannelCard.vue';

const props = defineProps(['channels'])

// 使用本地ref来控制更新频率
const localChannels = ref<number[]>(Array(16).fill(0))

const displayChannels = computed(() => {
	return localChannels.value
})

// 使用watch来控制更新频率
let updatePending = false
watch(() => props.channels, (newChannels) => {
    if (!newChannels || updatePending) return
    
    updatePending = true
    requestAnimationFrame(() => {
        localChannels.value = [...newChannels]
        updatePending = false
    })
}, { deep: true })

onMounted(() => {
	// 这里可以添加一些初始化逻辑
	// console.log('DataDisplay组件已挂载，当前通道值:', props.channels);
    if (props.channels) {
        localChannels.value = [...props.channels]
    }
});
</script>

<style lang="less" scoped>
.data-display {
	background: white;
	padding: 20px;
	border-radius: 8px;
	box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	.channels-section {
		margin-bottom: 30px;
		&:last-child {
			margin-bottom: 0;
		}
		
		h3 {
			color: #2c3e50;
			margin-bottom: 15px;
			padding-bottom: 10px;
			border-bottom: 2px solid #ecf0f1;
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 1.3em;
			.icon {
				font-size: 1.2em;
			}
		}
	}

	.channels-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 15px;
	}
}
</style>