require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 解析 JSON body
app.use(express.json());

// 静态文件服务
app.use(express.static(__dirname));

// AI Chat 代理 — key 只存在服务端
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'invalid messages' });
  }

  const systemPrompt = {
    role: 'system',
    content: '你是一个温暖贴心的情侣助手，用中文回复，语气可爱温柔，像朋友一样。回复尽量简短在100字以内，适当加一些emoji。',
  };

  try {
    const apiRes = await fetch(process.env.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.API_MODEL,
        messages: [systemPrompt, ...messages],
        max_tokens: 300,
        temperature: 0.9,
      }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.text();
      console.error('AI API error:', err);
      return res.status(502).json({ error: 'upstream error' });
    }

    const data = await apiRes.json();
    res.json({ reply: data.choices[0].message.content });
  } catch (e) {
    console.error('Proxy error:', e);
    res.status(502).json({ error: 'proxy error' });
  }
});

// SPA fallback — 所有其他路由返回 index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`💕 情侣网站已启动: http://localhost:${PORT}`);
});
