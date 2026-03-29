# EMO.J 项目跟踪文档

## 项目概述

### 项目名称

EMO.J - AI表情包生成器

### 项目描述

一个基于阿里云百炼API的Web应用，用户上传图片后自动生成9宫格Q版贴纸表情包，支持一键剪切导出。

### 目标用户

- 社交媒体用户
- 需要快速制作表情包的非专业设计师

### 技术栈

- **前端**: React 18 + Vite + TypeScript
- **后端**: 腾讯云云函数 SCF (Node.js)
- **AI API**: 阿里云百炼 API (dashscope z-image-turbo)
- **部署**: 腾讯云 (SCF + COS/CloudBase)

***

## 项目结构

```
d:\thought\emoj\
├── emo-j/                    # 前端项目
│   ├── src/
│   │   ├── components/       # React 组件
│   │   │   ├── Login/        # 登录组件
│   │   │   ├── ImageUploader/# 图片上传组件
│   │   │   ├── PromptEditor/ # 提示词编辑组件
│   │   │   ├── ResultViewer/ # 结果查看组件
│   │   │   ├── ExportPanel/  # 导出面板组件
│   │   │   ├── GenerateButton/# 生成按钮组件
│   │   │   └── ProgressDisplay/ # 进度显示组件
│   │   ├── utils/
│   │   │   ├── api.ts       # API 调用工具
│   │   │   ├── promptConfig.ts # Prompt 模板配置
│   │   │   ├── imageProcessor.ts # 图片分割和抠图处理
│   │   │   ├── taskQueueManager.ts # 异步任务队列管理器
│   │   │   └── notifications.ts # 浏览器通知工具
│   │   ├── workers/
│   │   │   └── mattingWorker.ts # Web Worker 抠图后台处理
│   │   ├── App.tsx           # 主组件
│   │   ├── App.css           # 主样式
│   │   ├── index.css         # 全局样式
│   │   └── main.tsx          # 入口文件
│   ├── dist/                 # 构建输出目录
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example          # 环境变量示例
│
├── scf-handler/              # 腾讯云函数后端
│   ├── index.js              # 云函数入口
│   └── package.json
│
└── .trae/                    # Trae IDE 配置
    ├── specs/emoj-generator/  # 项目规范文档
    │   ├── spec.md           # 功能规范
    │   ├── tasks.md          # 任务列表
    │   └── checklist.md      # 验收清单
    └── documents/            # 设计文档
        └── 前端页面重新设计计划.md
```

***

## 架构设计

### 前端架构

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 8.0
- **状态管理**: React Hooks (useState/useCallback)
- **路由**: 单页面应用 (SPA)

### 后端架构

- **平台**: 腾讯云云函数 SCF
- **运行时**: Node.js 14.x
- **功能**:
  - 密码验证 (Bearer Token)
  - 频率限制 (每IP每天10次)
  - API 转发至阿里云百炼

### API 调用流程

```
用户上传图片 → 前端发送请求 → SCF验证密码 → 调用百炼API → 返回图片URL → 前端展示
```

***

## 功能模块

### 1. 认证模块

- 密码访问控制 (默认密码: emo123)
- LocalStorage 存储 24 小时登录状态

### 2. 图片上传模块

- 支持格式: JPG/PNG/WebP
- 最大文件大小: 5MB
- 拖拽上传 + 点击选择

### 3. AI 生成模块

- 调用阿里云 z-image-turbo 模型
- 输出尺寸: 2000px \* 2000px 固定尺寸
- 6宫格布局 (2行3列)
- 每个表情包宽高不超过 500px
- 相邻表情包间距不低于 120px

### 4. Prompt 编辑模块 (选择式编辑)

- 用户可通过点击选择风格、气泡文字
- **风格选项** (8个): 卡通风、迪士尼风格、像素风格、水彩画风格、扁平插画风格、复古漫画风格、赛博朋克风格、自定义风格
- **气泡文字预设** (3组): 日常问候、社交互动、网络热梗，支持单独编辑每个气泡
- 所有选择都是可选的，默认值即为原始 prompt 效果
- 自动组装完整 prompt 字符串
- 背景固定为透明背景，带分割线

### 5. 剪切导出模块

- AI 生成透明背景的6宫格总图（2行3列，带分割线）
- 点击"生成预览"自动分割图片
- 对每个格子进行抠图，提取表情包主体
- Canvas API 均分图片 + 透明背景抠图
- JSZip 打包下载
- FileSaver 保存文件
- **抠图功能**:
  - 功能开关：用户可控的抠图功能启用/禁用选项
  - 批量自动抠图：一键移除所有表情包背景
  - 预览功能：为每个抠图后的子图提供效果预览
  - 导出规则：已抠图的子图导出抠图后图像，未抠图的导出原始分割图像
  - 快捷导出选项：一键导出所有抠图图像、一键导出所有原始分割图像
