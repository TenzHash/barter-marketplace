// supabase/functions/send-alert-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';

interface NotificationPayload {
  record: {
    user_id: string;
    type: string;
    title: string;
    message: string;
  };
}

serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json();
    const { user_id, title, message } = payload.record;

    // Fetch user student email via Supabase Admin Auth API
    const authHeader = req.headers.get('Authorization')!;
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user_id}`, {
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    const userData = await userRes.json();
    const userEmail = userData.email;

    if (!userEmail) {
      return new Response(JSON.stringify({ error: 'User email not found' }), { status: 400 });
    }

    // Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Barter.campus <alerts@bartercampus.edu>',
        to: [userEmail],
        subject: `[Campus Alert] ${title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background: #fafafa;">
            <h2 style="color: #18181b; font-size: 18px; margin-bottom: 8px;">${title}</h2>
            <p style="color: #52525b; font-size: 14px; line-height: 1.5;">${message}</p>
            <div style="margin-top: 20px;">
              <a href="https://bartercampus.vercel.app" style="display: inline-block; padding: 10px 16px; background: #18181b; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 13px; font-weight: 600;">Open Barter.campus</a>
            </div>
            <p style="font-size: 11px; color: #a1a1aa; margin-top: 24px;">You received this automated notification for your university student account.</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});