<!-- filepath: /Users/wen/Project/serial-tool/src/components/AppHeader.vue -->
<template>
	<header class="app-header">
		<h1>SBUS遥控器通道读取工具</h1>
		<p class="subtitle">检测Windows设备管理器并读取USB遥控器的SBUS协议数据</p>
	</header>
</template>

<script setup lang="ts">
</script>

<style lang="less" scoped>
.app-header {
	text-align: center;
	margin-bottom: 30px;
	font-size: 24px;
	padding-top: 7px;
}

.app-header h1 {
	color: #2c3e50;
	font-size: 2.5em;
	margin-bottom: 10px;
	font-weight: 600;
}

.subtitle {
	color: #7f8c8d;
	font-size: 24px;
	margin: 0;
}
</style>