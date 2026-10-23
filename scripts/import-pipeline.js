/**
 * TechCourse Finder — Supabase Data Import Pipeline
 * 
 * Usage:
 *   1. Direct SQL file generation (Easiest for beginners):
 *      node scripts/import-pipeline.js sql
 *      (Creates data/import_courses.sql which can be pasted into Supabase SQL Editor)
 * 
 *   2. Direct Supabase API batch upload:
 *      $env:SUPABASE_URL="https://your-project.supabase.co"
 *      $env:SUPABASE_SERVICE_KEY="your-service-role-key"
 *      node scripts/import-pipeline.js upload
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '..', 'data', 'courses.json');
if (!fs.existsSync(jsonPath)) {
  console.error(`Error: courses.json not found. Run 'node scripts/generate-catalog.js' first.`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
const courses = data.courses || [];
const command = process.argv[2] || 'sql';

console.log(`\n==============================================`);
console.log(` TechCourse Finder — Supabase Import Pipeline`);
console.log(` Dataset size: ${courses.length} courses`);
console.log(`==============================================\n`);

if (command === 'sql') {
  generateSqlScript(courses);
} else if (command === 'upload') {
  uploadToSupabase(courses);
} else {
  console.log(`Unknown command: ${command}`);
  console.log(`Available commands: 'sql' or 'upload'`);
}

function escapeSql(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${String(str).replace(/'/g, "''")}'`;
}

function escapeArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  const escapedElements = arr.map(item => `"${String(item).replace(/"/g, '\\"')}"`);
  return `'${escapedElements.join(',')}'::text[]`;
}

function generateSqlScript(courseList) {
  console.log(`Generating chunked SQL batch script for ${courseList.length} courses...`);
  const outPath = path.join(__dirname, '..', 'data', 'import_courses.sql');

  const lines = [
    `-- ==============================================================================`,
    `-- TechCourse Finder — Batch Course Import Script`,
    `-- Total records: ${courseList.length}`,
    `-- Run in Supabase SQL Editor: https://app.supabase.com/project/_/sql`,
    `-- ==============================================================================\n`,
    `BEGIN;`,
    `\n-- Clear existing demo courses if needed (optional):`,
    `-- DELETE FROM public.courses WHERE id LIKE 'tc-%';\n`
  ];

  // Batch insert in chunks of 250 records for optimal PostgreSQL transaction performance
  const chunkSize = 250;
  for (let i = 0; i < courseList.length; i += chunkSize) {
    const chunk = courseList.slice(i, i + chunkSize);
    lines.push(`-- Chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} courses)`);
    lines.push(`INSERT INTO public.courses (`);
    lines.push(`    id, title, provider, category, description, level, price, price_amount,`);
    lines.push(`    currency, certificate, url, url_type, language, estimated_duration,`);
    lines.push(`    skills, prerequisites, last_verified_at, verification_status, verification_notes, art_style, art_symbol`);
    lines.push(`) VALUES`);

    const valueRows = chunk.map(c => {
      return `    (${escapeSql(c.id)}, ${escapeSql(c.title)}, ${escapeSql(c.provider)}, ${escapeSql(c.category)}, ` +
             `${escapeSql(c.description)}, ${escapeSql(c.level)}, ${escapeSql(c.price)}, ${c.price_amount || 0}, ` +
             `${escapeSql(c.currency || 'USD')}, ${escapeSql(c.certificate)}, ${escapeSql(c.url)}, ${escapeSql(c.url_type)}, ` +
             `${escapeSql(c.language || 'English')}, ${escapeSql(c.estimated_duration)}, ` +
             `${escapeArray(c.skills)}, ${escapeSql(c.prerequisites)}, ${escapeSql(c.last_verified_at)}, ` +
             `${escapeSql(c.verification_status)}, ${escapeSql(c.verification_notes)}, ${escapeSql(c.artStyle || '')}, ${escapeSql(c.artSymbol || '✦')})`;
    });

    lines.push(valueRows.join(',\n'));
    lines.push(`ON CONFLICT (id) DO UPDATE SET`);
    lines.push(`    title = EXCLUDED.title,`);
    lines.push(`    provider = EXCLUDED.provider,`);
    lines.push(`    price = EXCLUDED.price,`);
    lines.push(`    url = EXCLUDED.url,`);
    lines.push(`    last_verified_at = EXCLUDED.last_verified_at;`);
    lines.push(``);
  }

  lines.push(`COMMIT;`);
  lines.push(`\n-- Verification Query:`);
  lines.push(`SELECT category, count(*) FROM public.courses GROUP BY category ORDER BY count(*) DESC;`);

  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`[SUCCESS] Generated SQL import script: ${outPath} (${(fs.statSync(outPath).size / 1024 / 1024).toFixed(2)} MB)\n`);
}

async function uploadToSupabase(courseList) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(`[ERROR] Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.`);
    console.log(`\nTo use direct API upload:`);
    console.log(`  $env:SUPABASE_URL="https://your-project.supabase.co"`);
    console.log(`  $env:SUPABASE_SERVICE_KEY="your-service-role-key"`);
    console.log(`  node scripts/import-pipeline.js upload\n`);
    return;
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}...`);
  // Simple REST fetch to avoid mandatory npm package requirement
  const batchSize = 100;
  let uploaded = 0;

  for (let i = 0; i < courseList.length; i += batchSize) {
    const chunk = courseList.slice(i, i + batchSize).map(c => ({
      id: c.id,
      title: c.title,
      provider: c.provider,
      category: c.category,
      description: c.description,
      level: c.level,
      price: c.price,
      price_amount: c.price_amount,
      currency: c.currency,
      certificate: c.certificate,
      url: c.url,
      url_type: c.url_type,
      language: c.language,
      estimated_duration: c.estimated_duration,
      skills: c.skills,
      prerequisites: c.prerequisites,
      last_verified_at: c.last_verified_at,
      verification_status: c.verification_status,
      verification_notes: c.verification_notes,
      art_style: c.artStyle || '',
      art_symbol: c.artSymbol || '✦'
    }));

    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/courses`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(chunk)
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[ERROR] Chunk ${i}-${i + batchSize} failed: ${errText}`);
        return;
      }

      uploaded += chunk.length;
      process.stdout.write(`Uploaded ${uploaded}/${courseList.length} courses...\r`);
    } catch (err) {
      console.error(`[NETWORK ERROR]:`, err.message);
      return;
    }
  }

  console.log(`\n[SUCCESS] Successfully uploaded all ${uploaded} courses to Supabase!`);
}
