const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Parse JSON bodies up to 5MB
app.use(express.json({ limit: '5mb' }));

// Serve static files from current directory
app.use(express.static(path.join(__dirname)));

// Airtable config from environment variables
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TABLE_ID = process.env.AIRTABLE_TABLE_ID;
const AIRTABLE_RECORD_ID = process.env.AIRTABLE_RECORD_ID;

const AIRTABLE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${AIRTABLE_RECORD_ID}`;

// GET - load all KPI data from Airtable
app.get('/api/data', async (req, res) => {
  try {
    const response = await fetch(AIRTABLE_URL, {
      headers: { 'Authorization': `Bearer ${AIRTABLE_PAT}` }
    });
    if (!response.ok) {
      console.error('Airtable GET error:', response.status, await response.text());
      return res.status(500).json({ error: 'Failed to load data from Airtable' });
    }
    const record = await response.json();
    const dataStr = record.fields?.Data || '{}';
    res.json(JSON.parse(dataStr));
  } catch (err) {
    console.error('Error loading data:', err.message);
    res.status(500).json({ error: 'Failed to load data' });
  }
});

// PUT - save all KPI data to Airtable
app.put('/api/data', async (req, res) => {
  try {
    const dataStr = JSON.stringify(req.body);
    const response = await fetch(AIRTABLE_URL, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${AIRTABLE_PAT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: { Data: dataStr }
      })
    });
    if (!response.ok) {
      const errText = await response.text();
      console.error('Airtable PATCH error:', response.status, errText);
      return res.status(500).json({ error: 'Failed to save data to Airtable' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving data:', err.message);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Fallback - serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Validate config and start
if (!AIRTABLE_PAT || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID || !AIRTABLE_RECORD_ID) {
  console.error('Missing required environment variables: AIRTABLE_PAT, AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_RECORD_ID');
  process.exit(1);
}

app.listen(port, () => {
  console.log(`KPI Bonus Tool running on port ${port}`);
  console.log('Using Airtable backend');
});
