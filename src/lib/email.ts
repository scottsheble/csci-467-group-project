import nodemailer from "nodemailer";

export async function sendEmail({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}) {
    // Configure your SMTP transport (example uses Gmail SMTP)
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, // Your Gmail address
            pass: process.env.EMAIL_PASS, // App password or app password for Gmail
        },
    });

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html,
    });
}

// Example usage in a route or service
//import { sendEmail } from "@/lib/email";

async function notifyCustomer() {
    await sendEmail({
        to: "customer@example.com",
        subject: "Your Finalized Quote",
        text: `
Hello,

Your quote is now finalized!

Quote ID: 12345
Total: $199.99

Thank you for your business!
        `,
        // Optionally, you can provide HTML for richer emails
        html: `
            <h2>Your quote is now finalized!</h2>
            <p><strong>Quote ID:</strong> 12345</p>
            <p><strong>Total:</strong> $199.99</p>
            <p>Thank you for your business!</p>
        `,
    });
}