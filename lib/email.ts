const RESEND_KEY = process.env.RESEND_API_KEY
const FROM       = 'WizeMory <hello@wizemory.com>'
const APP_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wizemory.com'

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_KEY || RESEND_KEY === 're_placeholder') {
    console.log(`[email] skipped (no key) → "${subject}" to ${to}`)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) console.error('[email] send failed:', await res.text())
}

function base(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f7f6f2;margin:0;padding:32px 16px}
.card{max-width:540px;margin:0 auto;background:white;border-radius:16px;padding:40px;border:1px solid #eeecea}
.logo{font-size:22px;font-weight:600;margin-bottom:32px}.logo span{color:#7340f5}
h1{font-size:26px;font-weight:500;margin:0 0 16px;color:#1a1714;line-height:1.3}
p{color:#5a5449;line-height:1.7;margin:0 0 16px;font-size:15px}
.btn{display:inline-block;padding:14px 28px;background:#1a1714;color:white!important;border-radius:10px;text-decoration:none;font-weight:500;font-size:14px;margin:8px 0}
.btn-v{background:#7340f5}.box{background:#f7f6f2;border-radius:12px;padding:20px 24px;margin:20px 0}
.box-v{background:#f3f0ff;border:1px solid #e4dcff}
.row{padding:8px 0;border-bottom:1px solid #eeecea;font-size:14px;color:#47413a}.row:last-child{border:none}
.row span{color:#7340f5;margin-right:8px}
.footer{margin-top:32px;padding-top:20px;border-top:1px solid #eeecea;font-size:12px;color:#928c82}
</style></head><body><div class="card"><div class="logo">Wize<span>Mory</span></div>${content}
<div class="footer"><p>WizeMory · <a href="${APP_URL}/dashboard/settings" style="color:#928c82">Settings</a> · <a href="${APP_URL}/unsubscribe" style="color:#928c82">Unsubscribe</a></p></div>
</div></body></html>`
}

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  await send(email, 'Your AI second brain is ready ✦', base(`
    <h1>Welcome${name ? `, ${name.split(' ')[0]}` : ''}!</h1>
    <p>You've set up the last note-taking app you'll ever need. Get started in 3 steps:</p>
    <div class="box">
      <div class="row"><span>1.</span>Save your first article — paste any URL</div>
      <div class="row"><span>2.</span>Ask the AI — "What do I know about [topic]?"</div>
      <div class="row"><span>3.</span>Install the browser extension for one-click saving</div>
    </div>
    <a href="${APP_URL}/dashboard" class="btn">Open your knowledge base →</a>
    <p style="margin-top:20px;font-size:13px;color:#928c82">Free: 50 items, 10 AI queries/month. <a href="${APP_URL}/pricing" style="color:#7340f5">Upgrade to Pro</a> for unlimited.</p>
  `))
}

export async function sendWeeklyDigestEmail(email: string, name: string, content: string, itemCount: number, streak: number): Promise<void> {
  const week = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date())
  await send(email, `Your WizeMory digest — ${week}`, base(`
    <h1>Your week in knowledge</h1>
    <p style="font-size:13px;color:#928c82;margin-bottom:20px">${week} · ${itemCount} items saved${streak > 1 ? ` · 🔥 ${streak}-day streak` : ''}</p>
    <div class="box">${content.replace(/\n/g, '<br>')}</div>
    <a href="${APP_URL}/dashboard" class="btn">Open your knowledge base →</a>
  `))
}

export async function sendUpgradeConfirmationEmail(email: string, name: string, plan: string): Promise<void> {
  await send(email, `You're now on WizeMory ${plan} 🎉`, base(`
    <h1>Welcome to ${plan}!</h1>
    <p>Your knowledge base just got a serious upgrade. Here's what's unlocked:</p>
    <div class="box box-v">
      <div class="row"><span>✦</span>Unlimited items saved</div>
      <div class="row"><span>✦</span>Unlimited AI questions</div>
      <div class="row"><span>✦</span>Weekly digest emails</div>
      <div class="row"><span>✦</span>YouTube &amp; video summarisation</div>
      <div class="row"><span>✦</span>Spaced repetition review queue</div>
      <div class="row"><span>✦</span>AI connection discovery</div>
    </div>
    <a href="${APP_URL}/dashboard" class="btn btn-v">Open WizeMory →</a>
  `))
}

export async function sendReviewReminderEmail(email: string, name: string, dueCount: number): Promise<void> {
  await send(email, `${dueCount} item${dueCount !== 1 ? 's' : ''} ready to review on WizeMory`, base(`
    <h1>${dueCount} item${dueCount !== 1 ? 's' : ''} ready for review</h1>
    <p>These items are due for a quick refresh today. Takes 3–5 minutes and dramatically improves retention.</p>
    <a href="${APP_URL}/dashboard/reminders" class="btn">Start review session →</a>
  `))
}

export async function sendReferralSuccessEmail(email: string, name: string, count: number): Promise<void> {
  const earned = count >= 3
  await send(email, earned ? 'You earned a free month of Pro! 🎁' : `${count}/3 friends referred`, base(`
    <h1>${earned ? '🎁 Free month earned!' : `Friend ${count}/3 joined!`}</h1>
    ${earned
      ? `<p>You've referred 3 friends. Your next month of Pro is on us — applied automatically.</p><a href="${APP_URL}/dashboard" class="btn btn-v">Open WizeMory →</a>`
      : `<p>${3 - count} more referral${3 - count !== 1 ? 's' : ''} to earn a free month of Pro.</p><a href="${APP_URL}/dashboard/referral" class="btn">Get your link →</a>`
    }
  `))
}

export async function sendStreakReminderEmail(email: string, name: string, streak: number): Promise<void> {
  await send(email, `Your ${streak}-day streak ends tonight 🔥`, base(`
    <h1>Don't break your ${streak}-day streak!</h1>
    <p>Save one article or write one note before midnight to keep your streak alive.</p>
    <a href="${APP_URL}/dashboard/add" class="btn">Save something now →</a>
  `))
}
