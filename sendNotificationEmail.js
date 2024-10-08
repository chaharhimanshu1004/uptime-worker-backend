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
        `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border: 1px solid #ddd;">
        <h2 style="color: #333;">Hello,</h2>
        <p style="font-size: 16px; color: #555;">
        We regret to inform you that your website <strong>${url}</strong> is currently <span style="color: red; font-weight: bold">down</span>.
        </p>
        <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; background-color: #ff4d4d; color: white; padding: 10px 20px; border-radius: 4px; font-size: 18px; font-weight: bold;">
            Website Down Alert
        </span>
        </div>
        <p style="font-size: 16px; color: #555;">
        Our monitoring system detected the issue and will continue to check for recovery. You will receive a notification once the website is back online.
        </p>
        <p style="font-size: 16px; color: #555;">
        If this was not expected, please check your server immediately.
        </p>
        <p style="font-size: 16px; color: #555;">
        Regards,<br />
        Uptime Monitoring Team
        </p>
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
