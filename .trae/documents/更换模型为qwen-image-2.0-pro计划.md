# 计划：更换AI模型为 qwen-image-2.0-pro

## 目标

将表情包生成功能从 z-image-turbo（文生图）更换为 qwen-image-2.0-pro（图片编译模型）。

## 新模型特性

* **模型名称**: qwen-image-2.0-pro

* **功能**: 图片编辑（Image-to-Image），支持多张参考图片(我的网站只允许用户上传一张) + 文本提示词

* **输入格式**: messages.content 包含多个 image URL + text

* **输出**: 生成图片 URL

## API请求格式对比

### 当前 z-image-turbo 格式

```json
{
  "model": "z-image-turbo",
  "input": {
    "messages": [{
      "role": "user",
      "content": [{
        "text": "提示词"
      }]
    }]
  },
  "parameters": {
    "size": "1120*1440"
  }
}
```

### 新 qwen-image-2.0-pro 格式

```json
{
  "model": "qwen-image-2.0-pro",
  "input": {
    "messages": [{
      "role": "user",
      "content": [
        { "image": "用户上传图片的URL" },
        { "text": "提示词" }
      ]
    }]
  },
  "parameters": {
    "n": 1,
    "negative_prompt": "低质量,模糊",
    "prompt_extend": true,
    "watermark": false,
    "size": "1024*1536"
  }
}
```

## 修改步骤

### 1. 修改 local-server.js

* 将 model 改为 `qwen-image-2.0-pro`

* 修改 input.messages\[].content 格式：用户上传的图片作为 image URL，提示词作为 text

* 修改 parameters：添加 n, negative\_prompt, watermark, prompt\_extend

* 修改响应解析（需要确认新响应格式）

### 2. 修改 index.js（腾讯云SCF版本）

* 同样修改 model、input 格式、parameters

### 3. 修改前端 api.ts

* 确保请求体结构正确

### 4. 测试验证

* 使用 Chrome DevTools MCP 工具测试API调用

* 验证图片生成功能正常

## 涉及文件

* `d:\thought\emoj\scf-handler\local-server.js`

* `d:\thought\emoj\scf-handler\index.js`

## 注意事项

* qwen-image-2.0-pro 是图片编译模型，需要用户提供参考图片

* 图片需要先上传到可访问的URL（当前是base64，可能需要调整）

* 需要确认阿里云API响应格式是否有变化

