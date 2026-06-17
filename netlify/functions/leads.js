const { getStore } = require('@netlify/blobs');

exports.handler = async (event) => {
  const h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: h, body: '' };

  const auth = (event.headers['x-auth'] || '').trim();
  const PASS = process.env.CRM_PASSWORD || 'crm1234';
  if (auth !== PASS) return { statusCode: 401, headers: h, body: JSON.stringify({ error: 'Ruxsat yoq' }) };

  const store = getStore('crm');

  async function getLeads() {
    try {
      const raw = await store.get('leads');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  async function setLeads(data) {
    await store.set('leads', JSON.stringify(data));
  }

  try {
    if (event.httpMethod === 'GET') {
      return { statusCode: 200, headers: h, body: JSON.stringify(await getLeads()) };
    }
    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const leads = await getLeads();
      leads.unshift({ ...body, id: body.id || Date.now() });
      await setLeads(leads);
      return { statusCode: 200, headers: h, body: JSON.stringify({ ok: true }) };
    }
    if (event.httpMethod === 'PUT') {
      const body = JSON.parse(event.body || '{}');
      const leads = await getLeads();
      const i = leads.findIndex(l => l.id === body.id);
      if (i > -1) { leads[i] = { ...leads[i], ...body }; await setLeads(leads); }
      return { statusCode: 200, headers: h, body: JSON.stringify({ ok: true }) };
    }
    if (event.httpMethod === 'DELETE') {
      const body = JSON.parse(event.body || '{}');
      await setLeads((await getLeads()).filter(l => l.id !== body.id));
      return { statusCode: 200, headers: h, body: JSON.stringify({ ok: true }) };
    }
    return { statusCode: 405, headers: h, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, headers: h, body: JSON.stringify({ error: err.message }) };
  }
};
