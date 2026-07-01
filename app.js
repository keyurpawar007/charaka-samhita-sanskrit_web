/*
  =========================================
  DIGITAL SANSKRIT SCRIPTURE LIBRARY
  Client-side SPA Core Controller and Audio Synthesizer
  =========================================
*/

document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Core Subsystems
  initTheme();
  initGoldenParticles();
  initAmbientSynthesizer();
  initMobileMenu();
  
  // Load mappings dynamically before routing starts
  await loadAudioMappings();
  initRouting();
});

/* ==========================================================================
   1. ROUTER & VIEW RENDERING
   ========================================================================== */

function initRouting() {
  window.addEventListener("hashchange", handleRouting);
  // Initial load
  handleRouting();
}

function handleRouting() {
  const hash = window.location.hash || "#home";
  const appViewport = document.getElementById("app-viewport");
  
  // Close mobile nav if open
  document.getElementById("main-navigation").classList.remove("open");
  
  // Update nav active states
  updateActiveNavLink(hash);
  
  // Simple view router matching
  if (hash === "#home") {
    renderHomeView(appViewport);
  } else if (hash === "#scriptures") {
    renderScripturesView(appViewport);
  } else if (hash.startsWith("#scripture/")) {
    const scriptureId = hash.split("/")[1];
    renderScriptureDetailView(appViewport, scriptureId);
  } else if (hash.startsWith("#adhyaya/")) {
    const parts = hash.split("/");
    const scriptureId = parts[1];
    const adhyayaNum = parseInt(parts[2], 10);
    renderAdhyayaView(appViewport, scriptureId, adhyayaNum);
  } else if (hash === "#audio") {
    renderAudioView(appViewport);
  } else if (hash === "#search") {
    renderSearchView(appViewport);
  } else if (hash === "#bookmarks") {
    renderBookmarksView(appViewport);
  } else if (hash === "#sandhi-diff") {
    renderSandhiDiffView(appViewport);
  } else if (hash === "#about") {
    renderAboutView(appViewport);
  } else if (hash === "#audio-mapper") {
    renderAudioMapperView(appViewport);
  } else {
    // Fallback
    renderHomeView(appViewport);
  }
  
  // Scroll to top of viewport
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateActiveNavLink(hash) {
  const links = document.querySelectorAll(".nav-link");
  links.forEach(link => {
    const href = link.getAttribute("href");
    if (hash === href || (hash.startsWith("#scripture") && href === "#scriptures")) {
      link.classList.add("active");
    } else if (hash.startsWith("#adhyaya") && href === "#scriptures") {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

/* ==========================================================================
   2. VIEW BUILDERS
   ========================================================================== */

// --- LANDING / HOME VIEW ---
function renderHomeView(container) {
  container.innerHTML = `
    <section class="view-section container">
      <!-- Grand Hero Section -->
      <div class="hero-section" style="background-image: url('assets/hero_temple_library.jpg');">
        <div class="hero-overlay">
          <span class="hero-tagline">धर्मार्थकाममोक्षाणामारोग्यं मूलमुत्तमम्</span>
          <h2 class="hero-title">चरक संहिता<br>Sutra Sthana</h2>
          <p class="hero-subtitle">"Explore the foundational text of Ayurveda — study authentic Sanskrit shlokas with Sandhi analysis, translations, and audio recitations."</p>
          <div class="hero-actions">
            <button class="btn-primary" onclick="window.location.hash='#scriptures'">
              <i class="fa-solid fa-book-open"></i> Browse Adhyayas
            </button>
            <button class="btn-secondary" onclick="window.location.hash='#about'">
              <i class="fa-solid fa-circle-info"></i> About Charaka Samhita
            </button>
          </div>
        </div>
      </div>

      <!-- Welcome Quote -->
      <div class="scripture-header">
        <span class="om-symbol" style="font-size: 3rem;">ॐ</span>
        <h3 class="sanskrit-text" style="font-size: 1.8rem; margin: 1rem 0;">
          हिताहितं सुखं दुःखमायुस्तस्य हिताहितम् ।<br>
          मानं च तच्च यत्रोक्तमायुर्वेदः स उच्यते ॥
        </h3>
        <p class="shloka-translation" style="text-align: center;">
          "That science is called Ayurveda which describes what is beneficial and harmful for life, what constitutes happy and unhappy life, the measure of life, and life itself." — Charaka Samhita 1.3
        </p>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
      </div>

      <!-- Featured Bookshelf -->
      <h3 class="section-headline">Adhyayas (Chapters)</h3>
      <div class="library-grid" id="featured-bookshelf"></div>

      <!-- Bookmarks & Recents Split Layout -->
      <div class="home-split-row">
        <!-- Recently Viewed Panel -->
        <div class="side-panel">
          <div class="panel-header">
            <i class="fa-solid fa-clock-rotate-left"></i>
            <span>Recently Studied</span>
          </div>
          <div class="panel-list" id="recent-studies-list">
            <!-- Loaded dynamically -->
          </div>
        </div>

        <!-- Bookmarks Quick Access Panel -->
        <div class="side-panel">
          <div class="panel-header">
            <i class="fa-solid fa-star"></i>
            <span>Saved Verses</span>
          </div>
          <div class="panel-list" id="bookmarked-shlokas-list">
            <!-- Loaded dynamically -->
          </div>
        </div>
      </div>
    </section>
  `;
  
  // Render Scripture Cards
  const shelf = document.getElementById("featured-bookshelf");
  SCRIPTURE_DB.scriptures.forEach(scrip => {
    shelf.appendChild(createScriptureCard(scrip));
  });

  // Render Lists
  renderRecentStudies();
  renderBookmarkedVersesPanel();
}

// --- SCRIPTURES DIRECTORY VIEW ---
function renderScripturesView(container) {
  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">Charaka Samhita — Sutra Sthana</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
        <p class="scripture-desc">Browse all 15 chapters of the Charaka Samhita Sutra Sthana. Each chapter is fully annotated with grammatical sandhi breakdowns and audio recitations.</p>
      </div>

      <div class="library-grid" id="full-library-grid"></div>
    </section>
  `;

  const grid = document.getElementById("full-library-grid");
  SCRIPTURE_DB.scriptures.forEach(scrip => {
    grid.appendChild(createScriptureCard(scrip));
  });
}

// --- SCRIPTURE DETAILS VIEW ---
function renderScriptureDetailView(container, scriptureId) {
  const scripture = SCRIPTURE_DB.scriptures.find(s => s.id === scriptureId);
  if (!scripture) {
    container.innerHTML = `<div class="container view-section"><p>Scripture not found.</p></div>`;
    return;
  }

  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">${scripture.name}</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
        <p class="scripture-desc">${scripture.description}</p>
      </div>

      <h3 class="section-headline" style="margin-bottom: 2rem;">Chapters (Adhyāyas)</h3>
      
      <div class="chapter-grid">
        ${scripture.adhyayas.map(adh => `
          <div class="chapter-card">
            <div class="chapter-number">Adhyāya ${adh.number}</div>
            <h4 class="chapter-name">${adh.name}</h4>
            ${adh.nameEnglish ? `<p class="chapter-name-en" style="font-size: 1.1rem; color: var(--accent-gold); font-weight: 600; margin: 0.3rem 0 0.8rem;">${adh.nameEnglish}</p>` : ""}
            <p class="chapter-desc">${adh.description}</p>
            <a href="#adhyaya/${scripture.id}/${adh.number}" class="chapter-action-btn">
              Begin Study <i class="fa-solid fa-arrow-right"></i>
            </a>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

// --- ADHYAYA / READER VIEW ---
function renderAdhyayaView(container, scriptureId, adhyayaNum) {
  const scripture = SCRIPTURE_DB.scriptures.find(s => s.id === scriptureId);
  if (!scripture) {
    container.innerHTML = `<div class="container view-section"><p>Scripture not found.</p></div>`;
    return;
  }
  
  const adhyaya = scripture.adhyayas.find(a => a.number === adhyayaNum);
  if (!adhyaya) {
    container.innerHTML = `<div class="container view-section"><p>Adhyaya not found.</p></div>`;
    return;
  }

  // Save to recently viewed
  saveRecentStudy(scripture, adhyaya);

  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header" style="margin-bottom: 2rem;">
        <span class="chapter-number">${scripture.name}</span>
        <h2 class="scripture-name" style="font-size: 2.5rem;">Adhyāya ${adhyaya.number}: ${adhyaya.name}</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
        <p class="scripture-desc">${adhyaya.description}</p>
      </div>

      <div class="reader-container">
        <!-- Sidebar Navigation -->
        <aside class="reader-sidebar">
          <h4 class="sidebar-title">Verses (Shlokas)</h4>
          <ul class="sidebar-nav-list">
            ${adhyaya.shlokas.map(s => `
              <li class="sidebar-nav-item" id="side-link-shloka-${s.number}">
                <a href="#shloka-card-${s.number}" onclick="scrollToShloka(event, ${s.number})">
                  Shloka ${adhyaya.number}.${s.number}
                </a>
              </li>
            `).join("")}
          </ul>
        </aside>

        <!-- Shlokas Content Area -->
        <div class="shlokas-list">
          ${adhyaya.shlokas.map(s => createShlokaCardMarkup(scripture.id, adhyaya.number, s)).join("")}
        </div>
      </div>
    </section>
  `;
}

// --- AUDIO RECITAL CHAMBER VIEW ---
function renderAudioView(container) {
  // Collect all shlokas with audio capabilities
  const audioShlokas = [];
  SCRIPTURE_DB.scriptures.forEach(scrip => {
    scrip.adhyayas.forEach(adh => {
      adh.shlokas.forEach(shl => {
        audioShlokas.push({
          scriptureId: scrip.id,
          scriptureName: scrip.name,
          adhyayaNum: adh.number,
          adhyayaName: adh.name,
          shloka: shl
        });
      });
    });
  });

  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">Audio Chant Chamber</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
        <p class="scripture-desc">Immerse yourself in authentic recitations of Charaka Samhita shlokas. For a meditative experience, turn on the "Temple Soundscape" background drone in the bottom right corner.</p>
      </div>

      <h3 class="section-headline">Available Audio Recitations</h3>
      <div class="shlokas-list" style="max-width: 800px; margin: 0 auto 4rem;">
        ${audioShlokas.map(item => `
          <div class="shloka-card">
            <span class="shloka-number-badge">${item.scriptureName} — Ch. ${item.adhyayaNum}, Shloka ${item.shloka.number}</span>
            <div class="shloka-sanskrit">
              <p class="sanskrit-text">${item.shloka.sanskrit.replace(/\n/g, '<br>')}</p>
            </div>
            <p class="shloka-translation" style="font-style: italic; text-align: center; color: var(--text-secondary);">
              "${item.shloka.translation}"
            </p>
            
            <div class="shloka-actions" style="margin-top: 1rem; border: none; padding-top: 0;">
              <!-- Play Audio Synthesizer -->
              <div class="shloka-audio-player">
                <button class="btn-play-shloka" onclick="playShloka(this, '${item.shloka.audio}', '${item.shloka.sanskrit.replace(/'/g, "\\'").replace(/\r/g, "").replace(/\n/g, "\\n")}')">
                  <i class="fa-solid fa-play"></i>
                </button>
                <span class="audio-progress-bar">
                  <span class="audio-progress"></span>
                </span>
                <span style="font-size: 0.85rem; font-family: var(--font-heading); color: var(--accent-gold); font-weight: bold;">Chant Audio</span>
              </div>
              
              <div class="shloka-buttons">
                <button class="btn-action" onclick="toggleBookmark('${item.scriptureId}', ${item.adhyayaNum}, ${item.shloka.number}, this)" title="Bookmark Shloka">
                  <i class="fa-regular fa-bookmark"></i>
                </button>
                <button class="btn-action" onclick="shareShloka('${item.scriptureName}', ${item.adhyayaNum}, ${item.shloka.number}, '${item.shloka.translation.replace(/'/g, "\\'")}')" title="Share Shloka">
                  <i class="fa-solid fa-share-nodes"></i>
                </button>
              </div>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

// --- SEARCH ENGINE VIEW ---
function renderSearchView(container) {
  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">Scripture Search Chamber</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
      </div>

      <div class="search-container">
        <div class="search-box">
          <input type="text" id="shloka-search-input" class="search-input" placeholder="Search by word, translation, verse number..." onkeyup="executeSearch()">
          <button class="btn-search" onclick="executeSearch()"><i class="fa-solid fa-magnifying-glass"></i></button>
        </div>
        <div class="search-filters">
          <span class="filter-badge active" onclick="setSearchFilter('all', this)">All scriptures</span>
          ${SCRIPTURE_DB.scriptures.map(s => `
            <span class="filter-badge" onclick="setSearchFilter('${s.id}', this)">${s.name}</span>
          `).join("")}
        </div>
      </div>

      <p class="search-results-info" id="search-results-info">Enter terms above to search the sacred library.</p>
      
      <div class="search-results-grid" id="search-results-container">
        <!-- Search items match dynamically -->
      </div>
    </section>
  `;
}

let activeSearchFilter = "all";

window.setSearchFilter = function(filter, element) {
  activeSearchFilter = filter;
  const badges = document.querySelectorAll(".filter-badge");
  badges.forEach(b => b.classList.remove("active"));
  element.classList.add("active");
  executeSearch();
};

window.executeSearch = function() {
  const query = document.getElementById("shloka-search-input").value.toLowerCase().trim();
  const resultsContainer = document.getElementById("search-results-container");
  const infoText = document.getElementById("search-results-info");
  
  if (!query) {
    resultsContainer.innerHTML = "";
    infoText.innerText = "Enter terms above to search the sacred library.";
    return;
  }
  
  const results = [];
  
  SCRIPTURE_DB.scriptures.forEach(scrip => {
    // Apply filter
    if (activeSearchFilter !== "all" && activeSearchFilter !== scrip.id) return;
    
    scrip.adhyayas.forEach(adh => {
      adh.shlokas.forEach(shl => {
        const textToSearch = `${scrip.name} ${adh.name} ${shl.sanskrit} ${shl.transliteration} ${shl.translation} ${shl.number}`.toLowerCase();
        if (textToSearch.includes(query)) {
          results.push({
            scriptureId: scrip.id,
            scriptureName: scrip.name,
            adhyayaNum: adh.number,
            adhyayaName: adh.name,
            shloka: shl
          });
        }
      });
    });
  });

  if (results.length === 0) {
    resultsContainer.innerHTML = "";
    infoText.innerText = `No verses found matching "${query}".`;
  } else {
    infoText.innerText = `Found ${results.length} matching verse(s):`;
    resultsContainer.innerHTML = results.map(item => `
      <div class="shloka-card">
        <span class="shloka-number-badge">${item.scriptureName} — Ch. ${item.adhyayaNum}, Shloka ${item.shloka.number}</span>
        <div class="shloka-sanskrit">
          <p class="sanskrit-text">${item.shloka.sanskrit.replace(/\n/g, '<br>')}</p>
        </div>
        <p class="shloka-translit-label">Transliteration</p>
        <p class="shloka-transliteration">${item.shloka.transliteration.replace(/\n/g, '<br>')}</p>
        <p class="shloka-transl-label">English Translation</p>
        <p class="shloka-translation">${item.shloka.translation}</p>
        
        <div class="shloka-actions">
          <div class="shloka-audio-player">
            <button class="btn-play-shloka" onclick="playShloka(this, '${item.shloka.audio}', '${item.shloka.sanskrit.replace(/'/g, "\\'").replace(/\r/g, "").replace(/\n/g, "\\n")}')">
              <i class="fa-solid fa-play"></i>
            </button>
            <span class="audio-progress-bar">
              <span class="audio-progress"></span>
            </span>
          </div>
          <div class="shloka-buttons">
            <a href="#adhyaya/${item.scriptureId}/${item.adhyayaNum}" class="btn-action" title="Open Chapter Study">
              <i class="fa-solid fa-arrow-up-right-from-square"></i>
            </a>
            <button class="btn-action" onclick="toggleBookmark('${item.scriptureId}', ${item.adhyayaNum}, ${item.shloka.number}, this)" title="Bookmark Shloka">
              <i class="fa-regular fa-bookmark"></i>
            </button>
          </div>
        </div>
      </div>
    `).join("");
    // Synchronize bookmark icons on render
    syncBookmarkIcons();
  }
};

// --- BOOKMARKS VIEW ---
function renderBookmarksView(container) {
  const bookmarks = getBookmarks();
  
  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">Your Bookmarks</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
        <p class="scripture-desc">Your personal study bookmarks. Review your saved Sanskrit shlokas and continue your spiritual contemplations.</p>
      </div>

      <div class="shlokas-list" id="bookmarks-full-list" style="max-width: 800px; margin: 0 auto 4rem;">
        <!-- Populated dynamically -->
      </div>
    </section>
  `;

  const bookmarksList = document.getElementById("bookmarks-full-list");

  if (bookmarks.length === 0) {
    bookmarksList.innerHTML = `
      <div class="shloka-card" style="text-align: center;">
        <i class="fa-regular fa-bookmark" style="font-size: 3rem; color: var(--accent-gold); margin-bottom: 1rem;"></i>
        <h4 class="chapter-name">No Bookmarks Saved Yet</h4>
        <p class="chapter-desc">Browse scriptures and tap the bookmark icon on any verse to save it to your library.</p>
        <button class="btn-primary" onclick="window.location.hash='#scriptures'" style="margin-top: 1rem;">Browse Scriptures</button>
      </div>
    `;
    return;
  }

  bookmarks.forEach(bm => {
    const scripture = SCRIPTURE_DB.scriptures.find(s => s.id === bm.scriptureId);
    if (!scripture) return;
    const adhyaya = scripture.adhyayas.find(a => a.number === bm.adhyayaNum);
    if (!adhyaya) return;
    const shloka = adhyaya.shlokas.find(s => s.number === bm.shlokaNum);
    if (!shloka) return;

    const div = document.createElement("div");
    div.className = "shloka-card";
    div.innerHTML = `
      <span class="shloka-number-badge">${scripture.name} — Ch. ${adhyaya.number}, Shloka ${shloka.number}</span>
      <div class="shloka-sanskrit">
        <p class="sanskrit-text">${shloka.sanskrit.replace(/\n/g, '<br>')}</p>
      </div>
      <p class="shloka-translit-label">Transliteration</p>
      <p class="shloka-transliteration">${shloka.transliteration.replace(/\n/g, '<br>')}</p>
      <p class="shloka-transl-label">Translation</p>
      <p class="shloka-translation">${shloka.translation}</p>
      
      <div class="shloka-actions">
        <div class="shloka-audio-player">
          <button class="btn-play-shloka" onclick="playShloka(this, '${shloka.audio}', '${shloka.sanskrit.replace(/'/g, "\\'").replace(/\r/g, "").replace(/\n/g, "\\n")}')">
            <i class="fa-solid fa-play"></i>
          </button>
          <span class="audio-progress-bar">
            <span class="audio-progress"></span>
          </span>
        </div>
        <div class="shloka-buttons">
          <a href="#adhyaya/${scripture.id}/${adhyaya.number}" class="btn-action" title="Open Chapter Study">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
          <button class="btn-action bookmarked" onclick="toggleBookmark('${scripture.id}', ${adhyaya.number}, ${shloka.number}, this); renderBookmarksView(document.getElementById('app-viewport'));" title="Remove Bookmark">
            <i class="fa-solid fa-bookmark"></i>
          </button>
        </div>
      </div>
    `;
    bookmarksList.appendChild(div);
  });
}

// --- ABOUT VIEW ---
function renderAboutView(container) {
  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">About Charaka Samhita</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
      </div>

      <div class="about-box">
        <h3 class="about-title">The Foundational Text of Ayurveda</h3>
        <div class="about-content">
          <p>The <strong>Charaka Samhita</strong> (चरक संहिता) is one of the most ancient and authoritative texts on <strong>Ayurveda</strong> — the Indian system of medicine and science of life. Attributed to <strong>Maharshi Charaka</strong>, it was originally composed by Agnivesha as the Agnivesha Tantra, later revised and supplemented by Charaka and further by Dridhabala.</p>
          
          <p>The <strong>Sutra Sthana</strong> (सूत्रस्थानम्) is the foundational section containing 30 chapters that lay out the core principles of Ayurvedic medicine. This digital library presents the first 15 chapters with original Devanagari text, detailed Sandhi analysis, transliteration, and English translations.</p>
          
          <p>Key concepts covered include: <strong>Tridosha</strong> (Vata, Pitta, Kapha), <strong>Panchakarma</strong> (five purification therapies), <strong>Ahara Vidhi</strong> (dietary science), <strong>Dravya Guna</strong> (pharmacology), and the fundamental philosophy of preventive and curative medicine.</p>
          
          <p>Toggle the <strong>Temple Soundscape</strong> background audio (located in the bottom-right corner) to enjoy a meditative environment during your study.</p>
        </div>

        <div class="deco-divider" style="margin: 2rem 0;">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>

        <h4 style="text-align: center; font-size: 1.5rem; margin-bottom: 1.5rem; font-family: var(--font-heading); color: var(--accent-saffron);">Pillars of Ayurveda</h4>
        
        <div class="deity-artwork-gallery">
          <div class="deity-card">
            <i class="fa-solid fa-staff-snake deity-icon"></i>
            <h5 class="deity-name">धन्वन्तरि</h5>
            <p class="deity-role">Dhanvantari — Divine Physician, God of Ayurveda</p>
          </div>
          <div class="deity-card">
            <i class="fa-solid fa-book-medical deity-icon"></i>
            <h5 class="deity-name">चरक</h5>
            <p class="deity-role">Maharshi Charaka — Author of Charaka Samhita</p>
          </div>
          <div class="deity-card">
            <i class="fa-solid fa-user-doctor deity-icon" style="color: var(--accent-gold);"></i>
            <h5 class="deity-name">आत्रेय</h5>
            <p class="deity-role">Punarvasu Atreya — Guru of Charaka, Pioneer of Medicine</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

/* ==========================================================================
   3. COMPONENTS & UTILITIES
   ========================================================================== */

function createScriptureCard(scripture) {
  const card = document.createElement("div");
  card.className = "scripture-card";
  
  card.innerHTML = `
    <div class="card-image-wrapper">
      <img src="${scripture.coverImage}" alt="${scripture.name}" class="card-image" onerror="this.src='https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&q=80'">
      <span class="card-category-badge">${scripture.category}</span>
    </div>
    <div class="card-content">
      <h4 class="card-title">${scripture.name}</h4>
      <p class="card-description">${scripture.description}</p>
      <div class="card-meta">
        <span class="meta-chapters">${scripture.totalAdhyayas} Adhyāyas</span>
        <a href="#scripture/${scripture.id}" class="card-btn">
          Explore <i class="fa-solid fa-arrow-right"></i>
        </a>
      </div>
    </div>
  `;
  return card;
}

function createShlokaCardMarkup(scriptureId, adhyayaNum, shloka) {
  const isBookmarked = hasBookmark(scriptureId, adhyayaNum, shloka.number);
  const bookmarkClass = isBookmarked ? "bookmarked" : "";
  const bookmarkIcon = isBookmarked ? "fa-solid fa-bookmark" : "fa-regular fa-bookmark";

  return `
    <div class="shloka-card" id="shloka-card-${shloka.number}">
      <span class="shloka-number-badge">Verse ${shloka.number}</span>
      
      <!-- Sanskrit Devanagari -->
      <div class="shloka-sanskrit">
        <p class="sanskrit-text">${shloka.sanskrit.replace(/\n/g, '<br>')}</p>
      </div>

      <!-- Transliteration -->
      <p class="shloka-translit-label">Transliteration</p>
      <p class="shloka-transliteration">${shloka.transliteration.replace(/\n/g, '<br>')}</p>

      <!-- Translation -->
      <p class="shloka-transl-label">English Translation</p>
      <p class="shloka-translation">${shloka.translation}</p>

      <!-- Sandhi Breakdown Collapse -->
      ${shloka.sandhi && shloka.sandhi.length > 0 ? `
        <div class="sandhi-container">
          <div class="sandhi-header" onclick="toggleSandhi(${shloka.number})">
            <span class="sandhi-title"><i class="fa-solid fa-gears"></i> Sandhi Analysis</span>
            <i class="fa-solid fa-chevron-down" id="sandhi-chevron-${shloka.number}"></i>
          </div>
          <div class="sandhi-body" id="sandhi-body-${shloka.number}">
            ${shloka.sandhi.map(item => `
              <div class="sandhi-item">
                <span class="sandhi-term">${item.term}</span>
                <span class="sandhi-breakdown">(${item.breakdown})</span>
                <p class="sandhi-meaning">${item.meaning}</p>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}

      <!-- Action Panel & Audio Control -->
      <div class="shloka-actions">
        <!-- Chanting audio synthethizer player -->
        <div class="shloka-audio-player">
          <button class="btn-play-shloka" onclick="playShloka(this, '${shloka.audio}', '${shloka.sanskrit.replace(/'/g, "\\'").replace(/\r/g, "").replace(/\n/g, "\\n")}')" title="Listen to Recitation">
            <i class="fa-solid fa-play"></i>
          </button>
          <span class="audio-progress-bar">
            <span class="audio-progress"></span>
          </span>
          <span style="font-size: 0.85rem; font-family: var(--font-heading); color: var(--accent-gold); font-weight: bold;">Listen recitation</span>
        </div>

        <div class="shloka-buttons">
          <button class="btn-action ${bookmarkClass}" onclick="toggleBookmark('${scriptureId}', ${adhyayaNum}, ${shloka.number}, this)" title="Bookmark Shloka">
            <i class="${bookmarkIcon}"></i>
          </button>
          <button class="btn-action" onclick="shareShloka('${scriptureId}', ${adhyayaNum}, ${shloka.number}, '${shloka.translation.replace(/'/g, "\\'")}')" title="Share Shloka">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

window.toggleSandhi = function(shlokaNum) {
  const body = document.getElementById(`sandhi-body-${shlokaNum}`);
  const chevron = document.getElementById(`sandhi-chevron-${shlokaNum}`);
  if (body.classList.contains("open")) {
    body.classList.remove("open");
    chevron.classList.replace("fa-chevron-up", "fa-chevron-down");
  } else {
    body.classList.add("open");
    chevron.classList.replace("fa-chevron-down", "fa-chevron-up");
  }
};

window.scrollToShloka = function(event, shlokaNum) {
  event.preventDefault();
  const target = document.getElementById(`shloka-card-${shlokaNum}`);
  if (target) {
    const offset = 120; // accounting for sticky header
    const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: "smooth" });
    
    // Highlight sidebar active state
    document.querySelectorAll(".sidebar-nav-item").forEach(item => item.classList.remove("active"));
    document.getElementById(`side-link-shloka-${shlokaNum}`).classList.add("active");
  }
};

/* ==========================================================================
   4. INTERACTIVE EFFECT: GOLDEN PARTICLES CANVAS
   ========================================================================== */

function initGoldenParticles() {
  const canvas = document.getElementById("particle-canvas");
  const ctx = canvas.getContext("2d");
  
  let particles = [];
  const particleCount = 45;
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
  
  class Particle {
    constructor() {
      this.reset();
      this.y = Math.random() * canvas.height; // distribution across height on init
    }
    
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + 10;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedY = -(Math.random() * 0.6 + 0.2);
      this.speedX = Math.random() * 0.4 - 0.2;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.maxLife = Math.random() * 300 + 200;
      this.life = 0;
    }
    
    update() {
      this.y += this.speedY;
      this.x += this.speedX;
      this.life++;
      
      if (this.y < -10 || this.life > this.maxLife) {
        this.reset();
      }
    }
    
    draw() {
      ctx.beginPath();
      // Antique gold lighting color
      const isDarkMode = document.documentElement.classList.contains("dark-mode");
      const r = isDarkMode ? 229 : 207;
      const g = isDarkMode ? 189 : 168;
      const b = isDarkMode ? 84  : 60;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
      ctx.shadowBlur = isDarkMode ? 4 : 0;
      ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }
  
  animate();
}

/* ==========================================================================
   5. MEDITATIVE SOUNDENGINE & AUDIO RECITER (Web Audio API)
   ========================================================================== */

let audioCtx = null;
let droneNode = null;
let currentShlokaSynth = null;
let ambientPlaying = false;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function initAmbientSynthesizer() {
  const toggleBtn = document.getElementById("toggle-ambient");
  
  toggleBtn.addEventListener("click", () => {
    const ctx = getAudioContext();
    
    if (ambientPlaying) {
      // Stop the ambient music
      if (droneNode) {
        droneNode.stop();
        droneNode = null;
      }
      ambientPlaying = false;
      toggleBtn.classList.remove("playing");
      toggleBtn.querySelector("i").className = "fa-solid fa-volume-xmark";
      showToast("Temple soundscape paused.");
    } else {
      // Start ambient tanpura/sitar humming
      startTempleAmbient(ctx);
      ambientPlaying = true;
      toggleBtn.classList.add("playing");
      toggleBtn.querySelector("i").className = "fa-solid fa-volume-high";
      showToast("Temple soundscape playing. Enjoy the study environment.");
    }
  });
}

function startTempleAmbient(ctx) {
  // Create Synthesized Drone (Tanpura sound simulation using multi-oscillator additive nodes)
  const masterVolume = ctx.createGain();
  masterVolume.gain.setValueAtTime(0.08, ctx.currentTime); // keep it low and atmospheric
  masterVolume.connect(ctx.destination);

  const baseFreq = 110; // A2 note
  const harmonics = [1, 1.5, 2, 2.5, 3]; // 5ths and octaves for a tanpura hum
  const oscillators = [];

  harmonics.forEach((harmonic, idx) => {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    // Choose wave types for rich string-like harmonics
    osc.type = idx % 2 === 0 ? "sawtooth" : "triangle";
    osc.frequency.setValueAtTime(baseFreq * harmonic, ctx.currentTime);
    
    // Low pass filter to warm up the sound
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(idx === 0 ? 400 : 700, ctx.currentTime);
    
    // Slow volume fluctuation (beating effect)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.1 + (idx * 0.05), ctx.currentTime); // slow beating
    lfoGain.gain.setValueAtTime(0.2, ctx.currentTime);
    
    // Hook LFO to oscillator volume
    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);
    
    // Add dynamic gain envelope
    const baseVolume = 0.2 / harmonics.length;
    oscGain.gain.setValueAtTime(baseVolume, ctx.currentTime);
    
    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(masterVolume);
    
    osc.start();
    lfo.start();
    
    oscillators.push({ osc, lfo });
  });

  droneNode = {
    stop: () => {
      oscillators.forEach(o => {
        o.osc.stop();
        o.lfo.stop();
      });
    }
  };
}

// Synthesize a beautiful Tibetan singing-bowl bell ring
function playSingingBell(ctx, masterVol) {
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = "sine";
  osc.frequency.setValueAtTime(440, ctx.currentTime); // Principal ring
  
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(442, ctx.currentTime); // Modulator ring creating beats

  gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
  // exponential decay for natural ring
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
  
  osc.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(masterVol);
  
  osc.start();
  osc2.start();
  
  osc.stop(ctx.currentTime + 4.5);
  osc2.stop(ctx.currentTime + 4.5);
}

let currentAudio = null;

window.playShloka = function(button, audioPath, sanskritText) {
  // If there's synthesized audio playing, stop it
  if (currentShlokaSynth && currentShlokaSynth.playing) {
    currentShlokaSynth.stop();
  }

  // If there's an HTML5 audio element playing, stop it
  if (currentAudio) {
    currentAudio.pause();
    const prevBtn = currentAudio.btn;
    if (prevBtn) {
      prevBtn.classList.remove("playing");
      prevBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      const prevBar = prevBtn.nextElementSibling.querySelector(".audio-progress");
      if (prevBar) prevBar.style.width = "0%";
    }
    
    // If the same button was clicked, we just stop
    if (prevBtn === button) {
      currentAudio = null;
      return;
    }
  }

  // If there's no audio path or it's empty, use synthesis
  if (!audioPath || audioPath === "undefined" || audioPath === "null" || audioPath === "") {
    playSynthesizedShloka(button, sanskritText);
    return;
  }

  // Handle multiple sequential audio files (comma separated)
  const paths = audioPath.split(",");
  let currentTrackIdx = 0;

  function playTrack(idx) {
    if (idx >= paths.length) {
      button.classList.remove("playing");
      button.innerHTML = '<i class="fa-solid fa-play"></i>';
      if (progressBar) progressBar.style.width = "0%";
      currentAudio = null;
      return;
    }

    const audio = new Audio(paths[idx]);
    audio.btn = button;
    currentAudio = audio;

    audio.ontimeupdate = () => {
      if (audio.duration && progressBar) {
        const pct = (audio.currentTime / audio.duration) * 100;
        progressBar.style.width = `${pct}%`;
      }
    };

    audio.onended = () => {
      playTrack(idx + 1);
    };

    audio.onerror = () => {
      console.warn(`Failed to load track ${idx}: ${paths[idx]}`);
      playTrack(idx + 1);
    };

    audio.play().catch(err => {
      console.warn("Audio playback failed for track:", paths[idx], err);
      audio.onerror();
    });
  }

  button.classList.add("playing");
  button.innerHTML = '<i class="fa-solid fa-stop"></i>';
  const progressBar = button.nextElementSibling.querySelector(".audio-progress");
  if (progressBar) progressBar.style.width = "0%";

  playTrack(0);
};

// Synthesized Shloka Audio Reciter
window.playSynthesizedShloka = function(button, sanskritText) {
  const ctx = getAudioContext();
  const progressBar = button.nextElementSibling.querySelector(".audio-progress");
  
  if (currentShlokaSynth && currentShlokaSynth.playing) {
    // If playing, stop it
    currentShlokaSynth.stop();
    if (currentShlokaSynth.btn === button) {
      // Just stopped ourselves
      return;
    }
  }

  button.classList.add("playing");
  button.innerHTML = '<i class="fa-solid fa-stop"></i>';
  progressBar.style.width = "0%";

  // Trigger bell chime
  const masterVol = ctx.createGain();
  masterVol.gain.setValueAtTime(0.12, ctx.currentTime);
  masterVol.connect(ctx.destination);
  playSingingBell(ctx, masterVol);

  // Synthesize soft chanting backdrop
  const chantDrone = ctx.createOscillator();
  const chantDroneVol = ctx.createGain();
  chantDrone.type = "sawtooth";
  chantDrone.frequency.setValueAtTime(110, ctx.currentTime); // Low baritone root chant
  
  const chantFilter = ctx.createBiquadFilter();
  chantFilter.type = "lowpass";
  chantFilter.frequency.setValueAtTime(150, ctx.currentTime); // Warm filter to make it sound vocal
  
  chantDroneVol.gain.setValueAtTime(0, ctx.currentTime);
  chantDroneVol.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.5);
  
  chantDrone.connect(chantFilter);
  chantFilter.connect(chantDroneVol);
  chantDroneVol.connect(masterVol);
  chantDrone.start();

  // Speech Synthesizer Voice Reading
  const cleanedText = sanskritText.replace(/\|/g, "").replace(/\n/g, " ");
  const utterance = new SpeechSynthesisUtterance(cleanedText);
  
  // Try to find a Sanskrit / Hindi / Indian voice
  const voices = window.speechSynthesis.getVoices();
  const indianVoice = voices.find(v => v.lang.includes("hi-IN") || v.lang.includes("sa-IN") || v.name.includes("India") || v.name.includes("Google हिन्दी"));
  if (indianVoice) {
    utterance.voice = indianVoice;
  }
  
  utterance.rate = 0.65; // slow, reverent reading
  utterance.pitch = 0.8; // deep, chanting tone

  let progressInterval = null;
  const durationEstimate = cleanedText.length * 90; // estimate time based on char length (90ms/char)
  let elapsed = 0;
  
  progressInterval = setInterval(() => {
    elapsed += 100;
    const progress = Math.min((elapsed / durationEstimate) * 100, 95);
    progressBar.style.width = `${progress}%`;
  }, 100);

  utterance.onend = () => {
    stopChant();
  };

  utterance.onerror = () => {
    stopChant();
  };

  window.speechSynthesis.speak(utterance);

  function stopChant() {
    window.speechSynthesis.cancel();
    clearInterval(progressInterval);
    button.classList.remove("playing");
    button.innerHTML = '<i class="fa-solid fa-play"></i>';
    progressBar.style.width = "0%";
    
    // fade out oscillators
    chantDroneVol.gain.setValueAtTime(chantDroneVol.gain.value, ctx.currentTime);
    chantDroneVol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    setTimeout(() => {
      try { chantDrone.stop(); } catch(e) {}
    }, 600);
    
    currentShlokaSynth = null;
  }

  currentShlokaSynth = {
    playing: true,
    btn: button,
    stop: stopChant
  };
};

/* ==========================================================================
   6. BOOKMARK SYSTEM & RECENT VIEWS STORAGE
   ========================================================================== */

function getBookmarks() {
  return JSON.parse(localStorage.getItem("sanskrit_library_bookmarks") || "[]");
}

function saveBookmarks(bookmarks) {
  localStorage.setItem("sanskrit_library_bookmarks", JSON.stringify(bookmarks));
}

function hasBookmark(scriptureId, adhyayaNum, shlokaNum) {
  const bookmarks = getBookmarks();
  return bookmarks.some(b => b.scriptureId === scriptureId && b.adhyayaNum === adhyayaNum && b.shlokaNum === shlokaNum);
}

window.toggleBookmark = function(scriptureId, adhyayaNum, shlokaNum, btn) {
  let bookmarks = getBookmarks();
  const index = bookmarks.findIndex(b => b.scriptureId === scriptureId && b.adhyayaNum === adhyayaNum && b.shlokaNum === shlokaNum);
  
  const icon = btn.querySelector("i");
  
  if (index > -1) {
    // Remove
    bookmarks.splice(index, 1);
    btn.classList.remove("bookmarked");
    if (icon) icon.className = "fa-regular fa-bookmark";
    showToast("Bookmark removed.");
  } else {
    // Add
    bookmarks.push({ scriptureId, adhyayaNum, shlokaNum });
    btn.classList.add("bookmarked");
    if (icon) icon.className = "fa-solid fa-bookmark";
    showToast("Shloka bookmarked successfully.");
  }
  
  saveBookmarks(bookmarks);
  
  // Re-render dashboard components if we're on the home screen
  if (window.location.hash === "#home" || !window.location.hash) {
    renderBookmarkedVersesPanel();
  }
};

function syncBookmarkIcons() {
  // Syncs page elements with storage status on viewport loads
  const actionButtons = document.querySelectorAll(".btn-action[onclick^='toggleBookmark']");
  actionButtons.forEach(btn => {
    const match = btn.getAttribute("onclick").match(/'([^']+)',\s*(\d+),\s*(\d+)/);
    if (match) {
      const isBookmarked = hasBookmark(match[1], parseInt(match[2]), parseInt(match[3]));
      const icon = btn.querySelector("i");
      if (isBookmarked) {
        btn.classList.add("bookmarked");
        if (icon) icon.className = "fa-solid fa-bookmark";
      } else {
        btn.classList.remove("bookmarked");
        if (icon) icon.className = "fa-regular fa-bookmark";
      }
    }
  });
}

function getRecentStudies() {
  return JSON.parse(localStorage.getItem("sanskrit_library_recents") || "[]");
}

function saveRecentStudy(scripture, adhyaya) {
  let recents = getRecentStudies();
  
  // Remove duplicates
  recents = recents.filter(r => !(r.scriptureId === scripture.id && r.chapterNum === adhyaya.number));
  
  // Add to front
  recents.unshift({
    scriptureId: scripture.id,
    scriptureName: scripture.name,
    chapterNum: adhyaya.number,
    chapterName: adhyaya.name,
    timestamp: Date.now()
  });
  
  // Cap at 5
  if (recents.length > 5) recents.pop();
  
  localStorage.setItem("sanskrit_library_recents", JSON.stringify(recents));
}

function renderRecentStudies() {
  const container = document.getElementById("recent-studies-list");
  if (!container) return;
  
  const recents = getRecentStudies();
  if (recents.length === 0) {
    container.innerHTML = `<p class="loader-text" style="font-size: 1rem; margin-top: 0;">No recently read chapters.</p>`;
    return;
  }
  
  container.innerHTML = recents.map(r => `
    <div class="panel-item">
      <div class="panel-item-left">
        <a href="#adhyaya/${r.scriptureId}/${r.chapterNum}" class="panel-item-title">${r.scriptureName}</a>
        <span class="panel-item-sub">Adhyāya ${r.chapterNum}: ${r.chapterName}</span>
      </div>
      <a href="#adhyaya/${r.scriptureId}/${r.chapterNum}" class="btn-action" title="Open Chapter Study">
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
      </a>
    </div>
  `).join("");
}

function renderBookmarkedVersesPanel() {
  const container = document.getElementById("bookmarked-shlokas-list");
  if (!container) return;
  
  const bookmarks = getBookmarks();
  if (bookmarks.length === 0) {
    container.innerHTML = `<p class="loader-text" style="font-size: 1rem; margin-top: 0;">No bookmarked verses.</p>`;
    return;
  }
  
  container.innerHTML = bookmarks.slice(0, 4).map(b => {
    const scripture = SCRIPTURE_DB.scriptures.find(s => s.id === b.scriptureId);
    if (!scripture) return "";
    return `
      <div class="panel-item">
        <div class="panel-item-left">
          <a href="#adhyaya/${b.scriptureId}/${b.adhyayaNum}" class="panel-item-title">${scripture.name}</a>
          <span class="panel-item-sub">Ch. ${b.adhyayaNum}, Shloka ${b.shlokaNum}</span>
        </div>
        <a href="#adhyaya/${b.scriptureId}/${b.adhyayaNum}" class="btn-action" title="Go to verse context">
          <i class="fa-solid fa-arrow-right-to-bracket"></i>
        </a>
      </div>
    `;
  }).join("");
}

/* ==========================================================================
   7. THEME MANAGER & MOBILE MENUS
   ========================================================================== */

function initTheme() {
  const themeToggleBtn = document.getElementById("theme-toggle");
  
  // Set default theme or load previous setting
  const savedTheme = localStorage.getItem("sanskrit_library_theme") || "light";
  if (savedTheme === "dark") {
    document.documentElement.className = "dark-mode";
    themeToggleBtn.querySelector("i").className = "fa-solid fa-sun";
    themeToggleBtn.querySelector("span").innerText = "Temple Light";
  } else {
    document.documentElement.className = "light-mode";
    themeToggleBtn.querySelector("i").className = "fa-solid fa-moon";
    themeToggleBtn.querySelector("span").innerText = "Sacred Night";
  }
  
  themeToggleBtn.addEventListener("click", () => {
    if (document.documentElement.classList.contains("dark-mode")) {
      document.documentElement.className = "light-mode";
      localStorage.setItem("sanskrit_library_theme", "light");
      themeToggleBtn.querySelector("i").className = "fa-solid fa-moon";
      themeToggleBtn.querySelector("span").innerText = "Sacred Night";
      showToast("Daylight parchment style restored.");
    } else {
      document.documentElement.className = "dark-mode";
      localStorage.setItem("sanskrit_library_theme", "dark");
      themeToggleBtn.querySelector("i").className = "fa-solid fa-sun";
      themeToggleBtn.querySelector("span").innerText = "Temple Light";
      showToast("Temple lighting activated.");
    }
  });
}

function initMobileMenu() {
  const menuBtn = document.getElementById("menu-btn");
  const mainNav = document.getElementById("main-navigation");
  
  menuBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    const isOpen = mainNav.classList.contains("open");
    menuBtn.querySelector("i").className = isOpen ? "fa-solid fa-xmark" : "fa-solid fa-bars";
  });
}

/* ==========================================================================
   8. NOTIFICATION SYSTEM & SHARING
   ========================================================================== */

function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerText = message;
  
  container.appendChild(toast);
  
  // Auto remove after 3s
  setTimeout(() => {
    toast.style.animation = "slide-toast 0.3s reverse forwards";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2700);
}

window.shareShloka = function(scriptureName, adhyayaNum, shlokaNum, translation) {
  const textToShare = `"${translation}" \n— ${scriptureName}, Chapter ${adhyayaNum}, Shloka ${shlokaNum}. Read & listen on Digital Sanskrit Scripture Library!`;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(textToShare)
      .then(() => showToast("Verse copied to clipboard. Share the wisdom!"))
      .catch(() => showToast("Sharing failed. Please copy manually."));
  } else {
    showToast("Sharing is not supported on this browser.");
  }
};

/* ==========================================================================
   9. AUDIO MAPPER SYSTEM
   ========================================================================== */

window.loadAudioMappings = async function() {
  let autoMappings = {};
  try {
    const res = await fetch("assets/auto_audio_mappings.json");
    if (res.ok) {
      autoMappings = await res.json();
    }
  } catch (err) {
    console.warn("Could not load auto_audio_mappings.json, using defaults.", err);
  }
  
  const customMappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
  
  // Merge custom mappings over auto mappings
  const mergedMappings = { ...autoMappings, ...customMappings };
  
  SCRIPTURE_DB.scriptures.forEach(scripture => {
    scripture.adhyayas.forEach(adhyaya => {
      adhyaya.shlokas.forEach(shloka => {
        const key = `${scripture.id}_${adhyaya.number}_${shloka.number}`;
        if (mergedMappings[key]) {
          const val = mergedMappings[key];
          if (Array.isArray(val)) {
            shloka.audio = val.join(",");
          } else {
            shloka.audio = val;
          }
        }
      });
    });
  });
};

window.applyCustomAudioMappings = function() {
  loadAudioMappings();
};

function renderAudioMapperView(container) {
  // Load css directly
  container.innerHTML = `
    <style>
      .mapper-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        margin-top: 2rem;
      }
      .mapper-panel {
        background: rgba(25, 15, 10, 0.7);
        border: 1px solid var(--accent-saffron);
        border-radius: 12px;
        padding: 1.5rem;
        max-height: 700px;
        overflow-y: auto;
      }
      .mapper-panel-title {
        font-family: var(--font-heading);
        color: var(--accent-gold);
        font-size: 1.5rem;
        margin-bottom: 1rem;
        border-bottom: 1px solid rgba(226, 88, 34, 0.3);
        padding-bottom: 0.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .raw-audio-list {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }
      .raw-audio-item {
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 0.8rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .raw-audio-item:hover, .raw-audio-item.selected {
        border-color: var(--accent-gold);
        background: rgba(214, 80, 28, 0.1);
      }
      .raw-audio-item.selected {
        box-shadow: 0 0 10px rgba(226, 88, 34, 0.3);
      }
      .raw-audio-info {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }
      .raw-audio-name {
        font-size: 0.9rem;
        font-family: monospace;
        word-break: break-all;
        color: var(--text-primary);
      }
      .raw-audio-status {
        font-size: 0.75rem;
        color: var(--accent-gold);
        font-weight: bold;
      }
      .mapper-shloka-card {
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
      }
      .mapper-shloka-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        padding-bottom: 0.3rem;
      }
      .mapper-shloka-num {
        font-weight: bold;
        color: var(--accent-gold);
      }
      .mapper-shloka-text {
        font-family: 'Inter', sans-serif;
        font-size: 1.05rem;
        line-height: 1.4;
      }
      .mapper-shloka-mapped {
        background: rgba(226, 88, 34, 0.15);
        border: 1px solid var(--accent-saffron);
        border-radius: 4px;
        padding: 0.4rem;
        font-size: 0.8rem;
        font-family: monospace;
        color: var(--text-primary);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .mapper-shloka-actions {
        display: flex;
        gap: 0.5rem;
      }
      .mapper-btn {
        background: rgba(226, 88, 34, 0.2);
        border: 1px solid var(--accent-saffron);
        color: var(--text-primary);
        padding: 0.4rem 0.8rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: all 0.3s ease;
      }
      .mapper-btn:hover {
        background: var(--accent-saffron);
        color: white;
      }
      .mapper-btn.primary {
        background: var(--accent-saffron);
        color: white;
      }
      .mapper-btn.primary:hover {
        background: #f06430;
      }
      .toolbar-mapper {
        background: rgba(25, 15, 10, 0.8);
        border: 1px solid rgba(226, 88, 34, 0.3);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      .toolbar-title {
        font-family: var(--font-heading);
        font-size: 1.3rem;
        color: var(--accent-gold);
      }
      .toolbar-actions {
        display: flex;
        gap: 0.8rem;
        align-items: center;
      }
      .mapper-shloka-mappings-list {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
        margin-top: 0.5rem;
      }
    </style>
    
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">Interactive Audio Mapper</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
      </div>
      
      <div class="toolbar-mapper">
        <div class="toolbar-title">
          Adhyāya: 
          <select id="mapper-chapter-select" style="background: #110805; color: white; border: 1px solid var(--accent-saffron); padding: 0.4rem 1rem; border-radius: 4px; font-size: 1.05rem;">
            ${SCRIPTURE_DB.scriptures[0].adhyayas.map(adh => `
              <option value="${adh.number}">Adhyāya ${adh.number} — ${adh.nameEnglish}</option>
            `).join("")}
          </select>
        </div>
        <div class="toolbar-actions">
          <button class="mapper-btn" id="mapper-btn-automap"><i class="fa-solid fa-magic"></i> Auto Map (1-to-1)</button>
          <button class="mapper-btn" id="mapper-btn-reset"><i class="fa-solid fa-rotate-left"></i> Reset Chapter</button>
          <button class="mapper-btn primary" id="mapper-btn-export"><i class="fa-solid fa-download"></i> Export JSON</button>
          <input type="file" id="mapper-file-import" style="display:none;" accept=".json">
          <button class="mapper-btn" id="mapper-btn-import" onclick="document.getElementById('mapper-file-import').click()"><i class="fa-solid fa-upload"></i> Import JSON</button>
        </div>
      </div>
      
      <div class="mapper-container">
        <!-- Raw Audio Files Panel -->
        <div class="mapper-panel">
          <div class="mapper-panel-title" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; border-bottom: 1px solid rgba(226, 88, 34, 0.3); padding-bottom: 0.5rem; margin-bottom: 1rem;">
            <span>Raw Audio Files</span>
            <span id="raw-audio-count" style="font-size: 0.9rem; color: var(--text-secondary);"></span>
          </div>
          <!-- Filter Controls -->
          <div style="margin-bottom: 1.2rem; display: flex; gap: 1rem; align-items: center;">
            <label style="font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none;">
              <input type="checkbox" id="mapper-filter-unmapped" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--accent-saffron);">
              <span>Show only unmapped files</span>
            </label>
          </div>
          <div class="raw-audio-list" id="raw-audio-list-container">
            <!-- Populated dynamically -->
          </div>
        </div>
        
        <!-- Shlokas List Panel -->
        <div class="mapper-panel">
          <div class="mapper-panel-title">
            <span>Adhyāya Shlokas</span>
            <span id="shlokas-count" style="font-size: 0.9rem; color: var(--text-secondary);"></span>
          </div>
          <div id="mapper-shlokas-container">
            <!-- Populated dynamically -->
          </div>
        </div>
      </div>
    </section>
  `;
  
  const chapterSelect = document.getElementById("mapper-chapter-select");
  const rawListContainer = document.getElementById("raw-audio-list-container");
  const shlokasContainer = document.getElementById("mapper-shlokas-container");
  const rawCountSpan = document.getElementById("raw-audio-count");
  const shlokasCountSpan = document.getElementById("shlokas-count");
  
  // Listen to filter checkbox change
  const filterCheckbox = document.getElementById("mapper-filter-unmapped");
  if (filterCheckbox) {
    filterCheckbox.addEventListener("change", () => {
      const rawFiles = RAW_AUDIO_FILES[currentChapterNum] || [];
      renderRawAudios(rawFiles);
    });
  }
  
  let selectedAudioFile = null;
  let currentChapterNum = 1;
  let activeAudioElement = null;
  
  // Load and render selected chapter
  function loadChapter(num) {
    currentChapterNum = parseInt(num, 10);
    selectedAudioFile = null;
    
    // Get raw audio files for this chapter
    const rawFiles = RAW_AUDIO_FILES[currentChapterNum] || [];
    rawCountSpan.innerText = `${rawFiles.length} files`;
    
    // Get shlokas
    const adhyaya = SCRIPTURE_DB.scriptures[0].adhyayas.find(a => a.number === currentChapterNum);
    shlokasCountSpan.innerText = `${adhyaya.shlokas.length} verses`;
    
    renderRawAudios(rawFiles);
    renderShlokas(adhyaya.shlokas);
  }
  
  function renderRawAudios(files) {
    if (files.length === 0) {
      rawListContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No audio recordings found for this chapter.</p>`;
      return;
    }
    
    const showOnlyUnmapped = document.getElementById("mapper-filter-unmapped")?.checked || false;
    
    // Check current active mappings from database
    const adhyaya = SCRIPTURE_DB.scriptures[0].adhyayas.find(a => a.number === currentChapterNum);
    
    const fileItems = files.map(file => {
      let mappedTo = null;
      if (adhyaya) {
        for (const shloka of adhyaya.shlokas) {
          if (shloka.audio) {
            const paths = shloka.audio.split(",");
            if (paths.includes(`assets/raw_audio/ch${currentChapterNum}/${file}`)) {
              mappedTo = `Verse ${shloka.number}`;
              break;
            }
          }
        }
      }
      return { file, mappedTo };
    });
    
    const filteredItems = showOnlyUnmapped 
      ? fileItems.filter(item => !item.mappedTo) 
      : fileItems;
      
    // Update the count span to show filtered vs total
    rawCountSpan.innerText = `${filteredItems.length} / ${files.length} files`;
    
    if (filteredItems.length === 0) {
      rawListContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No files match the filter.</p>`;
      return;
    }
    
    rawListContainer.innerHTML = filteredItems.map((item, idx) => {
      const isSelected = selectedAudioFile === item.file ? "selected" : "";
      
      return `
        <div class="raw-audio-item ${isSelected}" data-file="${item.file}">
          <div class="raw-audio-info">
            <span class="raw-audio-name">${idx + 1}. ${item.file}</span>
            ${item.mappedTo ? `<span class="raw-audio-status"><i class="fa-solid fa-link"></i> Mapped to ${item.mappedTo}</span>` : `<span class="raw-audio-status" style="color: var(--accent-gold);">Unmapped</span>`}
          </div>
          <button class="mapper-btn" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;" onclick="event.stopPropagation(); playRawAudio('${item.file}', this)">
            <i class="fa-solid fa-play"></i>
          </button>
        </div>
      `;
    }).join("");
    
    // Add click listener to raw audio items to select them
    rawListContainer.querySelectorAll(".raw-audio-item").forEach(item => {
      item.addEventListener("click", () => {
        rawListContainer.querySelectorAll(".raw-audio-item").forEach(i => i.classList.remove("selected"));
        item.classList.add("selected");
        selectedAudioFile = item.getAttribute("data-file");
      });
    });
  }
  
  function renderShlokas(shlokas) {
    shlokasContainer.innerHTML = shlokas.map(shloka => {
      const mappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
      const mappingKey = `charaka-samhita_${currentChapterNum}_${shloka.number}`;
      const customMapped = mappings[mappingKey];
      
      let mappingDisplay = "";
      if (customMapped) {
        const paths = Array.isArray(customMapped) ? customMapped : [customMapped];
        if (paths.length === 0) {
          mappingDisplay = `
            <div class="mapper-shloka-mapped" style="background: rgba(255, 0, 0, 0.05); border-color: rgba(255, 0, 0, 0.1); margin-bottom: 0.4rem;">
              <span style="color: var(--accent-saffron); font-weight: bold;"><i class="fa-solid fa-ban"></i> Audio Explicitly Removed</span>
              <button class="mapper-btn" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; border: none;" onclick="clearMapping(${shloka.number}, 0)">
                <i class="fa-solid fa-rotate-left"></i> Restore Default
              </button>
            </div>
          `;
        } else {
          mappingDisplay = paths.map((path, pIdx) => {
            const filename = path.substring(path.lastIndexOf("/") + 1);
            return `
              <div class="mapper-shloka-mapped" style="margin-bottom: 0.4rem;">
                <span><i class="fa-solid fa-file-audio"></i> Part ${pIdx+1}: ${filename}</span>
                <button class="mapper-btn" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; border: none; background: rgba(255,0,0,0.2);" onclick="clearMapping(${shloka.number}, ${pIdx})">
                  <i class="fa-solid fa-trash"></i> Remove
                </button>
              </div>
            `;
          }).join("");
        }
      } else if (shloka.audio && !shloka.audio.includes("raw_audio")) {
        // Default sequential mapping exists
        const paths = shloka.audio.split(",");
        mappingDisplay = paths.map((path, pIdx) => {
          const filename = path.substring(path.lastIndexOf("/") + 1);
          return `
            <div class="mapper-shloka-mapped" style="background: rgba(226, 88, 34, 0.05); border-color: rgba(255, 255, 255, 0.1); margin-bottom: 0.4rem;">
              <span style="color: var(--text-secondary);"><i class="fa-solid fa-clock-rotate-left"></i> Default Part ${pIdx+1}: ${filename}</span>
              <button class="mapper-btn" style="padding: 0.2rem 0.4rem; font-size: 0.75rem; border: none; background: rgba(255,0,0,0.2);" onclick="overrideDefaultMapping(${shloka.number})">
                <i class="fa-solid fa-trash"></i> Remove
              </button>
            </div>
          `;
        }).join("");
      }
      
      return `
        <div class="mapper-shloka-card">
          <div class="mapper-shloka-header">
            <span class="mapper-shloka-num">Shloka ${shloka.number}</span>
            <div class="mapper-shloka-actions">
              <button class="mapper-btn primary" onclick="replaceShlokaAudio(${shloka.number})" style="background: var(--accent-saffron); color: white; border-color: var(--accent-saffron);"><i class="fa-solid fa-exchange-alt"></i> Set Selected</button>
              <button class="mapper-btn" onclick="mapSelectedToShloka(${shloka.number})"><i class="fa-solid fa-plus"></i> Add Part</button>
              ${shloka.audio ? `<button class="mapper-btn" onclick="playShlokaPreview('${shloka.audio}', this)"><i class="fa-solid fa-play"></i> Play All</button>` : ""}
            </div>
          </div>
          <div class="mapper-shloka-text">${shloka.sanskrit.replace(/\n/g, "<br>")}</div>
          <div class="mapper-shloka-mappings-list">${mappingDisplay}</div>
        </div>
      `;
    }).join("");
  }
  
  // Custom audio playback for raw preview
  window.playRawAudio = function(filename, btn) {
    if (activeAudioElement) {
      activeAudioElement.pause();
      const prevBtn = activeAudioElement.btn;
      if (prevBtn) {
        prevBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
      if (activeAudioElement.src.includes(filename)) {
        activeAudioElement = null;
        return;
      }
    }
    
    const audioPath = `assets/raw_audio/ch${currentChapterNum}/${filename}`;
    const audio = new Audio(audioPath);
    audio.btn = btn;
    activeAudioElement = audio;
    
    btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    
    audio.onended = () => {
      btn.innerHTML = '<i class="fa-solid fa-play"></i>';
      activeAudioElement = null;
    };
    
    audio.play().catch(e => {
      showToast("Could not play audio. File might be missing.");
      btn.innerHTML = '<i class="fa-solid fa-play"></i>';
    });
  };
  
  // Shloka preview play
  window.playShlokaPreview = function(audioPath, btn) {
    if (activeAudioElement) {
      activeAudioElement.pause();
      const prevBtn = activeAudioElement.btn;
      if (prevBtn) {
        prevBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      }
      if (activeAudioElement.src.includes(audioPath.split(",")[0])) {
        activeAudioElement = null;
        return;
      }
    }
    
    const paths = audioPath.split(",");
    let currentIdx = 0;
    
    function playSeq(idx) {
      if (idx >= paths.length) {
        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
        activeAudioElement = null;
        return;
      }
      
      const audio = new Audio(paths[idx]);
      audio.btn = btn;
      activeAudioElement = audio;
      
      audio.onended = () => {
        playSeq(idx + 1);
      };
      
      audio.onerror = () => {
        playSeq(idx + 1);
      };
      
      audio.play().catch(e => {
        audio.onerror();
      });
    }
    
    btn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    playSeq(0);
  };
  
  // Overwrite shloka audio mapping entirely with selected raw file
  window.replaceShlokaAudio = function(shlokaNum) {
    if (!selectedAudioFile) {
      showToast("Please select a raw audio file from the left panel first!");
      return;
    }
    
    const mappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
    const mappingKey = `charaka-samhita_${currentChapterNum}_${shlokaNum}`;
    const newPath = `assets/raw_audio/ch${currentChapterNum}/${selectedAudioFile}`;
    
    mappings[mappingKey] = [newPath];
    
    localStorage.setItem("sanskrit_library_audio_mappings", JSON.stringify(mappings));
    applyCustomAudioMappings();
    saveMappingsToServer(mappings);
    showToast(`Set Shloka ${shlokaNum} audio to ${selectedAudioFile}`);
    
    // Refresh panels
    loadChapter(currentChapterNum);
  };

  // Link selected raw file to shloka (adds as a part)
  window.mapSelectedToShloka = function(shlokaNum) {
    if (!selectedAudioFile) {
      showToast("Please select a raw audio file from the left panel first!");
      return;
    }
    
    const mappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
    const mappingKey = `charaka-samhita_${currentChapterNum}_${shlokaNum}`;
    
    const newPath = `assets/raw_audio/ch${currentChapterNum}/${selectedAudioFile}`;
    
    if (!mappings[mappingKey]) {
      mappings[mappingKey] = [newPath];
    } else {
      let currentVal = mappings[mappingKey];
      if (!Array.isArray(currentVal)) {
        currentVal = [currentVal];
      }
      if (!currentVal.includes(newPath)) {
        currentVal.push(newPath);
      }
      mappings[mappingKey] = currentVal;
    }
    
    localStorage.setItem("sanskrit_library_audio_mappings", JSON.stringify(mappings));
    applyCustomAudioMappings();
    saveMappingsToServer(mappings);
    showToast(`Added part ${selectedAudioFile} to Shloka ${shlokaNum}!`);
    
    // Refresh panels
    loadChapter(currentChapterNum);
  };
  
  // Clear single mapping part
  window.clearMapping = function(shlokaNum, pIdx) {
    const mappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
    const mappingKey = `charaka-samhita_${currentChapterNum}_${shlokaNum}`;
    
    if (mappings[mappingKey]) {
      let currentVal = mappings[mappingKey];
      if (!Array.isArray(currentVal)) {
        currentVal = [currentVal];
      }
      currentVal.splice(pIdx, 1);
      if (currentVal.length === 0) {
        delete mappings[mappingKey];
      } else {
        mappings[mappingKey] = currentVal;
      }
    }
    
    localStorage.setItem("sanskrit_library_audio_mappings", JSON.stringify(mappings));
    applyCustomAudioMappings();
    saveMappingsToServer(mappings);
    showToast(`Removed audio part from Shloka ${shlokaNum}`);
    
    loadChapter(currentChapterNum);
  };
  
  // Override default mapping by writing empty array to custom mappings
  window.overrideDefaultMapping = function(shlokaNum) {
    const mappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
    const mappingKey = `charaka-samhita_${currentChapterNum}_${shlokaNum}`;
    
    mappings[mappingKey] = [];
    
    localStorage.setItem("sanskrit_library_audio_mappings", JSON.stringify(mappings));
    applyCustomAudioMappings();
    saveMappingsToServer(mappings);
    showToast(`Removed default audio for Shloka ${shlokaNum}`);
    
    loadChapter(currentChapterNum);
  };
  
  // Auto map sequentially (1-to-1)
  document.getElementById("mapper-btn-automap").addEventListener("click", () => {
    if (confirm(`Are you sure you want to map all available raw recordings sequentially to shlokas 1 to N for Adhyāya ${currentChapterNum}?`)) {
      const rawFiles = RAW_AUDIO_FILES[currentChapterNum] || [];
      const adhyaya = SCRIPTURE_DB.scriptures[0].adhyayas.find(a => a.number === currentChapterNum);
      const mappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
      
      const count = Math.min(rawFiles.length, adhyaya.shlokas.length);
      for (let i = 0; i < count; i++) {
        const shlokaNum = adhyaya.shlokas[i].number;
        const mappingKey = `charaka-samhita_${currentChapterNum}_${shlokaNum}`;
        mappings[mappingKey] = [`assets/raw_audio/ch${currentChapterNum}/${rawFiles[i]}`];
      }
      
      localStorage.setItem("sanskrit_library_audio_mappings", JSON.stringify(mappings));
      applyCustomAudioMappings();
      saveMappingsToServer(mappings);
      showToast(`Automatically mapped ${count} recordings sequentially!`);
      loadChapter(currentChapterNum);
    }
  });
  
  // Reset mappings for chapter
  document.getElementById("mapper-btn-reset").addEventListener("click", () => {
    if (confirm(`Reset all custom mappings for Adhyāya ${currentChapterNum}? This will fall back to defaults.`)) {
      const adhyaya = SCRIPTURE_DB.scriptures[0].adhyayas.find(a => a.number === currentChapterNum);
      const mappings = JSON.parse(localStorage.getItem("sanskrit_library_audio_mappings") || "{}");
      
      adhyaya.shlokas.forEach(shloka => {
        const mappingKey = `charaka-samhita_${currentChapterNum}_${shloka.number}`;
        delete mappings[mappingKey];
      });
      
      localStorage.setItem("sanskrit_library_audio_mappings", JSON.stringify(mappings));
      applyCustomAudioMappings();
      saveMappingsToServer(mappings);
      showToast("Chapter mappings reset successfully.");
      loadChapter(currentChapterNum);
    }
  });
  
  // Export mappings to JSON
  document.getElementById("mapper-btn-export").addEventListener("click", () => {
    const mappings = localStorage.getItem("sanskrit_library_audio_mappings") || "{}";
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(mappings);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "charaka_audio_mappings.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Mappings exported successfully!");
  });
  
  // Import mappings from JSON
  document.getElementById("mapper-file-import").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          localStorage.setItem("sanskrit_library_audio_mappings", JSON.stringify(imported));
          applyCustomAudioMappings();
          saveMappingsToServer(imported);
          showToast("Mappings imported successfully!");
          loadChapter(currentChapterNum);
        } catch (err) {
          showToast("Invalid JSON file!");
        }
      };
      reader.readAsText(file);
    }
  });
  
  // Listen to select change
  chapterSelect.addEventListener("change", (e) => {
    loadChapter(e.target.value);
  });
  
  // Initial load
  loadChapter(1);
}

async function saveMappingsToServer(mappings) {
  try {
    const response = await fetch("/api/save-mappings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mappings)
    });
    if (response.ok) {
      showToast("Mappings saved directly to database.js!");
    }
  } catch (err) {
    console.log("Save server not active, saving in browser only.");
  }
}

/* ==========================================================================
   10. INTERACTIVE SANDHI DIFF VIEW
   ========================================================================== */

function renderSandhiDiffView(container) {
  const scripture = SCRIPTURE_DB.scriptures[0];
  const adhyayas = scripture.adhyayas;
  
  container.innerHTML = `
    <section class="view-section container">
      <div class="scripture-header">
        <h2 class="scripture-name">Sandhi Vichheda (Split) Chamber</h2>
        <div class="deco-divider">
          <div class="divider-line"></div>
          <div class="divider-symbol-diya"></div>
          <div class="divider-line"></div>
        </div>
        <p class="scripture-desc">Compare original combined Sanskrit verses with their Sandhi-split (Vichheda) representations. Tap any highlighted term to analyze its phonetic transition rules.</p>
      </div>

      <div class="toolbar-mapper">
        <div class="toolbar-title">
          Select Adhyāya: 
          <select id="diff-chapter-select" style="background: #110805; color: white; border: 1px solid var(--accent-saffron); padding: 0.4rem 1rem; border-radius: 4px; font-size: 1.05rem;">
            ${adhyayas.map(adh => {
              const sandhiCount = adh.shlokas.filter(s => s.sandhi && s.sandhi.length > 0).length;
              const hasSandhi = sandhiCount > 0;
              const label = hasSandhi ? `Adhyāya ${adh.number} (${sandhiCount} Verses with Sandhi)` : `Adhyāya ${adh.number} (No sandhi data)`;
              return `<option value="${adh.number}">${label}</option>`;
            }).join("")}
          </select>
        </div>
        <div class="toolbar-actions">
          <span id="diff-sandhi-count" style="font-size: 1rem; font-family: var(--font-heading); color: var(--accent-gold); font-weight: bold;"></span>
        </div>
      </div>

      <div class="shlokas-list" id="diff-shlokas-container" style="max-width: 1000px; margin: 0 auto 4rem;">
        <!-- Loaded dynamically -->
      </div>
    </section>
  `;

  const chapterSelect = document.getElementById("diff-chapter-select");
  const shlokasContainer = document.getElementById("diff-shlokas-container");
  const sandhiCountSpan = document.getElementById("diff-sandhi-count");

  function loadChapterDiff(num) {
    const chapterNum = parseInt(num, 10);
    const adhyaya = adhyayas.find(a => a.number === chapterNum);
    if (!adhyaya) return;

    const versesWithSandhi = adhyaya.shlokas.filter(s => s.sandhi && s.sandhi.length > 0);
    sandhiCountSpan.innerText = `${versesWithSandhi.length} of ${adhyaya.shlokas.length} verses analyzed`;

    if (adhyaya.shlokas.length === 0) {
      shlokasContainer.innerHTML = `<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No shlokas in this chapter.</p>`;
      return;
    }

    shlokasContainer.innerHTML = adhyaya.shlokas.map(shloka => {
      const hasSandhi = shloka.sandhi && shloka.sandhi.length > 0;
      const cardId = `diff-shloka-card-${shloka.number}`;

      // Left pane (original text with highlights)
      const origHtml = highlightSandhisInShloka(shloka.sanskrit, shloka.sandhi, cardId, false);
      
      // Right pane (split text with highlights)
      const splitHtml = highlightSandhisInShloka(shloka.sanskrit, shloka.sandhi, cardId, true);

      return `
        <div class="shloka-card" id="${cardId}" style="padding: 2rem;">
          <span class="shloka-number-badge">Verse ${chapterNum}.${shloka.number}</span>
          
          <div class="diff-card-grid">
            <!-- Left Pane: Combined Text -->
            <div class="diff-pane">
              <div class="diff-pane-title">Combined Text (ससंहितः पाठः)</div>
              <p class="sanskrit-text" style="font-size: 1.35rem; line-height: 2.2rem; text-align: left; border-left: 3px solid var(--accent-saffron); padding-left: 1rem; margin: 0;">
                ${origHtml}
              </p>
            </div>

            <!-- Right Pane: Split Text -->
            <div class="diff-pane">
              <div class="diff-pane-title">Split Text (पदच्छेदः / संधि-विच्छेदः)</div>
              <p class="sanskrit-text" style="font-size: 1.35rem; line-height: 2.2rem; text-align: left; border-left: 3px solid #2e7d32; padding-left: 1rem; margin: 0;">
                ${splitHtml}
              </p>
            </div>
          </div>

          <!-- Bottom Pane: Rules Analysis -->
          ${hasSandhi ? `
            <div style="margin-top: 1.5rem;">
              <div class="shloka-translit-label" style="margin-bottom: 0.8rem;"><i class="fa-solid fa-gears"></i> Sandhi Transition Rules</div>
              <div class="diff-analysis-drawer" style="margin-top: 0; border: 1px solid var(--border-color); border-radius: 8px;">
                ${shloka.sandhi.map((item, idx) => `
                  <div class="analysis-rule-item" data-index="${idx}" onclick="selectSandhiIndex('${cardId}', ${idx})">
                    <div class="analysis-rule-title">
                      <span class="analysis-rule-term">${item.term}</span>
                      <span class="analysis-rule-arrow"><i class="fa-solid fa-right-long"></i></span>
                      <span class="analysis-rule-breakdown">${item.breakdown}</span>
                    </div>
                    <div class="analysis-rule-meaning">${item.meaning}</div>
                  </div>
                `).join("")}
              </div>
            </div>
          ` : `
            <div style="margin-top: 1.2rem; font-style: italic; color: var(--text-secondary); font-size: 0.95rem; text-align: center;">
              No sandhi analysis data available for this verse.
            </div>
          `}

          <!-- Actions Panel -->
          <div class="shloka-actions" style="margin-top: 1.5rem; padding-top: 1.2rem; justify-content: flex-end;">
            <div class="shloka-buttons">
              <button class="btn-action" onclick="toggleBookmark('${scripture.id}', ${chapterNum}, ${shloka.number}, this)" title="Bookmark Shloka">
                <i class="fa-regular fa-bookmark"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join("");

    syncBookmarkIcons();
  }

  chapterSelect.addEventListener("change", (e) => {
    loadChapterDiff(e.target.value);
  });

  const defaultChapter = adhyayas.find(a => a.shlokas.some(s => s.sandhi && s.sandhi.length > 0))?.number || 1;
  chapterSelect.value = defaultChapter;
  loadChapterDiff(defaultChapter);
}

function highlightSandhisInShloka(sanskritText, sandhiList, cardId, isSplit) {
  if (!sandhiList || sandhiList.length === 0) {
    return sanskritText.replace(/\n/g, '<br>');
  }

  let resultText = sanskritText;
  
  const sortedSandhi = sandhiList
    .map((item, idx) => ({ ...item, originalIndex: idx }))
    .sort((a, b) => b.term.length - a.term.length);

  const placeholders = [];

  sortedSandhi.forEach(item => {
    const term = item.term.trim();
    if (!term) return;

    if (resultText.includes(term)) {
      const placeholder = `___SANDHI_PLACEHOLDER_${item.originalIndex}___`;
      placeholders.push({
        placeholder,
        replacement: isSplit
          ? `<span class="sandhi-split-highlight" data-index="${item.originalIndex}" onclick="highlightSandhiRule('${cardId}', ${item.originalIndex})" title="Original: ${term}">${item.breakdown}</span>`
          : `<span class="sandhi-orig-highlight" data-index="${item.originalIndex}" onclick="highlightSandhiRule('${cardId}', ${item.originalIndex})" title="Split: ${item.breakdown}">${term}</span>`
      });
      resultText = resultText.replaceAll(term, placeholder);
    }
  });

  placeholders.forEach(p => {
    resultText = resultText.replaceAll(p.placeholder, p.replacement);
  });

  return resultText.replace(/\n/g, '<br>');
}

window.highlightSandhiRule = function(cardId, index) {
  const card = document.getElementById(cardId);
  if (!card) return;

  card.querySelectorAll(".analysis-rule-item").forEach(item => {
    item.classList.remove("highlighted");
  });

  const targetRule = card.querySelector(`.analysis-rule-item[data-index="${index}"]`);
  if (targetRule) {
    targetRule.classList.add("highlighted");
    targetRule.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  card.querySelectorAll(".sandhi-orig-highlight, .sandhi-split-highlight").forEach(span => {
    if (span.getAttribute("data-index") == index) {
      span.classList.add("active");
    } else {
      span.classList.remove("active");
    }
  });
};

window.selectSandhiIndex = function(cardId, index) {
  const card = document.getElementById(cardId);
  if (!card) return;

  card.querySelectorAll(".analysis-rule-item").forEach(item => {
    if (parseInt(item.getAttribute("data-index"), 10) === index) {
      item.classList.add("highlighted");
    } else {
      item.classList.remove("highlighted");
    }
  });

  card.querySelectorAll(".sandhi-orig-highlight, .sandhi-split-highlight").forEach(span => {
    if (span.getAttribute("data-index") == index) {
      span.classList.add("active");
    } else {
      span.classList.remove("active");
    }
  });
};
