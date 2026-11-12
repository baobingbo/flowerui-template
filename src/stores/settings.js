import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const LS_KEY = 'flower_settings'

export const TRANSPORT_OPTIONS = [
  {
    value: 'ws',
    label: 'WebSocket 实时推送',
    desc: '服务端主动推送 snapshot / summary / timeline / event，延迟最低，带宽最省'
  },
  {
    value: 'polling',
    label: 'HTTP 轮询',
    desc: '按固定间隔调用 REST 接口拉取，适合反向代理不支持 WebSocket 的环境'
  }
]

/** 轮询间隔的合法区间（毫秒） */
export const POLL_MIN = 1000
export const POLL_MAX = 120000

const DEFAULTS = {
  /** 数据通道：ws（WebSocket 推送）| polling（HTTP 轮询） */
  transport: 'ws',
  /** 轮询间隔，毫秒 */
  pollInterval: 3000,
  /** 轮询模式下是否同时拉取事件流（数据量较大，可关闭） */
  pollEvents: true,
  /** 侧边导航是否收起 */
  sidebarCollapsed: false,
  /** 表格密度 */
  tableSize: 'small',
  /** 页面切换动画 */
  pageTransition: true
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(LS_KEY) || '{}')
    return { ...DEFAULTS, ...(raw && typeof raw === 'object' ? raw : {}) }
  } catch {
    return { ...DEFAULTS }
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const initial = load()

  const transport = ref(initial.transport)
  const pollInterval = ref(initial.pollInterval)
  const pollEvents = ref(initial.pollEvents)
  const sidebarCollapsed = ref(initial.sidebarCollapsed)
  const tableSize = ref(initial.tableSize)
  const pageTransition = ref(initial.pageTransition)

  /* ---------------- 显示配置（服务端 TOML 权威） ----------------
   * 这三项不写 localStorage：由 /api/config/ui 每次启动下发，配置页保存后
   * 立即同步，保证不同浏览器 / 终端看到同一套导航与模块。 */
  const showSidebar = ref(true)
  const hiddenMenus = ref([])
  const hiddenModules = ref([])

  function applyServerVisibility(ui = {}) {
    showSidebar.value = ui.show_sidebar !== false
    hiddenMenus.value = Array.isArray(ui.hidden_menus) ? [...ui.hidden_menus] : []
    hiddenModules.value = Array.isArray(ui.hidden_modules) ? [...ui.hidden_modules] : []
  }

  /** config（系统配置）强制可见：否则把所有入口隐藏后无法再恢复设置 */
  function isMenuVisible(name) {
    if (name === 'config') return true
    return !hiddenMenus.value.includes(name)
  }

  function isModuleVisible(id) {
    return !hiddenModules.value.includes(id)
  }

  function snapshot() {
    return {
      transport: transport.value,
      pollInterval: pollInterval.value,
      pollEvents: pollEvents.value,
      sidebarCollapsed: sidebarCollapsed.value,
      tableSize: tableSize.value,
      pageTransition: pageTransition.value
    }
  }

  function persist() {
    localStorage.setItem(LS_KEY, JSON.stringify(snapshot()))
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function setTransport(v) {
    transport.value = v === 'polling' ? 'polling' : 'ws'
  }

  function setPollInterval(ms) {
    const n = Number(ms)
    if (!Number.isFinite(n)) return
    pollInterval.value = Math.min(POLL_MAX, Math.max(POLL_MIN, Math.round(n)))
  }

  function reset() {
    transport.value = DEFAULTS.transport
    pollInterval.value = DEFAULTS.pollInterval
    pollEvents.value = DEFAULTS.pollEvents
    sidebarCollapsed.value = DEFAULTS.sidebarCollapsed
    tableSize.value = DEFAULTS.tableSize
    pageTransition.value = DEFAULTS.pageTransition
  }

  /** 服务端配置里带了界面默认值时，用它覆盖"尚未被用户改过"的项 */
  function applyServerDefaults(ui = {}) {
    const touched = localStorage.getItem(LS_KEY)
    if (touched) return
    if (ui.transport) setTransport(ui.transport)
    if (ui.poll_interval) setPollInterval(ui.poll_interval)
  }

  watch(
    [transport, pollInterval, pollEvents, sidebarCollapsed, tableSize, pageTransition],
    persist
  )

  return {
    transport, pollInterval, pollEvents, sidebarCollapsed, tableSize, pageTransition,
    showSidebar, hiddenMenus, hiddenModules,
    toggleSidebar, setTransport, setPollInterval, reset, applyServerDefaults, snapshot,
    applyServerVisibility, isMenuVisible, isModuleVisible,
    DEFAULTS
  }
})
