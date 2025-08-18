// background.js — field-level controls
// New config keys: fieldPrefs (per-field booleans), enrichment.{categoryName, channelBasics}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function parseISODurationToSeconds(iso) {
  const m = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(iso || "");
  if (!m) return null;
  const [, h, min, s] = m.map(x => parseInt(x || "0", 10));
  return (h || 0) * 3600 + (min || 0) * 60 + (s || 0);
}

function inferIsShorts({ url, durationSeconds }) {
  if (url && url.includes("/shorts/")) return true;
  if (typeof durationSeconds === "number" && durationSeconds <= 60) return true;
  return false;
}

const DEFAULT_PREFS = {
  apiKey: "",
  profile: "Child",
  fieldPrefs: {
    // snippet
    title:true, description:true, channelId:true, channelTitle:true, publishedAt:true,
    tags:true, thumbnails:true, categoryId:true, defaultLanguage:true, defaultAudioLanguage:true, liveContent:true,
    // contentDetails
    durationSeconds:true, definition:true, caption:true, regionRestriction:true, contentRating:true,
    // statistics
    viewCount:true, likeCount:true, commentCount:true,
    // status
    madeForKids:true,
    // topicDetails
    topicCategories:false
  },
  enrichment: { categoryName:true, channelBasics:false }
};

const PART_FIELDS = {
  snippet: ["title","description","channelId","channelTitle","publishedAt","tags","thumbnails","categoryId","defaultLanguage","defaultAudioLanguage","liveContent"],
  contentDetails: ["durationSeconds","definition","caption","regionRestriction","contentRating"],
  statistics: ["viewCount","likeCount","commentCount"],
  status: ["madeForKids"],
  topicDetails: ["topicCategories"]
};

function partsNeededFromFieldPrefs(fieldPrefs) {
  const parts = new Set();
  for (const [part, fields] of Object.entries(PART_FIELDS)) {
    if (fields.some(f => fieldPrefs?.[f])) parts.add(part);
  }
  return Array.from(parts);
}

function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_PREFS, (cfg) => resolve(cfg));
  });
}

const categoryNameCache = new Map();
async function getCategoryName(categoryId, apiKey, regionCode = "US") {
  if (!categoryId) return null;
  const cacheKey = `${regionCode}:${categoryId}`;
  if (categoryNameCache.has(cacheKey)) return categoryNameCache.get(cacheKey);

  const url = new URL("https://www.googleapis.com/youtube/v3/videoCategories");
  url.search = new URLSearchParams({ part: "snippet", id: String(categoryId), key: apiKey, regionCode }).toString();
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const name = data?.items?.[0]?.snippet?.title || null;
  categoryNameCache.set(cacheKey, name);
  return name;
}

async function fetchChannelBasics(channelId, apiKey) {
  if (!channelId) return null;
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.search = new URLSearchParams({ part: "snippet,statistics,brandingSettings,topicDetails", id: channelId, key: apiKey }).toString();
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const c = data?.items?.[0];
  if (!c) return null;
  const sn = c.snippet || {};
  const stats = c.statistics || {};
  const branding = c.brandingSettings || {};
  return {
    channelId: c.id,
    customUrl: sn.customUrl || null,
    channelCountry: sn.country || null,
    channelDescription: sn.description || null,
    channelCreatedAt: sn.publishedAt || null,
    banner: branding?.image?.bannerExternalUrl || null,
    subscriberCount: stats.subscriberCount ? Number(stats.subscriberCount) : null,
    videoCount: stats.videoCount ? Number(stats.videoCount) : null,
  };
}

