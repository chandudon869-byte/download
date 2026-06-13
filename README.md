# NEPSE AI IPO Template

## Install
npm install express axios cheerio pg dotenv node-cron

## Run
node server.js

## Render
- Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in Render.
- Use `npm install` as the build command and `npm start` as the start command.
- The included `render.yaml` can be used as a blueprint for the web service.

## API
- `GET /api/corporate-actions` returns bonus share, dividend, and right share events from `stock_events`.

## Database
CREATE DATABASE nepse;

CREATE TABLE upcoming_ipos(
id SERIAL PRIMARY KEY,
company_name TEXT,
symbol TEXT,
status TEXT
);
