import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

export async function GET(request, { params }) {
  try {
    const { id: appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, message: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    // Fetch appointment details with farmer and plot information
    const { data: appointment, error: appointmentError } = await supabase
      .from('Appointment')
      .select(`
        *,
        "Farmer Data" (
          id,
          "Farmer_name",
          "Farmer_email",
          "Phone_number",
          location
        ),
        "Plot Details" (
          id,
          "Plot Number",
          "Area of Plot",
          "Category",
          "State",
          "District",
          "Taluka",
          "Village Name"
        )
      `)
      .eq('Appointment ID id', appointmentId)
      .single();

    if (appointmentError) {
      console.error('Appointment fetch error:', appointmentError);
      return NextResponse.json(
        { success: false, message: 'Appointment not found or error fetching details: ' + appointmentError.message },
        { status: 404 }
      );
    }

    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment['Appointment ID id'],
        appointmentDate: appointment['Appointment Date'],
        appointmentTime: appointment['Appointment Time'],
        plotArea: appointment['Plot Area'],
        farmer: appointment['Farmer Data'],
        plot: appointment['Plot Details']
      }
    });

  } catch (error) {
    console.error('Appointment fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
