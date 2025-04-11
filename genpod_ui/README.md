# Genpod UI

Frontend UI for the Genpod platform — an AI agent workspace for building and managing Genpod models.

Built with:
- ✅ Next.js 15
- ✅ React 19 (App Router)
- ✅ Tailwind CSS
- ✅ Lucide icons
- ✅ Chat + Metrics + Logs tabs
- ✅ Real-time LLM (Gemini 1.5 Flash)
- ✅ File-tabbed layout coming soon

---

## 🚀 Features (Completed Phases)

### 💬 Chat Tab
- Conversational UI powered by Gemini 1.5 Flash
- Message input with file upload, mic, and send icons
- Markdown + code block support
- Live loading spinner
- Animated chat bubble layout

### 📊 Metrics Tab
- Fetches metrics from `/api/metrics`
- Displays model progress, token usage, and ETA
- Smooth progress bar with Tailwind animation
- Radial chart support (optional)

### 🧠 Logs Tab
- Displays agent communication logs (like terminal output)
- Fetched from `/api/logs` (currently using mock data)
- Styled like a developer console
- Uses Lucide icons + monospaced layout

---

## 📦 Setup & Run

```bash
npm install
npm run dev

Runs at http://localhost:3000

⸻

🧪 Endpoints (Mock for now)
	•	GET /api/metrics → returns model progress data
	•	GET /api/logs → returns array of string logs

⸻

✅ Next Phase (WIP)
	•	Phase 6: Code View Tabs
	•	VSCode-style file tree
	•	Multi-tab Monaco Editor
	•	Preview, Configure, Insights panels

⸻

📁 Folder Structure

src/
  app/
    layout.tsx
    page.tsx
    api/
      metrics/route.ts
      logs/route.ts
  components/
    LeftPanel/
      ChatTab.tsx
      MetricsTab.tsx
      LogsTab.tsx
    RightPanel/
      (coming soon...)



⸻

👨‍💻 Author

Venkata Sai Ancha
🔗 GitHub | LinkedIn

