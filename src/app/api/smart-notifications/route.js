import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

// POST /api/smart-notifications - Create a new smart notification
export async function POST(request) {
  try {
    const {
      farmerId,
      notificationType,
      subType,
      title,
      message,
      priority,
      actionButtonText,
      actionData,
      isWeatherAlert = false,
      isFallback = false,
      location
    } = await request.json();

    // Validate required fields
    if (!farmerId || !notificationType || !title || !message || !priority) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID, notification type, title, message, and priority are required' },
        { status: 400 }
      );
    }

    // Insert new smart notification
    const { data: newNotification, error: insertError } = await supabase
      .from('Smart Notifications')
      .insert({
        farmer_id: farmerId,
        notification_type: notificationType,
        sub_type: subType,
        title: title,
        message: message,
        priority: priority,
        action_button_text: actionButtonText,
        action_data: actionData,
        is_weather_alert: isWeatherAlert,
        is_fallback: isFallback,
        location: location,
        action_taken: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Smart notification insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to create smart notification: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Smart notification created successfully!',
      notification: newNotification
    });

  } catch (error) {
    console.error('Smart notification API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/smart-notifications - Get smart notifications for a farmer
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmerId = searchParams.get('farmerId');
    const notificationType = searchParams.get('type');
    const priority = searchParams.get('priority');
    const actionTaken = searchParams.get('actionTaken');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (!farmerId) {
      return NextResponse.json(
        { success: false, message: 'Farmer ID is required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('Smart Notifications')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });

    if (notificationType) {
      query = query.eq('notification_type', notificationType);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (actionTaken !== null && actionTaken !== undefined) {
      query = query.eq('action_taken', actionTaken === 'true');
    }

    if (offset) {
      query = query.range(parseInt(offset), parseInt(offset) + (parseInt(limit) || 10) - 1);
    } else if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data: notifications, error: fetchError } = await query;

    if (fetchError) {
      console.error('Smart notifications fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch smart notifications: ' + fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      notifications: notifications || []
    });

  } catch (error) {
    console.error('Smart notifications fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/smart-notifications - Update smart notification (mark as dismissed or action taken)
export async function PUT(request) {
  try {
    const {
      notificationId,
      actionTaken,
      dismissedAt,
      actionTakenAt,
      actionData
    } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (actionTaken !== undefined) {
      updateData.action_taken = actionTaken;
    }

    if (dismissedAt) {
      updateData.dismissed_at = dismissedAt;
    }

    if (actionTakenAt) {
      updateData.action_taken_at = actionTakenAt;
    }

    if (actionData) {
      updateData.action_data = actionData;
    }

    const { data: updatedNotification, error: updateError } = await supabase
      .from('Smart Notifications')
      .update(updateData)
      .eq('id', notificationId)
      .select()
      .single();

    if (updateError) {
      console.error('Smart notification update error:', updateError);
      return NextResponse.json(
        { success: false, message: 'Failed to update smart notification: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Smart notification updated successfully!',
      notification: updatedNotification
    });

  } catch (error) {
    console.error('Smart notification update API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/smart-notifications - Delete a smart notification
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const { error: deleteError } = await supabase
      .from('Smart Notifications')
      .delete()
      .eq('id', notificationId);

    if (deleteError) {
      console.error('Smart notification deletion error:', deleteError);
      return NextResponse.json(
        { success: false, message: 'Failed to delete smart notification: ' + deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Smart notification deleted successfully!'
    });

  } catch (error) {
    console.error('Smart notification deletion API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
