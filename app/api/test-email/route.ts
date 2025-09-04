import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailPassword) {
      return NextResponse.json({
        success: false,
        message: 'Gmail credentials are not configured. Please add GMAIL_USER and GMAIL_APP_PASSWORD to your .env.local file.',
        user: gmailUser ? 'Set' : 'Not set',
        password: gmailPassword ? 'Set' : 'Not set'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Gmail credentials are configured correctly',
      user: gmailUser ? 'Set' : 'Not set',
      password: gmailPassword ? 'Set' : 'Not set'
    });

  } catch (error) {
    console.error('Error testing Gmail configuration:', error);
    return NextResponse.json({
      success: false,
      message: 'Error testing Gmail configuration'
    }, { status: 500 });
  }
}