- **异步处理机制** (2026-03-29 新增):
  - Web Worker 后台处理：抠图任务在独立线程执行，不阻塞主线程
  - 任务队列管理：支持多任务并发处理（最多2个并发）
  - 实时进度显示：进度条 + 百分比 + 当前处理状态
  - 任务取消功能：用户可随时终止处理
  - 任务状态更新：处理中/完成/失败/已取消
  - 完成通知：任务完成后浏览器自动通知

***

## 环境变量配置

### 前端 (.env)

```env
VITE_API_BASE_URL=https://your-scf-url.tencentyun.com
```

### 后端 (SCF 环境变量)

```env
DASHSCOPE_API_KEY=您的阿里云API密钥
ACCESS_PASSWORD=访问密码
DAILY_LIMIT=10
```

***

## 项目进度

### 已完成 ✅

- [x] 项目初始化 (React + Vite + TypeScript)
- [x] 登录页面组件
- [x] 图片上传组件
- [x] 提示词编辑组件
- [x] AI 生成功能集成
- [x] 结果查看组件
- [x] 导出面板组件 (6宫格剪切 + ZIP下载)
- [x] 前端界面重新设计 (黑绿配色 + 苹果风格)
- [x] TypeScript 类型定义
- [x] 生产构建测试
- [x] 结果区域按需显示 (点击生成后才显示)
- [x] ResultViewer 和 ExportPanel 高度统一为 400px
- [x] 添加本地测试服务器 (local-server.js)
- [x] 异步抠图处理机制 (Web Worker + 任务队列)

### 待完成 ⏳

- [ ] 云函数部署到腾讯云 SCF
- [ ] 前端部署到腾讯云 COS/CloudBase
- [ ] 真实 AI 生成流程测试
- [ ] 频率限制实际测试
- [ ] 响应式布局移动端测试

***

## 界面设计

### 当前设计风格

- **配色方案**: 黑色 + 绿色 (黑绿配色)
- **设计风格**: 苹果公司产品简约风格
- **布局方式**: 弹性布局 (Flexbox + CSS Grid)
- **圆角设计**: 8px - 24px
- **动画效果**: 150ms - 300ms 过渡

### CSS 变量系统

```css
--color-bg-primary: #000000      /* 主背景 */
--color-accent-primary: #00D26A  /* 强调色-绿 */
--color-text-primary: #FFFFFF    /* 主文字 */
--color-border: #2d2d2d          /* 边框色 */
```

***

## 部署指南

### 前端部署

```bash
cd emo-j
npm run build        # 构建生产版本
# 上传 dist/ 目录到 COS 或 CloudBase
```

### 后端部署

```bash
cd scf-handler
# 使用腾讯云 CLI 或控制台上传
scf deploy --function-name emo-handler
```

***

## 开发指南

### 安装依赖

```bash
cd emo-j
npm install
```

### 开发模式

```bash
cd emo-j
npm run dev
```

### 生产构建

```bash
cd emo-j
npm run build
```

### 代码检查

```bash
cd emo-j
npm run lint
```

***

## 本地测试指南

### 1. 安装后端依赖

```bash
cd scf-handler
npm install
```

### 2. 配置 API Key

编辑 `scf-handler/.env` 文件：

```env
DASHSCOPE_API_KEY=您的阿里云百炼API密钥
ACCESS_PASSWORD=emo123
```

### 3. 启动本地后端服务

```bash
cd scf-handler
npm run dev
```

### 4. 启动前端开发服务器

```bash
cd emo-j
npm run dev
```

### 5. 测试流程

1. 打开 <http://localhost:5173>
2. 输入密码登录 (默认: emo123)
3. 上传图片并填写提示词
4. 点击生成按钮测试

***

## 规范文档

详细功能规范请查看: [spec.md](./.trae/specs/emoj-generator/spec.md)

***

## 更新日志

### 2026-03-29 (下午)

- **重大改进**：异步抠图处理机制 - 解决界面阻塞问题
  - 实现 Web Worker 后台处理，抠图任务在独立线程执行，不阻塞主线程
  - 新增 `mattingWorker.ts` - Web Worker 脚本，处理 AI 背景移除
  - 新增 `taskQueueManager.ts` - 任务队列管理器，支持多任务并发处理（最多2个并发）
  - 新增 `ProgressDisplay` 组件 - 实时进度显示，包含进度条、百分比、当前处理状态
  - 新增 `notifications.ts` - 浏览器通知工具，任务完成后自动通知
  - 重构 `ExportPanel` 组件 - 集成异步任务系统，移除同步阻塞代码
  - 支持任务取消功能 - 用户可随时终止处理
  - 实现任务状态实时更新 - 包括"处理中"、"完成"、"失败"、"已取消"状态
  - 确保用户可在抠图过程中继续使用网站其他功能
  - 配置 Vite 打包 Worker 支持

