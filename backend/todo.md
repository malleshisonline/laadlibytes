this is the file for myself only to keep the things for reminder.

# TODO — Deployment & Hosting (handle later, not now)

Keep building in development. Come back to this file only when the backend + frontend are functionally complete and you're ready to go live.

## Before pushing to GitHub
- [ ] Confirm `.env` is in `.gitignore` (never commit real secrets/URI/passwords)
- [ ] Add a `.env.example` with placeholder values so collaborators (or future you) know what variables are needed
- [ ] Double check no hardcoded passwords, JWT secrets, or API keys anywhere in committed code
- [ ] Remove/rotate the MongoDB password that was shared in chat during setup (Atlas → Database Access → Edit Password)

## Cloudinary (when you get to image uploads)
- [ ] Create Cloudinary account, get `CLOUD_NAME`, `API_KEY`, `API_SECRET`
- [ ] Add these to `.env` (never hardcode in code)
- [ ] Install `cloudinary` + `multer` (or `multer-storage-cloudinary`) packages
- [ ] Decide: upload directly from frontend to Cloudinary, or route through your backend — backend route is usually safer (keeps API secret hidden)

## MongoDB Atlas — before going live
- [ ] Remove the `0.0.0.0/0` (allow from anywhere) IP whitelist entry used during dev
- [ ] Add your hosting platform's IP (or keep `0.0.0.0/0` only if the platform uses dynamic IPs — check their docs)
- [ ] Regenerate/rotate the database user password used during local dev
- [ ] Enable Atlas backups (if handling real customer data)

## Backend hosting
- [ ] Pick a platform: Render / Railway / Fly.io / DigitalOcean App Platform (free tiers available)
- [ ] Set all `.env` variables in the platform's dashboard (not committed to git)
- [ ] Confirm `npm start` (not `npm run dev`) is the start command used in production
- [ ] Set `NODE_ENV=production`
- [ ] Test the deployed health check route (`/`) once live

## Frontend hosting
- [ ] Pick a platform: Vercel / Netlify (both free, simple for React)
- [ ] Point frontend's API base URL to the deployed backend URL (not `localhost`)
- [ ] Set any frontend env variables (e.g. `VITE_API_URL`) in the platform's dashboard

## CORS — update once URLs are real
- [ ] Update `CORS_ORIGIN` in backend `.env` from `http://localhost:5173` to the real deployed frontend URL
- [ ] If using multiple origins (e.g. staging + production), confirm `CORS_ORIGIN` comma-separated parsing in `env.js` handles it

## Domain (optional, do this last — or skip entirely)
- [ ] Buy domain (Namecheap, GoDaddy, Google Domains, etc.) — or just use the free subdomain your host provides (e.g. `laadlibytes.onrender.com`)
- [ ] Point domain DNS to hosting platform (they provide exact instructions)
- [ ] Set up SSL/HTTPS (most platforms do this automatically once domain is connected)
- [ ] Update `CORS_ORIGIN` again to match the final custom domain

## Post-deployment sanity checks
- [ ] Register a real test user through the deployed API
- [ ] Confirm MongoDB Atlas Data Explorer shows the new data
- [ ] Test image upload end-to-end (Cloudinary)
- [ ] Test from an actual phone/different network (not just your dev machine) to catch CORS/whitelist issues early

- Write scripts/syncIndexes.js and run it after first deploy,
  before the site goes public (autoIndex is off in production)