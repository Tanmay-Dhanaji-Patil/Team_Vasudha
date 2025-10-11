import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

// POST /api/sowing-plans - Create a new sowing plan
export async function POST(request) {
  try {
    const {
      farmerId,
      notificationId,
      cropType,
      cropLabel,
      plotNumber,
      sowingDate,
      sowingTime,
      notes,
      priority = 'medium'
    } = await request.json();

    // Validate required fields
    if (!farmerId || !cropType || !cropLabel || !sowingDate) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID, crop type, crop label, and sowing date are required' },
        { status: 400 }
      );
    }

    // Insert new sowing plan
    const { data: newSowingPlan, error: insertError } = await supabase
      .from('sowing_plans')
      .insert({
        farmer_id: farmerId,
        notification_id: notificationId,
        crop_type: cropType,
        crop_label: cropLabel,
        plot_number: plotNumber,
        sowing_date: sowingDate,
        sowing_time: sowingTime,
        notes: notes,
        priority: priority,
        status: 'planned'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Sowing plan insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create sowing plan: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sowing plan created successfully!',
      sowingPlan: newSowingPlan
    });

  } catch (error) {
    console.error('Sowing plan API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/sowing-plans - Get sowing plans for a farmer
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (!farmerId) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('sowing_plans')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('sowing_date', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: sowingPlans, error: fetchError } = await query;

    if (fetchError) {
      console.error('Sowing plans fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch sowing plans: ' + fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sowingPlans: sowingPlans || []
    });

  } catch (error) {
    console.error('Sowing plans fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/sowing-plans - Update sowing plan status
export async function PUT(request) {
  try {
    const {
      sowingPlanId,
      status,
      completedAt,
      notes
    } = await request.json();

    if (!sowingPlanId || !status) {
      return NextResponse.json(
        { success: false, message: 'Sowing plan ID and status are required' },
        { status: 400 }
      );
    }

    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (completedAt) {
      updateData.completed_at = completedAt;
    }

    if (notes) {
      updateData.notes = notes;
    }

    const { data: updatedPlan, error: updateError } = await supabase
      .from('sowing_plans')
      .update(updateData)
      .eq('id', sowingPlanId)
      .select()
      .single();

    if (updateError) {
      console.error('Sowing plan update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update sowing plan: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sowing plan updated successfully!',
      sowingPlan: updatedPlan
    });

  } catch (error) {
    console.error('Sowing plan update API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
