export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://djiang.site');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { url } = req.query;

  if (!url || !url.startsWith('https://ef-webview.gryphline.com/')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const response = await fetch(url);
    const data = await response.text();
    res.setHeader('Content-Type', 'application/json');
    return res.status(response.status).send(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
