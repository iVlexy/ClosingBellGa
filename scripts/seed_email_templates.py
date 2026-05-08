#!/usr/bin/env python3
"""Seed the EmailTemplates table with a full library of professional real estate email templates."""
import subprocess, sys, uuid
from datetime import datetime

def psql(sql):
    r = subprocess.run(
        ['kubectl', 'exec', '-n', 'closingbell', 'postgres-0', '--',
         'psql', '-U', 'cbuser', '-d', 'closingbell', '-c', sql],
        capture_output=True, text=True
    )
    if r.returncode != 0:
        print('ERROR:', r.stderr.strip())
        sys.exit(1)
    return r.stdout.strip()

# Check existing count
out = psql('SELECT COUNT(*) FROM "EmailTemplates" WHERE "IsDeleted" = false;')
print(out)

# Templates: (name, stage, subject, body)
TEMPLATES = [

    # ── NEW INQUIRY ──────────────────────────────────────────────────────────
    (
        "Initial Buyer Inquiry Response",
        "New Inquiry",
        "Thanks for reaching out, [ClientName]!",
        """Hi [ClientName],

Thank you for reaching out — I'm thrilled to help you on your home search!

I'd love to learn more about what you're looking for and get you set up with a personalized property search. I'll be in touch shortly to schedule a quick call so we can talk through your goals, timeline, and must-haves.

In the meantime, feel free to browse listings on your client portal and mark anything that catches your eye.

Looking forward to working with you!

Best,
[AgentName]
Closing Bell GA"""
    ),
    (
        "Initial Seller Inquiry Response",
        "New Inquiry",
        "Let's talk about selling your home, [ClientName]",
        """Hi [ClientName],

Thank you for reaching out about selling your home — I'd love to help you get the best result possible!

I'll be in touch shortly to schedule a complimentary consultation where we can discuss your timeline, your home's current market value, and a customized marketing strategy to get you top dollar.

Please don't hesitate to reach out with any questions in the meantime.

Talk soon,
[AgentName]
Closing Bell GA"""
    ),
    (
        "Open House Follow-Up",
        "New Inquiry",
        "Great meeting you at [Address]!",
        """Hi [ClientName],

It was wonderful meeting you at the open house at [Address] on [Date]!

I hope you enjoyed the tour. I'd love to answer any questions you have about the property or the neighborhood, and I'm happy to set up a private showing if you'd like a second look.

Please feel free to reach out anytime — I'm here to help make your home search as smooth as possible.

Best,
[AgentName]
Closing Bell GA"""
    ),

    # ── POST-SHOWING ─────────────────────────────────────────────────────────
    (
        "Post-Showing Thank You",
        "Post-Showing",
        "Thanks for touring [Address] with me today!",
        """Hi [ClientName],

Thank you for taking the time to tour [Address] today! It was great walking through the property with you.

I'd love to hear your honest thoughts — what did you love? What gave you pause? Your feedback helps me narrow down the search and find you the perfect fit.

A few things to consider:
• How did the layout feel for your day-to-day life?
• Did the neighborhood feel right?
• Is this a place you could see yourself calling home?

Let me know your thoughts and we'll plan our next steps from there!

Best,
[AgentName]
Closing Bell GA"""
    ),
    (
        "Post-Showing Follow-Up (No Response)",
        "Post-Showing",
        "Checking in — thoughts on [Address]?",
        """Hi [ClientName],

I just wanted to check in after our showing at [Address] on [Date]. I know it can take a little time to process everything, and that's completely normal!

If you have any questions about the property, the neighborhood, or comparable homes in the area, I'm happy to chat. And if you'd like to schedule another look or move forward, just say the word.

No pressure at all — just here when you're ready!

Best,
[AgentName]
Closing Bell GA"""
    ),

    # ── PRE-OFFER ────────────────────────────────────────────────────────────
    (
        "Ready to Make an Offer?",
        "Pre-Offer",
        "[Address] — Ready to write an offer?",
        """Hi [ClientName],

Based on our conversations, I wanted to reach out about [Address]. This property checks a lot of your boxes, and I want to make sure we don't miss our window if you're interested in moving forward.

Here's a quick snapshot of the market situation:
• Days on market: varies — I'll pull the latest for you
• Recent comparable sales in the area support a strong offer strategy
• I'll have a full Comparative Market Analysis ready for you within 24 hours

Whenever you're ready to talk strategy, I'm here. We can put together a competitive offer that protects your interests and positions you to win.

Let me know!

Best,
[AgentName]
Closing Bell GA"""
    ),
    (
        "Comparative Market Analysis Ready",
        "Pre-Offer",
        "Your CMA for [Address] is ready, [ClientName]",
        """Hi [ClientName],

I've completed the Comparative Market Analysis for [Address] and I'm ready to walk you through it.

The data will help us determine a smart offer price — one that's competitive without leaving money on the table. I'll cover:

✓ Recent comparable sales in the area
✓ Active listings you'd be competing against
✓ My recommended offer range and strategy
✓ Key contingencies to protect you

Let's schedule a quick call or meeting to review everything together. What time works best for you?

Best,
[AgentName]
Closing Bell GA"""
    ),

    # ── POST-OFFER ───────────────────────────────────────────────────────────
    (
        "Offer Submitted Confirmation",
        "Post-Offer",
        "Your offer on [Address] has been submitted!",
        """Hi [ClientName],

Great news — your offer on [Address] has been officially submitted as of [Date]!

Here's what happens next:
1. The seller's agent will present your offer to their client
2. The seller can accept, counter, or reject within the timeframe specified
3. I'll contact you the moment I hear back — typically within 24–48 hours
4. If we receive a counteroffer, we'll review it together and strategize

I know the waiting can be nerve-wracking, but you've put forward a strong offer. I'll keep you updated every step of the way.

Fingers crossed!

Best,
[AgentName]
Closing Bell GA"""
    ),
    (
        "Offer Accepted — Congratulations!",
        "Post-Offer",
        "🎉 Your offer on [Address] was accepted, [ClientName]!",
        """Hi [ClientName],

Congratulations — your offer on [Address] has been accepted! This is a huge milestone and you should be very excited.

Here's what's coming up next:
1. Earnest money deposit due within the timeframe in the contract
2. Home inspection — I'll help you schedule this right away
3. Appraisal — ordered by your lender
4. Final walkthrough before closing
5. Closing day — keys in hand!

I'll be guiding you through every step. Please don't hesitate to reach out with any questions — big or small. You're in great hands.

Let's get this done!

Best,
[AgentName]
Closing Bell GA"""
    ),

    # ── UNDER CONTRACT ───────────────────────────────────────────────────────
    (
        "Under Contract — Inspection Reminder",
        "Under Contract",
        "Action needed: Schedule your home inspection for [Address]",
        """Hi [ClientName],

Now that we're under contract on [Address], one of your most important next steps is the home inspection. This is your opportunity to learn everything about the condition of the property before closing.

What you need to do:
• Schedule your inspection ASAP — we have a limited window per the contract
• I can recommend several trusted, licensed inspectors if you need names
• Plan to attend the inspection in person if possible — it's very educational
• We'll review the inspection report together and decide if we need to request any repairs

Please confirm your inspection is scheduled by [Date] so we stay on track.

Let me know if you need anything!

Best,
[AgentName]
Closing Bell GA"""
    ),
    (
        "Under Contract — Weekly Check-In",
        "Under Contract",
        "Quick update on [Address], [ClientName]",
        """Hi [ClientName],

Just a quick check-in on your transaction for [Address]. Here's where things stand:

We're making steady progress toward closing. I'm monitoring every deadline and coordinating with the lender, title company, and the listing agent to keep things on track.

If you haven't already, please make sure:
□ All lender document requests are handled promptly
□ You avoid any large purchases or credit changes before closing
□ Your homeowner's insurance is in place before closing day

I'll be in touch as soon as there are any updates. Don't hesitate to reach out anytime!

Best,
[AgentName]
Closing Bell GA"""
    ),

    # ── CLEAR TO CLOSE ───────────────────────────────────────────────────────
    (
        "Clear to Close — Closing Day Prep",
        "Clear to Close",
        "You're Clear to Close on [Address]! Here's what to expect",
        """Hi [ClientName],

Incredible news — your lender has issued Clear to Close for [Address]! This means your loan is fully approved and we're on the final stretch.

Here's your closing day checklist:
□ Final walkthrough scheduled (I'll confirm the time with you)
□ Bring a valid government-issued photo ID
□ Bring your certified check or confirm wire transfer for closing costs
□ Review the Closing Disclosure — it will be sent by your lender
□ Arrange to take the day off if possible — closings can take a few hours

Closing is scheduled for [Date]. I'll be right there with you every step of the way.

You're almost a homeowner — let's finish strong!

Best,
[AgentName]
Closing Bell GA"""
    ),

    # ── CLOSING FOLLOW-UP ────────────────────────────────────────────────────
    (
        "Closing Day Congratulations",
        "Closing Follow-Up",
        "Congratulations on your new home, [ClientName]! 🏡",
        """Hi [ClientName],

Today is the day — you are officially a homeowner! Congratulations on closing on [Address]!

It has been such a pleasure working with you through this journey. Watching you find and purchase a home you love is exactly why I do what I do.

A few reminders now that you have the keys:
• Update your address with the post office, bank, and DMV
• Set up utilities if not already done
• Change the locks — it's always a smart first step in a new home
• Keep all your closing documents in a safe place

Please don't hesitate to reach out for anything — whether it's a contractor recommendation or a question about homeownership. I'm always here for you.

Wishing you many years of happiness in your new home!

Warmly,
[AgentName]
Closing Bell GA"""
    ),
    (
        "30-Day Post-Closing Check-In",
        "Closing Follow-Up",
        "Checking in — how's life at [Address]?",
        """Hi [ClientName],

It's hard to believe it's already been about a month since you closed on [Address]! I hope you're settling in beautifully and the new home is everything you hoped for.

I just wanted to check in and see:
• How is everything going?
• Is there anything I can help with — contractor recommendations, neighborhood tips, or anything else?
• If you have a moment, I'd be so grateful if you'd share a quick review of our experience working together

Your referrals mean the world to me. If you know anyone who is looking to buy or sell, I'd be honored to help them the way I helped you.

Wishing you all the best in your new home!

Warmly,
[AgentName]
Closing Bell GA"""
    ),

    # ── GENERAL ──────────────────────────────────────────────────────────────
    (
        "Monthly Market Update",
        "General",
        "[Date] — Atlanta Real Estate Market Update",
        """Hi [ClientName],

I hope you're doing well! I wanted to share a quick snapshot of the Atlanta real estate market this month.

Key highlights:
• Inventory levels are [rising/stable/low] compared to last month
• Median home prices in your target area are around [price range]
• Average days on market is approximately [X days]
• Interest rates remain [favorable/elevated] — a good time to [buy/hold]

What this means for you: [Customize with relevant insight for the client's situation]

If you have any questions about how the current market affects your plans, I'd love to chat. Feel free to reply to this email or give me a call anytime.

Best,
[AgentName]
Closing Bell GA"""
    ),
    (
        "Happy Client Anniversary",
        "General",
        "Happy Home Anniversary, [ClientName]! 🎉",
        """Hi [ClientName],

One year ago today, you closed on [Address] — and I wanted to take a moment to say congratulations on your home anniversary!

I hope the past year has been wonderful and that your home has brought you joy, comfort, and great memories.

As a homeowner, here are a few annual reminders:
• Review your homeowner's insurance policy to make sure coverage is still adequate
• Check smoke and CO detector batteries
• Schedule HVAC maintenance if you haven't this season
• Your home's value may have changed — reach out if you'd ever like a free market valuation

It's been a genuine pleasure serving you. As always, if you or anyone you know is thinking about buying or selling, I'm just a call or text away.

Warmly,
[AgentName]
Closing Bell GA"""
    ),
]

# Clear existing non-deleted templates first? No — just skip if name exists.
existing_raw = psql('SELECT "Name" FROM "EmailTemplates" WHERE "IsDeleted" = false;')
existing_names = set(line.strip() for line in existing_raw.splitlines() if line.strip() and not line.strip().startswith('-') and not line.strip().startswith('Name') and not line.strip().startswith('('))

print(f"Existing templates: {len(existing_names)}")

inserted = 0
for name, stage, subject, body in TEMPLATES:
    if name in existing_names:
        print(f"  SKIP (exists): {name}")
        continue
    tid = str(uuid.uuid4())
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    # Escape single quotes in all text fields
    def esc(s): return s.replace("'", "''")
    sql = (
        f"INSERT INTO \"EmailTemplates\" "
        f"(\"Id\", \"Name\", \"Stage\", \"Subject\", \"Body\", \"IsActive\", \"IsDeleted\", \"CreatedAt\") "
        f"VALUES ('{tid}', '{esc(name)}', '{esc(stage)}', '{esc(subject)}', '{esc(body)}', true, false, '{now}');"
    )
    psql(sql)
    print(f"  ✓ {stage} — {name}")
    inserted += 1

print(f"\nDone. {inserted} templates inserted.")
