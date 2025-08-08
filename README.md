# Rally Timing Coordinator 🏰

A modern Next.js application for coordinating rally attacks so they arrive in a precise sequence. Perfect for strategy games where timing is everything.

## ✨ Features

- **Modern UI**: Clean, responsive design with smooth animations
- **Rally Management**: Add, edit, and remove rally leaders with march times and arrival offsets
- **Smart Sorting**: Automatically sorts rallies by earliest start time
- **Launch Overview**: Clear preview of start order, start offsets, and arrival times
- **Staggered Coordination**: Start times calculated so each rally arrives at its offset after the first hit
- **Live Countdown**: 5-second countdown before coordination begins
- **Real-time Tracking**: Status per leader (waiting → ready → go → completed)
- **Mobile Friendly**: Works great on desktop and mobile

## 🧠 How It Works

### Concept

Arrival Offset is how many seconds after the first hit a leader should arrive. Leaders with larger offsets arrive later; leaders with longer march times must start earlier to still meet their offset.

### Timing math

For each leader with `marchTime` and `arrivalOffset`:

```text
base        = max(marchTime - arrivalOffset)
startOffset = base - (marchTime - arrivalOffset)
arrivalTime = startOffset + marchTime = base + arrivalOffset
```

Leaders are sorted by `startOffset` so the earliest starter is first (often the one with offset 0).

## 🎮 Usage

1. **Add Rally Leaders**
   - Enter Name
   - Set March Time (seconds it takes to reach the castle)
   - Set Arrival Offset (seconds after the first hit to arrive)
2. **Review & Edit**
   - Leaders auto-sort by start time
   - Edit march time or arrival offset as needed
   - Remove unwanted entries
3. **Preview Launch**
   - See start order, start offsets, and arrival times
4. **Start Coordination**
   - Click Start to begin a 5-second countdown
   - Follow the live status per leader (waiting/ready/go/completed)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+

### Install & run (development)

```bash
npm install
npm run dev
```

App defaults to `http://localhost:3000`.

### Build

```bash
npm run build
```

This project is configured for static export (`next.config.js` has `output: 'export'`). After building, static files are generated into `out/`.

### Preview static export locally

```bash
npx serve out
```

Or deploy the `out/` directory to any static host (Vercel static, Netlify, GitHub Pages, etc.).

## 🧱 Project Structure

```text
rally_timings/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ globals.css
│  ├─ lib/
│  │  └─ time.ts
│  └─ store/
│     └─ rallyStore.ts
├─ next.config.js
├─ tailwind.config.ts
├─ postcss.config.js
├─ tsconfig.json
└─ package.json
```

## 🧰 Tech Stack

- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS
- Zustand (state management)
- Framer Motion (animations)
- Lucide React (icons)

## 📝 Scripts

```bash
npm run dev     # Start dev server
npm run build   # Build (static export to out/)
npm run start   # (Note) For SSR apps. With static export, deploy the out/ folder instead
npm run lint    # Lint
```

## 📤 Deploying to GitHub Pages

This repo includes a GitHub Actions workflow that builds and deploys the static export to GitHub Pages from the `V2` branch.

Steps:

1. In your GitHub repo, go to Settings → Pages, and set Source to “GitHub Actions”.
2. Push to the `V2` branch (or run the workflow manually). The workflow will:
   - Set `GITHUB_PAGES=true` and `BASE_PATH=/<repo-name>` to configure Next.js basePath/assetPrefix
   - Build `out/` via `npm run build`
   - Deploy `out/` to Pages

If you use a custom domain or organization page, adjust `BASE_PATH`/remove it accordingly in the workflow/`next.config.js`.

## 🛤️ Roadmap

- Save/load rally configurations
- Export coordination timeline
- Multiple target support
- Team templates
- Integrations

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a PR.

## 📄 License

MIT — see `LICENSE` for details.

---

Ready to coordinate your next victory? 🏆
