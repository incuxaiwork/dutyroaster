import axios from 'axios';

const BASE = '/api';

export const api = {
  // Officers
  getOfficers: () => axios.get(`${BASE}/officers`),
  createOfficer: (data) => axios.post(`${BASE}/officers`, data),
  updateOfficer: (id, data) => axios.put(`${BASE}/officers/${id}`, data),
  deleteOfficer: (id) => axios.delete(`${BASE}/officers/${id}`),
  clearOfficers: () => axios.delete(`${BASE}/officers/clear/all`),

  // Duty Types
  getDuties: () => axios.get(`${BASE}/duties`),
  createDuty: (data) => axios.post(`${BASE}/duties`, data),
  updateDuty: (code, data) => axios.put(`${BASE}/duties/${code}`, data),
  deleteDuty: (code) => axios.delete(`${BASE}/duties/${code}`),

  // Config
  getConfig: () => axios.get(`${BASE}/config`),
  updateConfig: (data) => axios.put(`${BASE}/config`, data),

  // Roster
  getRosters: () => axios.get(`${BASE}/roster`),
  getRoster: (id) => axios.get(`${BASE}/roster/${id}`),
  deleteRoster: (id) => axios.delete(`${BASE}/roster/${id}`),
};

// SSE-based streaming generation
export const generateRosterStream = (payload, { onDelta, onStatus, onComplete, onError }) => {
  // Use fetch for SSE
  return fetch('/api/roster/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(async (res) => {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const { type, data } = JSON.parse(line.slice(6));
            if (type === 'delta') onDelta?.(data.text);
            if (type === 'status') onStatus?.(data.message);
            if (type === 'complete') onComplete?.(data.roster);
            if (type === 'error') onError?.(data.message);
          } catch (e) {}
        }
      }
    }
  }).catch(onError);
};