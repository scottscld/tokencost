# TokenCost.ai

> Free AI token cost calculator. Compare pricing across GPT-4o, Claude, Gemini, DeepSeek, Grok and 15+ models.

## 📁 Project Structure

```
tokencost/
├── index.html          ← Main page
├── css/
│   └── style.css       ← All styles
├── js/
│   ├── models.js       ← AI model pricing data
│   └── app.js          ← All calculator logic
└── README.md
```

---

## 🚀 Deploy to GitHub Pages (Free Hosting)

### Step 1 — Create a GitHub Account
If you don't have one: go to https://github.com and sign up (free).

### Step 2 — Create a New Repository
1. Click the **+** icon in the top right → **New repository**
2. Name it: `tokencost` (or any name you like)
3. Set it to **Public**
4. Click **Create repository**

### Step 3 — Upload Your Files
1. On the repository page, click **uploading an existing file**
2. Drag and drop ALL files:
   - `index.html`
   - `css/style.css`  ← create the `css` folder by typing `css/style.css` in the name
   - `js/models.js`   ← create the `js` folder by typing `js/models.js`
   - `js/app.js`
3. Click **Commit changes**

### Step 4 — Enable GitHub Pages
1. Go to your repository → **Settings** tab
2. Click **Pages** in the left sidebar
3. Under "Source" → select **Deploy from a branch**
4. Branch: **main**, Folder: **/ (root)**
5. Click **Save**

Your site will be live at: `https://YOUR-USERNAME.github.io/tokencost/`

(Takes 1–3 minutes to go live. GitHub will show you the URL.)

### Step 5 — Custom Domain (Optional)
To use your own domain (e.g. tokencost.ai):
1. Buy a domain from Namecheap, GoDaddy, etc.
2. In GitHub Pages settings, enter your custom domain
3. In your domain's DNS settings, add a CNAME record pointing to `YOUR-USERNAME.github.io`

---

## 📊 Google Sheets Email Capture — Already Connected!

Your webhook URL is already configured in `js/app.js`. Every time a user enters their email, it gets logged automatically.

### What Gets Captured
- Email address
- Date & time (ISO format, UTC)
- Their timezone
- What use case they selected (chatbot, coding, etc.)
- How many requests/day they entered

### View Your Collected Emails
1. Go to: https://docs.google.com/spreadsheets
2. Open the spreadsheet connected to your Apps Script

### If You Need to Reconnect the Sheet
1. Go to: https://script.google.com
2. Find your project → **Deploy** → **Manage deployments**
3. Copy the Web App URL
4. In `js/app.js`, replace the `SHEETS_WEBHOOK` value

---

## 💰 Google AdSense Setup — Step by Step

### Step 1 — Apply for AdSense
1. Go to: https://adsense.google.com
2. Click **Get started**
3. Sign in with your Google account
4. Enter your website URL (your GitHub Pages URL)
5. Choose your country and accept the terms
6. Click **Start using AdSense**

### Step 2 — Add the AdSense Verification Code
Google will give you a snippet of code that looks like:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

1. Open `index.html`
2. Find this comment near the top (around line 18):
   ```html
   <!-- Google AdSense — STEP 1: Replace ca-pub-XXXXXXXXXXXXXXXX with your Publisher ID -->
   <!-- STEP 2: Uncomment the line below once your site is approved -->
   <!-- <script async src="..."></script> -->
   ```
3. Replace `ca-pub-XXXXXXXXXXXXXXXX` with your actual Publisher ID
4. Remove the `<!--` and `-->` comment tags to activate it

### Step 3 — Wait for Approval
- Google reviews your site (can take 1–14 days)
- You'll get an email when approved
- Your site must have real content and traffic to be approved

### Step 4 — Create Ad Units
Once approved:
1. In AdSense dashboard → **Ads** → **By ad unit**
2. Click **+ New ad unit** → Choose **Display ads**
3. Give it a name (e.g. "TokenCost Top Banner")
4. Copy the generated code snippet

### Step 5 — Place Ads on Your Page
In `index.html`, find the three ad slots:

```html
<div class="ad-slot" id="ad-slot-1">
  <!-- Replace this comment with your AdSense ad unit code -->
  <span>Advertisement</span>
</div>
```

Replace the comment + `<span>` with your actual ad unit code:
```html
<div class="ad-slot" id="ad-slot-1">
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
       data-ad-slot="YOUR-AD-SLOT-ID"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
</div>
```

There are 3 ad slots total:
- `ad-slot-1` — Below the token examples section
- `ad-slot-2` — Inside the results section (high visibility)
- `ad-slot-3` — Between token counter and tips

### AdSense Tips for Better Revenue
- The slot inside results (`ad-slot-2`) will get the most views — put your best ad there
- Enable **Auto ads** in AdSense — it finds additional placements automatically
- More traffic = more revenue. Share your tool on Reddit (r/webdev, r/ChatGPT), Product Hunt, Twitter/X

---

## 🔧 Updating Prices

AI prices change frequently. To update them:
1. Open `js/models.js`
2. Find the model you want to update
3. Change the `input` and `output` values (they're per 1 million tokens in USD)
4. Save and re-upload to GitHub

---

## 📈 SEO Tips
- Change the `<link rel="canonical">` in `index.html` to your actual URL
- Submit your sitemap to Google Search Console: https://search.google.com/search-console
- Share on Reddit, Hacker News, and Product Hunt to build backlinks
