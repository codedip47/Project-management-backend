import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.MAILTRAP_SMTP_HOST,
    port: Number(process.env.MAILTRAP_SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false, // Dev only
    },
});

async function verifyEmail(email, token, str) {
    // console.log(email);
    // console.log(token);
    if(!email || !token){
        return false;
    }
    try {
        const info = await transporter.sendMail({
        from: 'example@example.com',
        to: email,
        subject: "Verify Your Email",
        text: `Click the link to verify your email: ${process.env.BASE_URL}/api/v1/auth/verify/${str}/${token}`,
        });

        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Failed to send mail", error);
        return false;
    }
}

export default verifyEmail;
