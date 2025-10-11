import { NextResponse } from 'next/server';
import { supabase } from '@/database/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { name, email, password, location, phoneNumber } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !location || !phoneNumber) {
      return NextResponse.json(
        { success: false, message: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length < 2) {
      return NextResponse.json(
        { success: false, message: 'Name must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists (email)
    const { data: existingUser, error: checkError } = await supabase
      .from('Farmer Data')
      .select('id')
      .eq('Farmer_email', email.toLowerCase().trim())
      .single();

    if (existingUser && !checkError) {
      return NextResponse.json(
        { success: false, message: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone number already exists
    const { data: existingPhone, error: phoneCheckError } = await supabase
      .from('Farmer Data')
      .select('id')
      .eq('Phone_number', phoneNumber.trim())
      .single();

    if (existingPhone && !phoneCheckError) {
      return NextResponse.json(
        { success: false, message: 'User with this phone number already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate username from name
    const baseUsername = name.toLowerCase().replace(/\s+/g, '');
    let username = baseUsername;
    let counter = 1;

    // Check if username already exists and generate unique one
    while (true) {
      const { data: existingUsername } = await supabase
        .from('Farmer Data')
        .select('id')
        .eq('Farmer_name', username)
        .single();

      if (!existingUsername) break;
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Insert user into database
    const { data: newUser, error: insertError } = await supabase
      .from('Farmer Data')
      .insert([
        {
          Farmer_name: name.trim(),
          Farmer_email: email.toLowerCase().trim(),
          Phone_number: phoneNumber.trim(),
          password: hashedPassword,
          location: location.trim()
        }
      ])
      .select('id, Farmer_name, Farmer_email, Phone_number, location, created_at')
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      
      // Handle specific database constraint errors
      if (insertError.code === '23505') {
        if (insertError.details?.includes('Farmer_email')) {
          return NextResponse.json(
            { success: false, message: 'Email address is already registered' },
            { status: 409 }
          );
        }
        if (insertError.details?.includes('Phone_number')) {
          return NextResponse.json(
            { success: false, message: 'Phone number is already registered' },
            { status: 409 }
          );
        }
        return NextResponse.json(
          { success: false, message: 'User information already exists' },
          { status: 409 }
        );
      }
      
      // Handle network/connection errors
      if (insertError.message?.includes('fetch failed') || insertError.message?.includes('TypeError')) {
        return NextResponse.json(
          { success: false, message: 'Database connection error. Please try again later.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { success: false, message: 'Failed to create user account. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newUser.id,
        name: newUser.Farmer_name,
        email: newUser.Farmer_email,
        phoneNumber: newUser.Phone_number,
        location: newUser.location
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}