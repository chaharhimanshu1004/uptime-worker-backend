const nodemailer = require("nodemailer");

async function sendUptimeNotification(userEmail, url, REGION) {

    const region = REGION.charAt(0).toUpperCase() + REGION.slice(1);

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
        subject: `Website is back online in ${region}! | Uptime Monitoring`,
        html:
            `<div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #0A0A0B; color: #ffffff; border-radius: 12px; border: 1px solid #232328;">
                <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; padding: 15px; background: linear-gradient(135deg, #9333EA, #8B5CF6, #06B6D4); border-radius: 50%; margin-bottom: 20px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="16 12 12 8 8 12"></polyline>
                    <line x1="12" y1="16" x2="12" y2="8"></line>
                    </svg>
                </div>
                <h1 style="margin: 0; font-size: 28px; background: linear-gradient(to right, #9333EA, #8B5CF6, #06B6D4); -webkit-background-clip: text; background-clip: text; color: transparent; display: inline-block;">Your Website Is Back Online!</h1>
                </div>
                
                <div style="background-color: #141417; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #232328;">
                <h2 style="margin-top: 0; color: #ffffff; font-size: 20px;">Great news!</h2>
                <p style="color: #e2e2e2; font-size: 16px; line-height: 1.6;">
                    We're pleased to inform you that your website <strong style="color: white;">${url}</strong> is now <span style="color: #10b981; font-weight: bold;">back online</span> and functioning properly.
                </p>
                
                <div style="background-color: rgba(6, 182, 212, 0.1); border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid rgba(6, 182, 212, 0.2);">
                    <p style="color: #e2e2e2; font-size: 16px; margin: 0; display: flex; align-items: center;">
                    <span style="display: inline-block; width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; margin-right: 10px;"></span>
                    <span>Website is up in the <strong style="color: #06B6D4;">${region}</strong> region</span>
                    </p>
                </div>
                
                <div style="text-align: center; margin: 25px 0;">
                    <span style="display: inline-block; background: linear-gradient(to right, #4F46E5, #7C3AED); color: white; padding: 12px 24px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                    Website Restored Successfully
                    </span>
                </div>
                
                <p style="color: #e2e2e2; font-size: 16px; line-height: 1.6;">
                    Your website experienced some downtime recently, but it appears you've successfully resolved the issue. Our monitoring system will continue to keep an eye on your site's performance.
                </p>
                </div>
                
                <div style="background-color: rgba(124, 58, 237, 0.1); border-radius: 12px; padding: 20px; border: 1px solid rgba(124, 58, 237, 0.2);">
                <p style="color: #e2e2e2; font-size: 15px; line-height: 1.5; margin: 0;">
                    Want to view detailed uptime statistics? <a href="#" style="color: #8B5CF6; text-decoration: none; font-weight: bold;">Visit your dashboard</a> for comprehensive monitoring data.
                </p>
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

module.exports = sendUptimeNotification;
