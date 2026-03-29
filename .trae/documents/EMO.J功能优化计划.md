# EMO.J 功能优化计划

## 任务概述

优化 EMO.J 表情包生成器的用户体验，包括：
1. 原图下载功能
2. 预览取消按钮位置调整
3. 预览导航功能
4. UI布局优化
5. **BUG修复：同一张照片多次生成后预览不更新问题**

---

## 任务 1：实现图片原图下载功能

### 需求分析
- 在 ResultViewer 组件中添加下载原图按钮
- 支持主流图片格式（PNG/JPG/WebP）
- 显示下载进度和完成反馈

### 实现步骤

1. **修改 ResultViewer 组件** (`ResultViewer.tsx`)
   - 添加 `handleDownload` 回调函数
   - 使用 `saveAs` 从 file-saver 下载原图
   - 添加下载按钮 UI

2. **添加样式** (`ResultViewer.css`)
   - 设计下载按钮样式，与整体 UI 保持一致
   - 添加下载动画效果

### 验收标准
- [ ] 点击下载按钮可下载原图
- [ ] 下载过程有视觉反馈
- [ ] 按钮样式符合黑绿配色风格

---

## 任务 2：调整预览取消按钮位置

### 需求分析
- 将 `.preview-modal-close` 从图片右上角调整至设备右上角
- 确保在不同屏幕尺寸下保持一致位置

### 实现步骤

1. **修改 ExportPanel.css**
   - 将 `.preview-modal-close` 的定位从相对于 `.preview-modal-content` 改为相对于 `.preview-modal` (viewport)
   - 使用 `position: fixed` 配合 `top: 20px; right: 20px` 实现设备右上角定位

### 验收标准
- [ ] 取消按钮始终显示在屏幕右上角
- [ ] 不同屏幕尺寸下位置一致
- [ ] 按钮不遮挡图片内容

---

## 任务 3：添加图片预览导航功能

### 需求分析
- 在预览界面增加"上一张"和"下一张"按钮
- 按钮放置在预览界面两侧，不遮挡图片
- 平滑过渡动画
- 首尾按钮禁用/隐藏

### 实现步骤

1. **修改 ExportPanel.tsx**
   - 添加 `previewIndex` 状态管理
   - 添加 `goToPrevious` 和 `goToNext` 导航函数
   - 添加左右导航按钮
   - 实现边界条件处理（第一张/最后一张禁用）

2. **修改 ExportPanel.css**
   - 添加导航按钮样式（左右两侧箭头）
   - 添加平滑过渡动画
   - 添加按钮禁用状态样式

### 验收标准
- [ ] 左右导航按钮正确显示
- [ ] 导航时有过渡动画
- [ ] 第一张禁用"上一张"，最后一张禁用"下一张"

---

## 任务 4：优化 UI 布局和排版

### 需求分析
- 改进卡片式布局，消除布局空隙
- 优化整体排版，提升视觉层次感
- 确保响应式表现
- 统一设计元素

### 实现步骤

1. **优化 App.css**
   - 调整 `.content-grid` 和 `.result-grid` 的 gap 值
   - 优化 `.panel-card` 的 padding 和间距
   - 确保卡片之间紧凑排列

2. **优化各组件内部布局**
   - ExportPanel: 优化导出网格布局
   - ResultViewer: 优化图片容器布局
   - PromptEditor: 检查并优化内部间距

3. **检查响应式断点**
   - 确保平板和手机端的布局正确
   - 优化间距和字体大小

### 验收标准
- [ ] 布局紧凑无明显空隙
- [ ] 不同设备尺寸下显示正常
- [ ] 视觉层次清晰

---

## 任务 5：修复 BUG - 同一照片多次生成后预览不更新

### 问题描述
当用户对同一张照片点击两次"生成图片"按钮后，新生成的图片无法正确预览分割后的结果。原因是 `ExportPanel` 组件的 `processedResults` 和 `hasProcessed` 状态没有在 `imageUrl` 变化时重置。

### 问题根因
在 `App.tsx` 中，当 `handleGenerate` 被调用时：
1. `generatedImageUrl` 状态会更新为新的图片 URL
2. 但 `ExportPanel` 组件内的 `processedResults` 和 `hasProcessed` 状态保持不变
3. 导致 UI 仍然显示旧的预览结果

### 实现步骤

1. **修改 ExportPanel.tsx**
   - 添加 `useEffect` 监听 `imageUrl` 变化
   - 当 `imageUrl` 变化时，重置 `processedResults`、`hasProcessed`、`previewIndex` 状态

```typescript
useEffect(() => {
  setProcessedResults([]);
  setHasProcessed(false);
  setPreviewIndex(null);
}, [imageUrl]);
```

### 验收标准
- [ ] 第一次生成图片后，可以正常预览分割结果
- [ ] 第二次生成新图片后，预览自动更新为新图片的分割结果
- [ ] 不需要手动点击"生成预览"按钮

---

## 技术实现细节

### 文件修改清单
1. `src/components/ResultViewer/ResultViewer.tsx` - 添加下载功能
2. `src/components/ResultViewer/ResultViewer.css` - 下载按钮样式
3. `src/components/ExportPanel/ExportPanel.tsx` - 导航功能 + BUG修复
4. `src/components/ExportPanel/ExportPanel.css` - 关闭按钮位置 + 导航样式
5. `src/App.css` - 布局优化

### 依赖说明
- 使用 `file-saver` 的 `saveAs` 函数进行文件下载
- 使用原生 CSS 动画实现过渡效果

---

## 测试计划

### 功能测试
1. 原图下载是否正常工作
2. 预览导航是否正确切换
3. 取消按钮位置是否符合要求
4. **多次生成同一照片，预览是否正确更新**

### 兼容性测试
1. Chrome/Firefox/Safari 浏览器测试
2. Windows/macOS 系统测试
3. 移动端响应式测试

### 用户体验测试
1. 下载反馈是否清晰
2. 导航动画是否流畅
3. 按钮位置是否便于操作
