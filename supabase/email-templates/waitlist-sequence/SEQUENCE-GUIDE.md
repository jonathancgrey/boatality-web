# Boatality Studio — Waitlist Email Sequence

A 4-email drumbeat for users who sign up to the waitlist but haven't been approved yet.
Designed to keep them warm, build trust, and reduce churn before launch.

---

## The Sequence at a Glance

| # | File | Send Timing | Subject Line | Goal |
|---|------|-------------|--------------|------|
| 1 | `01-confirmation.html` | Immediately on signup | "You're on the Boatality waitlist ⚓" | Confirm, set expectations, feel human |
| 2 | `02-the-story.html` | Day 4 | "Why we're building Boatality" | Build trust, share the founder's vision |
| 3 | `03-inside-the-studio.html` | Day 10 | "A look inside Boatality Studio" | Show the product, ask an engagement question |
| 4 | `04-holding-your-spot.html` | Day 21 | "Your spot is still holding" | Re-engage, show progress, invite replies |

---

## How to Set This Up in Resend

### Option A: Resend Broadcasts (simplest for now)
Good for sending to your whole waitlist at once, or in batches.

1. Go to **Resend → Broadcasts → New Broadcast**
2. Paste the HTML from the relevant file
3. Set the subject line (see table above)
4. Set sender to `jonathan@boatality.com`
5. Select your audience (the waitlist contact list)
6. Schedule or send immediately

Use this if you're just starting out and the list is small enough to manage manually.

---

### Option B: Resend Automated Sequences (recommended long-term)
Triggered automatically when someone joins the waitlist.

**How it works:**
- When a user submits the waitlist form, your `/api/waitlist` route inserts a row into `beta_signups`
- At the same time, call the Resend API to add them to a contact list and start the sequence

**Add to `/api/waitlist/route.ts` after the Supabase insert:**

```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Add to Resend contact list (triggers sequence if set up)
await resend.contacts.create({
  email: email,
  audienceId: process.env.RESEND_WAITLIST_AUDIENCE_ID,
});
```

**Then in Resend:**
1. Create an Audience called "Waitlist"
2. Set up a Broadcast sequence triggered by contact creation
3. Add each email with the appropriate delay (immediate, +4 days, +10 days, +21 days)

---

## Email-by-Email Notes

### Email 1 — Confirmation (immediate)
- Sent the moment someone submits the waitlist form
- Tone: warm, personal, sets realistic expectations
- Key message: "We review every application personally"
- **No CTA button** — just human reassurance

### Email 2 — The Story (Day 4)
- Pure brand-building, no hard sell
- Jonathan talks about *why* Boatality exists
- Includes a pull quote about the boating community
- **No CTA** — just a founder letter
- Edit the copy to make it feel authentic to your voice

### Email 3 — Inside the Studio (Day 10)
- Shows the actual product features
- Ends with a question: "What's the first thing you'd publish?"
- This reply-baiting is intentional — replies signal strong interest and help you prioritise
- **Engagement goal:** get them to reply before you approve them

### Email 4 — Holding Your Spot (Day 21)
- Re-engagement email for people who have been waiting a while
- Shows a "progress tracker" so they know things are actually happening
- Invites them to reply and jump the queue
- Has a soft CTA to boatality.com
- If someone has been approved by now, they won't receive this — make sure to suppress approved users from the audience

---

## Suppression — Important

Once a user is **approved and sent an invite**, they should be removed from the waitlist
sequence so they don't keep getting waitlist emails.

In your `/api/admin/invite/route.ts`, after a successful invite send, add:

```ts
// Remove from waitlist audience in Resend
await resend.contacts.remove({
  email: email,
  audienceId: process.env.RESEND_WAITLIST_AUDIENCE_ID,
});
```

---

## Subject Line A/B Ideas (for later)

| Email | Alternative Subject |
|-------|-------------------|
| 1 | "Application received — here's what's next" |
| 2 | "The honest reason we're building this" |
| 3 | "Videos. Podcasts. Articles. All in one place." |
| 4 | "Still on the list? Yes. Here's the update." |

---

## What Happens After Email 4?

Options:
1. **Do nothing** — let the sequence end. They're still in the audience for manual broadcasts.
2. **Send a 5th email at Day 45** — a final "are you still interested?" with an unsubscribe nudge (keeps your list clean).
3. **Open the gates** — if you're ready to launch wider, send a broadcast to the whole waitlist at once.

The 5th email (if needed) should be something like:
> "Hey — it's been a while. Still interested in Boatality Studio? Just reply 'yes' and I'll make sure you're at the top of the next batch."

Simple, honest, and filters out dead contacts automatically.
