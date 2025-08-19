# Stream Replay (Rapidly Log and Analyze your kids Screentime)

**Stream Replay** is a Chrome and Edge browser extension that logs the YouTube videos and Shorts as your kids watch them. It captures detailed metadata (via the YouTube Data API v3) and stores all the information locally (for privacy) on your computer in a format that you can pass to ChatGPT to read and analyze. I built this so I could understand my kids better and if need-be modify their search preferences (via downvote). The first time I used it on my kids I learned that my 6 year old really likes watching videos about dinosaur and dragons but was exposed to something ChatGPT defined as a Psychological Experiment. As for my 10 year old, he spent a lot of time watching videos about a game called "Grow a Garden" and "Roblox.

The Installation is completely free but might be a little tricky for someone with zero technical capabilities. Generally, I wouldn't offer the following, but because I think it's a good cause. I'm happy to help you install it if interested, you're welcome to email or text me at kjregan120@gmail.com or 203-233-2691. 

Best regards, 

Kevin

---

## Features

- **Automatic Logging** – Detects YouTube/Shorts videos you watch in Chrome/Edge.  
- **Rich Metadata** – Captures title, description, channel, tags, publish date, view/like counts, duration, captions, categories, and more.  
- **Customizable Fields** – Enable/disable individual fields in the extension settings.  
- **Filtering & Export** – Built-in popup lets you search, filter (e.g., Shorts, Kids content), and export logs to JSON.  
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
<img width="1830" height="767" alt="image" src="https://github.com/user-attachments/assets/863ce7db-ed76-434f-bf01-d42071b75360" />  

<img width="1829" height="643" alt="image" src="https://github.com/user-attachments/assets/ac3adf0c-9c2a-4417-8189-15f3ab468317" />


## Chrome Installation
1 - Download the above zip file into your downloads folder and extract the contents.   
2 - In Chrome click the 3 dots (elipses) on the top right of the browser, scroll to and click Extensions => Manage Extensions  
3 - Click My Extensions and Toggle "Developer Mode" to On.  
4 - Click "Load Unpacked" and navigate to the extracted zip folder in downloads.   
5 - On the Settings / Options page (enter your Youtube Data API Key)  
6 - Select what data you'd like to collect from youtube.    
7 - Click Save.  












