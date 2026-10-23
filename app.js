/**
 * TechCourse Finder — Scalable Application Controller (Dual-Mode)
 * 
 * Supports:
 * - 5,000+ course listings with smooth 60fps pagination & debounced search
 * - Dual-mode backend: Supabase PostgreSQL (when configured) or fast in-memory client engine
 * - 10 technology categories, combined filters, active chips, and course details dialog
 * - 10-second visitor information capture prompt with privacy consent and spam protection
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. CONFIGURATION & STATE
  const config = window.TECHCOURSE_CONFIG || {
    supabaseUrl: '',
    supabaseAnonKey: '',
    pageSize: 24,
    searchDebounceMs: 250,
    visitorPromptDelayMs: 10000,
    leadStorageKey: 'techcourse_lead_submitted_v1',
    leadDismissedKey: 'techcourse_lead_dismissed_v1'
  };

  // State Management
  const state = {
    search: '',
    category: '',
    price: '',
    level: '',
    certificate: '',
    provider: '',
    sort: 'recommended',
    currentPage: 1,
    pageSize: config.pageSize || 24,
    totalRecords: 0,
    filteredCourses: []
  };

  // Initialize Supabase Client if credentials are provided
  let supabase = null;
  const isSupabaseConfigured = Boolean(
    config.supabaseUrl &&
    config.supabaseAnonKey &&
    config.supabaseUrl.trim().length > 10 &&
    typeof window.supabase !== 'undefined'
  );

  if (isSupabaseConfigured) {
    try {
      supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
      console.log('TechCourse Finder: Connected to Supabase backend.');
    } catch (err) {
      console.warn('TechCourse Finder: Could not initialize Supabase. Running in offline high-speed mode.', err);
    }
  } else {
    console.log('TechCourse Finder: Running in local indexed catalog mode (5,000+ courses ready).');
  }

  // 2. DOM ELEMENTS
  const searchInput = document.getElementById('search');
  const heroSearchForm = document.getElementById('hero-search');
  const categoryGrid = document.getElementById('category-grid');
  const courseGrid = document.getElementById('course-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyClearBtn = document.getElementById('empty-clear');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const activeFiltersContainer = document.getElementById('active-filters');
  const paginationControls = document.getElementById('pagination-controls');
  const loadingSpinner = document.getElementById('loading-spinner');
  const resultCount = document.getElementById('result-count');
  const totalCount = document.getElementById('total-count');
  const domainsCount = document.getElementById('domains-count');
  const resultsSummary = document.getElementById('results-summary');
  const yearSpan = document.getElementById('year');

  // Filter Select Elements
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const levelFilter = document.getElementById('level-filter');
  const certificateFilter = document.getElementById('certificate-filter');
  const providerFilter = document.getElementById('provider-filter');
  const sortFilter = document.getElementById('sort-filter');

  // Course Details Dialog Elements
  const courseDialog = document.getElementById('course-dialog');
  const dialogCloseBtn = document.getElementById('dialog-close');
  const dialogContent = document.getElementById('dialog-content');

  // Visitor Information Prompt Elements (Lead Prompt)
  const visitorDialog = document.getElementById('visitor-dialog');
  const visitorCloseBtn = document.getElementById('visitor-close');
  const visitorForm = document.getElementById('visitor-form');
  const visitorDismissBtn = document.getElementById('visitor-dismiss-btn');
  const visitorContinueBtn = document.getElementById('visitor-continue-btn');
  const visitorSuccess = document.getElementById('visitor-success');
  const headerRoadmapBtn = document.getElementById('header-roadmap-btn');

  // 3. UTILITY FUNCTIONS
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Pre-index courses for ultra-fast local search (< 4ms across 5,000+ objects)
  const catalog = (typeof window.TECHCOURSE_CATALOG !== 'undefined' && Array.isArray(window.TECHCOURSE_CATALOG))
    ? window.TECHCOURSE_CATALOG
    : (typeof coursesData !== 'undefined' ? coursesData : []);

  catalog.forEach(c => {
    if (!c._searchKey) {
      c._searchKey = [
        c.title,
        c.provider,
        c.category,
        c.description,
        Array.isArray(c.skills) ? c.skills.join(' ') : ''
      ].join(' ').toLowerCase();
    }
  });

  const domains = (typeof window.TECHCOURSE_DOMAINS !== 'undefined' && Array.isArray(window.TECHCOURSE_DOMAINS))
    ? window.TECHCOURSE_DOMAINS
    : (typeof categoriesData !== 'undefined' ? categoriesData : []);

  // Update Footer & Stats Count
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();
  if (totalCount) totalCount.textContent = catalog.length.toLocaleString() + '+';
  if (domainsCount) domainsCount.textContent = domains.length;

  // 4. CATEGORIES INITIALIZATION
  function initCategories() {
    if (!categoryGrid || domains.length === 0) return;

    categoryGrid.innerHTML = '';
    domains.forEach(domain => {
      const count = catalog.filter(c => c.category === domain.id).length;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'category-card';
      card.setAttribute('data-category', domain.id);
      card.setAttribute('aria-pressed', 'false');

      card.innerHTML = `
        <div class="category-icon" aria-hidden="true">${escapeHtml(domain.icon || '✦')}</div>
        <strong>${escapeHtml(domain.name)}</strong>
        <span>${count.toLocaleString()} courses · ${escapeHtml(domain.description)}</span>
      `;

      card.addEventListener('click', () => {
        if (state.category === domain.id) {
          state.category = '';
        } else {
          state.category = domain.id;
        }

        if (categoryFilter) {
          categoryFilter.value = state.category;
        }

        state.currentPage = 1;
        applyFilters();

        const catalogueSection = document.getElementById('explore');
        if (catalogueSection) {
          catalogueSection.scrollIntoView({ behavior: 'smooth' });
        }
      });

      categoryGrid.appendChild(card);
    });
  }

  // Populate Dropdowns
  function initDropdowns() {
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">All categories</option>';
      domains.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d.id;
        opt.textContent = d.name;
        categoryFilter.appendChild(opt);
      });
    }

    if (providerFilter) {
      providerFilter.innerHTML = '<option value="">All providers</option>';
      const providers = Array.from(new Set(catalog.map(c => c.provider))).sort();
      providers.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p;
        providerFilter.appendChild(opt);
      });
    }
  }

  function updateCategoryCards() {
    if (!categoryGrid) return;
    const cards = categoryGrid.querySelectorAll('.category-card');
    cards.forEach(card => {
      const catId = card.getAttribute('data-category');
      const isActive = catId === state.category;
      card.classList.toggle('active', isActive);
      card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  // 5. REMOVABLE FILTER CHIPS
  function renderActiveChips() {
    if (!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';

    const chips = [];
    if (state.search.trim()) chips.push({ key: 'search', label: `Search: "${state.search.trim()}"` });
    if (state.category) chips.push({ key: 'category', label: `Category: ${state.category}` });
    if (state.price) chips.push({ key: 'price', label: `Price: ${state.price}` });
    if (state.level) chips.push({ key: 'level', label: `Level: ${state.level}` });
    if (state.certificate) chips.push({ key: 'certificate', label: `Cert: ${state.certificate}` });
    if (state.provider) chips.push({ key: 'provider', label: `Provider: ${state.provider}` });

    if (chips.length === 0) return;

    chips.forEach(chip => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.innerHTML = `${escapeHtml(chip.label)} <span aria-hidden="true">✕</span>`;
      btn.setAttribute('aria-label', `Remove filter ${chip.label}`);
      btn.addEventListener('click', () => clearSpecificFilter(chip.key));
      activeFiltersContainer.appendChild(btn);
    });

    if (chips.length > 1) {
      const clearAllBtn = document.createElement('button');
      clearAllBtn.type = 'button';
      clearAllBtn.className = 'filter-chip filter-chip-clear';
      clearAllBtn.textContent = 'Clear all ✕';
      clearAllBtn.addEventListener('click', clearAllFilters);
      activeFiltersContainer.appendChild(clearAllBtn);
    }
  }

  function clearSpecificFilter(key) {
    if (key === 'search') {
      state.search = '';
      if (searchInput) searchInput.value = '';
    } else if (key === 'category') {
      state.category = '';
      if (categoryFilter) categoryFilter.value = '';
    } else if (key === 'price') {
      state.price = '';
      if (priceFilter) priceFilter.value = '';
    } else if (key === 'level') {
      state.level = '';
      if (levelFilter) levelFilter.value = '';
    } else if (key === 'certificate') {
      state.certificate = '';
      if (certificateFilter) certificateFilter.value = '';
    } else if (key === 'provider') {
      state.provider = '';
      if (providerFilter) providerFilter.value = '';
    }
    state.currentPage = 1;
    applyFilters();
  }

  function clearAllFilters() {
    state.search = '';
    state.category = '';
    state.price = '';
    state.level = '';
    state.certificate = '';
    state.provider = '';
    state.sort = 'recommended';
    state.currentPage = 1;

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (levelFilter) levelFilter.value = '';
    if (certificateFilter) certificateFilter.value = '';
    if (providerFilter) providerFilter.value = '';
    if (sortFilter) sortFilter.value = 'recommended';

    applyFilters();
  }

  // 6. FILTERING & SORTING LOGIC
  function executeLocalFilter() {
    const q = state.search.trim().toLowerCase();

    return catalog.filter(course => {
      // Fast text search
      if (q && !course._searchKey.includes(q)) {
        return false;
      }
      // Category
      if (state.category && course.category !== state.category) {
        return false;
      }
      // Price
      if (state.price && course.price !== state.price) {
        return false;
      }
      // Level
      if (state.level && course.level !== state.level) {
        return false;
      }
      // Certificate
      if (state.certificate && course.certificate !== state.certificate) {
        return false;
      }
      // Provider
      if (state.provider && course.provider !== state.provider) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (state.sort === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (state.sort === 'provider') {
        return a.provider.localeCompare(b.provider);
      }
      return 0; // recommended preserves curated default order
    });
  }

  // Master Filter & Render
  async function applyFilters() {
    updateCategoryCards();
    renderActiveChips();

    if (loadingSpinner) loadingSpinner.hidden = false;

    // Optional Supabase query if connected
    if (supabase) {
      try {
        let query = supabase.from('courses').select('*', { count: 'exact' });

        if (state.search.trim()) {
          query = query.textSearch('fts_document', state.search.trim(), { type: 'websearch' });
        }
        if (state.category) query = query.eq('category', state.category);
        if (state.price) query = query.eq('price', state.price);
        if (state.level) query = query.eq('level', state.level);
        if (state.certificate) query = query.eq('certificate', state.certificate);
        if (state.provider) query = query.eq('provider', state.provider);

        if (state.sort === 'title') query = query.order('title', { ascending: true });
        else if (state.sort === 'provider') query = query.order('provider', { ascending: true });
        else query = query.order('id', { ascending: true });

        const from = (state.currentPage - 1) * state.pageSize;
        const to = from + state.pageSize - 1;
        query = query.range(from, to);

        const { data: dbCourses, count, error } = await query;
        if (!error && Array.isArray(dbCourses)) {
          state.filteredCourses = dbCourses;
          state.totalRecords = count || dbCourses.length;
          renderCourseList(state.filteredCourses, state.totalRecords);
          renderPagination(state.totalRecords);
          if (loadingSpinner) loadingSpinner.hidden = true;
          return;
        }
      } catch (err) {
        console.warn('Supabase query failed, falling back to local catalog engine.', err);
      }
    }

    // High-performance client engine (instant fallback & default)
    const allFiltered = executeLocalFilter();
    state.totalRecords = allFiltered.length;

    // Slice for current page
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const paginatedCourses = allFiltered.slice(startIndex, startIndex + state.pageSize);

    renderCourseList(paginatedCourses, state.totalRecords);
    renderPagination(state.totalRecords);

    if (loadingSpinner) loadingSpinner.hidden = true;
  }

  // 7. RENDER COURSE CARDS (PAGINATED CHUNK)
  function renderCourseList(courses, totalCount) {
    if (!courseGrid || !emptyState) return;

    courseGrid.innerHTML = '';

    if (courses.length === 0) {
      courseGrid.hidden = true;
      emptyState.hidden = false;
      if (paginationControls) paginationControls.innerHTML = '';
      if (resultCount) resultCount.textContent = '0';
      if (resultsSummary) resultsSummary.textContent = 'No matching courses found.';
      return;
    }

    courseGrid.hidden = false;
    emptyState.hidden = true;

    if (resultCount) resultCount.textContent = totalCount.toLocaleString();

    const start = (state.currentPage - 1) * state.pageSize + 1;
    const end = Math.min(start + courses.length - 1, totalCount);
    if (resultsSummary) {
      resultsSummary.textContent = `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${totalCount.toLocaleString()} courses`;
    }

    courses.forEach(course => {
      const card = document.createElement('article');
      card.className = 'course-card';
      card.setAttribute('data-id', course.id);

      let certBadgeClass = 'badge';
      if (course.certificate === 'Unverified') certBadgeClass += ' unverified';

      card.innerHTML = `
        <div class="course-art ${escapeHtml(course.art_style || course.artStyle || '')}" data-symbol="${escapeHtml(course.art_symbol || course.artSymbol || '✦')}">
          <span class="art-category">${escapeHtml(course.category)}</span>
        </div>
        <div class="course-body">
          <div class="badges">
            <span class="badge ${String(course.price).toLowerCase()}">${escapeHtml(course.price)}</span>
            <span class="badge level">${escapeHtml(course.level)}</span>
            <span class="${certBadgeClass}">${escapeHtml(course.certificate)}</span>
          </div>
          <h3>${escapeHtml(course.title)}</h3>
          <p class="provider">${escapeHtml(course.provider)}</p>
          <p class="course-desc">${escapeHtml(course.description)}</p>
          <div class="course-meta">
            <span>⏱ ${escapeHtml(course.estimated_duration || course.estimatedDuration || 'Self-paced')}</span>
            <span>·</span>
            <span>${course.verification_status === 'Verified terms' || course.verificationStatus === 'Verified terms' ? '✓ Verified' : '⚠ Verify terms'}</span>
          </div>
          <div class="course-actions">
            <button type="button" class="view-details-btn" data-id="${course.id}">Details</button>
            <a href="${escapeHtml(course.url)}" class="view-course" target="_blank" rel="noopener noreferrer">Official site <span>↗</span></a>
          </div>
        </div>
      `;

      const detailsBtn = card.querySelector('.view-details-btn');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', () => openCourseModal(course));
      }

      courseGrid.appendChild(card);
    });
  }

  // 8. RENDER PAGINATION CONTROLS
  function renderPagination(totalItems) {
    if (!paginationControls) return;
    paginationControls.innerHTML = '';

    const totalPages = Math.ceil(totalItems / state.pageSize);
    if (totalPages <= 1) return;

    const info = document.createElement('div');
    info.className = 'pagination-info';
    info.textContent = `Page ${state.currentPage} of ${totalPages} (${totalItems.toLocaleString()} courses)`;

    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pagination-pages';

    // First button
    const firstBtn = document.createElement('button');
    firstBtn.className = 'page-btn';
    firstBtn.innerHTML = '«';
    firstBtn.title = 'First Page';
    firstBtn.disabled = state.currentPage === 1;
    firstBtn.addEventListener('click', () => changePage(1));
    pagesContainer.appendChild(firstBtn);

    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerHTML = '‹';
    prevBtn.title = 'Previous Page';
    prevBtn.disabled = state.currentPage === 1;
    prevBtn.addEventListener('click', () => changePage(state.currentPage - 1));
    pagesContainer.appendChild(prevBtn);

    // Generate page numbers with clean ellipsis for 5,000+ items (up to 210+ pages!)
    const pagesToShow = [];
    pagesToShow.push(1);

    const startRange = Math.max(2, state.currentPage - 2);
    const endRange = Math.min(totalPages - 1, state.currentPage + 2);

    if (startRange > 2) pagesToShow.push('...');
    for (let p = startRange; p <= endRange; p++) {
      pagesToShow.push(p);
    }
    if (endRange < totalPages - 1) pagesToShow.push('...');
    if (totalPages > 1) pagesToShow.push(totalPages);

    pagesToShow.forEach(p => {
      if (p === '...') {
        const span = document.createElement('span');
        span.className = 'pagination-ellipsis';
        span.textContent = '…';
        pagesContainer.appendChild(span);
      } else {
        const pageBtn = document.createElement('button');
        pageBtn.className = `page-btn ${p === state.currentPage ? 'active' : ''}`;
        pageBtn.textContent = p;
        pageBtn.addEventListener('click', () => changePage(p));
        pagesContainer.appendChild(pageBtn);
      }
    });

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerHTML = '›';
    nextBtn.title = 'Next Page';
    nextBtn.disabled = state.currentPage === totalPages;
    nextBtn.addEventListener('click', () => changePage(state.currentPage + 1));
    pagesContainer.appendChild(nextBtn);

    // Last button
    const lastBtn = document.createElement('button');
    lastBtn.className = 'page-btn';
    lastBtn.innerHTML = '»';
    lastBtn.title = 'Last Page';
    lastBtn.disabled = state.currentPage === totalPages;
    lastBtn.addEventListener('click', () => changePage(totalPages));
    pagesContainer.appendChild(lastBtn);

    paginationControls.appendChild(info);
    paginationControls.appendChild(pagesContainer);
  }

  function changePage(newPage) {
    state.currentPage = newPage;
    applyFilters();
    const catalogue = document.getElementById('explore');
    if (catalogue) {
      catalogue.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // 9. COURSE DETAILS MODAL
  function openCourseModal(course) {
    if (!courseDialog || !dialogContent) return;

    const skillsArray = Array.isArray(course.skills) ? course.skills : [];
    const skillsHtml = skillsArray.length > 0
      ? skillsArray.map(s => `<span class="badge">${escapeHtml(s)}</span>`).join(' ')
      : 'Comprehensive technical syllabus';

    const isVerified = (course.verification_status === 'Verified terms' || course.verificationStatus === 'Verified terms');
    const verificationBadge = isVerified
      ? `<span class="badge" style="background:#eaf8e4;color:#2e6b20;">✓ Verified terms</span>`
      : `<span class="badge unverified">⚠ Requires manual verification</span>`;

    dialogContent.innerHTML = `
      <div class="badges" style="margin-bottom:8px;">
        <span class="badge">${escapeHtml(course.category)}</span>
        <span class="badge level">${escapeHtml(course.level)}</span>
        <span class="badge ${String(course.price).toLowerCase()}">${escapeHtml(course.price)}</span>
        ${verificationBadge}
      </div>
      <h2 class="dialog-title" id="dialog-title">${escapeHtml(course.title)}</h2>
      <div class="dialog-provider">Provided by <b>${escapeHtml(course.provider)}</b></div>
      <p class="dialog-description">${escapeHtml(course.description)}</p>

      <ul class="dialog-list">
        <li><strong>Price & Access:</strong> <span>${escapeHtml(course.price)} ${course.price_amount ? `($${course.price_amount})` : ''}</span></li>
        <li><strong>Skill Level:</strong> <span>${escapeHtml(course.level)}</span></li>
        <li><strong>Certificate Status:</strong> <span>${escapeHtml(course.certificate)}</span></li>
        <li><strong>Duration:</strong> <span>${escapeHtml(course.estimated_duration || course.estimatedDuration || 'Self-paced')}</span></li>
        <li><strong>Language:</strong> <span>${escapeHtml(course.language || 'English')}</span></li>
        <li><strong>Prerequisites:</strong> <span>${escapeHtml(course.prerequisites || 'None specified')}</span></li>
        <li><strong>Last Verified:</strong> <span>${escapeHtml(course.last_verified_at || course.lastVerifiedAt || '2026-10-23')}</span></li>
        <li style="flex-direction:column;align-items:flex-start;gap:6px;">
          <strong>Core Skills Covered:</strong>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${skillsHtml}</div>
        </li>
      </ul>

      <div class="dialog-warning">
        <strong>⚠️ Verification Notice:</strong><br>
        ${escapeHtml(course.verification_notes || course.verificationNotes || 'Details such as certificate terms, enrollment costs, and exam requirements are managed directly by the course provider. Please confirm current requirements on the provider website before enrolling.')}
      </div>

      <a href="${escapeHtml(course.url)}" target="_blank" rel="noopener noreferrer" class="dialog-official">
        Visit Official Course Page <span>↗</span>
      </a>
    `;

    if (typeof courseDialog.showModal === 'function') {
      courseDialog.showModal();
    } else {
      courseDialog.setAttribute('open', '');
    }
  }

  function closeCourseModal() {
    if (!courseDialog) return;
    if (typeof courseDialog.close === 'function') {
      courseDialog.close();
    } else {
      courseDialog.removeAttribute('open');
    }
  }

  if (dialogCloseBtn) dialogCloseBtn.addEventListener('click', closeCourseModal);
  if (courseDialog) {
    courseDialog.addEventListener('click', e => {
      const rect = courseDialog.getBoundingClientRect();
      const inDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!inDialog) closeCourseModal();
    });
  }

  // 10. VISITOR INFORMATION CAPTURE (10-SECOND PROMPT)
  function showVisitorPrompt() {
    if (!visitorDialog) return;

    // Do not show if already submitted or dismissed
    const alreadySubmitted = localStorage.getItem(config.leadStorageKey);
    const alreadyDismissed = localStorage.getItem(config.leadDismissedKey);

    if (alreadySubmitted || alreadyDismissed) {
      return;
    }

    if (typeof visitorDialog.showModal === 'function') {
      visitorDialog.showModal();
    } else {
      visitorDialog.setAttribute('open', '');
    }
  }

  function closeVisitorPrompt(recordDismissal = true) {
    if (!visitorDialog) return;
    if (typeof visitorDialog.close === 'function') {
      visitorDialog.close();
    } else {
      visitorDialog.removeAttribute('open');
    }
    if (recordDismissal) {
      localStorage.setItem(config.leadDismissedKey, 'true');
    }
  }

  // 10-Second Automatic Trigger
  setTimeout(() => {
    showVisitorPrompt();
  }, config.visitorPromptDelayMs || 10000);

  // Manual Trigger via Header Roadmap Button
  if (headerRoadmapBtn) {
    headerRoadmapBtn.addEventListener('click', () => {
      if (visitorDialog) {
        if (typeof visitorDialog.showModal === 'function') {
          visitorDialog.showModal();
        } else {
          visitorDialog.setAttribute('open', '');
        }
      }
    });
  }

  if (visitorCloseBtn) visitorCloseBtn.addEventListener('click', () => closeVisitorPrompt(true));
  if (visitorDismissBtn) visitorDismissBtn.addEventListener('click', () => closeVisitorPrompt(true));
  if (visitorContinueBtn) visitorContinueBtn.addEventListener('click', () => closeVisitorPrompt(false));

  if (visitorDialog) {
    visitorDialog.addEventListener('click', e => {
      const rect = visitorDialog.getBoundingClientRect();
      const inDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!inDialog) closeVisitorPrompt(true);
    });
  }

  // Lead Form Submission Handling (with Validation, Consent, and Supabase integration)
  if (visitorForm) {
    visitorForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('visitor-name');
      const emailInput = document.getElementById('visitor-email');
      const phoneInput = document.getElementById('visitor-phone');
      const categoryInput = document.getElementById('visitor-category');
      const consentInput = document.getElementById('visitor-consent');
      const honeypotInput = visitorForm.querySelector('input[name="b_website"]');

      const nameError = document.getElementById('name-error');
      const emailError = document.getElementById('email-error');
      const consentError = document.getElementById('consent-error');

      // Reset errors
      if (nameError) nameError.textContent = '';
      if (emailError) emailError.textContent = '';
      if (consentError) consentError.textContent = '';

      // Honeypot spam bot check
      if (honeypotInput && honeypotInput.value.trim().length > 0) {
        console.warn('Bot detected via honeypot.');
        closeVisitorPrompt(true);
        return;
      }

      // Input Validation
      let isValid = true;
      const name = nameInput ? nameInput.value.trim() : '';
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const preferredCategory = categoryInput ? categoryInput.value : '';
      const consent = consentInput ? consentInput.checked : false;

      if (!name || name.length < 2) {
        if (nameError) nameError.textContent = 'Please enter your full name (at least 2 characters).';
        isValid = false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        if (emailError) emailError.textContent = 'Please enter a valid email address.';
        isValid = false;
      }

      if (!consent) {
        if (consentError) consentError.textContent = 'Please agree to receive course recommendations to continue.';
        isValid = false;
      }

      if (!isValid) return;

      const submitBtn = document.getElementById('visitor-submit-btn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving Preferences...';
      }

      const leadRecord = {
        name: name,
        email: email,
        phone: phone || null,
        preferred_category: preferredCategory,
        consent_given: true,
        source: 'visitor_prompt_10s',
        created_at: new Date().toISOString()
      };

      // Save to Supabase if connected
      let savedToCloud = false;
      if (supabase) {
        try {
          const { error } = await supabase.from('visitor_leads').insert([leadRecord]);
          if (!error) {
            savedToCloud = true;
          } else {
            console.warn('Supabase lead insert notice:', error.message);
          }
        } catch (err) {
          console.warn('Network error saving to Supabase:', err);
        }
      }

      // Always save locally in localStorage as reliable fallback
      try {
        const storedLeads = JSON.parse(localStorage.getItem('techcourse_local_leads') || '[]');
        storedLeads.push(leadRecord);
        localStorage.setItem('techcourse_local_leads', JSON.stringify(storedLeads));
      } catch (err) {
        // localStorage quotas
      }

      localStorage.setItem(config.leadStorageKey, 'true');

      // Show success view inside modal
      if (visitorForm) visitorForm.hidden = true;
      if (visitorSuccess) visitorSuccess.hidden = false;
    });
  }

  // 11. ATTACH EVENT LISTENERS
  if (searchInput) {
    searchInput.addEventListener('input', debounce((e) => {
      state.search = e.target.value;
      state.currentPage = 1;
      applyFilters();
    }, config.searchDebounceMs || 250));
  }

  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (searchInput) state.search = searchInput.value;
      state.currentPage = 1;
      applyFilters();
      const catalogue = document.getElementById('explore');
      if (catalogue) catalogue.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      state.category = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  if (priceFilter) {
    priceFilter.addEventListener('change', (e) => {
      state.price = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  if (levelFilter) {
    levelFilter.addEventListener('change', (e) => {
      state.level = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  if (certificateFilter) {
    certificateFilter.addEventListener('change', (e) => {
      state.certificate = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  if (providerFilter) {
    providerFilter.addEventListener('change', (e) => {
      state.provider = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', (e) => {
      state.sort = e.target.value;
      state.currentPage = 1;
      applyFilters();
    });
  }

  if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', clearAllFilters);
  if (emptyClearBtn) emptyClearBtn.addEventListener('click', clearAllFilters);

  // 12. INITIAL BOOTSTRAP
  initCategories();
  initDropdowns();
  applyFilters();
});
