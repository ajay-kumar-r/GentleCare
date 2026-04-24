# GentleCare Deployment Guide

## 1. Deploy Backend and Web on Render

1. Push this repository to GitHub.
2. In Render, create a Blueprint deployment from repo root.
3. Render reads [render.yaml](render.yaml) and creates:
- `gentlecare-api` (Python web service)
- `gentlecare-web` (static web app from Expo export)

## 2. Configure Render Environment Variables

Set these on `gentlecare-api`:
- `SECRET_KEY`
- `JWT_SECRET_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_CREDENTIALS_JSON` (full service-account JSON as one line)

Set this on `gentlecare-web`:
- `EXPO_PUBLIC_API_BASE_URL=https://<your-api-domain>.onrender.com`

## 3. Verify API

After deploy, verify:
- `GET /health`
- `GET /capabilities`

Expected when fully configured:
- `ready: true`
- `ai.chatbot: true`
- `ai.speech_to_text: true`
- `ai.text_to_speech: true`

## 4. Use with Expo Anytime (Mobile)

1. In [Client/.env](Client/.env), set:
- `EXPO_PUBLIC_API_BASE_URL=https://<your-api-domain>.onrender.com`
2. Start app:
```bash
cd Client
npm install
npm run start
```
3. Open from Expo Go (scan QR) or run:
- `npm run ios`
- `npm run android`

## 5. Use Web Anytime

Hosted web app URL is the Render static site URL for `gentlecare-web`.

For local web:
```bash
cd Client
npm run web
```

## Notes

- If `/chat` returns `Chatbot is not configured on the server`, verify `GEMINI_API_KEY`.
- If `/speak` or `/transcribe` fails auth, verify `GOOGLE_CREDENTIALS_JSON`.
- `PORT` is managed by Render automatically.
