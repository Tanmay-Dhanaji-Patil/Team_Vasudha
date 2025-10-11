import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

// POST /api/soil-actions - Create a new soil health action
export async function POST(request) {
  try {
    const {
      farmerId,
      notificationId,
      actionType,
      actionLabel,
      plotNumber,
      actionDate,
      actionTime,
      urgency,
      notes,
      priority = 'medium'
    } = await request.json();

    // Validate required fields
    if (!farmerId || !actionType || !actionLabel || !actionDate || !urgency) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID, action type, action label, action date, and urgency are required' },
        { status: 400 }
      );
    }

    // Insert new soil health action
    const { data: newSoilAction, error: insertError } = await supabase
      .from('soil_health_actions')
      .insert({
        farmer_id: farmerId,
        notification_id: notificationId,
        action_type: actionType,
        action_label: actionLabel,
        plot_number: plotNumber,
        action_date: actionDate,
        action_time: actionTime,
        urgency: urgency,
        notes: notes,
        status: 'planned'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Soil action insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create soil action: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Soil health action created successfully!',
      soilAction: newSoilAction
    });

  } catch (error) {
    console.error('Soil action API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/soil-actions - Get soil health actions for a farmer
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const urgency = searchParams.get('urgency');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (!farmerId) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('soil_health_actions')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('action_date', { ascending: true });

    if (urgency) {
      query = query.eq('urgency', urgency);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: soilActions, error: fetchError } = await query;

    if (fetchError) {
      console.error('Soil actions fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch soil actions: ' + fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      soilActions: soilActions || []
    });

  } catch (error) {
    console.error('Soil actions fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/soil-actions - Update soil health action status
export async function PUT(request) {
  try {
    const {
      soilActionId,
      status,
      completedAt,
      notes
    } = await request.json();

    if (!soilActionId || !status) {
      return NextResponse.json(
        { success: false, message: 'Soil action ID and status are required' },
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

    const { data: updatedAction, error: updateError } = await supabase
      .from('soil_health_actions')
      .update(updateData)
      .eq('id', soilActionId)
      .select()
      .single();

    if (updateError) {
      console.error('Soil action update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update soil action: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Soil health action updated successfully!',
      soilAction: updatedAction
    });

  } catch (error) {
    console.error('Soil action update API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
