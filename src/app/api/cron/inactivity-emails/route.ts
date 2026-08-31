import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

// NOTE: Add these to your .env file
// SMTP_HOST=smtp.gmail.com (or your college SMTP server)
// SMTP_PORT=587
// SMTP_USER=your_email@college.edu
// SMTP_PASS=your_app_password
// CRON_SECRET=my-super-secret-key-123
// NEXT_PUBLIC_APP_URL=http://your-intranet-portal.college.edu

export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  try {
    // 1. Verify authorization (so no one else can trigger this randomly)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Calculate the date window (exactly between 15 and 16 days ago)
    // We check between 15-16 days so we only email them once, not every single day after 15 days.
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const sixteenDaysAgo = new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000);

    // 3. Find inactive users
    const inactiveUsers = await prisma.user.findMany({
      where: {
        status: "ACTIVE", // Only email active accounts
        lastLoginAt: {
          gte: sixteenDaysAgo,
          lt: fifteenDaysAgo,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
      },
    });

    if (inactiveUsers.length === 0) {
      return NextResponse.json({ message: "No inactive users to notify today." });
    }

    // 4. Setup Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 5. Send Emails
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let sentCount = 0;

    for (const user of inactiveUsers) {
      const roleText = user.role.toLowerCase();
      
      const mailOptions = {
        from: `"Problem Repository Admin" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "We miss you! 15 Days of Inactivity on Problem Repository Portal",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #333;">Hello ${user.name},</h2>
            <p>We noticed you haven't logged into the Problem Repository Portal for the last 15 days.</p>
            <p>As a registered <strong>${roleText}</strong>, your participation is highly valued. There have been many new updates, questions, and activities since your last visit.</p>
            
            <div style="margin: 30px 0; text-align: center;">
              <a href="${appUrl}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Access the Intranet Portal Now
              </a>
            </div>
            
            <p>For easy access while on campus, bookmark the intranet link: <br>
            <a href="${appUrl}" style="color: #007bff;">${appUrl}</a></p>

            <p style="margin-top: 30px; font-size: 12px; color: #777;">
              If you have any issues logging in, please contact the system administrator.<br>
              This is an automated notification.
            </p>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        sentCount++;
      } catch (err) {
        console.error(`Failed to send email to ${user.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully sent ${sentCount} inactivity reminder emails.`,
    });

  } catch (error) {
    console.error("Error processing inactivity emails:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
