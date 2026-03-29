# EMO.J 网站重新设计计划

## 设计方向

### 目标风格
- **极简风格**: 大量留白，简洁元素
- **手绘线条风格**: 虚线边框、手绘图标、sketch风格装饰
- **Anthropic风格**: 黑白主色调、精致排版、圆润边角、简约线条

### 设计参考 (Anthropic + 手绘)
- 白色/浅色背景为主
- 黑色细线条作为主要边框和装饰
- 手绘风格的虚线边框和装饰元素
- 圆润的卡片边角
- 精致的间距和排版
- 少许彩色点缀（保持克制）

---

## 设计系统

### 配色方案
```css
--color-bg-primary: #FAFAFA;        /* 主背景 - 浅灰白 */
--color-bg-card: #FFFFFF;           /* 卡片背景 - 纯白 */
--color-border: #1a1a1a;             /* 主边框 - 深黑线条 */
--color-border-light: #E5E5E5;       /* 次要边框 - 浅灰 */
--color-text-primary: #1a1a1a;       /* 主文字 - 深黑 */
--color-text-secondary: #666666;     /* 次要文字 - 中灰 */
--color-accent: #FF6B6B;             /* 强调色 - 珊瑚红 */
--color-accent-light: #FFE5E5;       /* 强调浅色 */
--color-success: #4CAF50;            /* 成功色 - 绿色 */
--color-error: #E53935;              /* 错误色 - 红色 */
```

### 字体
- 主字体: `'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`
- 标题使用正常粗细，不要过重

### 边框样式
- 手绘风格虚线边框: `border: 2px dashed #1a1a1a`
- 圆角: 12px-16px
- 卡片阴影: 轻柔阴影 `0 2px 12px rgba(0,0,0,0.06)`

---

## 页面设计

### 1. 登录页 (Login)
- 居中卡片设计
- 卡片使用手绘虚线边框
- Logo使用简约线条风格
- 输入框使用细边框
- 登录按钮使用实线边框 + 强调色

### 2. 主页面布局
- 顶部导航栏: 细线条底边框，Logo居左，按钮居右
- 内容区域: 左右两栏布局（上传区 + 编辑区）
- 卡片使用白色背景 + 轻阴影 + 细边框
- 结果区域在生成后展开

### 3. 各组件设计

#### ImageUploader
- 上传区域使用手绘虚线边框
- 图标使用简约线条风格SVG
- 拖拽时边框变为强调色

#### PromptEditor
- Tab切换使用细线条按钮
- 风格选项使用手绘风格卡片
- 输入框使用细边框

#### GenerateButton
- 使用手绘风格边框（不是渐变背景）
- 悬停时填充强调色

#### ResultViewer / ExportPanel
- 保持简洁的网格布局
- 按钮使用手绘风格边框

---

## 实现步骤

### Step 1: 更新全局样式 (index.css)
- 修改配色系统
- 更新字体和基础样式
- 添加手绘风格工具类

### Step 2: 更新 App.css
- 修改布局样式
- 更新导航栏设计
- 调整卡片样式

### Step 3: 更新 Login 组件
- 登录卡片使用虚线边框
- 更新配色和动画

### Step 4: 更新 ImageUploader
- 上传区域使用虚线边框
- 保持手绘风格

### Step 5: 更新 PromptEditor
- Tab和选项使用细边框
- 保持简约风格

### Step 6: 更新 GenerateButton
- 使用边框按钮代替渐变按钮

### Step 7: 更新 ResultViewer
- 保持简洁设计
- 更新图标样式

### Step 8: 更新 ExportPanel
- 网格布局保持
- 更新边框和按钮样式

### Step 9: 更新 ProgressDisplay
- 简约进度条设计

---

## 验收标准

1. ✅ 整体视觉从"黑绿科技风"转变为"手绘简约风"
2. ✅ 保持所有功能不变
3. ✅ 响应式布局正常（PC和移动端）
4. ✅ 交互效果流畅
5. ✅ 编译无错误
