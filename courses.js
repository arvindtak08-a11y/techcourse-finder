/**
 * TechCourse Finder — Course Catalog Data Adapter
 * Provides backward-compatible globals (categoriesData, coursesData)
 * and connects to the scalable 5,050-course database.
 */

// 1. Categories / Domains Definition (10 Official Technology Domains)
const defaultCategories = [
  {
    id: "Programming and Software Development",
    name: "Programming and Software Development",
    icon: "⌘",
    colorStyle: "green",
    description: "Core algorithms, Python, Java, C++, Rust, Go, software design patterns & testing"
  },
  {
    id: "Artificial Intelligence and Machine Learning",
    name: "Artificial Intelligence and Machine Learning",
    icon: "✳",
    colorStyle: "purple",
    description: "Deep learning, NLP, computer vision, LLMs, PyTorch, TensorFlow & AI safety"
  },
  {
    id: "Data Science and Data Analytics",
    name: "Data Science and Data Analytics",
    icon: "📊",
    colorStyle: "purple",
    description: "Statistical analysis, Pandas, SQL querying, data storytelling & Tableau"
  },
  {
    id: "Cloud Computing and DevOps",
    name: "Cloud Computing and DevOps",
    icon: "☁",
    colorStyle: "orange",
    description: "AWS, Microsoft Azure, Google Cloud, Docker, Kubernetes, Terraform & CI/CD"
  },
  {
    id: "Cybersecurity",
    name: "Cybersecurity",
    icon: "🛡️",
    colorStyle: "blue",
    description: "Ethical hacking, network defense, SIEM operations, cryptography & compliance"
  },
  {
    id: "Internet of Things",
    name: "Internet of Things",
    icon: "📡",
    colorStyle: "green",
    description: "Embedded systems, Arduino, Raspberry Pi, MQTT, sensor networks & edge computing"
  },
  {
    id: "Databases and IT",
    name: "Databases and IT",
    icon: "🗄️",
    colorStyle: "orange",
    description: "PostgreSQL, MySQL, MongoDB, Redis, Linux administration & IT infrastructure"
  },
  {
    id: "Web Development",
    name: "Web Development",
    icon: "🌐",
    colorStyle: "orange",
    description: "Modern JavaScript, TypeScript, React, Next.js, HTML5/CSS3 & REST APIs"
  },
  {
    id: "Mobile App Development",
    name: "Mobile App Development",
    icon: "📱",
    colorStyle: "green",
    description: "Android Kotlin, Jetpack Compose, iOS Swift, SwiftUI & React Native"
  },
  {
    id: "Blockchain and Web3",
    name: "Blockchain and Web3",
    icon: "⛓️",
    colorStyle: "blue",
    description: "Ethereum smart contracts, Solidity, cryptography, decentralized protocols & dApps"
  }
];

// Global categories accessor
const categoriesData = (typeof window !== 'undefined' && window.TECHCOURSE_DOMAINS)
  ? window.TECHCOURSE_DOMAINS
  : defaultCategories;

// Global courses accessor (prioritizes 5,000+ course catalog from courses-data.js)
const coursesData = (typeof window !== 'undefined' && Array.isArray(window.TECHCOURSE_CATALOG) && window.TECHCOURSE_CATALOG.length > 0)
  ? window.TECHCOURSE_CATALOG
  : [];
