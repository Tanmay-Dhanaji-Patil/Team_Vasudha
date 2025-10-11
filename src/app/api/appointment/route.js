import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

export async function POST(request) {
  try {
    const { 
      farmerId,
      plotNumber,
      appointmentDate,
      appointmentTime
    } = await request.json();

    // Validate required fields
    if (!farmerId || !plotNumber || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // First, get the plot details to fetch the area
    const { data: plotDetails, error: plotError } = await supabase
      .from('Plot Details')
      .select('*')
      .eq('Owner ID', farmerId)
      .eq('Plot Number', String(plotNumber).trim())
      .single();

    if (plotError || !plotDetails) {
      return NextResponse.json(
        { success: false, message: 'Plot not found. Please select a valid plot number.' },
        { status: 404 }
      );
    }

    // Check if appointment already exists for this farmer, plot, and date
    const { data: existingAppointment, error: checkError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('Farmer Id', farmerId)
      .eq('Plot ID', plotDetails.id)
      .eq('Appointment Date', appointmentDate)
      .single();

    if (existingAppointment && !checkError) {
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        message: `You already have an appointment for Plot ${plotNumber} on ${appointmentDate}.`,
        suggestion: 'Please choose a different date or plot.'
      });
    }

    // Insert new appointment into database
    const { data: newAppointment, error: insertError } = await supabase
      .from('Appointment')
      .insert([
        {
          "Farmer Id": farmerId,
          "Plot ID": plotDetails.id,
          "Plot Area": plotDetails['Area of Plot'] || null,
          "Appointment Date": appointmentDate,
          "Appointment Time": appointmentTime
        }
      ])
      .select('*')
      .single();

    if (insertError) {
      console.error('Appointment insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to book appointment: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appointment booked successfully!',
      appointment: newAppointment
    });

  } catch (error) {
    console.error('Appointment API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    // Fetch appointments for the specific farmer
    const { data: appointments, error: fetchError } = await supabase
      .from('Appointment')
      .select('*')
      .eq('Farmer Id', farmerId)
      .order('Appointment Date', { ascending: true });

    if (fetchError) {
      console.error('Appointments fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch appointments: ' + fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      appointments: appointments || []
    });

  } catch (error) {
    console.error('Appointments fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
