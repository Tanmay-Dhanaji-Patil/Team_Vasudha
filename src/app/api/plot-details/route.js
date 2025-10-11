import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';

export async function POST(request) {
  try {
    const { 
      category, 
      state, 
      district, 
      taluka, 
      plotNumber,
      villageName, 
      areaOfPlot, 
      farmerId,
      isEdit,
      plotId
    } = await request.json();

    // Validate required fields
    if (!category || !state || !district || !taluka || !plotNumber || !villageName || !areaOfPlot || !farmerId) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!['Rural', 'Urban'].includes(category)) {
      return NextResponse.json(
        { success: false, message: 'Category must be either Rural or Urban' },
        { status: 400 }
      );
    }

    // Validate area of plot (should be a positive number)
    const area = parseFloat(areaOfPlot);
    if (isNaN(area) || area <= 0) {
      return NextResponse.json(
        { success: false, message: 'Area of plot must be a positive number' },
        { status: 400 }
      );
    }

    // If editing, update the existing plot directly
    if (isEdit && plotId) {
      const { data: updatedPlot, error: updateError } = await supabase
        .from('Plot Details')
        .update({
          "Category": category,
          "State": String(state).trim(),
          "District": String(district).trim(),
          "Taluka": String(taluka).trim(),
          "Plot Number": String(plotNumber).trim(),
          "Village Name": String(villageName).trim(),
          "Area of Plot": area
        })
        .eq('id', plotId)
        .eq('Owner ID', farmerId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Plot details update error:', updateError);
        return NextResponse.json(
          { success: false, message: 'Failed to update plot details: ' + updateError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Plot details updated successfully!',
        plot: updatedPlot
      });
    }

    // For new plots, check if plot number already exists for this farmer
    const { data: existingPlot, error: checkError } = await supabase
      .from('Plot Details')
      .select('*')
      .eq('Owner ID', farmerId)
      .eq('Plot Number', String(plotNumber).trim())
      .single();

    // If plot number already exists, ask user if they want to edit
    if (existingPlot && !checkError) {
      return NextResponse.json({
        success: false,
        isDuplicate: true,
        message: `Plot Number "${plotNumber}" already exists in your records.`,
        existingPlot: existingPlot,
        suggestion: 'Do you want to edit the existing plot details?'
      });
    }

    // Insert new plot details into database
    const { data: newPlot, error: insertError } = await supabase
      .from('Plot Details')
      .insert([
        {
          "Category": category,
          "Owner ID": farmerId,
          "State": String(state).trim(),
          "District": String(district).trim(),
          "Taluka": String(taluka).trim(),
          "Plot Number": String(plotNumber).trim(),
          "Village Name": String(villageName).trim(),
          "Area of Plot": area
        }
      ])
      .select('*')
      .single();

    if (insertError) {
      console.error('Plot details insertion error:', insertError);
      return NextResponse.json(
        { success: false, message: 'Failed to save plot details: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Plot details saved successfully!',
      plot: newPlot
    });

  } catch (error) {
    console.error('Plot details API error:', error);
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

    // Fetch plot details for the specific farmer
    const { data: plots, error: fetchError } = await supabase
      .from('Plot Details')
      .select('*')
      .eq('Owner ID', farmerId)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Plot details fetch error:', fetchError);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch plot details: ' + fetchError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plots: plots || []
    });

  } catch (error) {
    console.error('Plot details fetch API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