async function fetchVideoMetadataRich(videoId, apiKey, parts, { maxRetries = 3 } = {}) {
  const allowedParts = ["snippet","contentDetails","statistics","status","topicDetails"];
  const partList = (Array.isArray(parts) && parts.length ? parts : ["snippet","contentDetails","statistics","status"])
    .filter(p => allowedParts.includes(p));
  const baseUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
  baseUrl.search = new URLSearchParams({
    part: partList.join(","),
    id: videoId,
    key: apiKey,
  }).toString();

  let attempt = 0;
  while (true) {
    try {
      const res = await fetch(baseUrl.toString());
      if (!res.ok) throw new Error(`videos.list ${res.status} ${res.statusText}`);
      const data = await res.json();
      const v = data?.items?.[0];
      if (!v) throw new Error("Video not found");

      const out = { videoId: v.id };

      if (partList.includes("snippet")) {
        const sn = v.snippet || {};
        out.title = sn.title ?? null;
        out.description = sn.description ?? null;
        out.publishedAt = sn.publishedAt ?? null;
        out.channelId = sn.channelId ?? null;
        out.channelTitle = sn.channelTitle ?? null;
        out.tags = sn.tags ?? [];
        out.thumbnails = sn.thumbnails ?? {};
        out.categoryId = sn.categoryId ?? null;
        out.defaultLanguage = sn.defaultLanguage ?? null;
        out.defaultAudioLanguage = sn.defaultAudioLanguage ?? null;
        out.liveContent = sn.liveBroadcastContent || "none";
      }

      if (partList.includes("contentDetails")) {
        const cd = v.contentDetails || {};
        out.durationSeconds = parseISODurationToSeconds(cd.duration);
        out.definition = cd.definition ?? null;
        out.caption = cd.caption === "true";
        out.regionRestriction = cd.regionRestriction ?? null;
        out.contentRating = cd.contentRating ?? null;
      }

      if (partList.includes("status")) {
        const st = v.status || {};
        out.madeForKids = st?.madeForKids ?? null;
      }

      if (partList.includes("statistics")) {
        const stats = v.statistics || {};
        out.viewCount = stats.viewCount ? Number(stats.viewCount) : null;
        out.likeCount = stats.likeCount ? Number(stats.likeCount) : null;
        out.commentCount = stats.commentCount ? Number(stats.commentCount) : null;
      }

      if (partList.includes("topicDetails")) {
        out.topicCategories = (v.topicDetails && v.topicDetails.topicCategories) || [];
      }

      return out;
    } catch (e) {
      if (attempt >= maxRetries) throw e;
      attempt += 1;
      await sleep(300 * attempt);
    }
  }
}

function filterByFieldPrefs(entry, fieldPrefs) {
  const keep = new Set(Object.entries(fieldPrefs).filter(([,v]) => v).map(([k]) => k));
  const always = new Set(["videoId","url","profile","watchedAt","isShorts"]); // core context
  const out = {};
  for (const [k, v] of Object.entries(entry)) {
    if (always.has(k) || keep.has(k)) out[k] = v;
  }
  // If thumbnails kept=false, drop the whole object
  if (!keep.has("thumbnails")) delete out.thumbnails;
  // If tags kept=false, drop array
  if (!keep.has("tags")) delete out.tags;
  // If topicCategories kept=false, drop it
  if (!keep.has("topicCategories")) delete out.topicCategories;
  // If regionRestriction kept=false, drop it
  if (!keep.has("regionRestriction")) delete out.regionRestriction;
  // If contentRating kept=false, drop it
  if (!keep.has("contentRating")) delete out.contentRating;
  return out;
}

// Storage helpers
function recentlyLogged(profile, videoId, ttlMinutes = 120) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ lastLogged: {} }, ({ lastLogged }) => {
      const key = `${profile}:${videoId}`;
      const last = lastLogged[key];
      if (!last) return resolve(false);
      const ageMin = (Date.now() - new Date(last).getTime()) / 60000;
      resolve(ageMin < ttlMinutes);
    });
  });
}
function markLogged(profile, videoId) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ lastLogged: {} }, ({ lastLogged }) => {
      const key = `${profile}:${videoId}`;
      lastLogged[key] = new Date().toISOString();
      chrome.storage.local.set({ lastLogged }, resolve);
    });
  });
}
function setLogEntry(entry, maxEntries = 5000) {
  return new Promise((resolve) => {
    chrome.storage.local.get({ watchLog: [] }, ({ watchLog }) => {
      const list = Array.isArray(watchLog) ? watchLog : [];
      list.push(entry);
      if (list.length > maxEntries) list.splice(0, list.length - maxEntries);
      chrome.storage.local.set({ watchLog: list }, () => resolve());
    });
  });
}

