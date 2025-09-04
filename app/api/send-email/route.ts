import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPassword = process.env.GMAIL_APP_PASSWORD;
    
    if (!gmailUser || !gmailPassword) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Gmail credentials not configured. Please check your environment variables.' 
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { timelineData, userEmail, userName } = body;

    if (!timelineData || !userEmail) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required data: timelineData and userEmail are required' 
        },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPassword,
      },
    });

    // Verify transporter connection
    try {
      await transporter.verify();
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Failed to connect to Gmail SMTP server. Please check your credentials.' 
        },
        { status: 500 }
      );
    }

    const emailContent = formatTimelineEmail(timelineData, userEmail, userName);
    
    const mailOptions = {
      from: gmailUser,
      to: gmailUser,
      subject: `New Timeline Submission - ${userName || userEmail}`,
      html: emailContent,
    };

    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Timeline submitted and email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send email notification' 
      },
      { status: 500 }
    );
  }
}

function formatTimelineEmail(timelineData: any, userEmail: string, userName: string): string {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  let eventsHtml = '';
  if (timelineData.events && timelineData.events.length > 0) {
    eventsHtml = `
      <h3>Timeline Events (${timelineData.events.length})</h3>
      <div style="margin-left: 20px;">
        ${timelineData.events.map((event: any, index: number) => `
          <div style="margin-bottom: 20px; padding: 15px; border-left: 3px solid #3b82f6; background-color: #f8fafc;">
            <h4 style="margin: 0 0 10px 0; color: #1e40af;">Event ${index + 1}: ${event.title}</h4>
            <p><strong>Type:</strong> ${event.type}</p>
            <p><strong>Date:</strong> ${formatDate(event.approximateDate)}</p>
            <p><strong>Description:</strong> ${event.description}</p>
            ${event.details && Object.keys(event.details).length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Additional Details:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${Object.entries(event.details).map(([key, value]) => `
                    <li><strong>${key}:</strong> ${value}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            ${event.attachments && event.attachments.length > 0 ? `
              <div style="margin-top: 10px;">
                <strong>Attachments:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  ${event.attachments.map((attachment: any) => `
                    <li>${attachment.name} (${attachment.type}, ${formatFileSize(attachment.size)})</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Timeline Submission</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #1e40af; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px; }
        .section { margin-bottom: 25px; padding: 15px; background-color: #f8fafc; border-radius: 5px; }
        .section h3 { margin-top: 0; color: #1e40af; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 New Timeline Submission</h1>
          <p>Submitted via Timeline App</p>
        </div>
        
        <div class="content">
          <div class="section">
            <h3>👤 User Information</h3>
            <p><strong>Name:</strong> ${userName || 'Not provided'}</p>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Submission Time:</strong> ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h3>🏢 Employer Information</h3>
            <p><strong>Company:</strong> ${timelineData.employerInfo?.companyName || 'Not provided'}</p>
            <p><strong>Location:</strong> ${timelineData.employerInfo?.location || 'Not provided'}</p>
            <p><strong>Job Title:</strong> ${timelineData.employerInfo?.jobTitle || 'Not provided'}</p>
            <p><strong>Start Date:</strong> ${formatDate(timelineData.employerInfo?.startDate)}</p>
            <p><strong>End Date:</strong> ${formatDate(timelineData.employerInfo?.endDate)}</p>
            <p><strong>Pay Rate:</strong> ${timelineData.employerInfo?.payRate || 'Not provided'}</p>
            <p><strong>Employment Type:</strong> ${timelineData.employerInfo?.employmentType || 'Not provided'}</p>
          </div>

          ${eventsHtml}

          <div class="footer">
            <p>This email was automatically generated by the Timeline App.</p>
            <p>Please review the submission and take appropriate action.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
