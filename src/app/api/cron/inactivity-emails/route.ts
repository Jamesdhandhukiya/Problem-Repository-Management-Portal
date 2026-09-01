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
      let subject = "";
      let bodyContent = "";

      if (user.role === "STUDENT") {
        subject = "Practice Reminder: Problem Repository Portal";
        bodyContent = `
          <p>We noticed that you have not been active on the Problem Repository Portal recently.</p>
          <p>We encourage you to log in to the portal and continue practicing programming and problem-solving questions. Regular practice will help you improve your skills and strengthen your understanding of different concepts and difficulty levels.</p>
          <p>Please log in to the portal and continue your practice.</p>
          <p>Thank you for being a part of the Problem Repository.</p>
        `;
      } else if (user.role === "STAFF") {
        subject = "Question Contribution Reminder: Problem Repository Portal";
        bodyContent = `
          <p>We noticed that you have not recently added new questions to the Problem Repository Portal.</p>
          <p>We encourage you to log in to the portal and contribute new, high-quality programming and problem-solving questions. Your contributions help expand the repository and provide students with more opportunities to practice and improve their skills.</p>
          <p>Please log in to the portal and add new questions at your convenience.</p>
          <p>Thank you for your valuable contribution.</p>
        `;
      } else if (user.role === "MODERATOR") {
        subject = "Question Moderation Reminder: Problem Repository Portal";
        bodyContent = `
          <p>We noticed that there are questions awaiting your moderation on the Problem Repository Portal.</p>
          <p>We request you to log in to the portal and review the pending questions. Please complete the moderation process by approving, rejecting, or requesting changes as appropriate.</p>
          <p>Your timely moderation helps maintain the quality of the repository and ensures that approved questions are made available to students without unnecessary delays.</p>
          <p>Thank you for your valuable contribution.</p>
        `;
      } else {
        subject = "Inactivity Reminder: Problem Repository Portal";
        bodyContent = `
          <p>We noticed you haven't logged into the Problem Repository Portal recently.</p>
        `;
      }

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Dear ${user.name},</h2>
          
          <div style="color: #444; line-height: 1.6;">
            ${bodyContent}
          </div>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${appUrl}/login" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Access the Intranet Portal Now
            </a>
          </div>
          
          <p>For easy access while on campus, bookmark the intranet link: <br>
          <a href="${appUrl}" style="color: #007bff;">${appUrl}</a></p>

          <p style="margin-top: 20px;">
            Regards,<br>
            <strong>Problem Repository Team</strong>
          </p>

          <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            If you have any issues logging in, please contact the system administrator.<br>
            This is an automated notification.
          </p>
        </div>
      `;

      const mailOptions = {
        from: `"Problem Repository Admin" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: subject,
        html: html,
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
