const nodemailer = require("nodemailer");

async function sendNotificationEmail(url, userEmail) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.NODEMAILER_GMAIL,
      pass: process.env.NODEMAILER_PASS,
    },
  });
  const mailOptions = {
    from: "uptime.monitoring.dev@gmail.com",
    to: userEmail,
    subject: "Website down alert | Uptime Monitoring",
    html:
      `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0A0A0B; color: #ffffff; border-radius: 12px; border: 1px solid #232328;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; padding: 15px; background: linear-gradient(135deg, #9333EA, #8B5CF6, #06B6D4); border-radius: 50%; margin-bottom: 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h1 style="margin: 0; font-size: 28px; background: linear-gradient(to right, #9333EA, #8B5CF6, #06B6D4); -webkit-background-clip: text; background-clip: text; color: transparent; display: inline-block;">Website Down Alert</h1>
        </div>
        
        <div style="background-color: #141417; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #232328;">
          <h2 style="margin-top: 0; color: #ffffff; font-size: 20px;">Hello,</h2>
          <p style="color: #e2e2e2; font-size: 16px; line-height: 1.6;">
            We regret to inform you that your website <strong style="color: white;">${url}</strong> is currently <span style="color: #ef4444; font-weight: bold">down</span>.
          </p>
          
          <div style="text-align: center; margin: 25px 0; position: relative; overflow: hidden; border-radius: 8px;">
            <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(45deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1)); z-index: 1;"></div>
            <div style="position: relative; z-index: 2; padding: 15px; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444; margin: 0 auto 10px;">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span style="display: block; color: white; font-size: 18px; font-weight: bold;">
                Website Down Alert
              </span>
            </div>
          </div>
          
          <p style="color: #e2e2e2; font-size: 16px; line-height: 1.6;">
            Our monitoring system detected the issue and will continue to check for recovery. You will receive a notification once the website is back online.
          </p>
          
          <p style="color: #e2e2e2; font-size: 16px; line-height: 1.6;">
            If this was not expected, please check your server immediately.
          </p>
        </div>
        
        <div style="background-color: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(239, 68, 68, 0.2);">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="min-width: 40px; height: 40px; border-radius: 50%; background-color: rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center;">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <p style="color: #e2e2e2; font-size: 15px; line-height: 1.5; margin: 0;">
              Need help troubleshooting? <a href="#" style="color: #ef4444; text-decoration: none; font-weight: bold;">Visit your dashboard</a> for more details or contact our support team.
            </p>
          </div>
        </div>
        
        <div style="margin-top: 30px; text-align: center; padding-top: 20px; border-top: 1px solid #232328;">
          <p style="color: #a1a1aa; font-size: 14px;">
            Regards,<br />
            <span style="background: linear-gradient(to right, #9333EA, #06B6D4); -webkit-background-clip: text; background-clip: text; color: transparent; font-weight: bold;">Uptime Monitor Team</span>
          </p>
          <p style="color: #71717a; font-size: 12px; margin-top: 15px;">
            This is an automated notification. Please do not reply to this email.
          </p>
        </div>
      </div>`
  };
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail}`);
  } catch (error) {
    console.error(`Error sending userEmail to ${userEmail}: ${error.message}`);
  }
}

module.exports = sendNotificationEmail;
