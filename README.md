# TechCourse Finder — Tech Certification Discovery Platform

A modern, responsive, static course-discovery web platform for discovering and comparing technology certification courses across AI, Cloud, Programming, Cybersecurity, Data Science, and more.

Built with clean, vanilla web standards (**HTML5, CSS3, JavaScript**). No node modules, build steps, bundlers, external frameworks, or database setups are required.

---

## 🚀 Quick Start (Local Preview)

Because TechCourse Finder is built with pure static files, you can preview it immediately with zero installation:

### Method 1: Direct Browser Preview
1. Navigate to the project directory: `c:\Users\Arvind Tak\OneDrive\Documents\`
2. Double-click `index.html` (or right-click `index.html` → **Open with** → Chrome / Edge / Firefox / Brave).
3. The website will load with all 30 courses, filters, categories, and popups working immediately.

### Method 2: Live Server in VS Code / Antigravity
1. Open the project folder in VS Code or Google Antigravity.
2. Install or enable the **Live Server** extension (or right-click `index.html` and click **"Open with Live Server"**).
3. The site will open at `http://127.0.0.1:5500/index.html` with instant live reload on any edits.

---

## 📁 Project Structure

```
├── index.html     # Semantic, accessible HTML structure and layout
├── styles.css     # Responsive design system, CSS Grid/Flexbox, native dialog styling
├── courses.js     # 30 curated technology certification courses across 12 categories
├── app.js         # Interactive controller: search, multi-filters, dialogs, active chips
└── README.md      # Documentation, local preview, and deployment guide
```

---

## 🔍 Features & Interactions

- **Live Search**: Instant real-time search across course titles, providers, categories, descriptions, and skill tags.
- **Category Browsing**: 12 interactive category cards ("Explore by Interest") that instantly filter the catalogue and scroll smoothly to results.
- **Combined Multi-Filtering**: Seamlessly filter simultaneously by:
  - Category (12 technology domains)
  - Price (Free, Paid)
  - Skill Level (Beginner, Intermediate, Advanced)
  - Certificate Status (Certificate available, Unverified, No certificate)
  - Provider (Coursera, Harvard, AWS, Cisco, freeCodeCamp, etc.)
  - Sort order (Recommended, Title A–Z, Provider A–Z)
- **Active Filter Chips**: Visual tags showing all applied filters with one-click individual removal or "Clear all".
- **Accessible Course Details Popup**: Native HTML5 `<dialog>` displaying full syllabus details, prerequisites, duration, skills tags, and clear verification warnings.
- **Safe External Links**: All outbound course links open safely in a new tab (`target="_blank" rel="noopener noreferrer"`).
- **Responsive Layout**: Fluid breakpoints optimized for mobile phones (320px–600px), tablets (601px–1000px), and wide desktop screens.

---

## 🌐 How to Deploy Publicly for Free

TechCourse Finder is completely static, which makes it fast, secure, and 100% free to host. Choose any of the following providers:

### Option 1: GitHub Pages (Recommended)
1. Initialize a Git repository in this folder:
   ```bash
   git init
   git add .
   git commit -m "Initial release of TechCourse Finder"
   ```
2. Create a new public repository on [GitHub](https://github.com).
3. Push your code to GitHub:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
4. On GitHub, go to **Settings** → **Pages**.
5. Under **Branch**, select `main` and root `/`, then click **Save**.
6. In 1–2 minutes, your website will be live at:
   `https://<your-username>.github.io/<your-repo-name>/`

### Option 2: Netlify Drop (Instant, No Git Required)
1. Visit [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop the folder containing `index.html`, `styles.css`, `courses.js`, and `app.js` into the upload zone.
3. Your website will be deployed instantly with a live public URL (e.g., `https://techcourse-finder.netlify.app`).

### Option 3: Vercel
1. Visit [Vercel](https://vercel.com) and click **"Add New Project"**.
2. Connect your GitHub repository or install the Vercel CLI (`npm i -g vercel`) and run `vercel` in the folder.
3. Accept the default static settings. Vercel will deploy your site on a high-speed global CDN.

---

## 📋 Course Data & Verification Notice

In compliance with truthful advertising and student transparency, course details in `courses.js` include explicit verification metadata:

- **12 courses** are flagged with **`Verified terms`**:
  - Free courses offering free verified certificates/badges (e.g., Harvard CS50x direct, freeCodeCamp, Cisco Networking Academy, Google Cloud Generative AI, Kaggle, Webflow University) or courses that explicitly do not issue certificates (e.g., The Odin Project).
- **18 courses** are flagged with **`Needs manual verification`**:
  - Courses where audit access is free but certificates require a paid subscription (e.g., Coursera $49/mo, edX certificate upgrades).
  - Courses where preparation training is free but proctored certification exams require fee vouchers (e.g., AWS Cloud Practitioner CLF-C02 ~$100, Azure Fundamentals AZ-900 ~$99, PortSwigger Burp Practitioner).
  - Courses where institution or academy partner enrollment is required (e.g., Cisco IT Essentials).

### How to Update or Add Courses
Open `courses.js` and edit or append to the `coursesData` array:
```javascript
{
  id: "course-31",
  title: "Your Course Title",
  provider: "Provider Name",
  category: "Artificial Intelligence",
  artStyle: "purple-art", // Options: purple-art, orange-art, blue-art, dark-art, or ""
  artSymbol: "✳",
  price: "Free", // "Free" or "Paid"
  level: "Beginner", // "Beginner", "Intermediate", or "Advanced"
  certificate: "Certificate available", // "Certificate available", "Unverified", or "No certificate"
  url: "https://official-provider.com/course",
  urlType: "Direct course page",
  estimatedDuration: "4 weeks",
  description: "Course summary...",
  skills: ["Skill 1", "Skill 2"],
  prerequisites: "Prerequisites if any...",
  lastVerifiedAt: "2026-10-17",
  verificationStatus: "Verified terms", // or "Needs manual verification"
  verificationNotes: "Transparent notes about pricing, audit options, or exam costs."
}
```
