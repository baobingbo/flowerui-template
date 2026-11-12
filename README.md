# FlowerUI 前端模板（flowerui-template）

> 基于 **Vue 3 + Element Plus + Vite** 的 Celery/Flower 管理界面前端脚手架。
>
> 这是从 FlowerUI 单体仓库（`flowerui-fastapi`）中拆出的**前端独立仓库**，可作为前端模板单独克隆、开发、构建。后端（FastAPI + Celery）见 [`flower-fastapi`](https://github.com/baobingbo/flower-fastapi)。

---

## 1. 概览

- **框架**：Vue 3 + Element Plus，Vite 构建。
- **开发服务器**：Vite 热更新，默认端口 **5556**，通过代理把 `/api` 与 `/ws` 转发到后端（默认 5555）。
- **生产产物**：`npm run build` 输出到 `dist/`，可交给后端单端口托管。
- **主题系统**：内置暗色 / 亮色主题，支持在界面上传自定义 CSS（"目录即真理"：上传即识别，重启后保持）。
- **数据来源**：默认对接真实后端；后端加 `--mock` 或 `demo` 模式可查看演示数据。

### 已包含的功能模块

| 模块 | 说明 |
| --- | --- |
| 仪表盘 Dashboard | 概览卡片、图表（ECharts） |
| Workers / Tasks | Worker 与任务列表、详情、状态标签 |
| Broker | 消息代理状态 |
| 监控 Monitor | 实时指标 |
| 配置 Config | 运行时配置查看与编辑 |
| 系统 System | 系统信息与重启 |
| 登录 Login | 基础认证登录页 |
| 主题 Theme | 暗/亮切换、自定义 CSS 上传 |

---

## 2. 目录结构

```
flowerui-template/
├── src/
│   ├── api/                    # axios 封装 + WebSocket 客户端
│   │   ├── client.js           # HTTP 客户端（自动带鉴权头）
│   │   ├── index.js            # 业务接口聚合
│   │   └── ws.js               # WebSocket 客户端（可切换轮询兜底）
│   ├── stores/                 # Pinia 状态管理（app / detail / settings / theme）
│   ├── composables/            # 组合式函数（如 useChart）
│   ├── layouts/AppLayout.vue   # 主布局（可折叠导航 / 登录态）
│   ├── components/             # 通用组件（StatCard / StateTag / ThemeSwitcher …）
│   ├── views/                  # 页面（Dashboard / Workers / Tasks / Broker / Config / System / Login …）
│   ├── styles/                 # 全局样式（tokens / themes / components）
│   │   └── themes/             # dark.css / light.css / _contract.css / _glass.css
│   ├── theme/registry.js       # 主题注册表
│   ├── utils/format.js         # 格式化工具
│   ├── router/index.js         # 路由
│   ├── App.vue
│   └── main.js
├── vite.config.js              # Vite 配置（开发端口 5556，代理 /api /ws → 5555）
├── package.json
├── package-lock.json
├── index.html
├── manage.sh                  # 前端专属服务管理（dev/build/stop/status/clean/help）
├── .gitignore
└── LICENSE
```

> 设计约定：**后端返回聚合结果，前端纯展示**。前端通过 `src/api` 对接后端，所有交互在前端完整实现，便于后续替换为真实服务。

---

## 3. 环境准备

需要 **Node.js 18+** 与 npm。

```bash
# 安装依赖（国内镜像）
npm install --registry=https://registry.npmmirror.com
```

依赖已写入 `package.json`：核心含 `vue`、`vue-router`、`pinia`、`element-plus`、`axios`、`echarts`、`dayjs`。

---

## 4. 快速开始

### 方式一：开发模式（推荐，热更新）

```bash
# 前端专属脚本（Vite 5556，后台运行，关终端不影响）
./manage.sh dev
```

打开 <http://127.0.0.1:5556>，Vite 自动代理后端 API 与 WebSocket。
开发模式下请确保后端（5555）已启动，否则页面会因 `/api` 代理无响应而空白。

### 方式二：仅构建产物（交给后端托管）

```bash
npm run build          # 输出到 dist/
# 或：./manage.sh build（额外把 dist 同步到后端静态目录，见第 6 节）
```

构建出的 `dist/` 可由 Nginx、或 FlowerUI 后端单端口直接托管。

---

## 5. 服务管理（`manage.sh`）

所有命令在本仓库根目录执行（Git Bash / Linux / macOS 通用）。

| 命令 | 说明 |
| --- | --- |
| `./manage.sh dev` | 开发模式：停 + 起（Vite 热更新，端口 5556，**后台**运行） |
| `./manage.sh restart` | 重启（等价于 `dev`，先停后起） |
| `./manage.sh build` | 构建前端产物（在单体仓库中还会同步到后端 `static/`，见下） |
| `./manage.sh stop` | 仅停止前端（按端口 5556 精确定位，不误杀后端 / worker） |
| `./manage.sh status` | 查看前端运行状态 |
| `./manage.sh clean` | 清理 `logs/` 下历史日志 |
| `./manage.sh help` | 显示帮助 |

> **后台行为**：`dev` / `restart` 将 Vite 以后台方式拉起（PID 记在 `logs/_vite.pid`，日志在 `logs/vite.log`）。
> **日志位置**：运行时日志在 `logs/`（Vite 日志与 `_vite.pid`）。这些文件已被 `.gitignore` 过滤，不会入库。

---

## 6. 与后端的关系

- 本仓库是**纯前端**。开发时通过 `vite.config.js` 的代理把 `/api`、`/ws` 转发到后端（默认 `http://127.0.0.1:5555`）。
- 当本前端被放进 FlowerUI 单体仓库的 `frontend/` 目录时，`./manage.sh build` 会：
  1. 预清 `dist/`（规避部分环境下 Vite 清空输出被安全机制拦截）；
  2. `npm run build` 输出到 `dist/`；
  3. 把 `dist/` 同步到后端 `backend/flowerui/static/`（全量替换），并补齐内置主题到 `backend/flowerui/themes/`（只补齐缺失文件，不覆盖用户上传的主题）。
- 在**本独立模板**中，`build` 仍会正常构建 `dist/`；若后端目录不存在，同步步骤会自动跳过（仅提示），不影响构建产物本身。

---

## 7. 主题

- 界面「主题」页可切换暗色 / 亮色，也可上传自定义 CSS。
- 内置主题变量在 `src/styles/themes/`（`dark.css` / `light.css` / `_contract.css` / `_glass.css`），共享变量通过 `_contract.css` 约定。
- 后端运行时的「目录即真理」机制：`backend/flowerui/themes/*.css` 即一个主题，扫描即注册，上传即识别、重启保持（详见后端仓库文档）。

---

## 8. 故障排查

| 现象 | 原因 / 处理 |
| --- | --- |
| 5556 起不来 | 端口被占用；`./manage.sh stop` 后再 `dev`，或查 `logs/vite.log` |
| 页面空白 / API 404 | 后端未启动，或 `/api` 代理未生效；确认后端 5555 在运行 |
| 没起 Vite、只启动后端时访问 5556 白屏 | 5556 仅在 dev 模式存在；生产部署应访问后端托管的 5555 |
| 打开 `http://0.0.0.0:5555` 白屏 | `0.0.0.0` 是网卡绑定值不是访问地址；改用 `127.0.0.1` |
| 界面在但数据全 0 | 真实 broker 无 Worker / 任务；后端加 `--mock` 或用 `demo` 模式查看演示数据 |
| 主题不生效 | 确认后端 `themes/` 下有对应 CSS；界面上传后刷新即可 |

---

## 9. 许可证

MIT License — Copyright (c) 2026 Bao Bingbo. 详见 [LICENSE](./LICENSE)。
