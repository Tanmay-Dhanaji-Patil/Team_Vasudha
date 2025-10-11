import { useState } from 'react';

export default function ThingSpeakUploader() {
  const [mode, setMode] = useState('paste'); // 'paste' or 'fetch'
  const [pasteValue, setPasteValue] = useState('');
  const [channelId, setChannelId] = useState('');
  const [parameterType, setParameterType] = useState('soil'); // 'soil' or 'water'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function sendToServer(payload) {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/thingspeak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || 'Server error');
      setResult(json);
    } catch (err) {
      console.error(err);
      setError(String(err.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  async function handlePasteSubmit(e) {
    e.preventDefault();
    setError(null);
    try {
      const parsed = JSON.parse(pasteValue);
      // Accept either full object or { channel: {...} }
      const payload = parsed.channel ? parsed : { channel: parsed };
      if (parameterType === 'water') {
        const ch = payload.channel;
        // attempt to find water ph in channel fields or the feeds
        for (let i = 1; i <= 8; i++) {
          const label = (ch[`field${i}`] || '').toLowerCase();
          if (label.includes('water') && label.includes('ph') || /\bwater\b/.test(label) && /\bph\b/.test(label)) {
            // get value from latest feed if present
            const val = ch?.feeds?.[0]?.[`field${i}`] ?? null;
            if (val != null) payload.channel.water_ph = val;
            break;
          }
        }
      }
      await sendToServer(payload);
    } catch (err) {
      setError('Invalid JSON: ' + String(err.message));
    }
  }

  async function handleFetchSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!channelId) return setError('Please enter a channel id');

    try {
      setLoading(true);
      // Fetch channel metadata from ThingSpeak public API
      const tsRes = await fetch(`https://api.thingspeak.com/channels/${encodeURIComponent(channelId)}.json`);
      if (!tsRes.ok) throw new Error('ThingSpeak fetch failed: ' + tsRes.statusText);
      const channelData = await tsRes.json();
      const feedRes = await fetch(`https://api.thingspeak.com/channels/${encodeURIComponent(channelId)}/feeds.json?results=1`);
      const feedData = feedRes.ok ? await feedRes.json() : null;
      const last = feedData?.feeds?.[0] ?? null;

      // If water parameter selected, try to map a water pH field
      if (parameterType === 'water') {
        const payload = { channel: channelData };
        if (last) {
          // Attempt to find water pH from field labels
          for (let i = 1; i <= 8; i++) {
            const label = (channelData[`field${i}`] || '').toLowerCase();
            if (label.includes('water') && label.includes('ph') || /\bwater\b/.test(label) && /\bph\b/.test(label)) {
              payload.channel.water_ph = last[`field${i}`];
              break;
            }
            if (/\bph\b/.test(label) && label.includes('water')) {
              payload.channel.water_ph = last[`field${i}`];
              break;
            }
          }
        }
        await sendToServer(payload);
      } else {
        // soil: send channel + last feed (existing behavior)
        await sendToServer({ channel: channelData });
      }
    } catch (err) {
      console.error(err);
      setError(String(err.message ?? err));
      setLoading(false);
    }
  }

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-medium mb-3">ThingSpeak channel uploader</h3>
      <div className="mb-3 flex items-center gap-4">
        <div>
          <label className="mr-3">
            <input type="radio" checked={mode === 'paste'} onChange={() => setMode('paste')} /> Paste JSON
          </label>
          <label>
            <input type="radio" checked={mode === 'fetch'} onChange={() => setMode('fetch')} /> Fetch by channel id
          </label>
        </div>
        <div className="ml-6">
          <label className="mr-3">
            <input type="radio" checked={parameterType === 'soil'} onChange={() => setParameterType('soil')} /> Soil
          </label>
          <label>
            <input type="radio" checked={parameterType === 'water'} onChange={() => setParameterType('water')} /> Water (water pH)
          </label>
        </div>
      </div>

      {mode === 'paste' ? (
        <form onSubmit={handlePasteSubmit}>
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            className="w-full border rounded p-2 mb-2"
            rows={8}
            placeholder='Paste ThingSpeak channel JSON here (either {"channel": {...}} or the channel object)'
          />
          <div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
              {loading ? 'Sending...' : 'Send to server'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleFetchSubmit}>
          <input
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
            placeholder="ThingSpeak channel id (e.g. 3110372)"
            className="border rounded px-3 py-2 w-full mb-2"
          />
          <div>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch and send'}
            </button>
          </div>
        </form>
      )}

      {error && <div className="mt-3 text-red-600">Error: {error}</div>}

      {result && (
        <div className="mt-3 p-3 bg-gray-50 rounded">
          <h4 className="font-medium">Result</h4>
          <pre className="text-sm max-h-64 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
