import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/database/supabaseAdmin';

export const runtime = 'nodejs';

const BUCKET = 'soil-reports';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json({ success: false, message: 'Missing path parameter' }, { status: 400 });
    }

    console.log(`[Validate] Validating PDF at path: ${path}`);

    // Download the first few bytes to check PDF signature
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from(BUCKET)
      .download(path);

    if (downloadError) {
      console.error('[Validate] Download error:', downloadError);
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to download file: ' + downloadError.message 
      }, { status: 400 });
    }

    if (!fileData) {
      return NextResponse.json({ 
        success: false, 
        message: 'No file data received' 
      }, { status: 400 });
    }

    // Convert to buffer and check first 5 bytes
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const header = buffer.subarray(0, 5).toString('utf-8');
    
    console.log(`[Validate] File header: "${header}"`);
    
    const isValidPDF = header === '%PDF-';
    const fileSize = buffer.length;

    return NextResponse.json({
      success: true,
      isValidPDF,
      fileSize,
      header,
      message: isValidPDF ? 'Valid PDF file' : 'Invalid PDF file - missing %PDF- signature'
    });

  } catch (e) {
    console.error('[Validate] Error:', e);
    return NextResponse.json({ 
      success: false, 
      message: 'Validation error: ' + e.message 
    }, { status: 500 });
  }
}
