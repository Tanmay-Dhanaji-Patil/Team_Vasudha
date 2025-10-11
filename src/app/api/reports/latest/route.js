import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/database/supabaseAdmin';

export const runtime = 'nodejs';

const BUCKET = 'soil-reports';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const expires = Number(searchParams.get('expires')) || 60 * 10; // 10 min

    if (!email) {
      return NextResponse.json({ success: false, message: 'Missing required query parameter: email' }, { status: 400 });
    }

    console.log(`[Latest Report] Fetching report for email: ${email}`);

    // Find farmer id by email in table "Farmer Data"
    const { data: farmer, error: farmerError } = await supabaseAdmin
      .from('Farmer Data')
      .select('id, Farmer_name, Farmer_email')
      .eq('Farmer_email', email)
      .maybeSingle();

    if (farmerError) {
      console.error('[Latest Report] Farmer lookup error:', farmerError);
      return NextResponse.json({ success: false, message: 'Database error: ' + farmerError.message }, { status: 500 });
    }

    if (!farmer?.id) {
      console.log(`[Latest Report] No farmer found for email: ${email}`);
      return NextResponse.json({ success: false, message: 'Farmer not found for email' }, { status: 404 });
    }

    console.log(`[Latest Report] Found farmer: ${farmer.Farmer_name} (ID: ${farmer.id})`);

    const folder = `reports/${farmer.id}`;

    // List files in the farmer folder, sorted newest first
    const { data: files, error: listError } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .list(folder, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

    if (listError) {
      console.error('[Latest Report] File list error:', listError);
      return NextResponse.json({ success: false, message: 'Storage error: ' + listError.message }, { status: 500 });
    }

    if (!files || files.length === 0) {
      console.log(`[Latest Report] No files found in folder: ${folder}`);
      return NextResponse.json({ success: false, message: 'No reports found for farmer' }, { status: 404 });
    }

    console.log(`[Latest Report] Found ${files.length} files. Validating headers...`);

    // Iterate newest → oldest, find first valid PDF (header starts with %PDF-)
    let chosen = null;
    for (const entry of files) {
      const candidatePath = `${folder}/${entry.name}`;
      try {
        const { data: blob, error: dlErr } = await supabaseAdmin
          .storage
          .from(BUCKET)
          .download(candidatePath);
        if (dlErr || !blob) {
          console.warn('[Latest Report] Skip (download error):', candidatePath, dlErr?.message);
          continue;
        }
        const head = Buffer.from(await blob.arrayBuffer()).subarray(0, 5).toString('utf-8');
        if (head === '%PDF-') {
          chosen = { entry, path: candidatePath };
          console.log('[Latest Report] Chosen valid PDF:', candidatePath);
          break;
        } else {
          console.warn('[Latest Report] Skip (invalid header):', candidatePath, `header="${head}"`);
        }
      } catch (e) {
        console.warn('[Latest Report] Skip (exception while validating):', candidatePath, e?.message);
      }
    }

    if (!chosen) {
      return NextResponse.json({ success: false, message: 'No valid PDF reports found (all missing %PDF- header)' }, { status: 404 });
    }

    // Create signed URL for the chosen valid file
    const { data: signed, error: signError } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(chosen.path, expires);

    if (signError || !signed?.signedUrl) {
      console.error('[Latest Report] Sign URL error:', signError);
      return NextResponse.json({ success: false, message: 'Failed to create signed URL: ' + (signError?.message || 'unknown') }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      farmer: { id: farmer.id, name: farmer.Farmer_name, email: farmer.Farmer_email },
      storagePath: chosen.path,
      signedUrl: signed.signedUrl,
      fileName: chosen.entry.name,
      fileSize: chosen.entry.metadata?.size || 'unknown',
      createdAt: chosen.entry.created_at
    });
  } catch (e) {
    console.error('[Latest Report] Unexpected error:', e);
    return NextResponse.json({ success: false, message: 'Internal server error: ' + (e?.message || 'Unknown error') }, { status: 500 });
  }
}


