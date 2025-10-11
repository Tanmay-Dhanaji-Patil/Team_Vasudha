import { NextResponse } from 'next/server';
import pool from '@/database/supabaseClient';

// Helper: sanitize a string to a safe SQL identifier (lowercase, letters, numbers and underscore)
function sanitizeIdentifier(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^([0-9])/, '_$1')
    .slice(0, 64);
}

async function ensureTableExists() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS thingspeak_channels (
      id bigint PRIMARY KEY,
      name text,
      description text,
      latitude text,
      longitude text,
      created_at timestamptz,
      updated_at timestamptz,
      last_entry_id integer,
      feeds jsonb,
      field1 text,
      field2 text,
      field3 text,
      field4 text,
      field5 text,
      field6 text,
      field7 text,
      field8 text,
      channel_json jsonb
    );
  `;
  await pool.query(createTableSQL);
}

// Upsert the provided channel object into DB. Returns the inserted/updated row.
async function upsertChannelToDb(channel) {
  await ensureTableExists();

  const allowedBase = new Set([
    'id','name','description','latitude','longitude','created_at','updated_at','last_entry_id','feeds',
    'field1','field2','field3','field4','field5','field6','field7','field8','channel_json'
  ]);

  const incomingKeys = Object.keys(channel);

  // Add unknown keys as jsonb columns
  for (const key of incomingKeys) {
    const col = sanitizeIdentifier(key);
    if (allowedBase.has(col)) continue;
    const colCheck = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'thingspeak_channels' AND column_name = $1`,
      [col]
    );
    if (colCheck.rowCount === 0) {
      const alter = `ALTER TABLE thingspeak_channels ADD COLUMN IF NOT EXISTS "${col}" jsonb`;
      await pool.query(alter);
    }
  }

  const chanId = channel.id ?? channel.channel_id;

  const insertSQL = `
    INSERT INTO thingspeak_channels (
      id, name, description, latitude, longitude, created_at, updated_at, last_entry_id,
      feeds, field1, field2, field3, field4, field5, field6, field7, field8, channel_json
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      created_at = EXCLUDED.created_at,
      updated_at = EXCLUDED.updated_at,
      last_entry_id = EXCLUDED.last_entry_id,
      feeds = EXCLUDED.feeds,
      field1 = EXCLUDED.field1,
      field2 = EXCLUDED.field2,
      field3 = EXCLUDED.field3,
      field4 = EXCLUDED.field4,
      field5 = EXCLUDED.field5,
      field6 = EXCLUDED.field6,
      field7 = EXCLUDED.field7,
      field8 = EXCLUDED.field8,
      channel_json = EXCLUDED.channel_json
    RETURNING *;
  `;

  const params = [
    chanId,
    channel.name ?? null,
    channel.description ?? null,
    channel.latitude ?? channel.lat ?? null,
    channel.longitude ?? channel.long ?? null,
    channel.created_at ? new Date(channel.created_at) : null,
    channel.updated_at ? new Date(channel.updated_at) : null,
    channel.last_entry_id ?? null,
    channel.feeds ?? null,
    channel.field1 ?? null,
    channel.field2 ?? null,
    channel.field3 ?? null,
    channel.field4 ?? null,
    channel.field5 ?? null,
    channel.field6 ?? null,
    channel.field7 ?? null,
    channel.field8 ?? null,
    channel
  ];

  const { rows } = await pool.query(insertSQL, params);

  // Update arbitrary columns we created earlier with proper JSONB values
  const extraKeys = incomingKeys.filter(k => !allowedBase.has(sanitizeIdentifier(k)));
  if (extraKeys.length > 0) {
    const sets = [];
    const values = [];
    let idx = 1;
    for (const k of extraKeys) {
      const col = sanitizeIdentifier(k);
      sets.push(`"${col}" = $${idx}`);
      values.push(channel[k]); // pass raw value so driver stores proper jsonb
      idx++;
    }
    const updateSQL = `UPDATE thingspeak_channels SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`;
    const updateParams = [...values, chanId];
    const updated = await pool.query(updateSQL, updateParams);
    return updated.rows[0];
  }

  return rows[0];
}

export async function POST(request) {
  try {
    const body = await request.json();
    const channel = body?.channel ?? body;

    if (!channel || (!channel.id && !channel.channel_id)) {
      return NextResponse.json({ success: false, message: 'ThingSpeak channel object with an id is required' }, { status: 400 });
    }

    const row = await upsertChannelToDb(channel);
    return NextResponse.json({ success: true, channel: row });
  } catch (error) {
    console.error('ThingSpeak route error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const shouldFetch = searchParams.get('fetch') === '1' || searchParams.get('fetch') === 'true';
    if (!id) return NextResponse.json({ success: false, message: 'id query param required' }, { status: 400 });

    if (shouldFetch) {
      // Server-side fetch from ThingSpeak and upsert into DB (useful when client cannot fetch due to CORS or private channels)
      try {
        // Prefer a server-side API key set in environment: THINGSPEAK_READ_API_KEY
        // As a fallback, accept an api_key query param. Passing the key via query param
        // is less secure (it may appear in logs) — prefer env var.
        const providedKey = searchParams.get('api_key');
        const apiKey = process.env.THINGSPEAK_READ_API_KEY || providedKey || null;

        const chUrlBase = `https://api.thingspeak.com/channels/${encodeURIComponent(id)}.json`;
        const chUrl = apiKey ? `${chUrlBase}?api_key=${encodeURIComponent(apiKey)}` : chUrlBase;
        const chRes = await fetch(chUrl);
        if (!chRes.ok) {
          const txt = await chRes.text().catch(() => '');
          throw new Error(`ThingSpeak fetch failed: ${chRes.status} ${chRes.statusText} ${txt}`);
        }
        const channelData = await chRes.json();
        // fetch last feed if available (append api_key if present)
        const feedUrlBase = `https://api.thingspeak.com/channels/${encodeURIComponent(id)}/feeds.json?results=1`;
        const feedUrl = apiKey ? `${feedUrlBase}&api_key=${encodeURIComponent(apiKey)}` : feedUrlBase;
        const feedRes = await fetch(feedUrl);
        if (feedRes.ok) {
          const feedData = await feedRes.json().catch(() => null);
          if (feedData?.feeds) channelData.feeds = feedData.feeds;
        }

        const row = await upsertChannelToDb(channelData);
        return NextResponse.json({ success: true, channel: row });
      } catch (err) {
        console.error('Server-side ThingSpeak fetch error:', err?.message ?? err);
        return NextResponse.json({ success: false, message: 'Server-side fetch failed', error: String(err) }, { status: 502 });
      }
    }

    const res = await pool.query('SELECT * FROM thingspeak_channels WHERE id = $1', [id]);
    if (res.rowCount === 0) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, channel: res.rows[0] });
  } catch (error) {
    console.error('ThingSpeak GET error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error', error: String(error) }, { status: 500 });
  }
}
