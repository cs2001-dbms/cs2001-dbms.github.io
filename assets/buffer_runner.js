/**
 * CS2001 DBMS - Interactive Buffer Pool Table Simulator (LRU & MRU)
 * Textbook Matrix Visualization with SQL-Runner-style Edit/Revert & Code Area
 *
 * Design:
 * - Shows the code / values passed in a code area above the simulation
 * - Toolbar on top: Badges & Policy tabs (left), [Edit] (toggles to [Revert]) and [Run] (right)
 * - Matrix table below: Buffer Slots as Rows, Block Requests as Columns
 * - Visual HIT pointer directly on the hit slot cell
 * - Stepping: [Previous Step] and [Next Step] (No play button)
 * - Policies: LRU and MRU only
 */

(function () {
  'use strict';

  if (window.__bufferRunnerLoaded) return;
  window.__bufferRunnerLoaded = true;

  // Professional SVG Icons (Lucide-style, zero emojis)
  const ICONS = {
    layers: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`,
    stepBack: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>`,
    stepForward: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
    first: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="11 19 4 12 11 5"></polyline><polyline points="19 19 12 12 19 5"></polyline></svg>`,
    last: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="13 19 20 12 13 5"></polyline><polyline points="5 19 12 12 5 5"></polyline></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    revert: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    alert: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
  };

  function getQuartoOffset() {
    const offsetMeta = document.querySelector('meta[name="quarto:offset"]');
    return offsetMeta ? offsetMeta.getAttribute('content') : '../../';
  }

  function ensureCSSLoaded() {
    if (document.querySelector('link[href*="buffer_runner.css"]')) return;
    const offset = getQuartoOffset();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = offset + 'assets/buffer_runner.css';
    document.head.appendChild(link);
  }

  function getAceTheme() {
    const isDark = document.body.classList.contains("quarto-dark") ||
      document.documentElement.getAttribute("data-bs-theme") === "dark" ||
      localStorage.getItem("quarto-color-scheme") === "dark";
    const lightTheme = localStorage.getItem("playgroundLightTheme") || "ace/theme/textmate";
    const darkTheme = localStorage.getItem("playgroundDarkTheme") || "ace/theme/tomorrow_night";
    return isDark ? darkTheme : lightTheme;
  }

  let aceLoadedPromise = null;
  function loadAce(timeoutMs = 2500) {
    if (window.ace) return Promise.resolve(window.ace);
    if (aceLoadedPromise) return aceLoadedPromise;
    aceLoadedPromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        aceLoadedPromise = null;
        reject(new Error("Ace CDN timeout"));
      }, timeoutMs);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.7/ace.js';
      s.onload = () => {
        clearTimeout(timer);
        resolve(window.ace);
      };
      s.onerror = (e) => {
        clearTimeout(timer);
        aceLoadedPromise = null;
        reject(e);
      };
      document.head.appendChild(s);
    });
    return aceLoadedPromise;
  }

  // Parse sequence, capacity, and policy (LRU / MRU)
  function parseBufferInput(text, defaultCapacity = 3, defaultPolicy = 'lru') {
    const lines = text.split('\n').map(l => l.trim());
    let sequence = [];
    let capacity = defaultCapacity;
    let policy = defaultPolicy.toLowerCase();

    for (let line of lines) {
      if (!line || line.startsWith('#') || line.startsWith('//') || line.startsWith('--')) continue;

      const seqMatch = line.match(/^(?:sequence|requests?|pages?|blocks?|stream)\s*[:=]\s*(.+)$/i);
      if (seqMatch) {
        sequence = seqMatch[1].split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
        continue;
      }

      const capMatch = line.match(/^(?:capacity|frames?|slots?|size)\s*[:=]\s*(\d+)$/i);
      if (capMatch) {
        capacity = Math.max(1, Math.min(8, parseInt(capMatch[1], 10)));
        continue;
      }

      const polMatch = line.match(/^(?:policy|algorithm|algo|method)\s*[:=]\s*([a-zA-Z_-]+)$/i);
      if (polMatch) {
        const p = polMatch[1].toLowerCase().replace(/[^a-z]/g, '');
        if (p === 'mru' || p === 'lru') {
          policy = p;
        }
        continue;
      }

      if (sequence.length === 0 && (line.includes(',') || line.split(/\s+/).length > 2)) {
        sequence = line.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
      }
    }

    if (sequence.length === 0) {
      sequence = ['A', 'B', 'C', 'D', 'A', 'B', 'E', 'A', 'B', 'C', 'D', 'E'];
    }

    if (policy !== 'mru') policy = 'lru';

    return { sequence, capacity, policy };
  }

  // Simulation Engine for LRU and MRU
  function runBufferSimulation(sequence, capacity, policy) {
    const steps = [];
    let slots = [];
    for (let i = 0; i < capacity; i++) {
      slots.push({ slotIndex: i, page: null, lastAccessTime: -1, loadTime: -1 });
    }

    let hitCount = 0;
    let missCount = 0;

    for (let t = 0; t < sequence.length; t++) {
      const page = sequence[t];
      const existingSlotIdx = slots.findIndex(s => s.page === page);

      let isHit = false;
      let targetSlotIdx = -1;
      let evictedPage = null;
      let action = 'load';
      let explanation = '';

      if (existingSlotIdx !== -1) {
        // HIT
        isHit = true;
        hitCount++;
        action = 'hit';
        targetSlotIdx = existingSlotIdx;
        slots[existingSlotIdx].lastAccessTime = t;

        explanation = `<strong>Cache Hit:</strong> Block <code>${page}</code> is already resident in <strong>Slot ${targetSlotIdx}</strong>. Access timestamp updated to step ${t + 1}. No disk I/O required.`;
      } else {
        // MISS
        missCount++;
        action = 'miss';

        const emptySlotIdx = slots.findIndex(s => s.page === null);
        if (emptySlotIdx !== -1) {
          // Cold start load into empty slot
          targetSlotIdx = emptySlotIdx;
          action = 'load';
          slots[emptySlotIdx].page = page;
          slots[emptySlotIdx].loadTime = t;
          slots[emptySlotIdx].lastAccessTime = t;

          explanation = `<strong>Cache Miss (Initial Load):</strong> Block <code>${page}</code> is not in buffer. Placed into empty <strong>Slot ${targetSlotIdx}</strong> via disk read.`;
        } else {
          // Buffer full -> Evict based on policy
          let victimIdx = -1;

          if (policy === 'lru') {
            // Least Recently Used: minimum lastAccessTime
            let minAccess = Infinity;
            for (let i = 0; i < capacity; i++) {
              if (slots[i].lastAccessTime < minAccess) {
                minAccess = slots[i].lastAccessTime;
                victimIdx = i;
              }
            }
            evictedPage = slots[victimIdx].page;
            const stepsAgo = t - slots[victimIdx].lastAccessTime;
            explanation = `<strong>Cache Miss (Eviction):</strong> Buffer full. Under <strong>LRU</strong>, Slot ${victimIdx} with Block <code>${evictedPage}</code> was used longest ago (${stepsAgo} step${stepsAgo === 1 ? '' : 's'} ago at step ${slots[victimIdx].lastAccessTime + 1}). Evicted to load <code>${page}</code>.`;
          } else {
            // Most Recently Used (MRU): maximum lastAccessTime
            let maxAccess = -Infinity;
            for (let i = 0; i < capacity; i++) {
              if (slots[i].lastAccessTime > maxAccess) {
                maxAccess = slots[i].lastAccessTime;
                victimIdx = i;
              }
            }
            evictedPage = slots[victimIdx].page;
            explanation = `<strong>Cache Miss (Eviction):</strong> Buffer full. Under <strong>MRU</strong>, Slot ${victimIdx} with Block <code>${evictedPage}</code> was referenced most recently (step ${slots[victimIdx].lastAccessTime + 1}). Evicted to load <code>${page}</code>.`;
          }

          targetSlotIdx = victimIdx;
          action = 'evict';
          slots[victimIdx].page = page;
          slots[victimIdx].loadTime = t;
          slots[victimIdx].lastAccessTime = t;
        }
      }

      // Snapshot slots for step t
      const snapshot = slots.map((s, idx) => ({
        slotIndex: idx,
        page: s.page,
        isHitSlot: idx === targetSlotIdx && isHit,
        isTarget: idx === targetSlotIdx,
        action: idx === targetSlotIdx ? action : 'idle',
        evictedPage: idx === targetSlotIdx ? evictedPage : null
      }));

      steps.push({
        stepIndex: t,
        page,
        isHit,
        targetSlotIdx,
        evictedPage,
        action,
        explanation,
        slots: snapshot,
        runningHits: hitCount,
        runningMisses: missCount,
        hitRatio: ((hitCount / (t + 1)) * 100).toFixed(1)
      });
    }

    return {
      sequence,
      capacity,
      policy,
      steps,
      totalHits: hitCount,
      totalMisses: missCount,
      hitRatio: ((hitCount / sequence.length) * 100).toFixed(1)
    };
  }

  function extractCleanCode(codeEl) {
    const clone = codeEl.cloneNode(true);
    clone.querySelectorAll('.ln, .line-numbers, .c-copy, .copy-button, a, button, .code-annotation, .code-copy-button').forEach(e => e.remove());
    return (clone.innerText || clone.textContent || '').trim();
  }

  // Setup Buffer Runner Block (Matches SQL Runner structure)
  function setupBufferBlock(scaffold, codeEl) {
    if (scaffold.dataset.bufferRunnerInit) return;
    scaffold.dataset.bufferRunnerInit = 'true';

    const initialCode = extractCleanCode(codeEl);

    // Extract attributes
    const attrCapacity = scaffold.getAttribute('frames') || scaffold.dataset.frames ||
      codeEl.getAttribute('frames') || (initialCode.match(/frames?[:=]\s*(\d+)/i) || [])[1] || 3;
    const attrPolicy = scaffold.getAttribute('policy') || scaffold.dataset.policy ||
      codeEl.getAttribute('policy') || (initialCode.match(/policy[:=]\s*([a-z]+)/i) || [])[1] || 'lru';

    let config = parseBufferInput(initialCode, parseInt(attrCapacity, 10), attrPolicy.toLowerCase());
    let activePolicy = config.policy;

    let currentStepIdx = 0;
    let simResult = runBufferSimulation(config.sequence, config.capacity, activePolicy);

    // 1. Create Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'buffer-runner-wrapper';
    scaffold.parentNode.insertBefore(wrapper, scaffold);

    // 2. Toolbar (Left: Badges & Policy tabs; Right: Edit & Run buttons like SQL runner)
    const toolbar = document.createElement('div');
    toolbar.className = 'buffer-runner-toolbar';

    const leftDiv = document.createElement('div');
    leftDiv.className = 'buffer-runner-left';

    const mainBadge = document.createElement('span');
    mainBadge.className = 'buffer-badge buffer-badge-primary';
    mainBadge.innerHTML = `<span class="buffer-icon">${ICONS.layers}</span> <span>Buffer Pool Simulator</span>`;

    const capBadge = document.createElement('span');
    capBadge.className = 'buffer-badge';
    capBadge.innerHTML = `<span>Slots:</span> <b class="buffer-cap-val">${config.capacity} Rows</b>`;

    // Policy switcher (LRU vs MRU)
    const policyTabs = document.createElement('div');
    policyTabs.className = 'buffer-policy-tabs';
    ['lru', 'mru'].forEach(p => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = `buffer-tab-pill ${p === activePolicy ? 'active' : ''}`;
      tab.dataset.policy = p;
      tab.textContent = p.toUpperCase();
      tab.addEventListener('click', () => {
        if (activePolicy === p) return;
        activePolicy = p;
        policyTabs.querySelectorAll('.buffer-tab-pill').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        recomputeSimulation();
      });
      policyTabs.appendChild(tab);
    });

    leftDiv.appendChild(mainBadge);
    leftDiv.appendChild(policyTabs);
    leftDiv.appendChild(capBadge);

    // Right controls: Edit (toggles to Revert) and Run
    const rightDiv = document.createElement('div');
    rightDiv.className = 'buffer-runner-right';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'buffer-btn buffer-btn-edit';
    editBtn.title = 'Edit values inline';
    editBtn.innerHTML = `${ICONS.edit} <span>Edit</span>`;

    const runBtn = document.createElement('button');
    runBtn.type = 'button';
    runBtn.className = 'buffer-btn buffer-btn-primary';
    runBtn.title = 'Run simulation (Ctrl+Enter)';
    runBtn.innerHTML = `${ICONS.play} <span>Run</span>`;

    rightDiv.appendChild(editBtn);
    rightDiv.appendChild(runBtn);

    toolbar.appendChild(leftDiv);
    toolbar.appendChild(rightDiv);
    wrapper.appendChild(toolbar);

    // 3. Code Area: Shows the values/code we pass by default!
    const codeArea = document.createElement('div');
    codeArea.className = 'buffer-runner-code-area';
    codeArea.appendChild(scaffold); // Scaffold (syntax-highlighted code) is visible here!

    const aceContainer = document.createElement('div');
    aceContainer.className = 'buffer-runner-ace-container';
    aceContainer.style.display = 'none';
    codeArea.appendChild(aceContainer);

    const textarea = document.createElement('textarea');
    textarea.className = 'buffer-runner-textarea';
    textarea.value = initialCode;
    textarea.style.display = 'none';
    textarea.spellcheck = false;
    codeArea.appendChild(textarea);

    wrapper.appendChild(codeArea);

    // 4. Output Body (Matrix Table & Step Navigation)
    const bodyContainer = document.createElement('div');
    bodyContainer.className = 'buffer-body';
    wrapper.appendChild(bodyContainer);

    // Ace Editor Setup
    let aceInstance = null;
    let isEditing = false;

    async function initAceEditor() {
      if (aceInstance) {
        aceInstance.setTheme(getAceTheme());
        return aceInstance;
      }
      const ace = await loadAce();
      aceInstance = ace.edit(aceContainer);
      aceInstance.session.setMode("ace/mode/text");
      aceInstance.setTheme(getAceTheme());
      aceInstance.setFontSize(13);
      aceInstance.setShowPrintMargin(false);
      aceInstance.session.setUseWrapMode(true);
      aceInstance.setValue(initialCode, -1);

      aceInstance.commands.addCommand({
        name: "runSimulation",
        bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
        exec: () => runBtn.click()
      });

      const observer = new MutationObserver(() => {
        aceInstance.setTheme(getAceTheme());
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

      return aceInstance;
    }

    // Edit button click (toggles Edit <-> Revert, exactly like SQL runner)
    editBtn.addEventListener('click', async () => {
      isEditing = !isEditing;
      if (isEditing) {
        const height = Math.max(90, scaffold.offsetHeight);
        scaffold.style.display = 'none';

        try {
          aceContainer.style.display = 'block';
          aceContainer.style.height = height + 'px';
          const editor = await initAceEditor();
          editor.resize();
          editor.focus();
        } catch (e) {
          aceContainer.style.display = 'none';
          textarea.style.display = 'block';
          textarea.style.height = height + 'px';
          textarea.focus();
        }

        editBtn.innerHTML = `${ICONS.revert} <span>Revert</span>`;
        editBtn.title = 'Revert to original values';
      } else {
        // Revert clicked
        if (aceInstance) {
          aceInstance.setValue(initialCode, -1);
        }
        textarea.value = initialCode;
        aceContainer.style.display = 'none';
        textarea.style.display = 'none';
        scaffold.style.display = '';

        editBtn.innerHTML = `${ICONS.edit} <span>Edit</span>`;
        editBtn.title = 'Edit values inline';

        config = parseBufferInput(initialCode, parseInt(attrCapacity, 10), attrPolicy.toLowerCase());
        activePolicy = config.policy;
        policyTabs.querySelectorAll('.buffer-tab-pill').forEach(t => {
          t.classList.toggle('active', t.dataset.policy === activePolicy);
        });
        capBadge.querySelector('.buffer-cap-val').textContent = `${config.capacity} Rows`;
        recomputeSimulation();
      }
    });

    // Run button click
    runBtn.addEventListener('click', () => {
      let code = initialCode;
      if (isEditing) {
        code = aceInstance ? aceInstance.getValue() : textarea.value;
      }
      config = parseBufferInput(code, config.capacity, activePolicy);
      activePolicy = config.policy;

      policyTabs.querySelectorAll('.buffer-tab-pill').forEach(t => {
        t.classList.toggle('active', t.dataset.policy === activePolicy);
      });
      capBadge.querySelector('.buffer-cap-val').textContent = `${config.capacity} Rows`;
      recomputeSimulation();
    });

    // Sub-containers in Output Body
    const tableContainer = document.createElement('div');
    tableContainer.className = 'buffer-table-container';
    bodyContainer.appendChild(tableContainer);

    const explanationCard = document.createElement('div');
    explanationCard.className = 'buffer-explanation-card';
    bodyContainer.appendChild(explanationCard);

    const controlsBar = document.createElement('div');
    controlsBar.className = 'buffer-controls-bar';
    bodyContainer.appendChild(controlsBar);

    function recomputeSimulation() {
      simResult = runBufferSimulation(config.sequence, config.capacity, activePolicy);
      if (currentStepIdx >= simResult.steps.length) {
        currentStepIdx = simResult.steps.length - 1;
      }
      renderStep();
    }

    // Render Matrix Table: Buffer Slots as Rows, Block Requests as Columns
    function renderMatrixTable() {
      const numSteps = config.sequence.length;
      let html = `<table class="buffer-matrix-table">`;

      // 1. Header Row: Request Values
      html += `<tr class="row-requests"><th class="col-label">Request</th>`;
      for (let c = 0; c < numSteps; c++) {
        const isCurrent = c === currentStepIdx;
        const isFuture = c > currentStepIdx;
        const colClass = isCurrent ? 'step-active' : (isFuture ? 'col-future' : '');
        html += `<th class="${colClass}" data-step="${c}" title="Click to jump to step ${c + 1}">${config.sequence[c]}</th>`;
      }
      html += `</tr>`;

      // 2. Middle Rows: Buffer Slots (Rows)
      for (let slot = 0; slot < config.capacity; slot++) {
        html += `<tr><td class="col-label">Slot ${slot}</td>`;
        for (let c = 0; c < numSteps; c++) {
          const isCurrent = c === currentStepIdx;
          const isFuture = c > currentStepIdx;
          const stepData = simResult.steps[c];

          let cellClass = '';
          let cellContent = '';

          if (isFuture) {
            // Future step: DO NOT fill values, DO NOT highlight hits
            cellClass = 'col-future';
            cellContent = '';
          } else {
            // Reached step: fill values and highlight hit if applicable
            const slotData = stepData.slots[slot];
            const pageVal = slotData && slotData.page !== null ? slotData.page : '—';
            cellContent = `<span class="buffer-cell-val">${pageVal}</span>`;

            if (isCurrent) cellClass += ' col-active';

            // Visual Hit Pointer directly on the hit cell (only for reached steps)
            if (slotData && slotData.isHitSlot) {
              cellClass += ' buffer-cell-hit';
            } else if (slotData && slotData.isTarget && !stepData.isHit) {
              cellClass += ' buffer-cell-loaded';
            }
          }

          html += `
            <td class="${cellClass}" data-step="${c}">
              ${cellContent}
            </td>
          `;
        }
        html += `</tr>`;
      }

      // 3. Bottom Row: Status (HIT vs MISS)
      html += `<tr class="row-result"><td class="col-label">Status</td>`;
      for (let c = 0; c < numSteps; c++) {
        const isCurrent = c === currentStepIdx;
        const isFuture = c > currentStepIdx;
        const stepData = simResult.steps[c];

        let colClass = isCurrent ? 'col-active' : (isFuture ? 'col-future' : '');
        let badgeHtml = '';

        if (!isFuture) {
          // Only show HIT or MISS when step is reached
          if (stepData.isHit) {
            badgeHtml = `<span class="status-badge-hit">${ICONS.check} HIT</span>`;
          } else {
            badgeHtml = `<span class="status-badge-miss">MISS</span>`;
          }
        }

        html += `<td class="${colClass}" data-step="${c}">${badgeHtml}</td>`;
      }
      html += `</tr>`;

      html += `</table>`;
      tableContainer.innerHTML = html;

      // Click to jump to step
      tableContainer.querySelectorAll('[data-step]').forEach(cell => {
        cell.style.cursor = 'pointer';
        cell.addEventListener('click', () => {
          currentStepIdx = parseInt(cell.dataset.step, 10);
          renderStep();
        });
      });
    }

    // Render Pedagogical Explanation
    function renderExplanation(curStep) {
      explanationCard.className = `buffer-explanation-card ${curStep.isHit ? 'hit' : 'miss'}`;
      const titleIcon = curStep.isHit ? ICONS.check : ICONS.alert;
      const titleText = curStep.isHit
        ? `Step ${curStep.stepIndex + 1}: Requested Block "${curStep.page}" → CACHE HIT (Found in Slot ${curStep.targetSlotIdx})`
        : `Step ${curStep.stepIndex + 1}: Requested Block "${curStep.page}" → CACHE MISS (${curStep.action === 'load' ? 'Loaded in Slot ' + curStep.targetSlotIdx : 'Evicted ' + curStep.evictedPage + ' from Slot ' + curStep.targetSlotIdx})`;

      explanationCard.innerHTML = `
        <div class="buffer-explanation-title">
          <span class="buffer-icon" style="color: ${curStep.isHit ? 'var(--buf-hit-badge)' : 'var(--buf-miss-badge)'};">${titleIcon}</span>
          <span>${titleText}</span>
        </div>
        <div class="buffer-explanation-body">${curStep.explanation}</div>
      `;
    }

    // Render Navigation Controls (Previous and Next only, with KPIs)
    function renderControls(curStep) {
      const isFirst = currentStepIdx === 0;
      const isLast = currentStepIdx === simResult.steps.length - 1;

      controlsBar.innerHTML = `
        <div class="buffer-step-controls">
          <button type="button" class="buffer-btn" id="btn-first" title="Jump to First Step" ${isFirst ? 'disabled' : ''}>
            ${ICONS.first} <span>Start</span>
          </button>
          <button type="button" class="buffer-btn buffer-btn-primary" id="btn-prev" title="Previous Step" ${isFirst ? 'disabled' : ''}>
            ${ICONS.stepBack} <span>Previous</span>
          </button>
          <button type="button" class="buffer-btn buffer-btn-primary" id="btn-next" title="Next Step" ${isLast ? 'disabled' : ''}>
            <span>Next</span> ${ICONS.stepForward}
          </button>
          <button type="button" class="buffer-btn" id="btn-last" title="Jump to Final Step" ${isLast ? 'disabled' : ''}>
            <span>End</span> ${ICONS.last}
          </button>
          <span style="font-size:0.8rem; color:var(--buf-text-muted); margin-left:0.5rem; font-weight:600;">
            Step <b>${curStep.stepIndex + 1}</b> of ${config.sequence.length}
          </span>
        </div>
        <div class="buffer-kpis">
          <div class="buffer-kpi-item">
            Hits: <span class="buffer-kpi-badge buffer-kpi-hit">${curStep.runningHits}</span>
          </div>
          <div class="buffer-kpi-item">
            Misses: <span class="buffer-kpi-badge buffer-kpi-miss">${curStep.runningMisses}</span>
          </div>
          <div class="buffer-kpi-item">
            Hit Ratio: <span class="buffer-kpi-badge buffer-kpi-ratio">${curStep.hitRatio}%</span>
          </div>
        </div>
      `;

      controlsBar.querySelector('#btn-first').addEventListener('click', () => {
        currentStepIdx = 0;
        renderStep();
      });

      controlsBar.querySelector('#btn-prev').addEventListener('click', () => {
        if (currentStepIdx > 0) {
          currentStepIdx--;
          renderStep();
        }
      });

      controlsBar.querySelector('#btn-next').addEventListener('click', () => {
        if (currentStepIdx < simResult.steps.length - 1) {
          currentStepIdx++;
          renderStep();
        }
      });

      controlsBar.querySelector('#btn-last').addEventListener('click', () => {
        currentStepIdx = simResult.steps.length - 1;
        renderStep();
      });
    }

    function renderStep() {
      const curStep = simResult.steps[currentStepIdx];
      renderMatrixTable();
      renderExplanation(curStep);
      renderControls(curStep);
    }

    renderStep();
  }

  function initBufferRunners() {
    ensureCSSLoaded();

    const selectors = [
      'code.sourceCode.buffer',
      'code.buffer',
      'code[check="buffer-pool"]',
      'code[data-check="buffer-pool"]'
    ];

    const codeElements = document.querySelectorAll(selectors.join(', '));
    codeElements.forEach(codeEl => {
      const scaffold = codeEl.closest('.code-copy-outer-scaffold') || codeEl.closest('.sourceCode') || codeEl.closest('pre');
      if (scaffold && !scaffold.dataset.bufferRunnerInit) {
        setupBufferBlock(scaffold, codeEl);
      }
    });

    document.querySelectorAll('pre.buffer, pre[data-check="buffer-pool"], pre[check="buffer-pool"], div[data-check="buffer-pool"]').forEach(el => {
      const code = el.querySelector('code') || el;
      const scaffold = code.closest('.code-copy-outer-scaffold') || code.closest('.sourceCode') || el;
      if (scaffold && !scaffold.dataset.bufferRunnerInit) {
        setupBufferBlock(scaffold, code);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBufferRunners);
  } else {
    initBufferRunners();
  }

})();
