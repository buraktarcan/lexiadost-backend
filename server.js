const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/api/convert', async (req, res) => {
  const { text, options } = req.body || {};

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Metin boş olamaz.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API anahtarı yapılandırılmamış.' });
  }

  const prompt = `Sen, edebi eserleri ve metinleri disleksi ile disgrafi yaşayan okuyucular için daha erişilebilir hale getiren uzman bir Türkçe dil asistanısın.

Görevin:
1. Metni yeniden yaz; yazarın sesini, üslubunu ve anlam bütünlüğünü koru.
2. Edebi kaliteyi ve duygusal derinliği asla düşürme.
3. Şu disleksi dostu teknikleri uygula:
${options || '- Kısa ve net cümleler kullan.\n- Paragrafları kısa tut (3-4 cümle).\n- Edilgen yapıları etken yapıya çevir.'}
4. Türkçe dil bilgisi kurallarına tam uy.
5. Sadece dönüştürülmüş metni yaz. Açıklama ekleme, giriş cümlesi kurma.

Dönüştürülecek metin:
${text}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.4 },
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errData.error?.message || 'Gemini API hatası.',
      });
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ result });
  } catch (err) {
    return res.status(500).json({ error: 'Sunucu hatası: ' + err.message });
  }
});

app.get('/', (req, res) => res.json({ status: 'LexiDost API çalışıyor ✓' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`LexiDost backend port ${PORT}'de çalışıyor`));
