# Ennustamine

Jalgpalli MM / EM ennustusmäng gruppidele. Next.js 16, Supabase, Vercel.

- **Live:** https://ennustus-roan.vercel.app
- **Repo:** https://github.com/Erki-J/Ennustus

## Kiirstart

```bash
git clone https://github.com/Erki-J/Ennustus.git
cd Ennustus
npm install
cp env.example .env.local   # täida Supabase ja muud võtmed
npm run dev
```

Ava http://localhost:3000

## Uus arvuti või teine Cursori kasutaja

Täielik juhend (`.env.local`, Supabase, Git, deploy):

→ **[docs/uue-arvuti-seadistus.md](docs/uue-arvuti-seadistus.md)**

## Struktuur

| Kaust | Sisu |
|-------|------|
| `src/app/` | Next.js lehed ja API |
| `src/components/` | UI komponendid |
| `src/lib/` | Supabase, i18n, äri loogika |
| `supabase/` | Skeem ja migratsioonid |
| `docs/` | Arendusjuhendid |

## Deploy

Push `main` harule → Vercel deploy automaatselt.

Keskkonna muutujad: Vercel Project Settings (vt `env.example`).
