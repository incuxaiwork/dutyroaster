import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useApp } from '../context/AppContext';
import { generateRosterStream } from '../utils/api';
import { PageHeader, Card, CardHeader, Grid, Field, Select, Textarea, Button, Alert } from '../components/UI';

export default function Generate() {
  const { officers, dutyTypes, config, refreshRosters } = useApp();
  const navigate = useNavigate();
  const [instructions, setInstructions] = useState('');
  const [mode, setMode] = useState('full');
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState('');
  const [status, setStatus] = useState('');
  const [done, setDone] = useState(false);
  const outputRef = useRef(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [streamText]);

  const handleGenerate = async () => {
    if (officers.length < 2) return toast.error('Add at least 2 officers first');
    if (dutyTypes.length < 1) return toast.error('Add at least 1 duty type first');

    setGenerating(true);
    setStreamText('');
    setStatus('Connecting to AI engine...');
    setDone(false);

    await generateRosterStream(
      { instructions, mode },
      {
        onStatus: (msg) => setStatus(msg),
        onDelta: (text) => setStreamText(prev => prev + text),
        onComplete: async (roster) => {
          setStatus('✓ Roster generated and saved');
          setDone(true);
          await refreshRosters();
          toast.success('Roster generated successfully!');
        },
        onError: (err) => {
          toast.error(typeof err === 'string' ? err : 'Generation failed');
          setStatus('❌ Generation failed');
          setGenerating(false);
        },
      }
    );
    setGenerating(false);
  };

  const canGenerate = officers.length >= 2 && dutyTypes.length >= 1 && !generating;

  // Strip raw JSON from display text
  const displayText = streamText
    .replace(/\{[\s\S]*?\}/g, (match) => {
      if (match.length > 200) return '[JSON roster data received ✓]';
      return match;
    })
    .trim();

  return (
    <div className="fade-in">
      <PageHeader
        title="AI Roster Generation"
        subtitle="Intelligent duty assignment powered by Claude AI"
      />

      {officers.length < 2 && (
        <Alert type="warning">⚠ Add at least 2 officers before generating a roster.</Alert>
      )}
      {dutyTypes.length < 1 && (
        <Alert type="warning">⚠ Add at least 1 duty type before generating.</Alert>
      )}

      <Grid cols={2} gap={16}>
        <Card accent>
          <CardHeader icon="🤖" title="Generation Parameters" />

          <div style={{ marginBottom: 14, padding: '10px 14px', background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 3 }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Current Setup</div>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>👮 <strong style={{ color: 'var(--cyan)' }}>{officers.length}</strong> officers</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>📋 <strong style={{ color: 'var(--gold)' }}>{dutyTypes.length}</strong> duty types</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>📅 <strong style={{ color: 'var(--green)' }}>{config?.rosterPeriod || 14}</strong> days</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>🏛 {config?.stationName}</span>
            </div>
          </div>

          <Field label="Generation Mode">
            <Select value={mode} onChange={e => setMode(e.target.value)}>
              <option value="full">Full Auto — Complete Roster</option>
              <option value="analyze">Analyze & Recommend Only</option>
              <option value="optimize">Optimize for Equity</option>
            </Select>
          </Field>

          <Field label="Special Instructions (optional)">
            <Textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              placeholder="Examples:&#10;• Inspector Sharma should avoid night shifts&#10;• Ensure 2 senior officers per shift&#10;• VVIP security needs Inspector-level officers&#10;• Balance traffic duty across specializations"
              style={{ minHeight: 100 }}
            />
          </Field>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            style={{ width: '100%', justifyContent: 'center', padding: '13px', marginTop: 4, fontSize: 13 }}
          >
            {generating
              ? <><div className="spinner" /> Generating...</>
              : '🚀 Generate AI Roster'
            }
          </Button>

          {done && (
            <Button variant="success" onClick={() => navigate('/roster')} style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              📅 View Generated Roster →
            </Button>
          )}
        </Card>

        <Card accent>
          <CardHeader icon="📡" title="AI Output Stream" />
          {status && (
            <div style={{ fontSize: 11, color: 'var(--cyan)', marginBottom: 8, fontFamily: 'IBM Plex Mono, monospace', letterSpacing: 0.5 }}>
              {generating && <span className="spinner" style={{ marginRight: 6 }} />}
              {status}
            </div>
          )}
          <div
            ref={outputRef}
            style={{
              background: 'rgba(10,15,30,0.9)', border: '1px solid rgba(6,182,212,0.15)', borderRadius: 3,
              padding: 14, minHeight: 320, maxHeight: 420, overflowY: 'auto',
              fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, lineHeight: 1.75, color: 'var(--text2)',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {streamText ? (
              <>
                <span style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 11, letterSpacing: 1 }}>AI_DISPATCH {'>'}</span>{'\n\n'}
                {displayText}
                {generating && <span style={{ display: 'inline-block', width: 8, height: 14, background: 'var(--cyan)', animation: 'blink .8s infinite', verticalAlign: 'middle', marginLeft: 2 }}>|</span>}
              </>
            ) : (
              <span style={{ color: 'var(--text3)' }}>Awaiting generation command...{'\n\nConfigure officers and duty types, then click Generate AI Roster.'}</span>
            )}
          </div>
        </Card>
      </Grid>
    </div>
  );
}