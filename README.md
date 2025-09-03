# Radiographic Interpretation Note Builder — Ready for Vercel

This project is pre-wired (Next.js App Router + Tailwind + minimal UI components) so you can deploy quickly.

## 1) Run locally
```bash
npm install
npm run dev
# open http://localhost:3000
```

## 2) Push to GitHub
```bash
git init
git add -A
git commit -m "Initial"
git branch -M main
git remote add origin https://github.com/<your-username>/rx-note.git
git push -u origin main
```

(Or use GitHub Desktop → Add Local Repository → Publish.)

## 3) Deploy on Vercel
1. Go to https://vercel.com → **Add New → Project**.
2. Select your `rx-note` repo.
3. Click **Deploy**. You’ll get a URL like `https://rx-note.vercel.app`.

### Optional: Custom domain
In your Vercel project → **Settings → Domains** → add `notes.yourclinic.com` and follow the DNS instructions.

## Notes
- Clipboard operations fall back to **download** or **scratchpad** if blocked by browser policy.
- Your inputs are saved in `localStorage` (per browser/device).
