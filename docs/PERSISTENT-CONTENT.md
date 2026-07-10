# Keep your CMS content permanent on Render

## Why edits disappear

Your live site currently reports:

```json
{ "storage": "sqlite" }
```

Render **deletes the disk** on every redeploy (every `git push`).  
SQLite lives on that disk → your Save All content is wiped → site resets to default `content.json`.

This is **not** caused by editing in admin. It is caused by missing PostgreSQL.

## Fix (one-time, ~5 minutes)

### 1. Create Postgres on Render
1. Open https://dashboard.render.com/
2. **New +** → **PostgreSQL**
3. Name: `inframindtech-db`
4. Plan: **Free**
5. Create

### 2. Link it to your web service
1. Open your **inframindtech** web service
2. **Environment** → **Add Environment Variable**
3. Key: `DATABASE_URL`
4. Value: copy **Internal Database URL** from the Postgres page
5. Save (service redeploys)

### 3. Verify
Open: https://inframindtech.onrender.com/api/health

You must see:

```json
{ "storage": "postgres", "persistent": true }
```

### 4. Re-enter / restore content once
After Postgres is linked, open admin and **Save All** again (or import a backup).  
From then on, code pushes will **not** erase your content.

## Backup before any deploy
In admin sidebar: **Download Backup**  
Keep the JSON file safe. You can paste it back later if needed.

## Azure VPS
On Azure, SQLite on the VM disk is fine (disk is permanent).  
Postgres is still recommended for production.
