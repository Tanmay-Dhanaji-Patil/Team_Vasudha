import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');

    if (!farmerId) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID is required' },
        { status: 400 }
      );
    }

    // Fetch plot details for the specific farmer
    const { data: plots, error: fetchError } = await supabase
      .from('Plot Details')
      .select('*')
      .eq('Owner ID', farmerId)
      .order('"Plot Number"', { ascending: true });

    if (fetchError) {
      console.error('Plots fetch error:', fetchError);
      console.error('Farmer ID:', farmerId);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch plots: ' + fetchError.message },
        { status: 500 }
      );
    }

    console.log('Found plots for farmer:', farmerId, 'Count:', plots?.length || 0);
    return NextResponse.json({
      success: true,
      plots: plots || []
    });

  } catch (error) {
    console.error('Plots fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
