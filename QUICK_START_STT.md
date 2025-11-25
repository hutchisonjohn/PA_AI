# Quick Start: Free Whisper STT (No Self-Hosting Required!)

## ✅ Easiest Option: Hugging Face Inference API

**No self-hosting needed!** Use Hugging Face's free Whisper API directly.

### Step 1: Get Free API Token
1. Go to: https://huggingface.co/settings/tokens
2. Sign up (free)
3. Create a new token (read access)
4. Copy your token

### Step 2: Add to `.env` File
```env
STT_API_ENDPOINT=https://api-inference.huggingface.co/models/openai/whisper-base
STT_API_KEY=your_huggingface_token_here
```

### Step 3: Test It!
```bash
npm start
# Click mic button on your device
# Speak - it will transcribe!
```

**That's it!** No server setup, no self-hosting, completely free!

---

## Alternative: Replicate (Also Free)

### Step 1: Sign Up
1. Go to: https://replicate.com
2. Sign up (free)
3. Get your API token

### Step 2: Add to `.env`
```env
STT_API_ENDPOINT=https://api.replicate.com/v1/predictions
STT_API_KEY=your_replicate_token_here
```

### Step 3: Test It!

---

## Comparison

| Service | Self-Hosting? | Free Tier | Setup Time |
|---------|---------------|-----------|------------|
| **Hugging Face** | ❌ No | ✅ Yes | 2 minutes |
| **Replicate** | ❌ No | ✅ Yes | 2 minutes |
| **Self-Hosted Whisper** | ✅ Yes | ✅ Free | 30+ minutes |

**Recommendation:** Use **Hugging Face** - it's the easiest and completely free!

---

## Need Help?

See `EXPO_GO_STT_SOLUTION.md` for detailed setup instructions.

