# EMO.J - AI表情包生成器

一款基于人工智能的 Web 应用，可将您的照片转换成可爱的 9 宫格 Q 版表情包。

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6)

---

## 功能特性

- **🤖 AI 智能生成** - 基于阿里云百炼 API，一键生成 9 宫格表情包
- **📤 简单上传** - 支持拖拽或点击上传图片
- **✏️ 灵活编辑** - 可自定义提示词和气泡文字
- **📦 一键导出** - 9 张图片 ZIP 打包下载
- **🔒 密码保护** - 简单密码访问控制
- **📱 响应式设计** - 支持桌面端和移动端

---

## 界面预览

采用黑绿配色 + 苹果简约风格设计，大圆角、弹性布局、流畅动画。

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite |
| 后端服务 | 腾讯云云函数 SCF |
| AI 接口 | 阿里云百炼 API |
| 文件打包 | JSZip + FileSaver |

---

## 项目结构

```
emo-j/
├── src/
│   ├── components/     # React 组件
│   │   ├── Login/            # 登录组件
│   │   ├── ImageUploader/    # 图片上传
│   │   ├── PromptEditor/     # 提示词编辑
│   │   ├── ResultViewer/     # 结果查看
│   │   ├── ExportPanel/      # 导出面板
│   │   └── GenerateButton/   # 生成按钮
│   ├── utils/
│   │   └── api.ts            # API 调用
│   ├── App.tsx               # 主组件
│   └── main.tsx               # 入口文件
├── scf-handler/              # 云函数后端
│   └── index.js
└── dist/                     # 构建输出

```

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
cd emo-j
npm install
```

### 配置环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=https://your-scf-url.tencentyun.com
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

---

## 部署指南

### 后端部署 (腾讯云 SCF)

1. 进入腾讯云云函数控制台
2. 创建新函数，选择 `Node.js 14.x` 运行时
3. 上传 `scf-handler/index.js` 代码
4. 配置环境变量：
   - `DASHSCOPE_API_KEY`: 阿里云 API 密钥
   - `ACCESS_PASSWORD`: 访问密码
   - `DAILY_LIMIT`: 每日限制次数 (默认 10)

### 前端部署 (腾讯云 COS/CloudBase)

1. 构建生产版本：
   ```bash
   npm run build
   ```

2. 上传 `dist/` 目录到 COS 存储桶

3. 配置静态网站托管，绑定自定义域名

4. 确保前端环境变量指向云函数地址

---

## 使用说明

### 1. 登录

首次访问需要输入访问密码（默认为 `emo123`）

### 2. 上传图片

- 拖拽图片到上传区域
- 或点击区域选择文件
- 支持 JPG/PNG/WebP 格式，最大 5MB

### 3. 编辑提示词

- 默认提示词已填充，可按需修改
- 比例 10:16 和布局 3×3 为固定值，不可修改
- 可编辑9个气泡文字内容

### 4. 生成表情包

点击「生成图片」按钮，等待 AI 处理

### 5. 导出表情包

- 点击「生成预览」查看 9 张分割图
- 点击「一键下载全部」打包下载 ZIP
- 或单独点击某一张下载

---

## API 接口

### 生成图片

```
POST /api/generate
Content-Type: application/json
Authorization: Bearer <password>

{
  "image_data": "data:image/jpeg;base64,...",
  "prompt": "您的提示词"
}
```

### 响应格式

成功：
```json
{
  "success": true,
  "image_url": "https://..."
}
```

失败：
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

### 错误码

| 错误码 | 说明 |
|--------|------|
| INVALID_PASSWORD | 密码错误 |
| QUOTA_EXCEEDED | 今日额度已用完 |
| API_ERROR | API 调用失败 |
| INVALID_IMAGE | 图片格式或大小不符合要求 |

---

## 配置说明

### 云函数环境变量

| 变量名 | 必填 | 说明 |
|--------|------|------|
| DASHSCOPE_API_KEY | 是 | 阿里云百炼 API 密钥 |
| ACCESS_PASSWORD | 是 | 访问密码 |
| DAILY_LIMIT | 否 | 每日生成次数限制，默认 10 |

---

## 开发相关

### 代码检查

```bash
npm run lint
```

### TypeScript 类型检查

```bash
npx tsc --noEmit
```

---

## 注意事项

1. **API 密钥安全** - 请勿将阿里云 API 密钥提交到代码仓库
2. **频率限制** - 默认每 IP 每天限制生成 10 次
3. **图片格式** - 仅支持 JPG、PNG、WebP 格式
4. **图片大小** - 最大支持 5MB

---

## License

MIT License

---

## 联系方式

如有问题或建议，请提交 Issue。
