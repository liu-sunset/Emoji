const axios = require('axios');

const DAILY_LIMIT = parseInt(process.env.DAILY_LIMIT) || 999999;

const rateLimitStore = new Map();

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

function cleanExpiredEntries() {
  const today = new Date().toISOString().split('T')[0];
  for (const key of rateLimitStore.keys()) {
    if (!key.endsWith(today)) {
      rateLimitStore.delete(key);
    }
  }
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
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    throw new Error('DASHSCOPE_API_KEY is not configured');
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
        'Authorization': `Bearer ${apiKey}`,
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

async function main(event, context) {
  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  setCorsHeaders(response);

  cleanExpiredEntries();

  if (event.httpMethod === 'OPTIONS') {
    return response;
  }

  if (event.httpMethod !== 'POST') {
    response.body = JSON.stringify({
      success: false,
      error: '只支持 POST 请求',
      code: 'INVALID_METHOD'
    });
    return response;
  }

  const ip = event.headers['X-Forwarded-For']?.split(',')[0]?.trim() ||
             event.headers['X-Real-IP'] ||
             event.requestContext?.identity?.sourceIp ||
             'unknown';

  const authHeader = event.headers['Authorization'] ||
                     event.headers['authorization'] ||
                     '';

  const password = authHeader.replace(/^Bearer\s+/i, '');

  if (!password || password !== process.env.ACCESS_PASSWORD) {
    response.statusCode = 401;
    response.body = JSON.stringify({
      success: false,
      error: '密码错误',
      code: 'INVALID_PASSWORD'
    });
    return response;
  }

  if (!checkRateLimit(ip)) {
    response.statusCode = 429;
    response.body = JSON.stringify({
      success: false,
      error: '今日额度已用完',
      code: 'QUOTA_EXCEEDED'
    });
    return response;
  }

  let body;
  try {
    body = parseBody(event.body);
  } catch {
    response.statusCode = 400;
    response.body = JSON.stringify({
      success: false,
      error: '请求体解析失败',
      code: 'INVALID_REQUEST'
    });
    return response;
  }

  if (!body || !body.image_data) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      success: false,
      error: '缺少图片数据',
      code: 'INVALID_IMAGE'
    });
    return response;
  }

  const imageData = body.image_data;
  const prompt = body.prompt || '';

  if (typeof imageData !== 'string' || !imageData.startsWith('data:image/')) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      success: false,
      error: '图片格式或大小不符合要求',
      code: 'INVALID_IMAGE'
    });
    return response;
  }

  if (!prompt.trim()) {
    response.statusCode = 400;
    response.body = JSON.stringify({
      success: false,
      error: '请输入提示词',
      code: 'INVALID_PROMPT'
    });
    return response;
  }

  try {
    const imageUrl = await callDashScopeAPI(imageData, prompt);
    incrementUsage(ip);

    response.body = JSON.stringify({
      success: true,
      image_url: imageUrl
    });
  } catch (error) {
    console.error('API Error:', error.message);

    response.statusCode = 500;
    response.body = JSON.stringify({
      success: false,
      error: error.message || 'API调用失败',
      code: 'API_ERROR'
    });
  }

  return response;
}

exports.main_handler = async (event, context) => {
  return main(event, context);
};
