# Gmail SMTP Setup for Timeline App

This guide will help you set up Gmail SMTP to send email notifications when users submit timelines.

## Prerequisites

- A Gmail account
- 2-Factor Authentication enabled on your Gmail account

## Step 1: Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on "2-Step Verification" under "Signing in to Google"
3. Follow the steps to enable 2-Factor Authentication

## Step 2: Generate App Password

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Click on "App passwords" under "2-Step Verification"
3. Select "Mail" from the dropdown
4. Click "Generate"
5. **Copy the 16-character password** (this is your app password, not your regular Gmail password)

## Step 3: Update Environment Variables

1. Open your `.env.local` file in the project root
2. Add these two lines:

```bash
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

**Important Notes:**
- Replace `your-email@gmail.com` with your actual Gmail address
- Replace `your-16-character-app-password` with the app password you generated in Step 2
- Do NOT use your regular Gmail password
- Do NOT share these credentials or commit them to version control

## Step 4: Test the Configuration

1. Start your development server: `npm run dev`
2. Sign in to your app
3. Click the "Test Email" button in the top-right corner
4. You should see a success message confirming your credentials are configured

## Troubleshooting

### "Gmail credentials not configured" Error
- Make sure your `.env.local` file exists and contains both variables
- Restart your development server after updating `.env.local`
- Check that there are no extra spaces or quotes around the values

### "Failed to connect to Gmail SMTP server" Error
- Verify your app password is correct (16 characters, no spaces)
- Ensure 2-Factor Authentication is enabled on your Gmail account
- Check that you're using the app password, not your regular password

### "Authentication failed" Error
- Double-check your Gmail email address spelling
- Regenerate your app password if needed
- Make sure you're using the latest app password

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for all sensitive data**
3. **Regularly rotate your app passwords**
4. **Monitor your Gmail account for unusual activity**

## Production Deployment

When deploying to production:
1. Set the same environment variables in your hosting platform
2. Ensure your hosting platform supports environment variables
3. Consider using a dedicated email service for production (SendGrid, Mailgun, etc.)

## Support

If you continue to have issues:
1. Check the browser console for detailed error messages
2. Verify your Gmail account settings
3. Try generating a new app password
4. Ensure your Gmail account isn't restricted by security policies
