# APStack — AP Exam Study App

AI-powered study playlist for AP Chem, Physics 1, APUSH, CSP, and Calc BC.
Uses **OpenRouter free models** (Llama 3.1 8B) for AI lessons and **Neon** (free Postgres) for cross-device progress sync.

---

## Deploy in ~5 minutes

### 1. Get your free API keys

**OpenRouter API key** (free, no credit card):
1. Go to https://openrouter.ai and sign up
2. Go to https://openrouter.ai/keys → Create Key
3. Copy it — starts with `sk-or-v1-...`
4. Free models need zero credits: `meta-llama/llama-3.1-8b-instruct:free`

**Neon database** (free Postgres, no credit card):
1. Go to https://neon.tech and sign up
2. Create a new project (any name, any region)
3. Copy the **Connection string** (starts with `postgresql://`)

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "initial"
git remote add origin https://github.com/YOUR_USERNAME/apstack.git
git push -u origin main
```

### 3. Deploy to Vercel

1. Go to https://vercel.com → sign in with GitHub
2. Add New Project → import your repo
3. Add Environment Variables:
   - `OPENROUTER_API_KEY` → your OpenRouter key
   - `DATABASE_URL` → your Neon connection string
   - `NEXT_PUBLIC_SITE_URL` → e.g. `https://apstack-xyz.vercel.app`
4. Deploy!

---

## Changing the AI model

Edit `FREE_MODEL` in `app/api/lesson/route.ts`:
- `meta-llama/llama-3.1-8b-instruct:free` (default)
- `google/gemma-2-9b-it:free`
- `mistralai/mistral-7b-instruct:free`

Browse all free models: https://openrouter.ai/models?q=free

---

## Cross-device sync

Your Device ID is shown at the bottom of the sidebar. To sync on a second device:

```js
localStorage.setItem('apstack_uid', 'user_YOURID')
location.reload()
```

---

## Local dev

```bash
npm install
cp .env.example .env.local
# fill in keys
npm run dev
```
