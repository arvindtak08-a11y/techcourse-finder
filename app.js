/**
 * TechCourse Finder — Application Logic
 * Pure JavaScript: no dependencies, fast, maintainable, and beginner-friendly.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const searchInput = document.getElementById('search');
  const heroSearchForm = document.getElementById('hero-search');
  const categoryGrid = document.getElementById('category-grid');
  const courseGrid = document.getElementById('course-grid');
  const emptyState = document.getElementById('empty-state');
  const emptyClearBtn = document.getElementById('empty-clear');
  const clearFiltersBtn = document.getElementById('clear-filters');
  const activeFiltersContainer = document.getElementById('active-filters');
  const resultCount = document.getElementById('result-count');
  const totalCount = document.getElementById('total-count');
  const resultsSummary = document.getElementById('results-summary');
  const yearSpan = document.getElementById('year');

  // Filter Dropdowns
  const categoryFilter = document.getElementById('category-filter');
  const priceFilter = document.getElementById('price-filter');
  const levelFilter = document.getElementById('level-filter');
  const certificateFilter = document.getElementById('certificate-filter');
  const providerFilter = document.getElementById('provider-filter');
  const sortFilter = document.getElementById('sort-filter');

  // Dialog Elements
  const courseDialog = document.getElementById('course-dialog');
  const dialogCloseBtn = document.getElementById('dialog-close');
  const dialogContent = document.getElementById('dialog-content');

  // Application State
  const state = {
    search: '',
    category: '',
    price: '',
    level: '',
    certificate: '',
    provider: '',
    sort: 'recommended'
  };

  // Helper: Escape HTML to prevent injection
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Set Current Year in Footer
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Set Total Listings Count in Stats Row
  if (totalCount && typeof coursesData !== 'undefined') {
    totalCount.textContent = coursesData.length;
  }

  // Populate Categories in the "Explore by Interest" Section
  function initCategories() {
    if (!categoryGrid || typeof categoriesData === 'undefined') return;

    categoryGrid.innerHTML = '';
    categoriesData.forEach(cat => {
      // Calculate course count for this category
      const count = coursesData.filter(c => c.category === cat.id).length;

      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'category-card';
      card.setAttribute('data-category', cat.id);
      card.setAttribute('aria-pressed', 'false');

      card.innerHTML = `
        <div class="category-icon" aria-hidden="true">${escapeHtml(cat.icon)}</div>
        <strong>${escapeHtml(cat.name)}</strong>
        <span>${count} course${count === 1 ? '' : 's'} · ${escapeHtml(cat.description)}</span>
      `;

      card.addEventListener('click', () => {
        // Toggle category: if already selected, clear it; otherwise, select it
        if (state.category === cat.id) {
          state.category = '';
        } else {
          state.category = cat.id;
        }

        if (categoryFilter) {
          categoryFilter.value = state.category;
        }

        applyFilters();

        // Smooth scroll to the catalogue section
        const catalogue = document.getElementById('explore');
        if (catalogue) {
          catalogue.scrollIntoView({ behavior: 'smooth' });
        }
      });

      categoryGrid.appendChild(card);
    });
  }

  // Populate Dropdown Selects (Category & Provider)
  function initDropdowns() {
    if (typeof coursesData === 'undefined') return;

    // Populate Category Filter dropdown
    if (categoryFilter && typeof categoriesData !== 'undefined') {
      // Preserve first option ("All categories")
      categoryFilter.innerHTML = '<option value="">All categories</option>';
      categoriesData.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categoryFilter.appendChild(option);
      });
    }

    // Populate Provider Filter dropdown with sorted unique providers
    if (providerFilter) {
      providerFilter.innerHTML = '<option value="">All providers</option>';
      const providers = Array.from(new Set(coursesData.map(c => c.provider))).sort();
      providers.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        providerFilter.appendChild(option);
      });
    }
  }

  // Highlight Active Category Card in Category Grid
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

  // Render Removable Active Filter Chips
  function renderActiveChips() {
    if (!activeFiltersContainer) return;
    activeFiltersContainer.innerHTML = '';

    const chips = [];

    if (state.search.trim()) {
      chips.push({ key: 'search', label: `Search: "${state.search.trim()}"` });
    }
    if (state.category) {
      chips.push({ key: 'category', label: `Category: ${state.category}` });
    }
    if (state.price) {
      chips.push({ key: 'price', label: `Price: ${state.price}` });
    }
    if (state.level) {
      chips.push({ key: 'level', label: `Level: ${state.level}` });
    }
    if (state.certificate) {
      chips.push({ key: 'certificate', label: `Cert: ${state.certificate}` });
    }
    if (state.provider) {
      chips.push({ key: 'provider', label: `Provider: ${state.provider}` });
    }

    if (chips.length === 0) {
      return;
    }

    chips.forEach(chip => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-chip';
      btn.innerHTML = `${escapeHtml(chip.label)} <span aria-hidden="true">✕</span>`;
      btn.setAttribute('aria-label', `Remove filter ${chip.label}`);
      btn.addEventListener('click', () => {
        clearSpecificFilter(chip.key);
      });
      activeFiltersContainer.appendChild(btn);
    });

    // Add "Clear all" chip if 2 or more filters are active
    if (chips.length > 1) {
      const clearAllBtn = document.createElement('button');
      clearAllBtn.type = 'button';
      clearAllBtn.className = 'filter-chip filter-chip-clear';
      clearAllBtn.textContent = 'Clear all ✕';
      clearAllBtn.addEventListener('click', clearAllFilters);
      activeFiltersContainer.appendChild(clearAllBtn);
    }
  }

  // Clear a specific filter
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
    applyFilters();
  }

  // Clear all filters
  function clearAllFilters() {
    state.search = '';
    state.category = '';
    state.price = '';
    state.level = '';
    state.certificate = '';
    state.provider = '';
    state.sort = 'recommended';

    if (searchInput) searchInput.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (priceFilter) priceFilter.value = '';
    if (levelFilter) levelFilter.value = '';
    if (certificateFilter) certificateFilter.value = '';
    if (providerFilter) providerFilter.value = '';
    if (sortFilter) sortFilter.value = 'recommended';

    applyFilters();
  }

  // Filter & Sort Courses
  function getFilteredCourses() {
    if (typeof coursesData === 'undefined') return [];

    const query = state.search.trim().toLowerCase();

    return coursesData.filter(course => {
      // 1. Text Search: matches title, provider, category, description, or skills
      if (query) {
        const titleMatch = course.title.toLowerCase().includes(query);
        const providerMatch = course.provider.toLowerCase().includes(query);
        const categoryMatch = course.category.toLowerCase().includes(query);
        const descMatch = course.description.toLowerCase().includes(query);
        const skillsMatch = Array.isArray(course.skills) && course.skills.some(s => s.toLowerCase().includes(query));

        if (!titleMatch && !providerMatch && !categoryMatch && !descMatch && !skillsMatch) {
          return false;
        }
      }

      // 2. Category Filter
      if (state.category && course.category !== state.category) {
        return false;
      }

      // 3. Price Filter (Free / Paid)
      if (state.price && course.price !== state.price) {
        return false;
      }

      // 4. Skill Level Filter (Beginner / Intermediate / Advanced)
      if (state.level && course.level !== state.level) {
        return false;
      }

      // 5. Certificate Status Filter (Certificate available / Unverified / No certificate)
      if (state.certificate && course.certificate !== state.certificate) {
        return false;
      }

      // 6. Provider Filter
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
      // 'recommended' retains default curated catalog ordering
      return 0;
    });
  }

  // Render Course Cards
  function renderCourses(courses) {
    if (!courseGrid || !emptyState) return;

    courseGrid.innerHTML = '';

    if (courses.length === 0) {
      courseGrid.hidden = true;
      emptyState.hidden = false;
      if (resultCount) resultCount.textContent = '0';
      if (resultsSummary) resultsSummary.textContent = 'No matching courses found.';
      return;
    }

    courseGrid.hidden = false;
    emptyState.hidden = true;

    if (resultCount) {
      resultCount.textContent = courses.length;
    }
    if (resultsSummary) {
      resultsSummary.textContent = `Showing ${courses.length} of ${coursesData.length} courses`;
    }

    courses.forEach(course => {
      const card = document.createElement('article');
      card.className = 'course-card';
      card.setAttribute('data-id', course.id);

      // Certificate badge class styling
      let certBadgeClass = 'badge';
      if (course.certificate === 'Unverified') {
        certBadgeClass += ' unverified';
      }

      card.innerHTML = `
        <div class="course-art ${escapeHtml(course.artStyle || '')}" data-symbol="${escapeHtml(course.artSymbol || '✦')}">
          <span class="art-category">${escapeHtml(course.category)}</span>
        </div>
        <div class="course-body">
          <div class="badges">
            <span class="badge ${course.price.toLowerCase()}">${escapeHtml(course.price)}</span>
            <span class="badge level">${escapeHtml(course.level)}</span>
            <span class="${certBadgeClass}">${escapeHtml(course.certificate)}</span>
          </div>
          <h3>${escapeHtml(course.title)}</h3>
          <p class="provider">${escapeHtml(course.provider)}</p>
          <p class="course-desc">${escapeHtml(course.description)}</p>
          <div class="course-meta">
            <span>⏱ ${escapeHtml(course.estimatedDuration)}</span>
            <span>·</span>
            <span>${course.verificationStatus === 'Verified terms' ? '✓ Verified' : '⚠ Verify terms'}</span>
          </div>
          <div class="course-actions">
            <button type="button" class="view-details-btn" data-id="${course.id}">Details</button>
            <a href="${escapeHtml(course.url)}" class="view-course" target="_blank" rel="noopener noreferrer">Official site <span>↗</span></a>
          </div>
        </div>
      `;

      // Details button event listener
      const detailsBtn = card.querySelector('.view-details-btn');
      if (detailsBtn) {
        detailsBtn.addEventListener('click', () => {
          openCourseModal(course);
        });
      }

      courseGrid.appendChild(card);
    });
  }

  // Open Course Details Modal Dialog
  function openCourseModal(course) {
    if (!courseDialog || !dialogContent) return;

    const skillsHtml = Array.isArray(course.skills)
      ? course.skills.map(s => `<span class="badge">${escapeHtml(s)}</span>`).join(' ')
      : 'General technical foundation';

    const verificationBadge = course.verificationStatus === 'Verified terms'
      ? `<span class="badge" style="background:#eaf8e4;color:#2e6b20;">✓ Verified terms</span>`
      : `<span class="badge unverified">⚠ Requires manual verification</span>`;

    dialogContent.innerHTML = `
      <div class="badges" style="margin-bottom:8px;">
        <span class="badge">${escapeHtml(course.category)}</span>
        <span class="badge level">${escapeHtml(course.level)}</span>
        <span class="badge">${escapeHtml(course.price)}</span>
        ${verificationBadge}
      </div>
      <h2 class="dialog-title" id="dialog-title">${escapeHtml(course.title)}</h2>
      <div class="dialog-provider">Provided by <b>${escapeHtml(course.provider)}</b></div>
      <p class="dialog-description">${escapeHtml(course.description)}</p>

      <ul class="dialog-list">
        <li><strong>Price & Access:</strong> <span>${escapeHtml(course.price)}</span></li>
        <li><strong>Skill Level:</strong> <span>${escapeHtml(course.level)}</span></li>
        <li><strong>Certificate:</strong> <span>${escapeHtml(course.certificate)}</span></li>
        <li><strong>Duration:</strong> <span>${escapeHtml(course.estimatedDuration)}</span></li>
        <li><strong>Prerequisites:</strong> <span>${escapeHtml(course.prerequisites || 'None specified')}</span></li>
        <li><strong>Last Checked:</strong> <span>${escapeHtml(course.lastVerifiedAt || 'Pending verification')}</span></li>
        <li style="flex-direction:column;align-items:flex-start;gap:6px;">
          <strong>Key Topics Covered:</strong>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">${skillsHtml}</div>
        </li>
      </ul>

      <div class="dialog-warning">
        <strong>⚠️ Verification Notice:</strong><br>
        ${escapeHtml(course.verificationNotes || 'Details such as certificate terms, enrollment costs, and syllabus are determined directly by the course provider. Please confirm current requirements on the provider website before enrolling.')}
      </div>

      <a href="${escapeHtml(course.url)}" target="_blank" rel="noopener noreferrer" class="dialog-official">
        Visit Official Course Page <span>↗</span>
      </a>
    `;

    // Show native dialog modal
    if (typeof courseDialog.showModal === 'function') {
      courseDialog.showModal();
    } else {
      courseDialog.setAttribute('open', '');
    }
  }

  // Close Dialog handler
  function closeCourseModal() {
    if (!courseDialog) return;
    if (typeof courseDialog.close === 'function') {
      courseDialog.close();
    } else {
      courseDialog.removeAttribute('open');
    }
  }

  if (dialogCloseBtn) {
    dialogCloseBtn.addEventListener('click', closeCourseModal);
  }

  // Close dialog on clicking outside the modal box (on backdrop)
  if (courseDialog) {
    courseDialog.addEventListener('click', e => {
      const rect = courseDialog.getBoundingClientRect();
      const isInDialog = (
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width
      );
      if (!isInDialog) {
        closeCourseModal();
      }
    });
  }

  // Master Filter & Render Trigger
  function applyFilters() {
    updateCategoryCards();
    renderActiveChips();
    const filtered = getFilteredCourses();
    renderCourses(filtered);
  }

  // Attach Event Listeners

  // 1. Live Search Input
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.search = e.target.value;
      applyFilters();
    });
  }

  // 2. Hero Search Form Submit
  if (heroSearchForm) {
    heroSearchForm.addEventListener('submit', e => {
      e.preventDefault();
      if (searchInput) {
        state.search = searchInput.value;
      }
      applyFilters();
      const catalogue = document.getElementById('explore');
      if (catalogue) {
        catalogue.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // 3. Dropdowns
  if (categoryFilter) {
    categoryFilter.addEventListener('change', e => {
      state.category = e.target.value;
      applyFilters();
    });
  }

  if (priceFilter) {
    priceFilter.addEventListener('change', e => {
      state.price = e.target.value;
      applyFilters();
    });
  }

  if (levelFilter) {
    levelFilter.addEventListener('change', e => {
      state.level = e.target.value;
      applyFilters();
    });
  }

  if (certificateFilter) {
    certificateFilter.addEventListener('change', e => {
      state.certificate = e.target.value;
      applyFilters();
    });
  }

  if (providerFilter) {
    providerFilter.addEventListener('change', e => {
      state.provider = e.target.value;
      applyFilters();
    });
  }

  if (sortFilter) {
    sortFilter.addEventListener('change', e => {
      state.sort = e.target.value;
      applyFilters();
    });
  }

  // 4. Clear Filters Buttons
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', clearAllFilters);
  }

  if (emptyClearBtn) {
    emptyClearBtn.addEventListener('click', clearAllFilters);
  }

  // Initial Boot
  initCategories();
  initDropdowns();
  applyFilters();
});
