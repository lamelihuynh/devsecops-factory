export const createWelcomeEmailTemplate = (name, clientURL) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Quack Chat</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #e4e4e7; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom, #0a0a0b 0%, #18181b 100%);">
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; box-shadow: 0 0 40px rgba(245, 158, 11, 0.25), 0 8px 32px rgba(0, 0, 0, 0.4);">
      <img src="https://img.freepik.com/free-vector/hand-drawn-message-element-vector-cute-sticker_53876-118344.jpg?t=st=1741295028~exp=1741298628~hmac=0d076f885d7095f0b5bc8d34136cd6d64749455f8cb5f29a924281bafc11b96c&w=1480" alt="Quack Chat Logo" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%; background-color: rgba(255, 255, 255, 0.95); padding: 10px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);">Welcome to Quack Chat!</h1>
    </div>
    <div style="background: rgba(24, 24, 27, 0.95); padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); border: 1px solid rgba(39, 39, 42, 0.8); backdrop-filter: blur(10px);">
      <p style="font-size: 18px; color: #fbbf24;"><strong>Hello ${name},</strong></p>
      <p style="color: #d4d4d8;">We're excited to have you join our messaging platform! Quack Chat connects you with friends, family, and colleagues in real-time, no matter where they are.</p>
      
      <div style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%); padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2);">
        <p style="font-size: 16px; margin: 0 0 15px 0; color: #fbbf24;"><strong>Get started in just a few steps:</strong></p>
        <ul style="margin: 0; padding-left: 20px; color: #d4d4d8;">
          <li style="margin-bottom: 10px;">Set up your profile with a photo</li>
          <li style="margin-bottom: 10px;">Start connecting with people</li>
          <li style="margin-bottom: 10px;">Send your first message!</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${clientURL}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; text-decoration: none; padding: 14px 36px; border-radius: 50px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3); transition: all 0.3s ease;">Open Quack Chat</a>
      </div>
      
      <p style="margin-bottom: 5px; color: #d4d4d8;">If you need any help or have questions, we're always here to assist you.</p>
      
      <p style="margin-top: 25px; margin-bottom: 0; color: #d4d4d8;">Best regards,<br><span style="color: #fbbf24; font-weight: 500;">The Quack Chat Team</span></p>
    </div>
    
    <div style="text-align: center; padding: 20px; color: #71717a; font-size: 12px;">
      <p style="margin-bottom: 10px;">© 2025 Quack Chat. All rights reserved.</p>
    </div>
  </body>
</html>
`;
