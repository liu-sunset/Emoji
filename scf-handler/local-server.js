const http = require('http');
const axios = require('axios');

const PORT = process.env.PORT || 3001;
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY;
const ACCESS_PASSWORD = process.env.ACCESS_PASSWORD || 'emo123';

const rateLimitStore = new Map();
const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT) || 10;

function getDailyKey(ip) {
  const today = new Date().toISOString().split('T')[0];
  return `${ip}:${today}`;
}

function checkRateLimit(ip) {
  const key = getDailyKey(ip);
  const count = rateLimitStore.get(key) || 0;
  return count < DAILY_LIMIT;
}

function incrementUsage(ip) {
  const key = getDailyKey(ip);
  const count = rateLimitStore.get(key) || 0;
  rateLimitStore.set(key, count + 1);
}

function setCorsHeaders(response) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Max-Age', '86400');
}

function parseBody(body) {
  if (!body) return null;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }
  return body;
}

async function callDashScopeAPI(imageData, prompt) {
  if (!DASHSCOPE_API_KEY) {
    throw new Error('DASHSCOPE_API_KEY is not configured. Please set it in .env file');
  }

  const requestBody = {
    model: 'qwen-image-2.0-pro',
    input: {
      messages: [{
        role: 'user',
        content: [
          { image: imageData },
          { text: prompt }
        ]
      }]
    },
    parameters: {
      n: 1,
      negative_prompt: '低质量,模糊',
      prompt_extend: true,
      watermark: false,
      size: '1024*1536'
    }
  };

  const response = await axios.post(
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
    requestBody,
    {
      headers: {
        'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000
    }
  );

  if (response.data && response.data.output && response.data.output.choices) {
    const imageUrl = response.data.output.choices[0]?.message?.content?.[0]?.image;
    if (imageUrl) {
      return imageUrl;
    }
  }

  throw new Error('Invalid API response format');
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'EMO.J API Server is running. Use POST /api/generate' }));
    return;
  }

  let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.socket.remoteAddress ||
           'unknown';

  const authHeader = req.headers['authorization'] || '';
  const password = authHeader.replace(/^Bearer\s+/i, '');

  if (!password || password !== ACCESS_PASSWORD) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '密码错误',
      code: 'INVALID_PASSWORD'
    }));
    return;
  }

  if (!checkRateLimit(ip)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: '今日额度已用完',
      code: 'QUOTA_EXCEEDED'
    }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    const data = parseBody(body);

    if (!data || !data.image_data) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '缺少图片数据',
        code: 'INVALID_IMAGE'
      }));
      return;
    }

    const imageData = data.image_data;
    const prompt = data.prompt || '';

    if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '图片格式或大小不符合要求',
        code: 'INVALID_IMAGE'
      }));
      return;
    }

    if (!prompt.trim()) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: '请输入提示词',
        code: 'INVALID_PROMPT'
      }));
      return;
    }

    try {
      const imageUrl = await callDashScopeAPI(imageData, prompt);
      incrementUsage(ip);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        image_url: imageUrl
      }));
    } catch (error) {
      console.error('API Error:', error.message);

      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: error.message || 'API调用失败',
        code: 'API_ERROR'
      }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                    EMO.J API Server                        ║
╠═══════════════════════════════════════════════════════════╣
║  Server running at: http://localhost:${PORT}                  ║
║  API Endpoint:      http://localhost:${PORT}/api/generate    ║
╠═══════════════════════════════════════════════════════════╣
║  Environment Variables:                                    ║
║    DASHSCOPE_API_KEY: ${DASHSCOPE_API_KEY ? '✓ Configured' : '✗ NOT SET'}                        ║
║    ACCESS_PASSWORD:   ${ACCESS_PASSWORD ? '✓ Configured' : '✗ NOT SET'}                        ║
║    PORT:              ${PORT}                                   ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
