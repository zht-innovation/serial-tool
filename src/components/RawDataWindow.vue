<template>
    <div class="raw-data-window">
        <div class="window-header">
            <h3>
                <i class="icon">🔍</i>
                原始数据流 (16进制)
            </h3>
            <div class="controls">
                <button @click="clearData" class="btn btn-clear">清空</button>
                <button @click="toggleAutoScroll" class="btn btn-scroll" :class="{ active: autoScroll }">
                    {{ autoScroll ? '停止滚动' : '自动滚动' }}
                </button>
                <span class="data-count">{{ dataCount }} 字节</span>
            </div>
        </div>
        
        <div class="data-display" ref="dataContainer" @scroll="onScroll">
            <div class="data-content">
                <div 
                    v-for="(line, index) in dataLines" 
                    :key="index" 
                    class="data-line"
                >
                    <span class="line-number">{{ String(index * 16).padStart(6, '0') }}:</span>
                    <span class="hex-data">{{ line.hex }}</span>
                    <span class="ascii-data">{{ line.ascii }}</span>
                </div>
            </div>
        </div>
        
        <div class="status-bar">
            <span>最后更新: {{ lastUpdate }}</span>
            <span>数据包: {{ packetCount }}</span>
            <span>接收速率: {{ dataRate }} bytes/s</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

interface DataLine {
    hex: string
    ascii: string
}

// 响应式数据
const rawData = ref<number[]>([])
const dataCount = ref(0)
const packetCount = ref(0)
const lastUpdate = ref('')
const autoScroll = ref(true)
const dataContainer = ref<HTMLElement>()

// 数据速率计算
const dataRate = ref(0)
const dataRateInterval = ref<NodeJS.Timeout>()
const lastDataCount = ref(0)

// 计算属性
const dataLines = computed(() => {
    const lines: DataLine[] = []
    const data = rawData.value
    
    for (let i = 0; i < data.length; i += 16) {
        const lineData = data.slice(i, i + 16)
        
        // 生成16进制字符串
        const hexParts = lineData.map(byte => byte.toString(16).toUpperCase().padStart(2, '0'))
        const hex = hexParts.join(' ')
        
        // 生成ASCII字符串
        const ascii = lineData.map(byte => {
            return (byte >= 32 && byte <= 126) ? String.fromCharCode(byte) : '.'
        }).join('')
        
        lines.push({ hex, ascii })
    }
    
    return lines
})

// 方法
const addData = (data: Buffer) => {
    const newBytes = Array.from(data)
    rawData.value.push(...newBytes)
    dataCount.value += newBytes.length
    packetCount.value++
    lastUpdate.value = new Date().toLocaleTimeString()
    
    // 限制缓冲区大小（保留最近的10KB数据）
    if (rawData.value.length > 10240) {
        rawData.value = rawData.value.slice(-8192)
    }
    
    // 自动滚动到底部
    if (autoScroll.value) {
        nextTick(() => {
            scrollToBottom()
        })
    }
}

const clearData = () => {
    rawData.value = []
    dataCount.value = 0
    packetCount.value = 0
    lastUpdate.value = ''
}

const toggleAutoScroll = () => {
    autoScroll.value = !autoScroll.value
    if (autoScroll.value) {
        nextTick(() => {
            scrollToBottom()
        })
    }
}

const scrollToBottom = () => {
    if (dataContainer.value) {
        dataContainer.value.scrollTop = dataContainer.value.scrollHeight
    }
}

const onScroll = () => {
    if (!dataContainer.value) return
    
    const { scrollTop, scrollHeight, clientHeight } = dataContainer.value
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 10
    
    // 如果用户手动滚动到非底部位置，停止自动滚动
    if (!isAtBottom && autoScroll.value) {
        autoScroll.value = false
    }
}

// 计算数据接收速率
const updateDataRate = () => {
    const currentCount = dataCount.value
    const bytesPerSecond = currentCount - lastDataCount.value
    dataRate.value = bytesPerSecond
    lastDataCount.value = currentCount
}

// 生命周期
onMounted(() => {
    // 每秒更新一次数据速率
    dataRateInterval.value = setInterval(updateDataRate, 1000)
})

onUnmounted(() => {
    if (dataRateInterval.value) {
        clearInterval(dataRateInterval.value)
    }
})

// 暴露方法给父组件
defineExpose({
    addData
})
</script>

<style lang="less" scoped>
.raw-data-window {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    margin-top: 20px;
    overflow: hidden;

    .window-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        border-bottom: 1px solid #dee2e6;

        h3 {
            color: #2c3e50;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.2em;

            .icon {
                font-size: 1.1em;
            }
        }

        .controls {
            display: flex;
            align-items: center;
            gap: 10px;

            .btn {
                padding: 6px 12px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 17px;
                transition: all 0.3s ease;
            }

            .btn-clear {
                background-color: #e74c3c;
                color: white;

                &:hover {
                    background-color: #c0392b;
                }
            }

            .btn-scroll {
                background-color: #95a5a6;
                color: white;

                &.active {
                    background-color: #27ae60;
                }

                &:hover {
                    opacity: 0.8;
                }
            }

            .data-count {
                font-size: 16px;
                color: #7f8c8d;
                background-color: #ecf0f1;
                padding: 4px 8px;
                border-radius: 3px;
                font-family: 'Courier New', monospace;
            }
        }
    }

    .data-display {
        height: 300px;
        overflow-y: auto;
        background-color: #2c3e50;
        color: #ecf0f1;
        font-family: 'Courier New', monospace;
        font-size: 17px;
        padding: 10px;

        &::-webkit-scrollbar {
            width: 8px;
        }

        &::-webkit-scrollbar-track {
            background: #34495e;
        }

        &::-webkit-scrollbar-thumb {
            background: #7f8c8d;
            border-radius: 4px;

            &:hover {
                background: #95a5a6;
            }
        }

        .data-content {
            .data-line {
                display: flex;
                align-items: center;
                margin-bottom: 2px;
                line-height: 1.4;

                &:hover {
                    background-color: rgba(52, 73, 94, 0.5);
                }

                .line-number {
                    color: #95a5a6;
                    margin-right: 10px;
                    width: 60px;
                    flex-shrink: 0;
                }

                .hex-data {
                    color: #3498db;
                    margin-right: 20px;
                    flex: 1;
                    letter-spacing: 1px;
                }

                .ascii-data {
                    color: #e67e22;
                    width: 140px;
                    flex-shrink: 0;
                    background-color: rgba(0, 0, 0, 0.2);
                    padding: 2px 6px;
                    border-radius: 2px;
                }
            }
        }
    }

    .status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 20px;
        background-color: #f8f9fa;
        border-top: 1px solid #dee2e6;
        font-size: 17px;
        color: #6c757d;

        span {
            font-family: 'Courier New', monospace;
        }
    }
}
</style>