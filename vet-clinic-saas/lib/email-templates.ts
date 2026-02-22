interface InviteEmailProps {
  clinicName: string;
  clinicLocation?: string;
  inviteeName: string;
  role: string;
  inviteLink: string;
}

export function getInviteEmailHtml({
  clinicName,
  clinicLocation,
  inviteeName,
  role,
  inviteLink,
}: InviteEmailProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Join ${clinicName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #C00000 0%, #8B0000 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
                </svg>
              </div>
              <h1 style="margin: 20px 0 0 0; font-size: 28px; font-weight: 700; color: #1e293b; line-height: 1.3;">
                You're Invited!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.6;">
                Hi <strong>${inviteeName}</strong>,
              </p>
              <p style="margin: 0 0 20px 0; font-size: 16px; color: #475569; line-height: 1.6;">
                You've been invited to join <strong style="color: #C00000;">${clinicName}</strong>${clinicLocation ? ` (${clinicLocation})` : ''} as a <strong>${role}</strong>.
              </p>
              <p style="margin: 0 0 30px 0; font-size: 16px; color: #475569; line-height: 1.6;">
                Click the button below to accept your invitation and set up your account:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #C00000 0%, #8B0000 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(192, 0, 0, 0.2);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Details Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #64748b;">
                          <strong style="color: #334155;">Clinic:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b; text-align: right;">
                          ${clinicName}
                        </td>
                      </tr>
                      ${clinicLocation ? `
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #64748b;">
                          <strong style="color: #334155;">Location:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b; text-align: right;">
                          ${clinicLocation}
                        </td>
                      </tr>
                      ` : ''}
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #64748b;">
                          <strong style="color: #334155;">Role:</strong>
                        </td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1e293b; text-align: right;">
                          ${role}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; line-height: 1.5;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13px; color: #94a3b8; word-break: break-all;">
                ${inviteLink}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b; text-align: center;">
                This invitation was sent by ${clinicName}
              </p>
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

export function getInviteEmailText({
  clinicName,
  clinicLocation,
  inviteeName,
  role,
  inviteLink,
}: InviteEmailProps): string {
  return `
You're Invited to Join ${clinicName}!

Hi ${inviteeName},

You've been invited to join ${clinicName}${clinicLocation ? ` (${clinicLocation})` : ''} as a ${role}.

Click the link below to accept your invitation and set up your account:
${inviteLink}

Clinic Details:
- Clinic: ${clinicName}
${clinicLocation ? `- Location: ${clinicLocation}` : ''}
- Role: ${role}

If you didn't expect this invitation, you can safely ignore this email.

---
This invitation was sent by ${clinicName}
`;
}