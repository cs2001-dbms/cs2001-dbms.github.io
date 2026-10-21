/**
 * CS2001 DBMS - Interactive In-Browser SQL Runner
 * Powered by PGlite (WebAssembly PostgreSQL) with Ace Editor Syntax Highlighting
 *
 * Rules:
 * 1. Only SQL blocks with an explicit database name are made executable.
 *    If no db is specified, the code block remains static syntax-highlighted code.
 * 2. Database Specification:
 *    - In code block attributes: ```{.sql db="test_db"} or ```{.sql db="university"}
 *    - Inline comment inside SQL: -- db: test_db
 *    - In parent wrapper: ::: {db="test_db"}
 *    - In preceding marker: <div class="ds">Dataset: flis</div> or **Database:** test_db
 * 3. Minimal Toolbar:
 *    - Left: Database badge (workspace / dataset)
 *    - Right: Edit & Run buttons
 *    - Zero emojis: Clean professional SVG vector icons everywhere
 * 4. Automatic DDL/DML visual feedback:
 *    - CREATE / ALTER TABLE displays schema breakdown with PK, FK, UNIQUE, NOT NULL badges
 *    - INSERT / UPDATE / DELETE displays live updated table rows
 * 5. Ephemeral In-Memory Execution:
 *    - Pure in-memory PGlite instances (zero browser storage/persistence).
 *    - Once the student leaves or switches to another page, all created tables and data are automatically lost.
 *    - SQL Playground remains completely separate and untouched.
 */

