/**
 * TechCourse Finder — Catalog Management & Quality Assurance Tool
 * Run:
 *   node scripts/manage-catalog.js validate
 *   node scripts/manage-catalog.js stats
 *   node scripts/manage-catalog.js duplicates
 *   node scripts/manage-catalog.js search "python"
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'data', 'courses.json');

if (!fs.existsSync(jsonPath)) {
  console.error(`Error: File not found at ${jsonPath}. Run 'node scripts/generate-catalog.js' first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const courses = data.courses || [];
const domains = data.domains || [];

const command = process.argv[2] || 'stats';
const queryArg = process.argv.slice(3).join(' ');

console.log(`\n========================================`);
console.log(` TechCourse Finder — Catalog QA Manager`);
console.log(` Total Courses Loaded: ${courses.length}`);
console.log(`========================================\n`);

switch (command) {
  case 'validate':
    runValidation();
    break;
  case 'duplicates':
    checkDuplicates();
    break;
  case 'stats':
    printStats();
    break;
  case 'search':
    runSearch(queryArg);
    break;
  default:
    console.log(`Unknown command: ${command}`);
    console.log(`Available commands: validate, duplicates, stats, search <query>`);
}

function runValidation() {
  console.log(`Running comprehensive validation on ${courses.length} courses...\n`);
  let errors = 0;
  const validLevels = new Set(['Beginner', 'Intermediate', 'Advanced']);
  const validPrices = new Set(['Free', 'Paid']);
  const validCerts = new Set(['Certificate available', 'Unverified', 'No certificate']);

  courses.forEach((c, index) => {
    const loc = `Course #${index + 1} (${c.id || 'NO_ID'})`;

    if (!c.id || typeof c.id !== 'string') {
      console.error(`[ERROR] ${loc}: Missing or invalid 'id'`);
      errors++;
    }
    if (!c.title || typeof c.title !== 'string' || c.title.trim().length === 0) {
      console.error(`[ERROR] ${loc}: Missing or empty 'title'`);
      errors++;
    }
    if (!c.provider || typeof c.provider !== 'string') {
      console.error(`[ERROR] ${loc}: Missing or invalid 'provider'`);
      errors++;
    }
    if (!c.category || typeof c.category !== 'string') {
      console.error(`[ERROR] ${loc}: Missing or invalid 'category'`);
      errors++;
    }
    if (!validLevels.has(c.level)) {
      console.error(`[ERROR] ${loc}: Invalid level '${c.level}'`);
      errors++;
    }
    if (!validPrices.has(c.price)) {
      console.error(`[ERROR] ${loc}: Invalid price '${c.price}'`);
      errors++;
    }
    if (!validCerts.has(c.certificate)) {
      console.error(`[ERROR] ${loc}: Invalid certificate status '${c.certificate}'`);
      errors++;
    }
    if (!c.url || !c.url.startsWith('https://')) {
      console.error(`[ERROR] ${loc}: Invalid or non-HTTPS URL '${c.url}'`);
      errors++;
    }
    if (!c.description || c.description.trim().length < 15) {
      console.error(`[ERROR] ${loc}: Description too short or missing`);
      errors++;
    }
    if (!Array.isArray(c.skills) || c.skills.length === 0) {
      console.error(`[ERROR] ${loc}: Missing skills array`);
      errors++;
    }
  });

  if (errors === 0) {
    console.log(`[PASS] Validation SUCCESSFUL: All ${courses.length} courses have 100% valid schema fields and secure HTTPS URLs!\n`);
  } else {
    console.error(`[FAIL] Found ${errors} validation errors.\n`);
    process.exit(1);
  }
}

function checkDuplicates() {
  console.log(`Checking for duplicates among ${courses.length} courses...\n`);
  const idMap = new Map();
  const titleProviderMap = new Map();
  let duplicateIds = 0;
  let duplicateTitles = 0;

  courses.forEach(c => {
    if (idMap.has(c.id)) {
      console.warn(`[DUPLICATE ID] ${c.id} appears multiple times!`);
      duplicateIds++;
    } else {
      idMap.set(c.id, true);
    }

    const key = `${c.provider}::${c.title}`.toLowerCase();
    if (titleProviderMap.has(key)) {
      console.warn(`[DUPLICATE TITLE] '${c.title}' by '${c.provider}' appears multiple times!`);
      duplicateTitles++;
    } else {
      titleProviderMap.set(key, true);
    }
  });

  if (duplicateIds === 0 && duplicateTitles === 0) {
    console.log(`[PASS] Zero duplicate IDs and Zero duplicate titles found across all ${courses.length} courses!\n`);
  } else {
    console.error(`[FAIL] Found ${duplicateIds} duplicate IDs and ${duplicateTitles} duplicate title/provider pairs.\n`);
  }
}

function printStats() {
  const catCount = {};
  const providerCount = {};
  const levelCount = {};
  const priceCount = {};
  const certCount = {};
  const verifCount = {};

  courses.forEach(c => {
    catCount[c.category] = (catCount[c.category] || 0) + 1;
    providerCount[c.provider] = (providerCount[c.provider] || 0) + 1;
    levelCount[c.level] = (levelCount[c.level] || 0) + 1;
    priceCount[c.price] = (priceCount[c.price] || 0) + 1;
    certCount[c.certificate] = (certCount[c.certificate] || 0) + 1;
    verifCount[c.verification_status] = (verifCount[c.verification_status] || 0) + 1;
  });

  console.log(`--- Breakdown by Technology Category ---`);
  Object.entries(catCount).forEach(([cat, count]) => {
    console.log(`  • ${cat.padEnd(42)} : ${count.toString().padStart(4)} courses`);
  });

  console.log(`\n--- Breakdown by Skill Level ---`);
  Object.entries(levelCount).forEach(([lvl, count]) => {
    console.log(`  • ${lvl.padEnd(20)} : ${count} courses`);
  });

  console.log(`\n--- Breakdown by Price ---`);
  Object.entries(priceCount).forEach(([pr, count]) => {
    console.log(`  • ${pr.padEnd(20)} : ${count} courses`);
  });

  console.log(`\n--- Breakdown by Certificate Status ---`);
  Object.entries(certCount).forEach(([cert, count]) => {
    console.log(`  • ${cert.padEnd(25)} : ${count} courses`);
  });

  console.log(`\n--- Breakdown by Verification Status ---`);
  Object.entries(verifCount).forEach(([verif, count]) => {
    console.log(`  • ${verif.padEnd(28)} : ${count} courses`);
  });

  console.log(`\nTotal Unique Providers: ${Object.keys(providerCount).length}`);
  console.log(`\nAll checks completed.\n`);
}

function runSearch(query) {
  if (!query) {
    console.log(`Please provide a search term: node scripts/manage-catalog.js search <term>`);
    return;
  }
  const q = query.toLowerCase();
  const startTime = Date.now();
  const results = courses.filter(c => 
    c.title.toLowerCase().includes(q) ||
    c.provider.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    (c.skills && c.skills.some(s => s.toLowerCase().includes(q)))
  );
  const elapsed = Date.now() - startTime;

  console.log(`Search for "${query}" completed in ${elapsed}ms.`);
  console.log(`Found ${results.length} matching courses. Showing first 5:\n`);

  results.slice(0, 5).forEach((c, idx) => {
    console.log(`${idx + 1}. [${c.category}] ${c.title}`);
    console.log(`   Provider: ${c.provider} | Level: ${c.level} | Price: ${c.price}`);
    console.log(`   URL: ${c.url}\n`);
  });
}
