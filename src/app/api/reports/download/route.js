import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/database/supabaseAdmin';

export const runtime = 'nodejs';

const BUCKET = 'soil-reports';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');
    const expires = Number(searchParams.get('expires')) || 60 * 5; // default 5 minutes

    if (!path) {
      return NextResponse.json({ success: false, message: 'Missing required query parameter: path' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .createSignedUrl(path, expires);

    if (error || !data?.signedUrl) {
      return NextResponse.json({ success: false, message: error?.message || 'Failed to create signed URL' }, { status: 400 });
    }

    // Redirect browser to Supabase signed URL so it handles headers correctly
    return NextResponse.redirect(data.signedUrl, 302);
  } catch (e) {
    return NextResponse.json({ success: false, message: e.message || 'Unexpected error' }, { status: 500 });
  }
}


