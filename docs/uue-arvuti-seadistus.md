# Uue arvuti seadistus

Juhend Ennustamine projekti arendamise jätkamiseks uues arvutis või teise Cursori kasutajaga.

Arendus **ei ole seotud Cursori kontoga**. Kood, andmed ja live sait elavad GitHubis, Supabase'is ja Vercelis.

## Kiire ülevaade

| Mis | Kus |
|-----|-----|
| Lähtekood | [GitHub — Erki-J/Ennustus](https://github.com/Erki-J/Ennustus) |
| Live sait | https://ennustus-roan.vercel.app |
| Andmebaas | Supabase (pilveteenus) |
| Deploy | Vercel (automaatne `git push` peale) |
| Lokaalsed saladused | `.env.local` (ainult sinu arvutis) |

---

## 1. Eeldused

Paigalda uues arvutis:

- [Node.js](https://nodejs.org/) 20+ (soovitatav LTS)
- [Git](https://git-scm.com/)
- [Cursor](https://cursor.com/) (või VS Code)

---

## 2. Klooni projekt

```bash
git clone https://github.com/Erki-J/Ennustus.git
cd Ennustus
npm install
```

---

## 3. Keskkonna muutujad (`.env.local`)

Loo projekti juurkausta fail `.env.local`. **Seda faili ei commitita GitHubi.**

Vana arvutist kopeeri olemasolev `.env.local` turvaliselt (paroolihoidja, krüpteeritud ketas jne).

Või loo fail `env.example` põhjal:

```bash
cp env.example .env.local
```

Täida väärtused:

| Muutuja | Kirjeldus | Kust leida |
|---------|-----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase projekti URL | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publishable / anon key | Supabase → Project Settings → API Keys |
| `NEXT_PUBLIC_SITE_URL` | Tootmis-URL kutsete jaoks | `https://ennustus-roan.vercel.app` |
| `CRON_SECRET` | Cron endpointi salajane võti | Vercel → Project → Settings → Environment Variables |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (ainult server) | Supabase → API Keys (Secret) |
| `FOOTBALL_DATA_API_KEY` | Valikuline — automaatne skoor | football-data.org |

---

## 4. Käivita lokaalselt

```bash
npm run dev
```

Ava brauseris: http://localhost:3000

Logi sisse sama e-mailiga, mida Supabase Auth kasutab. Grupid ja ennustused tulevad samast pilve-andmebaasist — live ja lokal jagavad andmeid.

---

## 5. Cursor uues arvutis

1. Ava Cursor → **File → Open Folder** → vali kloonitud `Ennustus` kaust.
2. Cursori kasutajakonto võib olla teine — projektile see ei mõju.
3. **Cursor Rules / Skills / vestlused** on kontoga seotud; neid ei kloonita automaatselt. Kopeeri käsitsi, kui vaja.
4. Soovitatav: lisa projekti `.cursor/rules` failid reposse, kui tahad, et AI juhised liiguksid arvutite vahel kaasa.

---

## 6. Supabase migratsioonid

Kui seadistad täiesti uue Supabase projekti (harv juhtum), käivita SQL Editoris failid **järjekorras**:

1. `supabase/schema.sql`
2. `supabase/migration-002-groups.sql` … kuni `migration-016-profile-locale.sql`

Olemasoleva projekti puhul (sama Supabase nagu live) **ei pea migratsioone uuesti jooksutama** — andmebaas on juba olemas.

Uued migratsioonid lisatakse repossse failidena; live DB uuendatakse käsitsi Supabase SQL Editoris, kui uus funktsioon seda nõuab.

---

## 7. Töövoog

```bash
# Enne tööd — too viimane kood
git pull

# Arenda (Cursor + npm run dev)
npm run dev

# Kui valmis
git add .
git commit -m "Kirjeldus muudatusest"
git push
```

`git push` `main` harule → Vercel deploy'ib automaatselt → live uueneb mõne minuti pärast.

---

## 8. Konto ja ligipääs

| Teenus | Mida vaja |
|--------|-----------|
| GitHub | Ligipääs repole `Erki-J/Ennustus` |
| Supabase | Sama projekt (Dashboard invite või olemasolev konto) |
| Vercel | Deploy vaatamiseks; env muutujad |
| Ennustus admin | Supabase `profiles.role = 'admin'` või grupi admin |

---

## 9. Levinud probleemid

**`npm run dev` annab Supabase vea**  
→ Kontrolli `.env.local` URL ja anon key.

**Lokaalselt tühi / puuduvad grupid**  
→ Logi õige kasutajaga; andmed on Supabase'is, mitte arvutis.

**Live töötab, lokal ei**  
→ `.env.local` puudub või on vale.

**Migratsioon puudub (nt `locale` veerg)**  
→ Käivita vastav `supabase/migration-XXX-....sql` Supabase SQL Editoris.

**Cron ei tööta lokaalselt**  
→ Normaalne; cron jookseb Vercelis. Lokaalselt testid `npm run dev` UI-d.

---

## 10. Kasulikud käsud

```bash
npm run dev      # arendusserver
npm run build    # tootmis-build enne push'i (soovitatav)
npm run lint     # ESLint
```

---

## Kontakt / viited

- Repo: https://github.com/Erki-J/Ennustus
- Live: https://ennustus-roan.vercel.app
