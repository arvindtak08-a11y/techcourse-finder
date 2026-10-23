/**
 * TechCourse Finder — Application Configuration
 * 
 * To connect to your Supabase backend:
 * 1. Create a free account at https://supabase.com
 * 2. Create a new project and run 'schema.sql' in the SQL Editor.
 * 3. Go to Project Settings -> API and copy your Project URL and anon public key.
 * 4. Paste them into supabaseUrl and supabaseAnonKey below.
 * 
 * IMPORTANT: NEVER put your service_role secret key here. Only use the anon public key!
 */

window.TECHCOURSE_CONFIG = {
  // Supabase Backend (Optional: If left empty, site runs in offline/local high-performance mode)
  supabaseUrl: '',
  supabaseAnonKey: '',

  // Scalability & Pagination Settings
  pageSize: 24,                   // Number of course cards rendered per page for smooth 60fps performance
  searchDebounceMs: 250,          // Keystroke debounce delay (ms) for responsive typing

  // Visitor Information Collection (Lead Prompt)
  visitorPromptDelayMs: 10000,    // 10 seconds after visitor arrival
  leadStorageKey: 'techcourse_lead_submitted_v1',
  leadDismissedKey: 'techcourse_lead_dismissed_v1'
};
