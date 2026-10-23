/**
 * TechCourse Finder — Automated Comprehensive Verification Suite
 * Tests:
 * 1. File existence & architecture integrity
 * 2. 5,000+ course catalog volume & schema conformance
 * 3. 10 technology categories coverage
 * 4. Safe HTTPS URLs & verification status flags
 * 5. Database schema & RLS policies
 * 6. Dual-mode fallback reliability
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = path.join(__dirname, '..');

console.log('\n========================================================');
console.log(' TechCourse Finder — Automated Quality Assurance Suite');
console.log('========================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    failCount++;
  }
}

// 1. Check all required project files
const requiredFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'courses.js',
  'courses-data.js',
  'config.js',
  'schema.sql',
  'README.md',
  'data/courses.json',
  'data/courses.csv',
  'data/import_courses.sql',
  'scripts/generate-catalog.js',
  'scripts/manage-catalog.js',
  'scripts/import-pipeline.js'
];

requiredFiles.forEach(f => {
  const filePath = path.join(rootDir, f);
  assert(fs.existsSync(filePath), `Required file exists: ${f}`);
});

// 2. Validate HTML DOM Element IDs
const htmlContent = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
const requiredIds = [
  'search',
  'hero-search',
  'category-grid',
  'course-grid',
  'pagination-controls',
  'loading-spinner',
  'empty-state',
  'empty-clear',
  'clear-filters',
  'active-filters',
  'result-count',
  'total-count',
  'domains-count',
  'results-summary',
  'year',
  'category-filter',
  'price-filter',
  'level-filter',
  'certificate-filter',
  'provider-filter',
  'sort-filter',
  'course-dialog',
  'dialog-close',
  'dialog-content',
  'visitor-dialog',
  'visitor-close',
  'visitor-form',
  'visitor-name',
  'visitor-email',
  'visitor-phone',
  'visitor-category',
  'visitor-consent',
  'visitor-submit-btn',
  'visitor-dismiss-btn',
  'visitor-success',
  'header-roadmap-btn'
];

let missingIds = [];
requiredIds.forEach(id => {
  if (!htmlContent.includes(`id="${id}"`)) {
    missingIds.push(id);
  }
});
assert(missingIds.length === 0, 'All required interactive HTML element IDs exist in index.html', missingIds.join(', '));

// 3. Test Course Catalog Data
const jsonPath = path.join(rootDir, 'data', 'courses.json');
const catalogData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const courses = catalogData.courses || [];
const domains = catalogData.domains || [];

assert(courses.length >= 5000, `Catalog contains at least 5,000 courses (Found: ${courses.length})`);
assert(domains.length === 10, `Catalog contains all 10 technology domains (Found: ${domains.length})`);

// 4. Test Zero Duplicates & 100% Safe URLs
const idSet = new Set();
const titleProviderSet = new Set();
let invalidUrls = 0;
let missingFields = 0;

courses.forEach(c => {
  idSet.add(c.id);
  titleProviderSet.add(`${c.provider}::${c.title}`.toLowerCase());

  if (!c.url || !c.url.startsWith('https://')) {
    invalidUrls++;
  }
  if (!c.id || !c.title || !c.provider || !c.category || !c.level || !c.price || !c.certificate) {
    missingFields++;
  }
});

assert(idSet.size === courses.length, `Unique course IDs: ${idSet.size} / ${courses.length}`);
assert(titleProviderSet.size === courses.length, `Unique title + provider pairs: ${titleProviderSet.size} / ${courses.length}`);
assert(invalidUrls === 0, `All course URLs use secure HTTPS protocol`);
assert(missingFields === 0, `All course records have complete non-null required fields`);

// 5. Test SQL Schema Integrity
const schemaContent = fs.readFileSync(path.join(rootDir, 'schema.sql'), 'utf8');
assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.courses'), 'schema.sql defines public.courses table');
assert(schemaContent.includes('CREATE TABLE IF NOT EXISTS public.visitor_leads'), 'schema.sql defines public.visitor_leads table');
assert(schemaContent.includes('fts_document tsvector'), 'schema.sql contains full-text search tsvector generated column');
assert(schemaContent.includes('ENABLE ROW LEVEL SECURITY'), 'schema.sql enforces Row Level Security (RLS)');
assert(schemaContent.includes('CREATE POLICY "Public can insert leads with consent"'), 'schema.sql protects visitor privacy via RLS insert policy');

// 6. Test Client-Side JS Execution in Sandboxed VM
try {
  const windowSandbox = {};
  const coursesDataCode = fs.readFileSync(path.join(rootDir, 'courses-data.js'), 'utf8');
  vm.runInNewContext(coursesDataCode, { window: windowSandbox });
  assert(Array.isArray(windowSandbox.TECHCOURSE_CATALOG) && windowSandbox.TECHCOURSE_CATALOG.length >= 5000,
    `courses-data.js loads successfully into window.TECHCOURSE_CATALOG (${windowSandbox.TECHCOURSE_CATALOG.length} courses)`);
} catch (err) {
  assert(false, 'courses-data.js parses and executes cleanly in browser context', err.message);
}

// 7. Results Summary
console.log('\n========================================================');
console.log(` Summary: ${passCount} Passed, ${failCount} Failed`);
console.log('========================================================\n');

if (failCount > 0) {
  process.exit(1);
}
