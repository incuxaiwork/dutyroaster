const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generateRoster } = require('./solver');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, 'db.json');

// Default Seed Data
const DEFAULT_CONFIG = {
  stationName: "City Central Police Station",
  rosterPeriod: 14,
  startDate: "2026-06-01",
  minOfficersPerShift: 2,
  nightShiftWeight: 2,
  weekendWeight: 2,
  maxConsecutiveShifts: 5,
  restHoursBetweenShifts: 12,
  priorityMode: "balanced"
};

const DEFAULT_DUTIES = [
  { code: "MORNING", name: "Morning Patrol Shift", startTime: "06:00", endTime: "14:00", priority: 1, color: "morning", requiredRank: "" },
  { code: "EVENING", name: "Evening Patrol Shift", startTime: "14:00", endTime: "22:00", priority: 2, color: "evening", requiredRank: "" },
  { code: "NIGHT", name: "Night Patrol & Response", startTime: "22:00", endTime: "06:00", priority: 3, color: "night", requiredRank: "Head Constable" },
  { code: "VVIP", name: "VVIP Security Detail", startTime: "09:00", endTime: "17:00", priority: 4, color: "info", requiredRank: "Sub-Inspector" }
];

const DEFAULT_OFFICERS = [
  { id: "P-001", name: "Inspector Rajesh Kumar", rank: "Inspector", specialization: "Investigation", unavailDates: [] },
  { id: "P-002", name: "Sub-Inspector Amit Patel", rank: "Sub-Inspector", specialization: "General Duty", unavailDates: ["2026-06-05"] },
  { id: "P-003", name: "Head Constable Sunil Verma", rank: "Head Constable", specialization: "Traffic", unavailDates: [] },
  { id: "P-004", name: "Head Constable Priya Singh", rank: "Head Constable", specialization: "Cyber Cell", unavailDates: [] },
  { id: "P-005", name: "Constable Vikram Rathore", rank: "Constable", specialization: "General Duty", unavailDates: [] },
  { id: "P-006", name: "Constable Kavita Devi", rank: "Constable", specialization: "Armed Reserve", unavailDates: [] },
  { id: "P-007", name: "Constable Rohan Joshi", rank: "Constable", specialization: "Traffic", unavailDates: [] },
  { id: "P-008", name: "Constable Meera Nair", rank: "Constable", specialization: "VVIP Security", unavailDates: [] },
  { id: "P-009", name: "Constable Arjun Sen", rank: "Constable", specialization: "General Duty", unavailDates: ["2026-06-10", "2026-06-11"] },
  { id: "P-010", name: "Constable Sanjay Yadav", rank: "Constable", specialization: "Armed Reserve", unavailDates: [] }
];

// Read DB helper
function readDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const db = { officers: DEFAULT_OFFICERS, duties: DEFAULT_DUTIES, config: DEFAULT_CONFIG, rosters: [] };
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
      return db;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading db.json", err);
    return { officers: [], duties: [], config: DEFAULT_CONFIG, rosters: [] };
  }
}

// Write DB helper
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing db.json", err);
  }
}

// Officers routes
app.get('/api/officers', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.officers });
});

app.post('/api/officers', (req, res) => {
  const db = readDB();
  const officer = req.body;
  
  if (!officer.id || !officer.name) {
    return res.status(400).json({ error: "Badge ID and Name are required" });
  }

  const exists = db.officers.find(o => o.id.toLowerCase() === officer.id.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Badge ID ${officer.id} already exists` });
  }

  db.officers.push(officer);
  writeDB(db);
  res.json({ success: true, data: officer });
});

app.put('/api/officers/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const update = req.body;

  const idx = db.officers.findIndex(o => o.id.toLowerCase() === id.toLowerCase());
  if (idx === -1) {
    return res.status(404).json({ error: "Officer not found" });
  }

  db.officers[idx] = { ...db.officers[idx], ...update, id: db.officers[idx].id }; // preserve badge ID
  writeDB(db);
  res.json({ success: true, data: db.officers[idx] });
});

app.delete('/api/officers/clear/all', (req, res) => {
  const db = readDB();
  db.officers = [];
  writeDB(db);
  res.json({ success: true, data: [] });
});

app.delete('/api/officers/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;

  db.officers = db.officers.filter(o => o.id.toLowerCase() !== id.toLowerCase());
  writeDB(db);
  res.json({ success: true });
});

// Duties routes
app.get('/api/duties', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.duties });
});

app.post('/api/duties', (req, res) => {
  const db = readDB();
  const duty = req.body;

  if (!duty.code || !duty.name) {
    return res.status(400).json({ error: "Duty Code and Name are required" });
  }

  const exists = db.duties.find(d => d.code.toUpperCase() === duty.code.toUpperCase());
  if (exists) {
    return res.status(400).json({ error: `Duty code ${duty.code} already exists` });
  }

  duty.code = duty.code.toUpperCase();
  db.duties.push(duty);
  writeDB(db);
  res.json({ success: true, data: duty });
});

app.put('/api/duties/:code', (req, res) => {
  const db = readDB();
  const { code } = req.params;
  const update = req.body;

  const idx = db.duties.findIndex(d => d.code.toUpperCase() === code.toUpperCase());
  if (idx === -1) {
    return res.status(404).json({ error: "Duty type not found" });
  }

  db.duties[idx] = { ...db.duties[idx], ...update, code: db.duties[idx].code }; // preserve code
  writeDB(db);
  res.json({ success: true, data: db.duties[idx] });
});

app.delete('/api/duties/:code', (req, res) => {
  const db = readDB();
  const { code } = req.params;

  db.duties = db.duties.filter(d => d.code.toUpperCase() !== code.toUpperCase());
  writeDB(db);
  res.json({ success: true });
});

// Config routes
app.get('/api/config', (req, res) => {
  const db = readDB();
  res.json({ success: true, data: db.config });
});

app.put('/api/config', (req, res) => {
  const db = readDB();
  const update = req.body;

  db.config = { ...db.config, ...update };
  writeDB(db);
  res.json({ success: true, data: db.config });
});

// Rosters routes
app.get('/api/roster', (req, res) => {
  const db = readDB();
  // Sort in reverse chronological order (latest generated roster first)
  const sorted = [...db.rosters].sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
  res.json({ success: true, data: sorted });
});

app.get('/api/roster/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const roster = db.rosters.find(r => r.id === id);
  if (!roster) {
    return res.status(404).json({ error: "Roster not found" });
  }
  res.json({ success: true, data: roster });
});

app.delete('/api/roster/:id', (req, res) => {
  const db = readDB();
  const { id } = req.params;
  db.rosters = db.rosters.filter(r => r.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// SSE Streaming Roster Generation route
app.post('/api/roster/generate', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { instructions, mode } = req.body;

  const db = readDB();

  const sendEvent = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  };

  try {
    if (db.officers.length < 2) {
      throw new Error("Add at least 2 officers first");
    }
    if (db.duties.length < 1) {
      throw new Error("Add at least 1 duty type first");
    }

    const roster = await generateRoster({
      officers: db.officers,
      duties: db.duties,
      config: db.config,
      instructions,
      onLog: (text) => sendEvent('delta', { text }),
      onStatus: (message) => sendEvent('status', { message })
    });

    // Save generated roster to database
    db.rosters.push(roster);
    writeDB(db);

    sendEvent('complete', { roster });
    res.end();
  } catch (err) {
    sendEvent('error', { message: err.message || "Generation failed" });
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`[POLICE_ROSTER_SERVER] Running on http://localhost:${PORT}`);
});
