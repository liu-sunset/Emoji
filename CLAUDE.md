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
├── tests/                    # Playwright 测试脚本
│   ├── test_plan.py          # 测试计划主脚本
│   ├── integration_test.py   # 集成测试
│   ├── test_modules/         # 各模块测试
│   │   ├── login_test.py
│   │   ├── upload_test.py
│   │   ├── prompt_test.py
│   │   ├── generate_test.py
│   │   └── export_test.py
│   ├── cloud_tests/          # 云端测试
│   │   ├── scf_test.py
│   │   └── cos_test.py
│   ├── performance_tests/    # 性能测试
│   │   └── load_test.py
│   └── reports/              # 测试报告
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
- [x] Playwright 端到端测试框架
- [x] 全面测试计划与测试脚本

### 待完成 ⏳

- [ ] 云函数部署到腾讯云 SCF
- [ ] 前端部署到腾讯云 COS/CloudBase
- [ ] 真实 AI 生成流程测试
- [ ] 频率限制实际测试
- [ ] 响应式布局移动端测试

***

## 界面设计

### 当前设计风格

- **配色方案**: 白色/浅灰背景 + 黑色细线条边框 + 珊瑚红强调色
- **设计风格**: 极简手绘线条风格 + Anthropic公司网站风格
- **布局方式**: 弹性布局 (Flexbox + CSS Grid)
- **圆角设计**: 8px - 20px
- **边框样式**: 手绘虚线边框 (dashed border) 为主要装饰元素
- **动画效果**: 150ms - 300ms 过渡，简洁不喧宾夺主

### CSS 变量系统

```css
--color-bg-primary: #FAFAFA         /* 主背景 - 浅灰白 */
--color-bg-card: #FFFFFF            /* 卡片背景 - 纯白 */
--color-border: #1a1a1a             /* 主边框 - 深黑线条 */
--color-border-light: #E5E5E5       /* 次要边框 - 浅灰 */
--color-text-primary: #1a1a1a       /* 主文字 - 深黑 */
--color-text-secondary: #666666      /* 次要文字 - 中灰 */
--color-accent: #FF6B6B             /* 强调色 - 珊瑚红 */
--color-accent-light: #FFE5E5       /* 强调浅色 */
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

## 测试指南

### 测试框架

本项目使用 Playwright 进行端到端自动化测试。

### 测试环境准备

```bash
# 创建虚拟环境
cd d:\thought\emoj
python -m venv venv

# 安装 Playwright（项目级）
venv\Scripts\pip install playwright
venv\Scripts\python -m playwright install chromium --with-deps
```

### 运行测试

```bash
# 启动前端开发服务器
cd emo-j
npm run dev

# 运行集成测试
cd ..
venv\Scripts\python tests/integration_test.py

# 运行模块测试
venv\Scripts\python tests/test_modules/login_test.py
venv\Scripts\python tests/test_modules/upload_test.py
venv\Scripts\python tests/test_modules/prompt_test.py
venv\Scripts\python tests/test_modules/generate_test.py
venv\Scripts\python tests/test_modules/export_test.py

# 运行云端测试（需配置环境变量）
set VITE_API_BASE_URL=https://your-scf-url.tencentyun.com
venv\Scripts\python tests/cloud_tests/scf_test.py
venv\Scripts\python tests/cloud_tests/cos_test.py

# 运行性能测试
venv\Scripts\python tests/performance_tests/load_test.py
```

### 测试用例覆盖

| 模块 | 用例数 | 覆盖功能 |
|-----|-------|---------|
| 登录模块 | 5 | 密码验证、自动登录、退出登录 |
| 图片上传模块 | 9 | 拖拽上传、格式校验、大小限制 |
| 提示词编辑模块 | 12 | 风格选择、气泡预设、自定义编辑 |
| 生成与结果模块 | 12 | 按钮状态、加载状态、错误处理 |
| 导出面板模块 | 17 | 分割预览、抠图处理、批量导出 |
| SCF云函数测试 | 10 | 部署验证、并发测试、日志检查 |
| COS部署测试 | 8 | 资源加载、CORS配置、SSL验证 |
| 性能测试 | 10 | 响应时间、负载测试、资源占用 |
| **总计** | **90+** | **全面覆盖** |

### 测试报告

详细测试计划请查看: [.trae/documents/EMO.J项目全面测试计划.md](./.trae/documents/EMO.J项目全面测试计划.md)

***

## 更新日志

### 2026-03-30

- **全面测试**: 完成EMO.J项目全面测试计划
  - 修复 ESLint 错误 (ProgressDisplay组件、imageProcessor工具)
  - 创建测试目录结构 `tests/`
  - 编写登录模块测试脚本
  - 编写图片上传模块测试脚本
  - 编写提示词编辑模块测试脚本
  - 编写生成与结果查看模块测试脚本
  - 编写导出面板模块测试脚本
  - 编写SCF云函数测试脚本
  - 编写COS/CloudBase部署测试脚本
  - 编写性能与负载测试脚本
  - 执行本地集成测试（5/5通过）
  - 响应式布局测试（桌面、笔记本、平板、手机全部通过）
  - 编译检查通过，生产构建成功

### 2026-03-29 (修复)