(function () {
  'use strict';

  if (window.__sqlRunnerLoaded) return;
  window.__sqlRunnerLoaded = true;

  // Clean up any old persistent course runner stores from earlier versions
  if (typeof indexedDB !== 'undefined' && indexedDB.deleteDatabase) {
    try {
      ['course-runner-workspace', 'course-runner-test_db', 'course-runner-university', 'course-runner-flis', 'course-runner-lis', 'course-runner-eshop'].forEach(name => {
        indexedDB.deleteDatabase(name);
      });
    } catch (e) {}
  }

  const VALID_DATASETS = ['university', 'flis', 'lis', 'eshop', 'test_db'];
  const DEFAULT_DATASET = 'university';

  // Professional SVG Icons (Lucide-style, zero emojis)
  const ICONS = {
    database: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    revert: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    table: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>`,
    columns: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
    eye: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`
  };

  let PGliteClass = null;
  const dbCache = {}; // datasetId -> { db, loadingPromise }

  // Theme resolution aligned with localStorage and Quarto
  function getAceTheme() {
    const isDark = document.body.classList.contains("quarto-dark") ||
                   document.documentElement.getAttribute("data-bs-theme") === "dark" ||
                   localStorage.getItem("quarto-color-scheme") === "dark";
    const lightTheme = localStorage.getItem("playgroundLightTheme") || "ace/theme/textmate";
    const darkTheme = localStorage.getItem("playgroundDarkTheme") || "ace/theme/tomorrow_night";
    return isDark ? darkTheme : lightTheme;
  }

  // Ace Editor Loader
  let aceLoadedPromise = null;
  function loadAce() {
    if (window.ace) return Promise.resolve(window.ace);
    if (aceLoadedPromise) return aceLoadedPromise;
    aceLoadedPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.7/ace.js';
      s.onload = () => resolve(window.ace);
      s.onerror = (e) => {
        aceLoadedPromise = null;
        reject(e);
      };
      document.head.appendChild(s);
    });
    return aceLoadedPromise;
  }

  function normalizeDs(val) {
    if (!val) return null;
    const str = String(val).trim().toLowerCase();
    if (str.includes('test_db') || str.includes('test-db') || str.includes('workspace')) return 'test_db';
    if (str.includes('university')) return 'university';
    if (str.includes('flis')) return 'flis';
    if (str.includes('lis')) return 'lis';
    if (str.includes('eshop')) return 'eshop';
    return null;
  }

  function getBadgeLabel(dsId) {
    if (dsId === 'test_db') return 'workspace';
    return dsId;
  }

  // Clean raw PostgreSQL dumps to run smoothly in browser WASM
  function sanitizeSQL(sql) {
    const lines = sql.split("\n");
    const cleaned = [];
    let copyMode = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (copyMode) {
        if (line.trim() === "\\.") {
          copyMode = null;
          continue;
        }
        const values = line.split("\t").map(v => {
          if (v === "\\N") return "NULL";
          return "'" + v.replace(/'/g, "''") + "'";
        });
        cleaned.push(`INSERT INTO ${copyMode.table} ${copyMode.cols} VALUES (${values.join(", ")});`);
        continue;
      }

      const trimmed = line.trim();
      if (trimmed.match(/^\\[a-zA-Z]/)) continue;
      if (trimmed.match(/^SET\s/i)) continue;
      if (trimmed.match(/^SELECT\s+pg_catalog/i)) continue;
      if (trimmed.match(/OWNER TO/i)) continue;
      if (trimmed.match(/^(REVOKE|GRANT)\s/i) && trimmed.match(/(ON SCHEMA|ON DATABASE|FROM |TO )/i)) continue;
      if (trimmed.match(/^CREATE EXTENSION/i)) continue;
      if (trimmed.match(/^-- (Dumped from|Dumped by|Name:.*Owner:)/)) continue;

      const copyMatch = line.match(/^COPY\s+(?:public\.)?(\w+)\s*(\([^)]+\))\s+FROM\s+stdin;/i);
      if (copyMatch) {
        copyMode = { table: copyMatch[1], cols: copyMatch[2] };
        continue;
      }

      cleaned.push(line.replace(/public\./g, ""));
    }
    return cleaned.join("\n");
  }

  function getQuartoOffset() {
    const offsetMeta = document.querySelector('meta[name="quarto:offset"]');
    return offsetMeta ? offsetMeta.getAttribute('content') : '../../';
  }

  function ensureCSSLoaded() {
    if (document.querySelector('link[href*="sql_runner.css"]')) return;
    const offset = getQuartoOffset();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = offset + 'assets/sql_runner.css';
    document.head.appendChild(link);
  }

  async function getPGlite() {
    if (!PGliteClass) {
      const mod = await import("https://cdn.jsdelivr.net/npm/@electric-sql/pglite/dist/index.js");
      PGliteClass = mod.PGlite;
    }
    return PGliteClass;
  }

  async function getDB(dsId, onProgress) {
    const target = VALID_DATASETS.includes(dsId) ? dsId : DEFAULT_DATASET;

    if (dbCache[target] && dbCache[target].db) {
      return dbCache[target].db;
    }
    if (dbCache[target] && dbCache[target].loadingPromise) {
      return dbCache[target].loadingPromise;
    }

    const promise = (async () => {
      const PGlite = await getPGlite();
      if (onProgress) onProgress("Connecting to in-browser database...");

      // Pure in-memory database: zero data stored in browser storage
      // Data exists ONLY in page memory; switching pages or refreshing completely resets it
      const db = new PGlite();

      if (target !== "test_db") {
        const offset = getQuartoOffset();
        const url = `${offset}datasets/${target}.sql`;

        if (onProgress) onProgress(`Loading ${target} dataset...`);
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`Failed to load dataset '${target}' from ${url} (${r.status} ${r.statusText})`);
        }
        const rawSql = await r.text();
        const cleanedSql = sanitizeSQL(rawSql);
        await db.exec(cleanedSql);
      }

      dbCache[target] = { db, loadingPromise: null };
      return db;
    })();

    dbCache[target] = { db: null, loadingPromise: promise };
    try {
      return await promise;
    } catch (err) {
      delete dbCache[target];
      throw err;
    }
  }

  function extractCleanCode(codeEl) {
    const clone = codeEl.cloneNode(true);
    clone.querySelectorAll('a, button, .code-annotation').forEach(el => el.remove());
    return (clone.innerText || clone.textContent || '').trim();
  }

  let lastSelectedCode = "";

  function getQueryToRun(codeEl, aceInstance, textarea) {
    // If Ace Editor is active
    if (aceInstance && aceInstance.container && aceInstance.container.offsetParent !== null) {
      const sel = aceInstance.getSelectedText().trim();
      if (sel) return sel;
      return aceInstance.getValue().trim();
    }

    // Fallback textarea
    if (textarea && textarea.style.display !== 'none') {
      const selStart = textarea.selectionStart;
      const selEnd = textarea.selectionEnd;
      if (selEnd > selStart) {
        const sel = textarea.value.substring(selStart, selEnd).trim();
        if (sel) return sel;
      }
      return textarea.value.trim();
    }

    if (lastSelectedCode) {
      const q = lastSelectedCode;
      lastSelectedCode = "";
      return q;
    }

    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
      const selText = sel.toString().trim();
      if (selText && codeEl.contains(sel.anchorNode)) {
        return selText;
      }
    }

    return extractCleanCode(codeEl);
  }

  /**
   * Determine the dataset for a SQL block.
   * Returns null if NO explicit database name is specified, so that
   * plain SQL blocks remain static and non-executable.
   */
  function detectDataset(scaffold, codeEl, codeText) {
    const targets = [
      codeEl,
      scaffold?.querySelector?.('code'),
      scaffold?.querySelector?.('pre'),
      scaffold?.querySelector?.('.sourceCode'),
      scaffold,
      codeEl?.closest?.('.sourceCode'),
      scaffold?.closest?.('.sourceCode')
    ];
    
    // 1. Direct attributes on code, pre, sourceCode, or scaffold
    for (const el of targets) {
      if (!el) continue;
      const attr = el.getAttribute?.('db') || el.getAttribute?.('data-db') || el.getAttribute?.('dataset') || el.getAttribute?.('data-dataset');
      if (attr) {
        const norm = normalizeDs(attr);
        if (norm) return norm;
      }
      if (el.classList) {
        for (const cls of el.classList) {
          const m = cls.match(/^(?:db|dataset)-([a-zA-Z0-9_\-]+)$/i);
          if (m) {
            const norm = normalizeDs(m[1]);
            if (norm) return norm;
          }
        }
      }
    }

    // 2. Direct parent wrapper (e.g. ::: {db="test_db"})
    const parentWithDb = scaffold?.closest?.('[db], [data-db], [dataset], [data-dataset], [class*="db-"]');
    if (parentWithDb && parentWithDb !== document.body) {
      const parentAttr = parentWithDb.getAttribute?.('db') || parentWithDb.getAttribute?.('data-db') || parentWithDb.getAttribute?.('dataset') || parentWithDb.getAttribute?.('data-dataset');
      if (parentAttr) {
        const norm = normalizeDs(parentAttr);
        if (norm) return norm;
      }
      if (parentWithDb.classList) {
        for (const cls of parentWithDb.classList) {
          const m = cls.match(/^(?:db|dataset)-([a-zA-Z0-9_\-]+)$/i);
          if (m) {
            const norm = normalizeDs(m[1]);
            if (norm) return norm;
          }
        }
      }
    }

    // 3. Comment inside SQL snippet: -- db: test_db or /* db: test_db */
    if (codeText) {
      const commentMatch = codeText.match(/(?:--|\/\*)\s*(?:db|dataset|database)\s*[:=]\s*([a-zA-Z0-9_\-]+)/i);
      if (commentMatch) {
        const norm = normalizeDs(commentMatch[1]);
        if (norm) return norm;
      }
    }

    // 4. Preceding DOM elements right before the SQL block
    let curr = scaffold;
    while (curr) {
      let prev = curr.previousElementSibling;
      while (prev) {
        const prevAttr = prev.getAttribute?.('db') || prev.getAttribute?.('data-db') || prev.getAttribute?.('dataset') || prev.getAttribute?.('data-dataset') ||
                         prev.querySelector?.('[db], [data-db], [dataset], [data-dataset]')?.getAttribute('db');
        if (prevAttr) {
          const norm = normalizeDs(prevAttr);
          if (norm) return norm;
        }

        const dsEl = (prev.classList?.contains('ds') || prev.classList?.contains('db')) ? prev : prev.querySelector?.('.ds, .db');
        if (dsEl) {
          const norm = normalizeDs(dsEl.textContent);
          if (norm) return norm;
        }

        const textMatch = prev.textContent?.trim().match(/^(?:\*\*)?(?:Database|Dataset|db)\s*(?:\*\*)?\s*:\s*([a-zA-Z0-9_\-]+)$/i);
        if (textMatch) {
          const norm = normalizeDs(textMatch[1]);
          if (norm) return norm;
        }

        prev = prev.previousElementSibling;
      }
      curr = curr.parentElement;
      if (curr && (curr.tagName === 'BODY' || curr.classList.contains('page-columns') || curr.classList.contains('content') || curr.tagName === 'MAIN')) {
        break;
      }
    }

    // If no explicit database name is specified, return null (do not make executable)
    return null;
  }

  async function executeSQL(db, query) {
    const startTime = performance.now();
    let cleaned = query.trim();

    if (cleaned.startsWith('...')) {
      throw new Error("This snippet starts with '...' indicating a continuation of a previous query. Click 'Edit' to complete the query before running.");
    }

    if (/<[a-zA-Z0-9_]+>/i.test(cleaned)) {
      throw new Error("This snippet contains syntax placeholders like <attributes>. Click 'Edit' and replace them with real table/column names before running.");
    }

    const results = await db.exec(cleaned, { rowMode: 'array' });
    const elapsed = (performance.now() - startTime).toFixed(1);
    return { results, elapsed };
  }

  // Schema & Table Inspection Helpers
  async function getTableSchema(db, tblName) {
    try {
      const colsQuery = `
        SELECT c.column_name, c.data_type, c.character_maximum_length, c.is_nullable
        FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = '${tblName}'
        ORDER BY c.ordinal_position;
      `;
      const colsRes = await db.query(colsQuery, [], { rowMode: 'array' });

      const constrQuery = `
        SELECT tc.constraint_type, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'public' AND tc.table_name = '${tblName}';
      `;
      const constrRes = await db.query(constrQuery, [], { rowMode: 'array' });

      const constraints = {};
      if (constrRes.rows) {
        constrRes.rows.forEach(r => {
          const type = r[0];
          const col = r[1];
          if (!constraints[col]) constraints[col] = [];
          if (!constraints[col].includes(type)) constraints[col].push(type);
        });
      }

      return { columns: colsRes.rows || [], constraints };
    } catch (e) {
      return null;
    }
  }

  async function getTableData(db, tblName, limit = 20) {
    try {
      const res = await db.query(`SELECT * FROM ${tblName} LIMIT ${limit};`, [], { rowMode: 'array' });
      const countRes = await db.query(`SELECT count(*) FROM ${tblName};`, [], { rowMode: 'array' });
      const total = countRes.rows && countRes.rows[0] ? countRes.rows[0][0] : res.rows.length;
      return { fields: res.fields || [], rows: res.rows || [], total };
    } catch (e) {
      return null;
    }
  }

  async function listAllTables(db) {
    try {
      const q = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;";
      const res = await db.query(q, [], { rowMode: 'array' });
      return (res.rows || []).map(r => r[0]);
    } catch (e) {
      return [];
    }
  }

  function renderSchemaTable(container, tblName, schema) {
    const title = document.createElement('div');
    title.className = 'sql-runner-section-title';
    title.innerHTML = `${ICONS.columns} <span>Table Schema: <strong>${tblName}</strong> (${schema.columns.length} columns)</span>`;
    container.appendChild(title);

    const table = document.createElement('table');
    table.className = 'sql-runner-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Column</th>
        <th>Type</th>
        <th>Nullable</th>
        <th>Key / Constraints</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    schema.columns.forEach(col => {
      const colName = col[0];
      let dataType = col[1];
      const maxLen = col[2];
      const isNullable = col[3];
      if (dataType === 'character varying') dataType = maxLen ? `varchar(${maxLen})` : 'varchar';

      const colConstraints = schema.constraints[colName] || [];
      let badgesHtml = '';
      if (colConstraints.includes('PRIMARY KEY')) {
        badgesHtml += '<span class="sql-runner-constraint-badge pk" title="Primary Key">PK</span>';
      }
      if (colConstraints.includes('FOREIGN KEY')) {
        badgesHtml += '<span class="sql-runner-constraint-badge fk" title="Foreign Key">FK</span>';
      }
      if (colConstraints.includes('UNIQUE')) {
        badgesHtml += '<span class="sql-runner-constraint-badge unique" title="Unique">UNIQUE</span>';
      }
      if (isNullable === 'NO' && !colConstraints.includes('PRIMARY KEY')) {
        badgesHtml += '<span class="sql-runner-constraint-badge notnull" title="Not Null">NOT NULL</span>';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${colName}</strong></td>
        <td><code>${dataType}</code></td>
        <td>${isNullable === 'YES' ? 'YES' : 'NO'}</td>
        <td>${badgesHtml || '—'}</td>
      `;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  function renderDataTable(container, tblName, data) {
    if (!data || data.fields.length === 0) return;

    const title = document.createElement('div');
    title.className = 'sql-runner-section-title';
    title.innerHTML = `${ICONS.table} <span>Current Data: <strong>${tblName}</strong> (${data.total} total row${data.total === 1 ? '' : 's'}${data.total > 20 ? ', showing first 20' : ''})</span>`;
    container.appendChild(title);

    if (data.rows.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'sql-runner-msg-box';
      emptyMsg.textContent = `Table '${tblName}' currently contains 0 rows.`;
      container.appendChild(emptyMsg);
      return;
    }

    const table = document.createElement('table');
    table.className = 'sql-runner-table';

    const thead = document.createElement('thead');
    const trH = document.createElement('tr');
    data.fields.forEach(f => {
      const th = document.createElement('th');
      th.textContent = f.name;
      trH.appendChild(th);
    });
    thead.appendChild(trH);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    data.rows.forEach(row => {
      const tr = document.createElement('tr');
      data.fields.forEach((f, cIdx) => {
        const td = document.createElement('td');
        const val = Array.isArray(row) ? row[cIdx] : row[f.name];
        if (val === null || val === undefined) {
          td.innerHTML = '<span class="null-val">NULL</span>';
        } else if (val instanceof Date) {
          td.textContent = val.toISOString().replace("T", " ").substring(0, 19);
        } else {
          td.textContent = String(val);
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  async function renderResultsWithInspection(container, db, query, { results, elapsed }) {
    container.innerHTML = "";

    // Identify statement intent
    const ddlMatch = query.match(/\b(CREATE|ALTER)\s+TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i);
    const dropMatch = query.match(/\bDROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/i);
    const dmlMatch = query.match(/\b(INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+(?:public\.)?([a-zA-Z0-9_]+)/i);

    // 1. DDL: Table Created or Altered
    if (ddlMatch) {
      const action = ddlMatch[1].toUpperCase();
      const tblName = ddlMatch[2].toLowerCase();
      const schema = await getTableSchema(db, tblName);

      const msg = document.createElement('div');
      msg.className = 'sql-runner-msg-box success';
      msg.innerHTML = `${ICONS.check} Table '<strong>${tblName}</strong>' ${action === 'CREATE' ? 'created' : 'altered'} successfully (${elapsed} ms)`;
      container.appendChild(msg);

      if (schema && schema.columns.length > 0) {
        renderSchemaTable(container, tblName, schema);

        // Action button to preview data
        const previewBtn = document.createElement('button');
        previewBtn.className = 'sql-runner-quick-btn';
        previewBtn.innerHTML = `${ICONS.eye} <span>View Data: SELECT * FROM ${tblName}</span>`;
        previewBtn.addEventListener('click', async () => {
          previewBtn.disabled = true;
          const data = await getTableData(db, tblName);
          renderDataTable(container, tblName, data);
        });
        container.appendChild(previewBtn);
      }
      return;
    }

    // 2. DDL: Table Dropped
    if (dropMatch) {
      const tblName = dropMatch[1].toLowerCase();
      const tables = await listAllTables(db);

      const msg = document.createElement('div');
      msg.className = 'sql-runner-msg-box success';
      msg.innerHTML = `${ICONS.check} Table '<strong>${tblName}</strong>' dropped (${elapsed} ms)`;
      container.appendChild(msg);

      const info = document.createElement('div');
      info.className = 'sql-runner-section-title';
      info.innerHTML = `${ICONS.database} <span>Remaining tables in database: <strong>${tables.join(', ') || 'None'}</strong></span>`;
      container.appendChild(info);
      return;
    }

    // 3. DML: Insert, Update, Delete
    if (dmlMatch) {
      const action = dmlMatch[1].toUpperCase();
      const tblName = dmlMatch[2].toLowerCase();
      const totalAffected = results ? results.reduce((acc, r) => acc + (r.affectedRows || 0), 0) : 0;
      const affectedText = totalAffected > 0 ? ` • ${totalAffected} row${totalAffected === 1 ? '' : 's'} affected` : '';

      const msg = document.createElement('div');
      msg.className = 'sql-runner-msg-box success';
      msg.innerHTML = `${ICONS.check} ${action.split(' ')[0]} statement executed successfully (${elapsed} ms${affectedText})`;
      container.appendChild(msg);

      // Automatically show current state of the modified table!
      const data = await getTableData(db, tblName);
      if (data) {
        renderDataTable(container, tblName, data);
      }
      return;
    }

    // 4. Standard Queries (e.g. SELECT)
    if (!results || results.length === 0) {
      container.innerHTML = `<div class="sql-runner-msg-box success">${ICONS.check} Query executed successfully (${elapsed} ms)</div>`;
      return;
    }

    const selectResults = results.filter(r => r && r.fields && r.fields.length > 0);

    if (selectResults.length === 0) {
      const totalAffected = results.reduce((acc, r) => acc + (r.affectedRows || 0), 0);
      const affectedText = totalAffected > 0 ? ` • ${totalAffected} row${totalAffected === 1 ? '' : 's'} affected` : '';
      container.innerHTML = `<div class="sql-runner-msg-box success">${ICONS.check} Statement executed successfully (${elapsed} ms${affectedText})</div>`;
      return;
    }

    selectResults.forEach((res, rIdx) => {
      if (selectResults.length > 1) {
        const heading = document.createElement("div");
        heading.style.cssText = "font-weight:600;font-size:0.75rem;margin:8px 0 4px;color:var(--pg-text-muted);";
        heading.textContent = `Result ${rIdx + 1}:`;
        container.appendChild(heading);
      }

      if (res.rows.length === 0) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "sql-runner-msg-box success";
        emptyDiv.innerHTML = `${ICONS.check} 0 rows returned (${elapsed} ms)`;
        container.appendChild(emptyDiv);
        return;
      }

      const table = document.createElement("table");
      table.className = "sql-runner-table";

      const thead = document.createElement("thead");
      const trH = document.createElement("tr");
      res.fields.forEach(f => {
        const th = document.createElement("th");
        th.textContent = f.name;
        trH.appendChild(th);
      });
      thead.appendChild(trH);
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      res.rows.forEach(row => {
        const tr = document.createElement("tr");
        res.fields.forEach((f, cIdx) => {
          const td = document.createElement("td");
          const val = Array.isArray(row) ? row[cIdx] : row[f.name];
          if (val === null || val === undefined) {
            td.innerHTML = '<span class="null-val">NULL</span>';
          } else if (val instanceof Date) {
            td.textContent = val.toISOString().replace("T", " ").substring(0, 19);
          } else {
            td.textContent = String(val);
          }
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      container.appendChild(table);
    });
  }

  function copyTableToClipboard(container, btn) {
    const table = container.querySelector('table');
    if (!table) return;
    const rows = Array.from(table.querySelectorAll('tr'));
    const text = rows.map(r => {
      return Array.from(r.querySelectorAll('th, td')).map(cell => cell.textContent.trim()).join('\t');
    }).join('\n');
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.innerHTML;
      btn.innerHTML = `${ICONS.check} Copied!`;
      setTimeout(() => { btn.innerHTML = orig; }, 1200);
    });
  }

  function setupSQLBlock(scaffold) {
    if (scaffold.dataset.sqlRunnerInit) return;

    const codeEl = scaffold.querySelector('pre > code.sourceCode.sql, pre > code.language-sql, code.sourceCode.sql');
    if (!codeEl) return;

    const initialCode = extractCleanCode(codeEl);
    if (!initialCode) return;

    // Check if an explicit database is specified
    const detectedDs = detectDataset(scaffold, codeEl, initialCode);
    if (!detectedDs) {
      // If code block doesn't specify a db name, do NOT make it executable
      return;
    }

    scaffold.dataset.sqlRunnerInit = "true";

    codeEl.addEventListener('mouseup', () => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && codeEl.contains(sel.anchorNode)) {
        lastSelectedCode = sel.toString().trim();
      } else {
        lastSelectedCode = "";
      }
    });

    const label = getBadgeLabel(detectedDs);

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'sql-runner-wrapper';
    wrapper.dataset.dataset = detectedDs;
    scaffold.parentNode.insertBefore(wrapper, scaffold);

    // Create toolbar (clean & minimal: badge on left, Edit & Run on right)
    const toolbar = document.createElement('div');
    toolbar.className = 'sql-runner-toolbar';

    // Left controls: Database Badge only (no scan or reset buttons)
    const leftDiv = document.createElement('div');
    leftDiv.className = 'sql-runner-left';

    const badge = document.createElement('span');
    badge.className = 'sql-runner-badge';
    badge.title = `Target Database: ${label}`;
    badge.innerHTML = `<span class="sql-runner-icon">${ICONS.database}</span><span class="sql-runner-db-name">${label}</span>`;
    leftDiv.appendChild(badge);

    // Right controls: Edit + Run
    const rightDiv = document.createElement('div');
    rightDiv.className = 'sql-runner-right';

    const editBtn = document.createElement('button');
    editBtn.className = 'sql-runner-btn sql-runner-edit-btn';
    editBtn.title = 'Edit this query inline with syntax highlighting';
    editBtn.innerHTML = `${ICONS.edit} <span>Edit</span>`;

    const runBtn = document.createElement('button');
    runBtn.className = 'sql-runner-btn sql-runner-run-btn';
    runBtn.title = 'Run query (Ctrl+Enter)';
    runBtn.innerHTML = `${ICONS.play} <span>Run</span>`;

    rightDiv.appendChild(editBtn);
    rightDiv.appendChild(runBtn);

    toolbar.appendChild(leftDiv);
    toolbar.appendChild(rightDiv);
    wrapper.appendChild(toolbar);

    // Code area
    const codeArea = document.createElement('div');
    codeArea.className = 'sql-runner-code-area';
    codeArea.appendChild(scaffold);

    // Ace Editor Container
    const aceContainer = document.createElement('div');
    aceContainer.className = 'sql-runner-ace-container';
    aceContainer.style.display = 'none';
    codeArea.appendChild(aceContainer);

    // Fallback textarea
    const textarea = document.createElement('textarea');
    textarea.className = 'sql-runner-textarea';
    textarea.value = initialCode;
    textarea.style.display = 'none';
    textarea.spellcheck = false;
    codeArea.appendChild(textarea);

    wrapper.appendChild(codeArea);

    let aceInstance = null;

    async function initAceEditor() {
      if (aceInstance) {
        aceInstance.setTheme(getAceTheme());
        return aceInstance;
      }
      const ace = await loadAce();
      aceInstance = ace.edit(aceContainer);
      aceInstance.session.setMode("ace/mode/sql");
      aceInstance.setTheme(getAceTheme());
      aceInstance.setFontSize(14);
      aceInstance.setShowPrintMargin(false);
      aceInstance.session.setUseWrapMode(true);
      aceInstance.setValue(initialCode, -1);

      // Keyboard shortcut Ctrl+Enter runs query
      aceInstance.commands.addCommand({
        name: "runQuery",
        bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
        exec: () => runBtn.click()
      });

      // Update badge dynamically if user types -- db: <name>
      aceInstance.session.on('change', () => {
        const val = aceInstance.getValue();
        const dynamicDs = detectDataset(scaffold, codeEl, val);
        if (dynamicDs && dynamicDs !== wrapper.dataset.dataset) {
          wrapper.dataset.dataset = dynamicDs;
          const dynLabel = getBadgeLabel(dynamicDs);
          badge.title = `Target Database: ${dynLabel}`;
          badge.querySelector('.sql-runner-db-name').textContent = dynLabel;
        }
      });

      // Synchronize with Quarto dark/light mode toggle and localStorage
      const observer = new MutationObserver(() => {
        aceInstance.setTheme(getAceTheme());
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

      window.addEventListener('storage', (e) => {
        if (e.key === 'playgroundLightTheme' || e.key === 'playgroundDarkTheme' || e.key === 'quarto-color-scheme') {
          aceInstance.setTheme(getAceTheme());
        }
      });

      return aceInstance;
    }

    // Output panel
    const outputPanel = document.createElement('div');
    outputPanel.className = 'sql-runner-output';
    outputPanel.style.display = 'none';

    outputPanel.innerHTML = `
      <div class="sql-runner-output-header">
        <span class="sql-runner-status"></span>
        <div class="sql-runner-output-actions">
          <button class="sql-runner-btn-sm sql-runner-copy-res-btn" title="Copy result table">${ICONS.copy} <span>Copy</span></button>
          <button class="sql-runner-btn-sm sql-runner-close-btn" title="Close output">${ICONS.close}</button>
        </div>
      </div>
      <div class="sql-runner-output-body"></div>
    `;

    const statusEl = outputPanel.querySelector('.sql-runner-status');
    const outputBody = outputPanel.querySelector('.sql-runner-output-body');
    const copyBtn = outputPanel.querySelector('.sql-runner-copy-res-btn');
    const closeBtn = outputPanel.querySelector('.sql-runner-close-btn');

    closeBtn.addEventListener('click', () => {
      outputPanel.style.display = 'none';
    });

    copyBtn.addEventListener('click', () => {
      copyTableToClipboard(outputBody, copyBtn);
    });

    wrapper.appendChild(outputPanel);

    // Edit button click
    let isEditing = false;
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
          // Fallback to textarea if Ace CDN fails
          aceContainer.style.display = 'none';
          textarea.style.display = 'block';
          textarea.style.height = height + 'px';
          textarea.focus();
        }

        editBtn.innerHTML = `${ICONS.revert} <span>Revert</span>`;
        editBtn.title = 'Revert to original query';
      } else {
        if (aceInstance) {
          aceInstance.setValue(initialCode, -1);
        }
        textarea.value = initialCode;
        aceContainer.style.display = 'none';
        textarea.style.display = 'none';
        scaffold.style.display = '';
        editBtn.innerHTML = `${ICONS.edit} <span>Edit</span>`;
        editBtn.title = 'Edit this query inline';

        // Revert badge if changed
        const restoredDs = detectDataset(scaffold, codeEl, initialCode) || wrapper.dataset.dataset;
        wrapper.dataset.dataset = restoredDs;
        const rLabel = getBadgeLabel(restoredDs);
        badge.title = `Target Database: ${rLabel}`;
        badge.querySelector('.sql-runner-db-name').textContent = rLabel;
      }
    });

    // Run button click
    runBtn.addEventListener('click', async () => {
      const activeDs = wrapper.dataset.dataset || DEFAULT_DATASET;
      const activeLabel = getBadgeLabel(activeDs);
      const query = getQueryToRun(codeEl, aceInstance, textarea);

      if (!query) {
        outputPanel.style.display = 'block';
        statusEl.className = 'sql-runner-status error';
        statusEl.textContent = 'Empty query';
        outputBody.innerHTML = `<div class="sql-runner-msg-box error">Please enter or select a SQL query to execute.</div>`;
        return;
      }

      outputPanel.style.display = 'block';
      statusEl.className = 'sql-runner-status';
      statusEl.innerHTML = `<span class="sql-runner-spinner"></span> Initializing ${activeLabel}...`;
      outputBody.innerHTML = '';
      runBtn.disabled = true;

      try {
        const db = await getDB(activeDs, (msg) => {
          statusEl.innerHTML = `<span class="sql-runner-spinner"></span> ${msg}`;
        });

        statusEl.innerHTML = `<span class="sql-runner-spinner"></span> Running on ${activeLabel}...`;

        const { results, elapsed } = await executeSQL(db, query);
        await renderResultsWithInspection(outputBody, db, query, { results, elapsed });

        statusEl.className = 'sql-runner-status success';
        const hasRows = results && results.some(r => r.rows && r.rows.length > 0);
        const rowCount = hasRows ? results.reduce((acc, r) => acc + (r.rows ? r.rows.length : 0), 0) : 0;
        statusEl.innerHTML = hasRows 
          ? `${ICONS.check} ${rowCount} row${rowCount === 1 ? '' : 's'} (${elapsed} ms)`
          : `${ICONS.check} Done (${elapsed} ms)`;

      } catch (err) {
        statusEl.className = 'sql-runner-status error';
        statusEl.textContent = 'Query Error';
        outputBody.innerHTML = `<div class="sql-runner-msg-box error">${err.message}</div>`;
      } finally {
        runBtn.disabled = false;
      }
    });
  }

  function initSQLRunners() {
    ensureCSSLoaded();

    // Find all SQL code blocks in page
    const codeElements = document.querySelectorAll(
      'div.sourceCode pre > code.sourceCode.sql, div.sourceCode.sql pre > code, pre.sourceCode.sql > code, pre > code.language-sql'
    );

    codeElements.forEach(codeEl => {
      const scaffold = codeEl.closest('.code-copy-outer-scaffold') || codeEl.closest('.sourceCode') || codeEl.closest('pre');
      if (scaffold) {
        setupSQLBlock(scaffold);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSQLRunners);
  } else {
    initSQLRunners();
  }

})();
