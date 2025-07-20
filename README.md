# Rally Timing Coordinator 🏰

A modern web application for coordinating rally attacks to ensure synchronized arrival at a castle. Perfect for strategy games where timing is everything!

## ✨ Features

- **Modern UI**: Clean, responsive design with smooth animations
- **Rally Management**: Add, edit, and remove rally leaders with custom march times and delays
- **Smart Sorting**: Automatically sorts rallies by total time (descending order)
- **Launch Overview**: Visual preview of launch sequence with timing details before starting
- **Synchronized Coordination**: Calculates optimal start times for simultaneous arrival
- **Live Countdown**: 5-second countdown before coordination begins
- **Real-time Tracking**: Visual indicators showing who should launch when
- **Audio Feedback**: Sound notifications for countdown and launch events
- **Mobile Responsive**: Works perfectly on desktop, tablet, and mobile devices

## 🚀 How It Works

### The Concept
The goal is to coordinate multiple rally leaders with staggered arrival times. The delay setting controls how many seconds AFTER the first rally hits, each subsequent rally should arrive. Leaders with longer arrival times need to start earlier.

### Example Scenario
- **Leader A**: 600 seconds march time + 120 seconds delay = 720 seconds total
- **Leader B**: 300 seconds march time + 0 seconds delay = 300 seconds total
- **Leader C**: 480 seconds march time + 60 seconds delay = 540 seconds total

**Launch Order** (sorted by total time, descending):
1. Leader A starts first (longest total time: 720 seconds)
2. Leader C starts 240 seconds later (540 seconds total)
3. Leader B starts last (shortest total time: 300 seconds)

**Result**: All three attacks arrive at the castle simultaneously!

## 🎮 How to Use

1. **Add Rally Leaders**
   - Enter the leader's name
   - Set their march time in seconds (how long it takes to reach the castle)
   - Add any additional delay time in seconds (optional)
   - Click "Add Rally Leader"

2. **Review Your Team**
   - Leaders are automatically sorted by total time (longest first)
   - Edit march times and delays by clicking the edit button
   - Remove leaders if needed

3. **Preview Launch Strategy**
   - Review the launch overview section that appears automatically
   - See who starts 1st, 2nd, 3rd with timing details
   - Check total coordination time and arrival timing
   - Visual timing bars show the launch sequence

4. **Start Coordination**
   - Click "Start Coordination" when ready
   - 5-second countdown begins
   - Follow the launch sequence instructions
   - Watch for "LAUNCH NOW!" indicators

5. **Execute the Plan**
   - Leaders launch according to the calculated timing
   - Visual indicators show current status
   - All rallies arrive simultaneously at the target

## 🛠️ Technical Details

### Built With
- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with CSS Grid, Flexbox, and animations
- **Vanilla JavaScript**: ES6+ features, no external dependencies
- **Font Awesome**: Professional icons
- **Google Fonts**: Inter font family for clean typography

### Browser Support
- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 📦 Installation & Setup

### Option 1: Direct Use
Simply open `index.html` in your web browser. No installation required!

### Option 2: Local Development Server
For the best experience with live reloading:

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 3: Simple HTTP Server
```bash
# Using Node.js http-server
npm run serve

# Or using Python
python -m http.server 3000

# Or using PHP
php -S localhost:3000
```

## 🎨 Customization

### Colors
The app uses CSS custom properties for easy theming. Modify the `:root` variables in `style.css`:

```css
:root {
    --primary-color: #667eea;
    --success-color: #48bb78;
    --danger-color: #f56565;
    /* ... more variables */
}
```

### Timing
Adjust countdown and notification timings in `script.js`:

```javascript
// Change initial countdown time (default: 5 seconds)
let countdown = 5;

// Modify launch window timing (default: 30 seconds)
if (elapsed >= launchTimeSeconds - 30) {
    // Ready phase starts 30 seconds before
}
```

## 🔧 File Structure

```
rally-timing-coordinator/
├── index.html          # Main HTML structure
├── style.css           # Modern CSS styling and animations
├── script.js           # Core JavaScript functionality
├── package.json        # Project configuration
└── README.md          # This file
```

## 📱 Responsive Design

The application is fully responsive and adapts to different screen sizes:

- **Desktop** (1200px+): Two-column layout with full features
- **Tablet** (768px-1199px): Single column with optimized spacing
- **Mobile** (320px-767px): Compact layout with touch-friendly controls

## 🎯 Use Cases

- **Strategy Games**: Coordinate attacks in war games
- **Event Planning**: Synchronize multiple timed events
- **Team Coordination**: Any scenario requiring precise timing
- **Educational Tool**: Teaching timing and coordination concepts

## 🚧 Future Enhancements

- [ ] Save/load rally configurations
- [ ] Export coordination timeline
- [ ] Multiple target support
- [ ] Advanced timing calculations
- [ ] Team templates
- [ ] Integration with game APIs

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎉 Acknowledgments

- Font Awesome for the beautiful icons
- Google Fonts for the Inter font family
- The strategy gaming community for inspiration

---

**Ready to coordinate your next victory? Open the app and start planning! 🏆** 