import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: fetchError } = await supabase
      .from('Farmer Data')
      .select('id, Farmer_name, Farmer_email, Phone_number, password, location, created_at')
      .eq('Farmer_email', email.toLowerCase().trim())
      .single();

    if (fetchError || !user) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login time
    await supabase
      .from('Farmer Data')
      .update({ 
        last_login: new Date().toISOString()
      })
      .eq('id', user.id);

    // Return user data (without password)
    return NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user.id,
        name: user.Farmer_name,
        email: user.Farmer_email,
        phoneNumber: user.Phone_number,
        location: user.location,
        created_at: user.created_at
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}