### 2026-03-29 (上午)

- **Prompt 优化**：添加背景颜色特征要求，优化抠图效果
  - 在 prompt 中明确要求生成纯绿色背景 (#00FF00)
  - 强调主体与背景必须有明显分界，便于 AI 抠图算法识别
  - 要求背景为高对比度纯色，不能使用渐变、纹理或复杂图案
  - 说明纯绿色背景与前景形成强烈对比，确保抠图时准确分离主体
  - 此优化可显著改善文字气泡、头发等细节的抠图效果

- **重大改进**：抠图功能升级 - 实现真正的透明背景
  - 集成 `@imgly/background-removal` AI 背景移除库
  - 使用 AI 技术自动识别前景主体并移除背景
  - 批量抠图时显示处理进度（"正在处理第 X/Y 张..."）
  - 输出真正的透明背景 PNG 图片（移除白色边框/背景）
  - 保留表情包主体边缘细节

- **功能简化**：移除单个图片抠图功能
  - 删除单个图片的区域选择抠图功能
  - 仅保留批量自动抠图功能，简化用户操作
  - 保留单个清除抠图结果的功能

- **BUG 修复**：修复抠图后预览无法正常显示的问题
  - 添加 useEffect 监听 `mattingPreviews` 状态变化
  - 修复 `mattingPreviewUrls` 和 `mattingPreviews` 状态未关联的问题
  - 优化 `getPreviewUrl` 函数逻辑，正确获取抠图预览 URL

- **BUG 修复**：修复分割后子图原图无法显示的问题
  - 将预览 URL 存储从数组改为 Map（索引 -> URL）
  - 避免数组索引对应关系错误导致的图片无法显示
  - 简化 `getPreviewUrl` 函数逻辑，直接使用 Map.get 获取 URL

### 2026-03-28

- **新增功能**：抠图功能模块
  - 添加用户可控的抠图功能启用/禁用开关
  - 实现区域选择功能：支持批量处理和单个处理两种操作模式
  - 为每个设置了抠图区域的子图提供抠图效果预览
  - 导出规则：已使用抠图的子图导出抠图后图像，未使用的导出原始分割图像
  - 添加"一键导出所有抠图图像"功能按钮
  - 添加"一键导出所有原始分割图像"功能按钮
- 重构 PromptEditor 组件为选择式编辑模式
- 新增 promptConfig.ts 配置文件，包含风格、气泡文字预设
- 所有选择都是可选的，默认值即为原始 prompt 效果
- 移除 App.tsx 中单独的 bubbleTexts 状态
- 图片尺寸从 1:1 比例改为 2000px \* 2000px 固定尺寸
- 单个表情包和气泡文字宽高不超过 500px
- 相邻表情包间距不低于 120px
- 风格提供 7 个预设选项 + 1 个自定义输入选项
- 移除了自定义完整编辑模式入口，改为各模块内的自定义输入
- 增强 prompt 中对表情包分割完整性的约束描述，避免表情跨越格子边界
- **重大变更**: 生成透明背景的6宫格图片（2行3列，带分割线），移除背景渐变选项
- 新增 imageProcessor.ts 实现图片分割和抠图功能
- 导出流程变更：生成预览 → 分割 → 抠图 → 展示抠图结果 → 一键导出
- 优化裁切策略，扩大 padding 值至 40，并使用动态 padding 确保表情包完整性
- **布局变更**: 从9宫格（3x3）改为6宫格（2x3），气泡文字从9个减少为6个
- **新增功能**: 原图下载功能 - 在 ResultViewer 中添加下载按钮，支持下载 AI 生成的完整图片
- **UI优化**: 预览关闭按钮位置从图片右上角调整为设备右上角 (viewport fixed)
- **新增功能**: 预览导航功能 - 添加"上一张/下一张"导航按钮，支持平滑过渡动画
- **BUG修复**: 修复同一照片多次生成后预览不更新的问题 - 添加 useEffect 监听 imageUrl 变化重置状态
- **UI优化**: 优化整体布局间距，移除冗余 hover 效果，提升视觉紧凑感

### 2026-03-27

- 添加 `hasStartedGeneration` 状态追踪生成流程
- 结果区域现在只在用户点击生成按钮后显示
- 统一 ResultViewer 和 ExportPanel 容器高度为 400px

### 2026-03-26

- 完成前端页面重新设计 (黑绿配色 + 苹果风格)
- 更新所有 CSS 文件使用新的设计系统
- 验证构建和开发服务器正常运行

### 2026-03-25

- 完成核心功能开发
- 实现 9 宫格剪切和 ZIP 导出
- 集成阿里云百炼 API

