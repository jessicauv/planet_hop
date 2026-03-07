# 75HER Challenge: Risk Log
**Project Name:** Planet Hop | **Team Name:** Jess & Steph

## 🛡️ Risk Log Table

| Area | Issue Description | Severity | Fix Applied | Evidence/Link | Status |
|------|------------------|----------|-------------|---------------|--------|
| **Responsive Design** | Website not fully responsive for mobile devices | 🟠 Major | Implemented responsive design with mobile-specific layouts and touch interactions | CSS media queries and mobile layout logic in `src/main.js` | ✅ Fixed |
| **Audio Controls** | Missing button to turn off all audio, audio intially not working on all browsers | 🟡 Minor | Added volume toggle button with persistent state, used .mp3 for audio instead of .ogg | Audio controls in `src/main.js` | ✅ Fixed |
| **Mobile Issues** | Mobile responsive issues: arrows not working, selection screen squished, Safari audio issues, UI issues | 🟠 Major | Fixed mobile touch interactions, improved layout, and Safari audio compatibility | Mobile-specific code in `src/main.js` | ✅ Fixed |
| **Visual Quality** | Planet textures appearing blurred, not crisp enough, occasional glitch/delay in planet animation | 🟡 Minor | Optimized texture loading and increased anisotropy settings | Texture loading in `src/planetFactory.js` | ✅ Fixed |
| **Accessibility** | Missing alt text on planet texture images for screen readers | 🟠 Major | Added descriptive alt text to all planet texture images in HTML and documentation | `public/textures/` images referenced in `src/planetFactory.js` | ✅ Fixed |
| **Visual Realism** | Planets lacked realistic features (Saturn rings, realistic orbits) | 🟡 Minor | Added Saturn rings and improved orbital mechanics | Planet factory enhancements in `src/planetFactory.js` | ✅ Fixed |
| **VR Functionality** | Cannot interact with the game with an actual VR headset using mouse clicks - eg forward/backward button press, selection for planets  | 🟠 Major | Updated code to use VR gaze-based selection and controller mapping | VR interaction logic in `src/main.js` | ✅ Fixed |

*Part of the #75HER Challenge | CreateHER Fest 2026*
