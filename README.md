# Stream Replay (YouTube Watch Logger)

**Stream Replay** is a Chrome/Edge extension that logs YouTube videos and Shorts as you watch them. It captures detailed metadata (via the YouTube Data API v3) and stores it locally in a structured format (JSON/CSV). This makes the logs LLM-friendly for downstream analysis like summarization, embeddings, classification, and trend detection.

---

## Features

- **Automatic Logging** – Detects YouTube/Shorts videos you watch in Chrome/Edge.  
- **Rich Metadata** – Captures title, description, channel, tags, publish date, view/like counts, duration, captions, categories, and more.  
- **Customizable Fields** – Enable/disable individual fields in the extension settings.  
- **Filtering & Export** – Built-in popup lets you search, filter (e.g., Shorts, Kids content), and export logs to JSON or CSV.  
- **Replay Playlists** – Generate a “watch again” playlist of logged videos with one click.  
- **Enrichment Options** – Lookup category names and basic channel stats (subscribers, banner, etc.).  
- **Privacy-Friendly** – Data is stored locally in Chrome’s storage; nothing is uploaded externally.  

---
## Requirements
To use this tool you will need to obtain an API Key (for Free) from Google's Youtube Data API.

## Free Google Youtube Data API Setup Instructions
## Getting a YouTube Data API Key (Free, Read-Only)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).  
2. Sign in with your Google account.  
3. Click **Select a project** (top left) → **New Project**. Give it any name.  
4. With the project selected, open the menu → **APIs & Services** → **Library**.  
5. Search for **YouTube Data API v3** → click it → **Enable**.  
6. Go to **APIs & Services** → **Credentials**.  
7. Click **Create credentials** → **API key**.  
8. Copy the key shown. This is your API key.  
9. (Optional but recommended) Under **API restrictions**, choose **Restrict key** → limit to **YouTube Data API v3**.  
10. Save your changes.  

Paste this key into the extension’s **Settings → YouTube Data API key** field.
<img width="1829" height="643" alt="image" src="https://github.com/user-attachments/assets/ac3adf0c-9c2a-4417-8189-15f3ab468317" />


## Chrome Installation
1 - Download the above zip file into your downloads folder and extract the contents.   
2 - In Chrome click the 3 dots (elipses) on the top right of the browser, scroll to and click Extensions => Manage Extensions  
3 - Click My Extensions and Toggle "Developer Mode" to On.  
4 - Click "Load Unpacked" and navigate to the extracted zip folder in downloads.   
5 - On the Settings / Options page (enter your Youtube Data API Key)  
6 - Select what data you'd like to collect from youtube.    
7 - Click Save.  












