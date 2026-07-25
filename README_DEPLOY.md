Deployment instructions for the minimal Flask API (free PaaS options)

Options:

- Render (free tiers may change):
  1. Create a new GitHub repo and push this project.
  2. Sign in to Render, create a new Web Service, connect your GitHub repo.
  3. Build command: `pip install -r requirements.txt`
  4. Start command: `gunicorn server:app`

- Fly.io (free tier available):
  1. Install `flyctl`.
  2. Run `fly launch` in project root and follow prompts (select region, app name).
  3. Deploy with `fly deploy`.

Notes:
- The app listens on `$PORT` or 5000. The frontend expects API endpoints at `/api/*`.
- If you deploy the static site separately (GitHub Pages / Netlify), update the frontend fetch URLs to point to the deployed API host.

Admin page:
- After running the server, open `http://<host>:<port>/admin.html` to access the admin interface (the server serves the `CloudGamingProject` static folder).