async function logYouTubeWatch({ videoId, url }) {
  try {
    const { apiKey, profile, fieldPrefs = DEFAULT_PREFS.fieldPrefs, enrichment = DEFAULT_PREFS.enrichment } = await getConfig();

    if (await recentlyLogged(profile, videoId)) return;

    // Determine which parts are required based on selected fields
    const parts = partsNeededFromFieldPrefs(fieldPrefs);

    let meta = { videoId };
    if (apiKey && parts.length) {
      meta = await fetchVideoMetadataRich(videoId, apiKey, parts);
    }

    // Build full entry
    const entry = {
      videoId,
      url,
      profile,

      // SNIPPET
      title: meta.title ?? null,
      description: meta.description ?? null,
      channelId: meta.channelId ?? null,
      channelTitle: meta.channelTitle ?? null,
      publishedAt: meta.publishedAt ?? null,
      tags: meta.tags ?? [],
      thumbnails: meta.thumbnails ?? {},
      categoryId: meta.categoryId ?? null,
      defaultLanguage: meta.defaultLanguage ?? null,
      defaultAudioLanguage: meta.defaultAudioLanguage ?? null,
      liveContent: meta.liveContent ?? "none",

      // CONTENT DETAILS
      durationSeconds: meta.durationSeconds ?? null,
      definition: meta.definition ?? null,
      caption: meta.caption ?? null,
      regionRestriction: meta.regionRestriction ?? null,
      contentRating: meta.contentRating ?? null,

      // STATUS
      madeForKids: meta.madeForKids ?? null,

      // STATISTICS
      viewCount: meta.viewCount ?? null,
      likeCount: meta.likeCount ?? null,
      commentCount: meta.commentCount ?? null,

      // TOPIC DETAILS
      topicCategories: meta.topicCategories ?? [],

      // computed
      isShorts: inferIsShorts({ url, durationSeconds: meta.durationSeconds }),

      // placeholder for enrichment
      categoryName: null,
      channelExtra: null,

      watchedAt: new Date().toISOString(),
    };

    // Enrichment (subject to needed inputs)
    if (apiKey && enrichment?.categoryName && entry.categoryId) {
      entry.categoryName = await getCategoryName(entry.categoryId, apiKey, "US");
    }
    if (apiKey && enrichment?.channelBasics && entry.channelId) {
      entry.channelExtra = await fetchChannelBasics(entry.channelId, apiKey);
    }

    // Now drop any fields the user disabled
    const filtered = filterByFieldPrefs(entry, fieldPrefs);

    await setLogEntry(filtered);
    await markLogged(profile, videoId);
    chrome.runtime.sendMessage({ type: "YTL_LOGGED", entry: filtered });
  } catch (err) {
    console.error("[YTL] Failed to log video:", err);
  }
}

// Messages
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === "YTL_VIDEO") {
    logYouTubeWatch({ videoId: msg.videoId, url: msg.url });
    sendResponse({ ok: true });
    return true;
  }
  if (msg?.type === "YTL_SET_CONFIG") {
    const upd = {
      apiKey: msg.apiKey ?? undefined,
      profile: msg.profile ?? undefined,
      fieldPrefs: msg.fieldPrefs ?? undefined,
      enrichment: msg.enrichment ?? undefined
    };
    chrome.storage.sync.set(upd, () => sendResponse({ ok: true }));
    return true;
  }
});

// First-run helpers remain unchanged
chrome.runtime.onInstalled.addListener((details) => {
  chrome.storage.sync.get({ apiKey: "" }, ({ apiKey }) => {
    if (!apiKey) {
      if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
      else chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
    }
  });
});
