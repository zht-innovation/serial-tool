import { createApp } from 'vue'
import './utils/rem'
import App from './App.vue'

createApp(App).mount('#app').$nextTick(() => {
	// Use contextBridge
	window.ipcRenderer.on('main-process-message', (_event, message) => {
		console.log(message)
	})
})
