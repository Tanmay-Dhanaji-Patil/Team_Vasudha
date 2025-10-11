import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

// POST /api/task-rescheduling - Create a new task rescheduling record
export async function POST(request) {
  try {
    const {
      farmerId,
      originalTaskId,
      taskType,
      cropName,
      originalDueDate,
      originalDueText,
      newDueDate,
      newDueText,
      rescheduledTime,
      rescheduleReason,
      status = 'rescheduled'
    } = await request.json();

    // Validate required fields
    if (!farmerId || !taskType || !cropName || !originalDueDate || !originalDueText || !newDueDate || !newDueText) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID, task type, crop name, dates, and due text are required' },
        { status: 400 }
      );
    }

    // Insert new task rescheduling record
    const { data: newRescheduling, error: insertError } = await supabase
      .from('Task Rescheduling')
      .insert({
        farmer_id: farmerId,
        original_task_id: originalTaskId,
        task_type: taskType,
        crop_name: cropName,
        original_due_date: originalDueDate,
        original_due_text: originalDueText,
        new_due_date: newDueDate,
        new_due_text: newDueText,
        rescheduled_time: rescheduledTime,
        reschedule_reason: rescheduleReason,
        status: status
      })
      .select()
      .single();

    if (insertError) {
      console.error('Task rescheduling insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create task rescheduling: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task rescheduling created successfully!',
      rescheduling: newRescheduling
    });

  } catch (error) {
    console.error('Task rescheduling API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/task-rescheduling - Get task rescheduling records for a farmer
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const taskType = searchParams.get('taskType');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');

    if (!farmerId) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('Task Rescheduling')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('new_due_date', { ascending: true });

    if (taskType) {
      query = query.eq('task_type', taskType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: reschedulingRecords, error: fetchError } = await query;

    if (fetchError) {
      console.error('Task rescheduling fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch task rescheduling: ' + fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      reschedulingRecords: reschedulingRecords || []
    });

  } catch (error) {
    console.error('Task rescheduling fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/task-rescheduling - Update task rescheduling status
export async function PUT(request) {
  try {
    const {
      reschedulingId,
      status,
      notes
    } = await request.json();

    if (!reschedulingId || !status) {
      return NextResponse.json(
        { success: false, message: 'Rescheduling ID and status are required' },
        { status: 400 }
      );
    }

    const updateData = {
      status: status,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.reschedule_reason = notes;
    }

    const { data: updatedRescheduling, error: updateError } = await supabase
      .from('Task Rescheduling')
      .update(updateData)
      .eq('id', reschedulingId)
      .select()
      .single();

    if (updateError) {
      console.error('Task rescheduling update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update task rescheduling: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Task rescheduling updated successfully!',
      rescheduling: updatedRescheduling
    });

  } catch (error) {
    console.error('Task rescheduling update API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
