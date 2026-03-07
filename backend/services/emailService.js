const { Resend } = require("resend");

// Initialize Resend with your environment variable
const resend = new Resend(process.env.RESEND_API_KEY);

// IMPORTANT: Until you verify a custom domain in Resend, 
// Production sender address using our verified custom domain.
const senderEmail = "NanoAlias <noreply@nanoalias.com>";

exports.sendVerificationEmail = async (to, token) => {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    const { data, error } = await resend.emails.send({
        from: senderEmail,
        to,
        subject: "Verify Your Email — NanoAlias",
        html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0A0A0A;border-radius:12px;overflow:hidden;border:1px solid #1a1a1a">
                <div style="background:#E2242A;padding:32px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:1px">NanoAlias</h1>
                </div>
                <div style="padding:32px;color:#e6eef8">
                    <h2 style="color:#fff;margin:0 0 12px">Verify your email address</h2>
                    <p style="margin:0 0 24px;line-height:1.6;color:#9aa7b8">
                        Thanks for signing up! Click the button below to verify your email and activate your account.
                        This link expires in <strong style="color:#CEB372">24 hours</strong>.
                    </p>
                    <div style="text-align:center;margin:0 0 24px">
                        <a href="${verifyUrl}" style="display:inline-block;background:#E2242A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px">
                            Verify Email
                        </a>
                    </div>
                    <p style="margin:0;font-size:13px;color:#64748b">
                        If the button doesn't work, paste this link into your browser:<br/>
                        <a href="${verifyUrl}" style="color:#CEB372;word-break:break-all">${verifyUrl}</a>
                    </p>
                </div>
                <div style="padding:16px 32px;background:#111111;text-align:center;font-size:12px;color:#475569;border-top:1px solid #1a1a1a">
                    &copy; ${new Date().getFullYear()} NanoAlias. You received this because an account was created with this email.
                </div>
            </div>
        `,
    });

    if (error) {
        console.error("Resend API Error (Verification):", error);
        throw new Error("Failed to send verification email");
    }
};

exports.sendPasswordResetEmail = async (to, token) => {
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const { data, error } = await resend.emails.send({
        from: senderEmail,
        to,
        subject: "Reset Your Password — NanoAlias",
        html: `
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0A0A0A;border-radius:12px;overflow:hidden;border:1px solid #1a1a1a">
                <div style="background:#E2242A;padding:32px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:1px">NanoAlias</h1>
                </div>
                <div style="padding:32px;color:#e6eef8">
                    <h2 style="color:#fff;margin:0 0 12px">Reset your password</h2>
                    <p style="margin:0 0 24px;line-height:1.6;color:#9aa7b8">
                        We received a request to reset your password. Click the button below to choose a new one.
                        This link expires in <strong style="color:#CEB372">15 minutes</strong>.
                    </p>
                    <div style="text-align:center;margin:0 0 24px">
                        <a href="${resetUrl}" style="display:inline-block;background:#E2242A;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px">
                            Reset Password
                        </a>
                    </div>
                    <p style="margin:0;font-size:13px;color:#64748b">
                        If you didn't request this, you can safely ignore this email.<br/>
                        <a href="${resetUrl}" style="color:#CEB372;word-break:break-all">${resetUrl}</a>
                    </p>
                </div>
                <div style="padding:16px 32px;background:#111111;text-align:center;font-size:12px;color:#475569;border-top:1px solid #1a1a1a">
                    &copy; ${new Date().getFullYear()} NanoAlias. This is an automated message.
                </div>
            </div>
        `,
    });

    if (error) {
        console.error("Resend API Error (Password Reset):", error);
        throw new Error("Failed to send password reset email");
    }
};

exports.sendOTPVerificationEmail = async (to, otp) => {
    const digits = String(otp).split("");

    const otpBoxes = digits
        .map(
            (d) =>
                `<td style="width:48px;height:56px;text-align:center;vertical-align:middle;font-family:'Courier New',monospace;font-size:28px;font-weight:700;color:#CEB372;background:#111111;border:1px solid #2a2a2a;border-radius:8px;letter-spacing:2px">${d}</td>`
        )
        .join('<td style="width:8px"></td>');

    const { data, error } = await resend.emails.send({
        from: senderEmail,
        to,
        subject: `${otp} is your NanoAlias verification code`,
        html: `
            <div style="display:none;max-height:0px;overflow:hidden;">Please use this code to securely complete your request.</div>
            <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;background:#0A0A0A;border-radius:12px;overflow:hidden;border:1px solid #1a1a1a">
                <div style="background:#E2242A;padding:28px 32px;text-align:center">
                    <h1 style="color:#fff;margin:0;font-size:28px;font-weight:800;letter-spacing:1px">NanoAlias</h1>
                </div>
                <div style="padding:36px 32px;color:#e6eef8">
                    <h2 style="color:#ffffff;margin:0 0 24px;font-size:22px;font-weight:700">Verification Code</h2>
                    <div style="text-align:center;margin:0 0 28px">
                        <div style="display:inline-block;background:#0b0b0b;border:1px solid #1a1a1a;border-radius:12px;padding:24px 28px">
                            <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto">
                                <tr>${otpBoxes}</tr>
                            </table>
                        </div>
                    </div>
                    <div style="background:#111111;border:1px solid #1a1a1a;border-left:3px solid #E2242A;border-radius:8px;padding:16px 20px;margin:0 0 24px">
                        <p style="margin:0;font-size:13px;line-height:1.6;color:#9aa7b8">
                            ⏱ This code expires in <strong style="color:#CEB372">5 minutes</strong>.
                        </p>
                    </div>
                    <p style="margin:0;font-size:13px;color:#64748b">
                        If you didn't request this code, you can safely ignore this email.
                    </p>
                </div>
                <div style="padding:16px 32px;background:#111111;text-align:center;font-size:12px;color:#475569;border-top:1px solid #1a1a1a">
                    &copy; ${new Date().getFullYear()} NanoAlias. This is an automated message — do not reply.
                </div>
            </div>
        `,
    });

    if (error) {
        console.error("Resend API Error (OTP):", error);
        throw new Error("Failed to send OTP email");
    }
};
