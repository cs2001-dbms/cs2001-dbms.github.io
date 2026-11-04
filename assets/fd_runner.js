/**
 * CS2001 DBMS - Interactive Normalization & Functional Dependencies Inline Runner
 * Aligned with SQL Runner UI & Behavior
 *
 * Rules:
 * 1. Only blocks with an explicit check/concept specified are made executable.
 *    If no check is specified, the code block remains static syntax-highlighted code.
 * 2. Concept Specification (like db="..." in SQL runner):
 *    - In code block attributes: ```{.fd check="bcnf"}, ```{.fd check="2nf"}, ```{.fd check="3nf"}
 *    - In code block attributes: ```{.fd check="lossless-join"}, ```{.fd check="canonical-cover"}, ```{.fd check="closure"}
 *    - Inline comment inside FD block: # check: bcnf or -- check: 2nf
 *    - In parent wrapper: ::: {check="bcnf"}
 *    - In preceding marker: **Check:** BCNF
 *    - In code heuristics: Decompose: ..., Query: ...
 * 3. Specific Checks Supported:
 *    - 1nf: Tests atomicity of relation attributes
 *    - 2nf: Tests for partial dependencies on proper subsets of candidate keys
 *    - 3nf: Tests if LHS is superkey or RHS is prime attribute
 *    - bcnf: Strict superkey test for LHS of every non-trivial FD
 *    - all-nf: Full diagnostic comparison across 1NF, 2NF, 3NF, and BCNF
 *    - lossless-join: Tests (R1 ∩ R2)+ ⊇ R1 or (R1 ∩ R2)+ ⊇ R2 and dependency preservation
 *    - dependency-preservation: Tests local projection closure across pieces
 *    - canonical-cover: Step-by-step extraneous LHS removal, redundant FD removal, LHS union
 *    - closure: Armstrong axioms step-by-step derivation with interactive attribute pills
 *    - candidate-keys: Minimal keys discovery, prime and non-prime attributes
 * 4. Minimal Toolbar:
 *    - Left: Concept Badge (e.g. Check BCNF) + Relation Badge R(...)
 *    - Right: Mode Pills, Edit, Run, Copy buttons
 *    - Zero emojis: Clean professional SVG vector icons everywhere
 */

(function () {
  'use strict';

  if (window.__fdRunnerLoaded) return;
  window.__fdRunnerLoaded = true;

  // Professional SVG Icons (Lucide-style, zero emojis)
  const ICONS = {
    calculator: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>`,
    play: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="6 3 20 12 6 21 6 3"></polygon></svg>`,
    edit: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`,
    revert: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`,
    check: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
    copy: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>`,
    key: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"></circle><path d="m21 2-9.6 9.6"></path><path d="m15.5 7.5 3 3L22 7l-3-3"></path></svg>`,
    shield: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    split: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></svg>`,
    table: `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="12" y1="3" x2="12" y2="21"></line></svg>`,
    close: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
  };

  function getQuartoOffset() {
    const offsetMeta = document.querySelector('meta[name="quarto:offset"]');
    return offsetMeta ? offsetMeta.getAttribute('content') : '../../';
  }

  function ensureCSSLoaded() {
    if (document.querySelector('link[href*="fd_runner.css"]')) return;
    const offset = getQuartoOffset();
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = offset + 'assets/fd_runner.css';
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

  // Attribute and FD Formatting Helpers
  function hasMultiCharAttrs(attrs) {
    return (attrs || []).some(a => a && a.length > 1);
  }

  function formatAttrs(attrs, style = 'fd') {
    if (!attrs || attrs.length === 0) return style === 'set' ? '∅' : '';
    const isMulti = hasMultiCharAttrs(attrs);
    if (style === 'set') {
      return `{ ${attrs.join(', ')} }`;
    }
    if (style === 'key') {
      return isMulti ? attrs.join(', ') : attrs.join('');
    }
    return isMulti ? attrs.join(', ') : attrs.join('');
  }

  function formatFD(fd) {
    if (!fd) return '';
    const left = formatAttrs(fd.left, 'fd');
    const right = formatAttrs(fd.right, 'fd');
    return `${left} → ${right}`;
  }

  // Parser
  function parseFDText(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('--') && !l.startsWith('//'));
    const attributes = new Set();
    const fds = [];
    const f1Fds = [];
    const f2Fds = [];
    let currentSet = null; // null, 'f1', 'f2'
    let query = '';
    const decompositions = [];

    const parseSide = (str, attrsSet) => {
      if (str.includes(',')) return str.split(',').map(s => s.trim()).filter(Boolean);
      const words = str.trim().split(/\s+/).filter(Boolean);
      if (words.length > 1) return words;
      const trimmed = str.trim();
      if (!trimmed) return [];
      if (attrsSet && attrsSet.has(trimmed)) {
        return [trimmed];
      }
      if (trimmed.length > 1 && !trimmed.includes('_')) {
        const chars = trimmed.split('');
        const allCharsKnown = attrsSet ? chars.every(c => attrsSet.has(c)) : false;
        if (allCharsKnown || (trimmed.toUpperCase() === trimmed && (!attrsSet || !Array.from(attrsSet).some(a => a.length > 1 && a.toUpperCase() === trimmed)))) {
          return chars;
        }
      }
      return [trimmed];
    };

    for (let rawLine of lines) {
      let line = rawLine.replace(/^\d+[\s:.\t]+/, '').trim();
      if (!line) continue;

      // Check for set section headers: F1:, F2:, F:, G:, Set 1:, Set 2:, S1:, S2:
      const setHeaderMatch = line.match(/^(?:set\s*([12])|(f1|f2|s1|s2|f|g))\s*[:=]\s*(.*)$/i);
      if (setHeaderMatch) {
        const tag = (setHeaderMatch[1] || setHeaderMatch[2] || '').toLowerCase();
        if (tag === '2' || tag === 'f2' || tag === 's2' || tag === 'g') {
          currentSet = 'f2';
        } else {
          currentSet = 'f1';
        }
        // If inline FDs follow the colon, e.g. F1: P -> Q, Q -> R or F1 = { P -> Q, Q -> R }
        const rest = (setHeaderMatch[3] || '').trim().replace(/^\{|\}$/g, '').trim();
        if (rest) {
          const inlineParts = rest.split(/[,;]+/).map(p => p.trim()).filter(Boolean);
          for (const part of inlineParts) {
            const m = part.match(/^([A-Za-z0-9,\s_]+)(?:->|→)\s*([A-Za-z0-9,\s_]+)$/);
            if (m) {
              const left = parseSide(m[1], attributes);
              const right = parseSide(m[2], attributes);
              left.forEach(a => attributes.add(a));
              right.forEach(a => attributes.add(a));
              const fdObj = { left, right };
              fds.push(fdObj);
              if (currentSet === 'f1') f1Fds.push(fdObj);
              else if (currentSet === 'f2') f2Fds.push(fdObj);
            }
          }
        }
        continue;
      }

      const relMatch = line.match(/^R\s*(?:\(([^)]+)\)|=\s*\(([^)]+)\))/i);
      if (relMatch) {
        const attrStr = relMatch[1] || relMatch[2];
        attrStr.split(/[,\s]+/).filter(Boolean).forEach(a => attributes.add(a.trim()));
        continue;
      }

      const qMatch = line.match(/(?:query|closure|compute|alpha|α|find|attrs?|X)\s*[:=]\s*(?:\(?([A-Za-z0-9,\s]+)\)?\+?|\(?([A-Za-z0-9,\s]+)\)?)/i);
      if (qMatch) {
        const qStr = qMatch[1] || qMatch[2];
        query = qStr.replace(/[^A-Za-z0-9]/g, '');
        continue;
      }

      const plusMatch = line.match(/^\(?([A-Za-z0-9,\s]+)\)?\+\s*(?:=\s*\??)?$/);
      if (plusMatch) {
        query = plusMatch[1].replace(/[^A-Za-z0-9]/g, '');
        continue;
      }

      const decompMatch = line.match(/(?:decompose|decomposition)\s*[:=]\s*(.+)/i);
      if (decompMatch) {
        const partStr = decompMatch[1];
        const rMatches = partStr.matchAll(/R\d*\s*\(([^)]+)\)/gi);
        for (const m of rMatches) {
          const dAttrs = m[1].split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
          decompositions.push(dAttrs);
          dAttrs.forEach(a => attributes.add(a));
        }
        continue;
      }

      const fdMatch = line.match(/^([A-Za-z0-9,\s_]+)(?:->|→)\s*([A-Za-z0-9,\s_]+)$/);
      if (fdMatch) {
        const left = parseSide(fdMatch[1], attributes);
        const right = parseSide(fdMatch[2], attributes);
        left.forEach(a => attributes.add(a));
        right.forEach(a => attributes.add(a));
        const fdObj = { left, right };
        fds.push(fdObj);
        if (currentSet === 'f1') {
          f1Fds.push(fdObj);
        } else if (currentSet === 'f2') {
          f2Fds.push(fdObj);
        }
      }
    }

    return {
      attributes: Array.from(attributes),
      fds,
      f1Fds,
      f2Fds,
      hasMultipleSets: f1Fds.length > 0 && f2Fds.length > 0,
      query,
      decompositions
    };
  }

  // Mathematical Engine
  function computeClosure(targetAttrs, fds, allAttrs) {
    const result = new Set(targetAttrs);
    const steps = [];
    steps.push({
      step: 0,
      current: Array.from(result).sort(),
      rule: 'Initial Set',
      reason: `Starting attribute set { ${Array.from(result).sort().join(', ')} }`
    });

    let changed = true;
    let stepCount = 1;

    while (changed) {
      changed = false;
      for (const fd of fds) {
        const applies = fd.left.every(a => result.has(a));
        if (applies) {
          const newlyAdded = fd.right.filter(a => !result.has(a));
          if (newlyAdded.length > 0) {
            newlyAdded.forEach(a => result.add(a));
            changed = true;
            steps.push({
              step: stepCount++,
              current: Array.from(result).sort(),
              rule: formatFD(fd),
              reason: `LHS {${formatAttrs(fd.left, 'fd')}} ⊆ current closure, adding RHS {${newlyAdded.join(', ')}}`
            });
          }
        }
      }
    }

    const closureArr = Array.from(result).sort();
    const isSuperKey = allAttrs.length > 0 && allAttrs.every(a => result.has(a));

    return {
      closure: closureArr,
      isSuperKey,
      steps
    };
  }

  function findCandidateKeys(allAttrs, fds) {
    if (allAttrs.length === 0) return [];

    const rhsAttrs = new Set();
    fds.forEach(fd => fd.right.forEach(a => rhsAttrs.add(a)));
    const mustHave = allAttrs.filter(a => !rhsAttrs.has(a));

    const initCl = computeClosure(mustHave, fds, allAttrs);
    if (initCl.isSuperKey) return [mustHave];

    const pool = allAttrs.filter(a => !mustHave.includes(a));
    const candidateKeys = [];

    function* combinations(arr, k) {
      if (k === 0) { yield []; return; }
      for (let i = 0; i <= arr.length - k; i++) {
        const head = arr[i];
        for (const tail of combinations(arr.slice(i + 1), k - 1)) {
          yield [head, ...tail];
        }
      }
    }

    for (let size = 1; size <= pool.length; size++) {
      for (const comb of combinations(pool, size)) {
        const candidate = [...mustHave, ...comb];
        const isSuperset = candidateKeys.some(ck => ck.every(a => candidate.includes(a)));
        if (isSuperset) continue;

        const cl = computeClosure(candidate, fds, allAttrs);
        if (cl.isSuperKey) {
          candidateKeys.push(candidate);
        }
      }
    }

    return candidateKeys;
  }

  function checkNormalForms(allAttrs, fds) {
    const candidateKeys = findCandidateKeys(allAttrs, fds);
    const primeAttrs = new Set();
    candidateKeys.forEach(k => k.forEach(a => primeAttrs.add(a)));
    const nonPrimeAttrs = allAttrs.filter(a => !primeAttrs.has(a));

    let is2NF = true;
    let is3NF = true;
    let isBCNF = true;

    const fdAnalysis = [];

    for (const fd of fds) {
      const cl = computeClosure(fd.left, fds, allAttrs);
      const isSuperKey = cl.isSuperKey;
      const nonTrivialRight = fd.right.filter(a => !fd.left.includes(a));

      if (nonTrivialRight.length === 0) {
        fdAnalysis.push({
          fd: formatFD(fd),
          lhs: formatAttrs(fd.left, 'fd'),
          rhs: formatAttrs(fd.right, 'fd'),
          lhsClosure: cl.closure,
          isSuperKey: true,
          allRightPrime: true,
          isPartial: false,
          satisfies2NF: true,
          satisfies3NF: true,
          satisfiesBCNF: true,
          reason2NF: 'Trivial dependency (RHS ⊆ LHS)',
          reason3NF: 'Trivial dependency (RHS ⊆ LHS)',
          reasonBCNF: 'Trivial dependency (RHS ⊆ LHS)',
          reason: 'Trivial dependency (RHS ⊆ LHS)'
        });
        continue;
      }

      const satisfiesBCNF = isSuperKey;
      if (!satisfiesBCNF) isBCNF = false;

      const allRightPrime = nonTrivialRight.every(a => primeAttrs.has(a));
      const satisfies3NF = isSuperKey || allRightPrime;
      if (!satisfies3NF) is3NF = false;

      let isPartial = false;
      let violatingKey = null;
      let isLhsProperSubsetOfCk = false;
      let subsetOfKeys = [];

      for (const ck of candidateKeys) {
        const isProperSubset = fd.left.every(a => ck.includes(a)) && fd.left.length < ck.length;
        if (isProperSubset) {
          isLhsProperSubsetOfCk = true;
          const formattedCk = formatAttrs(ck, 'key');
          subsetOfKeys.push(formattedCk);
          const hasNonPrimeRight = nonTrivialRight.some(a => nonPrimeAttrs.includes(a));
          if (hasNonPrimeRight) {
            isPartial = true;
            violatingKey = formattedCk;
          }
        }
      }
      const satisfies2NF = !isPartial;
      if (isPartial) is2NF = false;

      const lhsStr = formatAttrs(fd.left, 'fd');
      const nonTrivRhsStr = formatAttrs(nonTrivialRight, 'fd');

      let reasonBCNF = satisfiesBCNF
        ? `Pass: LHS {${lhsStr}} is a superkey`
        : `Fail: LHS {${lhsStr}} is NOT a superkey (${lhsStr}⁺ = {${cl.closure.join(', ')}} ≠ R)`;

      let reason3NF = '';
      if (isSuperKey) {
        reason3NF = `Pass: LHS {${lhsStr}} is a superkey (Condition 1 holds)`;
      } else if (allRightPrime) {
        reason3NF = `Pass: RHS {${nonTrivRhsStr}} consists of prime attribute(s) (Condition 2 holds)`;
      } else {
        reason3NF = `Fail: LHS {${lhsStr}} is not a superkey and RHS {${nonTrivRhsStr}} is non-prime`;
      }

      let reason2NF = '';
      if (isPartial) {
        reason2NF = `Fail: Partial dependency — LHS {${lhsStr}} is a proper subset of candidate key {${violatingKey}} determining non-prime {${nonTrivialRight.filter(a => nonPrimeAttrs.includes(a)).join(', ')}}`;
      } else if (isLhsProperSubsetOfCk) {
        reason2NF = `Pass: LHS {${lhsStr}} is a proper subset of candidate key {${subsetOfKeys[0]}}, but RHS {${nonTrivRhsStr}} consists of prime attribute(s) (allowed in 2NF)`;
      } else {
        reason2NF = `Pass: LHS {${lhsStr}} is not a proper subset of any candidate key`;
      }

      let highest = '1NF';
      if (satisfiesBCNF) highest = 'BCNF';
      else if (satisfies3NF) highest = '3NF';
      else if (satisfies2NF) highest = '2NF';

      let reason = '';
      if (satisfiesBCNF) {
        reason = `Pass: LHS {${lhsStr}} is a superkey`;
      } else if (satisfies3NF) {
        reason = `Fail (BCNF): LHS {${lhsStr}} is NOT a superkey (${lhsStr}⁺ = {${cl.closure.join(', ')}} ≠ R); satisfies 3NF (RHS {${nonTrivRhsStr}} is prime)`;
      } else if (satisfies2NF) {
        reason = `Fail (3NF & BCNF): LHS {${lhsStr}} is NOT a superkey and RHS {${nonTrivRhsStr}} is non-prime (transitive dependency); satisfies 2NF`;
      } else {
        reason = reason2NF;
      }

      fdAnalysis.push({
        fd: formatFD(fd),
        lhs: lhsStr,
        rhs: formatAttrs(fd.right, 'fd'),
        lhsClosure: cl.closure,
        isSuperKey,
        allRightPrime,
        isPartial,
        isLhsProperSubsetOfCk,
        subsetOfKeys,
        highest,
        satisfies2NF,
        satisfies3NF,
        satisfiesBCNF,
        reason2NF,
        reason3NF,
        reasonBCNF,
        reason
      });
    }

    let highestOverall = '1NF';
    if (isBCNF) highestOverall = 'BCNF';
    else if (is3NF) highestOverall = '3NF';
    else if (is2NF) highestOverall = '2NF';

    return {
      candidateKeys: candidateKeys.map(k => formatAttrs(k, 'key')),
      primeAttrs: Array.from(primeAttrs),
      nonPrimeAttrs,
      highestOverall,
      is2NF,
      is3NF,
      isBCNF,
      fdAnalysis
    };
  }

  function computeCanonicalCover(allAttrs, initialFds) {
    const steps = [];

    function mergeSameLHS(fdList) {
      const map = new Map();
      for (const fd of fdList) {
        const key = [...fd.left].sort().join(',');
        if (!map.has(key)) {
          map.set(key, { left: [...fd.left], right: new Set(fd.right) });
        } else {
          fd.right.forEach(r => map.get(key).right.add(r));
        }
      }
      const merged = [];
      map.forEach(val => {
        merged.push({ left: val.left, right: Array.from(val.right) });
      });
      return merged;
    }

    let F = mergeSameLHS(initialFds);
    steps.push({
      phase: 'Union Rule (Initial Merge)',
      detail: `Combined functional dependencies sharing identical left-hand sides: { ${F.map(f => formatFD(f)).join(', ')} }`
    });

    let changed = true;
    let iterations = 0;

    while (changed && iterations < 50) {
      changed = false;
      iterations++;

      // 1. Check for extraneous attribute in LHS of each FD
      for (let i = 0; i < F.length; i++) {
        const fd = F[i];
        if (fd.left.length > 1) {
          for (let j = 0; j < fd.left.length; j++) {
            const attr = fd.left[j];
            const reducedLeft = fd.left.filter(a => a !== attr);
            const cl = computeClosure(reducedLeft, F, allAttrs);
            const determinesAllRight = fd.right.every(r => cl.closure.includes(r));
            if (determinesAllRight) {
              steps.push({
                phase: 'Extraneous LHS Attribute',
                detail: `In ${formatFD(fd)}, attribute '${attr}' is extraneous because (${formatAttrs(reducedLeft, 'fd')})⁺ ⊇ {${fd.right.join(', ')}}. Reduced to ${formatFD({ left: reducedLeft, right: fd.right })}.`
              });
              fd.left = reducedLeft;
              F = mergeSameLHS(F);
              changed = true;
              break;
            }
          }
          if (changed) break;
        }
      }
      if (changed) continue;

      // 2. Check for extraneous attribute in RHS of each FD
      for (let i = 0; i < F.length; i++) {
        const fd = F[i];
        for (let j = 0; j < fd.right.length; j++) {
          const attr = fd.right[j];
          const reducedRight = fd.right.filter(b => b !== attr);
          const Fprime = [];
          for (let k = 0; k < F.length; k++) {
            if (k === i) {
              if (reducedRight.length > 0) {
                Fprime.push({ left: [...fd.left], right: reducedRight });
              }
            } else {
              Fprime.push(F[k]);
            }
          }
          const cl = computeClosure(fd.left, Fprime, allAttrs);
          if (cl.closure.includes(attr)) {
            steps.push({
              phase: 'Extraneous RHS Attribute',
              detail: `In ${formatFD(fd)}, attribute '${attr}' is extraneous because '${attr}' is still derivable from (${formatAttrs(fd.left, 'fd')})⁺ without it. Reduced to ${formatFD({ left: fd.left, right: reducedRight })}.`
            });
            if (reducedRight.length > 0) {
              fd.right = reducedRight;
            } else {
              F.splice(i, 1);
            }
            F = mergeSameLHS(F);
            changed = true;
            break;
          }
        }
        if (changed) break;
      }
    }

    F = F.filter(fd => fd.left.length > 0 && fd.right.length > 0);
    F = mergeSameLHS(F);

    const canonicalCover = F.map(f => formatFD({ left: f.left, right: Array.from(new Set(f.right)).sort() }));

    return {
      canonicalCover,
      steps
    };
  }

  function projectFDs(Ri, fds, allAttrs) {
    const riSet = new Set(Ri);

    function getSubsets(arr) {
      const res = [];
      const n = arr.length;
      for (let i = 1; i < (1 << n); i++) {
        const sub = [];
        for (let j = 0; j < n; j++) {
          if (i & (1 << j)) sub.push(arr[j]);
        }
        if (sub.length < n) res.push(sub);
      }
      res.sort((a, b) => a.length - b.length);
      return res;
    }

    const projected = [];
    const subsets = getSubsets(Ri);

    for (const X of subsets) {
      const cl = computeClosure(X, fds, allAttrs);
      const Y = cl.closure.filter(a => riSet.has(a) && !X.includes(a));
      if (Y.length === 0) continue;

      const clCurrent = computeClosure(X, projected, Ri);
      const newY = Y.filter(a => !clCurrent.closure.includes(a));
      if (newY.length > 0) {
        projected.push({
          left: X.sort(),
          right: newY.sort()
        });
      }
    }

    return projected;
  }

  function evaluateLosslessJoin(allAttrs, fds, decompositions) {
    if (!decompositions || decompositions.length < 2) {
      return {
        isValid: false,
        message: 'At least 2 decomposed relations are required.'
      };
    }

    // Step 1: Attribute Union
    const unionSet = new Set();
    decompositions.forEach(r => r.forEach(a => unionSet.add(a)));
    const union = Array.from(unionSet).sort();
    const satisfiesUnion = allAttrs.length === 0 || allAttrs.every(a => unionSet.has(a));

    const toSubscript = num => String(num).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[parseInt(d, 10)] || d).join('');

    let pool = decompositions.map((attrs, idx) => ({
      name: `R${toSubscript(idx + 1)}`,
      attrs: [...attrs].sort(),
      indices: [idx + 1]
    }));

    function testPair(rA, rB) {
      const inter = rA.attrs.filter(a => rB.attrs.includes(a)).sort();
      if (inter.length === 0) return null;

      const cl = computeClosure(inter, fds, allAttrs);
      const detA = rA.attrs.every(a => cl.closure.includes(a));
      const detB = rB.attrs.every(a => cl.closure.includes(a));

      if (detA || detB) {
        return {
          rA, rB, inter, cl: cl.closure, detA, detB,
          superkeyOf: (detA && detB) ? `both ${rA.name} and ${rB.name}` : (detA ? rA.name : rB.name)
        };
      }
      return null;
    }

    function findLosslessPair(currentPool) {
      // 1. Prioritize adjacent pairs first (preserves natural order when possible)
      for (let i = 0; i < currentPool.length - 1; i++) {
        const res = testPair(currentPool[i], currentPool[i + 1]);
        if (res) return { ...res, i, j: i + 1 };
      }
      // 2. Try all remaining pairs
      for (let i = 0; i < currentPool.length; i++) {
        for (let j = i + 2; j < currentPool.length; j++) {
          const res = testPair(currentPool[i], currentPool[j]);
          if (res) return { ...res, i, j };
        }
      }
      return null;
    }

    const steps = [];
    let isLossless = satisfiesUnion;
    let stepNum = 1;

    while (pool.length > 1) {
      const pair = findLosslessPair(pool);

      if (pair) {
        const { i, j, rA, rB, inter, cl, detA, detB, superkeyOf } = pair;
        const joinedIndices = Array.from(new Set([...rA.indices, ...rB.indices])).sort((a, b) => a - b);
        const joinedSubscript = joinedIndices.map(toSubscript).join('');
        const joinedName = `R${joinedSubscript}`;
        const joinedAttrs = Array.from(new Set([...rA.attrs, ...rB.attrs])).sort();

        steps.push({
          stepNum: stepNum++,
          leftName: rA.name,
          leftAttrs: rA.attrs,
          rightName: rB.name,
          rightAttrs: rB.attrs,
          intersection: inter,
          hasIntersection: true,
          interClosure: cl,
          determinesLeft: detA,
          determinesRight: detB,
          superkeyOf,
          stepLossless: true,
          resultName: joinedName,
          resultAttrs: joinedAttrs
        });

        // Replace the two joined relations with the new intermediate relation
        pool = pool.filter((_, idx) => idx !== i && idx !== j);
        pool.splice(Math.min(i, pool.length), 0, {
          name: joinedName,
          attrs: joinedAttrs,
          indices: joinedIndices
        });
      } else {
        // No pair can be losslessly joined
        isLossless = false;

        let failPair = null;
        let maxInter = -1;
        for (let i = 0; i < pool.length; i++) {
          for (let j = i + 1; j < pool.length; j++) {
            const overlap = pool[i].attrs.filter(a => pool[j].attrs.includes(a)).length;
            if (overlap > maxInter) {
              maxInter = overlap;
              failPair = { i, j, rA: pool[i], rB: pool[j] };
            }
          }
        }
        if (!failPair) {
          failPair = { i: 0, j: 1, rA: pool[0], rB: pool[1] };
        }

        const { rA, rB } = failPair;
        const inter = rA.attrs.filter(a => rB.attrs.includes(a)).sort();
        const cl = inter.length > 0 ? computeClosure(inter, fds, allAttrs).closure : [];

        steps.push({
          stepNum: stepNum++,
          leftName: rA.name,
          leftAttrs: rA.attrs,
          rightName: rB.name,
          rightAttrs: rB.attrs,
          intersection: inter,
          hasIntersection: inter.length > 0,
          interClosure: cl,
          determinesLeft: false,
          determinesRight: false,
          superkeyOf: 'Neither',
          stepLossless: false,
          resultName: null,
          resultAttrs: []
        });
        break;
      }
    }

    let explanation = '';
    if (!satisfiesUnion) {
      const missing = allAttrs.filter(a => !unionSet.has(a));
      explanation = `Fail: Attribute Preservation violated — attribute(s) { ${missing.join(', ')} } are omitted from the decomposition (∪ Rᵢ ≠ R).`;
    } else if (isLossless) {
      if (decompositions.length === 2) {
        const s = steps[0];
        const fdRule = s.determinesRight ? `${s.leftName} ∩ ${s.rightName} → ${s.rightName}` : `${s.leftName} ∩ ${s.rightName} → ${s.leftName}`;
        explanation = `Pass: Lossless Join confirmed. The shared attribute(s) ${formatAttrs(s.intersection, 'set')} form a superkey of ${s.superkeyOf} (${fdRule}). Natural join ${s.leftName} ⋈ ${s.rightName} reconstructs R without spurious tuples.`;
      } else {
        explanation = `Pass: Lossless join sequence confirmed across all ${decompositions.length} subrelations. In each progressive pairwise join, the shared attributes form a superkey of at least one relation, guaranteeing exact reconstruction without spurious tuples.`;
      }
    } else {
      const failedStep = steps.find(s => !s.stepLossless);
      if (failedStep) {
        if (!failedStep.hasIntersection) {
          explanation = `Fail: Lossy Join at Step 2.${failedStep.stepNum} (${failedStep.leftName} ⋈ ${failedStep.rightName}) — relations share no common attributes (intersection is empty ∅).`;
        } else {
          explanation = `Fail: Lossy Join at Step 2.${failedStep.stepNum} (${failedStep.leftName} ⋈ ${failedStep.rightName}) — shared attribute(s) ${formatAttrs(failedStep.intersection, 'set')} do NOT form a superkey of either ${failedStep.leftName} or ${failedStep.rightName} (${formatAttrs(failedStep.intersection, 'fd')}⁺ does not cover either side). Natural join generates spurious tuples.`;
        }
      } else {
        explanation = `Fail: Could not find any valid sequence of pairwise natural joins that reconstructs R losslessly without generating spurious tuples.`;
      }
    }

    return {
      isValid: true,
      decompositions,
      allAttrs: allAttrs.sort(),
      union,
      satisfiesUnion,
      steps,
      isLossless,
      explanation
    };
  }

  function testDependencyPreservation(allAttrs, fds, decompositions) {
    if (!decompositions || decompositions.length < 2) {
      return {
        isValid: false,
        message: 'At least 2 decomposed relations are required.',
        isPreserving: false,
        decompositions: [],
        localProjections: [],
        unionFds: [],
        fdChecks: []
      };
    }

    // Step 1: Project FDs onto each Ri
    const localProjections = [];
    const unionFds = [];

    decompositions.forEach((Ri, idx) => {
      const fList = projectFDs(Ri, fds, allAttrs);
      const rName = `R${idx + 1}`;
      localProjections.push({
        relationName: rName,
        subscript: `${idx + 1}`,
        attrs: Ri,
        fds: fList
      });
      fList.forEach(fd => {
        const exists = unionFds.some(u =>
          u.left.join(',') === fd.left.join(',') &&
          u.right.join(',') === fd.right.join(',')
        );
        if (!exists) {
          unionFds.push(fd);
        }
      });
    });

    // Step 2 & 3: Check each original FD against unionFds (F')
    const fdChecks = [];
    let allPreserved = true;

    for (const fd of fds) {
      let directlyIn = null;
      for (const lp of localProjections) {
        const match = lp.fds.some(lf =>
          fd.left.every(a => lf.left.includes(a)) &&
          fd.right.every(a => lf.right.includes(a))
        );
        if (match) {
          directlyIn = lp.relationName;
          break;
        }
      }

      const clUnion = computeClosure(fd.left, unionFds, allAttrs);
      const isPreserved = fd.right.every(a => clUnion.closure.includes(a));
      if (!isPreserved) allPreserved = false;

      fdChecks.push({
        fd,
        fdStr: formatFD(fd),
        leftStr: formatAttrs(fd.left, 'fd'),
        rightStr: formatAttrs(fd.right, 'fd'),
        directlyIn,
        isPreserved,
        closureUnderUnion: clUnion.closure,
        closureSteps: clUnion.steps
      });
    }

    return {
      isValid: true,
      decompositions,
      localProjections,
      unionFds,
      fdChecks,
      isPreserving: allPreserved,
      explanation: allPreserved
        ? `Pass: All original functional dependencies are preserved in (F₁ ∪ F₂ ∪ ... ∪ Fₖ)⁺. Every constraint can be enforced locally on individual relations without computing cross-table joins.`
        : `Fail: Dependency preservation violated. One or more functional dependencies cannot be derived from local projections (F₁ ∪ F₂ ∪ ...) and require expensive cross-table joins to enforce.`
    };
  }

  // Extraneous Attribute Analysis
  function testExtraneous(targetFd, targetAttr, side, allFds, allAttrs) {
    const left = [...targetFd.left];
    const right = [...targetFd.right];

    if (side === 'left') {
      // Condition 1: If X in alpha, (alpha - {X})+ contains beta => X is extraneous
      const alphaPrime = left.filter(a => a !== targetAttr);
      const cl = computeClosure(alphaPrime, allFds, allAttrs);
      const containsBeta = right.every(b => cl.closure.includes(b));
      const resultingFd = alphaPrime.length > 0
        ? { left: alphaPrime, right: [...right] }
        : null;

      return {
        conditionNumber: 1,
        side: 'left',
        sideLabel: 'LHS (α)',
        targetAttr,
        fdStr: formatFD(targetFd),
        testSet: alphaPrime,
        testSetStr: alphaPrime.length > 0 ? alphaPrime.join('') : '∅',
        closure: cl.closure,
        closureSteps: cl.steps,
        isExtraneous: containsBeta,
        resultingFdStr: resultingFd ? formatFD(resultingFd) : '∅ → ' + right.join(''),
        reason: containsBeta
          ? `Condition 1 Satisfied: (${alphaPrime.join('') || '∅'})⁺ = { ${cl.closure.join(', ')} } contains RHS { ${right.join(', ')} }. Thus, attribute '${targetAttr}' is EXTRANEOUS on the LHS and can be dropped.`
          : `Condition 1 Failed: (${alphaPrime.join('') || '∅'})⁺ = { ${cl.closure.join(', ')} } does NOT contain RHS { ${right.join(', ')} }. Thus, attribute '${targetAttr}' is ESSENTIAL on the LHS (not extraneous).`
      };
    } else {
      // Condition 2: If X in beta, compute alpha+ using F' = (F - {alpha -> beta}) U (alpha -> (beta - {X}))
      // if alpha+ contains X => X is extraneous
      const betaPrime = right.filter(a => a !== targetAttr);
      const otherFds = allFds.filter(f => f !== targetFd);
      const fPrime = [...otherFds];
      if (betaPrime.length > 0) {
        fPrime.push({ left: [...left], right: betaPrime });
      }

      const cl = computeClosure(left, fPrime, allAttrs);
      const containsX = cl.closure.includes(targetAttr);
      const resultingFd = betaPrime.length > 0
        ? { left: [...left], right: betaPrime }
        : null;

      const fPrimeStrs = fPrime.map(formatFD);

      return {
        conditionNumber: 2,
        side: 'right',
        sideLabel: 'RHS (β)',
        targetAttr,
        fdStr: formatFD(targetFd),
        testSet: left,
        testSetStr: left.join(''),
        closure: cl.closure,
        closureSteps: cl.steps,
        fPrimeStrs,
        isExtraneous: containsX,
        resultingFdStr: resultingFd ? formatFD(resultingFd) : '(Dependency completely eliminated)',
        reason: containsX
          ? `Condition 2 Satisfied: (${left.join('')})⁺ under F' = { ${cl.closure.join(', ')} } contains '${targetAttr}'. Thus, attribute '${targetAttr}' is EXTRANEOUS on the RHS and can be dropped.`
          : `Condition 2 Failed: (${left.join('')})⁺ under F' = { ${cl.closure.join(', ')} } does NOT contain '${targetAttr}'. Thus, attribute '${targetAttr}' is ESSENTIAL on the RHS (not extraneous).`
      };
    }
  }

  function evaluateExtraneousAudit(allFds, allAttrs) {
    const audit = [];
    allFds.forEach((fd, fdIdx) => {
      // LHS attributes
      fd.left.forEach(attr => {
        const res = testExtraneous(fd, attr, 'left', allFds, allAttrs);
        audit.push({
          fdIdx,
          fdStr: formatFD(fd),
          attr,
          side: 'left',
          ...res
        });
      });
      // RHS attributes
      fd.right.forEach(attr => {
        const res = testExtraneous(fd, attr, 'right', allFds, allAttrs);
        audit.push({
          fdIdx,
          fdStr: formatFD(fd),
          attr,
          side: 'right',
          ...res
        });
      });
    });
    return audit;
  }

  // Equivalence Analysis between F1 and F2
  function evaluateEquivalence(f1Fds, f2Fds, allAttrs, f1Name = 'F₁', f2Name = 'F₂') {
    // 1. F1 covers F2: for all X -> Y in F2, Y subseteq (X)+_F1
    const f1CoversF2Checks = f2Fds.map(fd => {
      const leftStr = formatAttrs(fd.left, 'fd');
      const rightStr = formatAttrs(fd.right, 'fd');
      const cl = computeClosure(fd.left, f1Fds, allAttrs);
      const isSatisfied = fd.right.every(r => cl.closure.includes(r));
      return {
        fdStr: `${leftStr} → ${rightStr}`,
        leftStr,
        rightStr,
        closureUnderOther: cl.closure,
        closureSteps: cl.steps,
        isSatisfied,
        reason: isSatisfied
          ? `(${leftStr})⁺ under ${f1Name} contains RHS { ${rightStr} }`
          : `(${leftStr})⁺ under ${f1Name} does NOT contain RHS { ${rightStr} }`
      };
    });
    const f1CoversF2 = f1CoversF2Checks.every(c => c.isSatisfied);

    // 2. F2 covers F1: for all X -> Y in F1, Y subseteq (X)+_F2
    const f2CoversF1Checks = f1Fds.map(fd => {
      const leftStr = formatAttrs(fd.left, 'fd');
      const rightStr = formatAttrs(fd.right, 'fd');
      const cl = computeClosure(fd.left, f2Fds, allAttrs);
      const isSatisfied = fd.right.every(r => cl.closure.includes(r));
      return {
        fdStr: `${leftStr} → ${rightStr}`,
        leftStr,
        rightStr,
        closureUnderOther: cl.closure,
        closureSteps: cl.steps,
        isSatisfied,
        reason: isSatisfied
          ? `(${leftStr})⁺ under ${f2Name} contains RHS { ${rightStr} }`
          : `(${leftStr})⁺ under ${f2Name} does NOT contain RHS { ${rightStr} }`
      };
    });
    const f2CoversF1 = f2CoversF1Checks.every(c => c.isSatisfied);

    const isEquivalent = f1CoversF2 && f2CoversF1;

    let explanation = '';
    if (isEquivalent) {
      explanation = `Equivalent: ${f1Name} covers ${f2Name} and ${f2Name} covers ${f1Name}. Both sets generate the exact same attribute closures (${f1Name}⁺ = ${f2Name}⁺).`;
    } else if (f1CoversF2 && !f2CoversF1) {
      explanation = `Not Equivalent: ${f1Name} covers ${f2Name}, but ${f2Name} does NOT cover ${f1Name}. Some dependencies in ${f1Name} cannot be derived from ${f2Name}.`;
    } else if (!f1CoversF2 && f2CoversF1) {
      explanation = `Not Equivalent: ${f2Name} covers ${f1Name}, but ${f1Name} does NOT cover ${f2Name}. Some dependencies in ${f2Name} cannot be derived from ${f1Name}.`;
    } else {
      explanation = `Not Equivalent: Neither set covers the other.`;
    }

    return {
      f1Name,
      f2Name,
      f1Fds,
      f2Fds,
      f1CoversF2,
      f1CoversF2Checks,
      f2CoversF1,
      f2CoversF1Checks,
      isEquivalent,
      explanation
    };
  }

  function normalizeCheck(val) {
    if (!val) return null;
    const s = String(val).trim().toLowerCase().replace(/[\s\-_]+/g, '');
    if (s === '1nf') return '1nf';
    if (s === '2nf') return '2nf';
    if (s === '3nf') return '3nf';
    if (s === 'bcnf') return 'bcnf';
    if (s === 'allnf' || s === 'all' || s === 'nf' || s === 'normalform' || s === 'normalforms') return 'all-nf';
    if (s.includes('lossless') || s.includes('join')) return 'lossless-join';
    if (s.includes('preserv') || s.includes('dep')) return 'dependency-preservation';
    if (s.includes('decomp')) return 'lossless-join';
    if (s.includes('extraneous')) return 'extraneous-attribute';
    if (s.includes('equiv') || (s.includes('cover') && !s.includes('canonical'))) return 'equivalence';
    if (s.includes('canonical') || s.includes('fc') || s.includes('cover')) return 'canonical-cover';
    if (s.includes('closure') || s.includes('alphaplus') || s.includes('query')) return 'closure';
    if (s.includes('candidate') || s.includes('key')) return 'candidate-keys';
    return null;
  }

  function parseCheckString(str) {
    if (!str) return [];
    const parts = String(str).split(/[,;|\s]+/).map(s => s.trim()).filter(Boolean);
    const result = [];
    for (const p of parts) {
      const norm = normalizeCheck(p);
      if (norm && !result.includes(norm)) {
        result.push(norm);
      }
    }
    return result;
  }

  function detectChecks(scaffold, codeEl, codeText) {
    const pre = codeEl?.closest('pre') || scaffold.querySelector('pre');
    const sourceDiv = codeEl?.closest('.sourceCode') || scaffold.querySelector('.sourceCode');
    const targets = [
      codeEl,
      pre,
      sourceDiv,
      scaffold,
      scaffold?.querySelector?.('.sourceCode'),
      scaffold?.querySelector?.('pre'),
      scaffold?.parentElement
    ];

    // 1. Direct attributes: check, data-check, concept, data-concept, compute, op, mode, task
    for (const el of targets) {
      if (!el) continue;
      const attr = el.getAttribute?.('check') || el.getAttribute?.('data-check') ||
        el.getAttribute?.('concept') || el.getAttribute?.('data-concept') ||
        el.getAttribute?.('compute') || el.getAttribute?.('data-compute') ||
        el.getAttribute?.('op') || el.getAttribute?.('data-op') ||
        el.getAttribute?.('mode') || el.getAttribute?.('data-mode') ||
        el.getAttribute?.('task') || el.getAttribute?.('data-task');
      if (attr) {
        const parsed = parseCheckString(attr);
        if (parsed.length > 0) return parsed;
      }
      if (el.classList) {
        for (const cls of el.classList) {
          const m = cls.match(/^(?:check|compute|op|task|concept|mode|fd)-(.+)$/i);
          if (m) {
            const parsed = parseCheckString(m[1]);
            if (parsed.length > 0) return parsed;
          }
          const directNorm = normalizeCheck(cls);
          if (directNorm) return [directNorm];
        }
      }
    }

    // 2. Parent wrapper (e.g. ::: {check="2nf, 3nf"})
    const parentWithAttr = scaffold?.closest?.('[check], [data-check], [concept], [data-concept], [compute], [data-compute], [op], [data-op]');
    if (parentWithAttr && parentWithAttr !== document.body) {
      const parentAttr = parentWithAttr.getAttribute?.('check') || parentWithAttr.getAttribute?.('data-check') ||
        parentWithAttr.getAttribute?.('concept') || parentWithAttr.getAttribute?.('data-concept') ||
        parentWithAttr.getAttribute?.('compute') || parentWithAttr.getAttribute?.('data-compute') ||
        parentWithAttr.getAttribute?.('op') || parentWithAttr.getAttribute?.('data-op');
      if (parentAttr) {
        const parsed = parseCheckString(parentAttr);
        if (parsed.length > 0) return parsed;
      }
    }

    // 3. Comment inside code snippet: # check: 2nf, 3nf, bcnf or -- check: canonical-cover
    if (codeText) {
      const commentMatch = codeText.match(/(?:#|--|\/\/|\/\*)\s*(?:check|compute|op|task|concept|mode)\s*[:=]\s*([a-zA-Z0-9_,\-\s]+)/i);
      if (commentMatch) {
        const parsed = parseCheckString(commentMatch[1]);
        if (parsed.length > 0) return parsed;
      }
    }

    // 4. Preceding DOM elements (e.g. **Check:** 2NF, 3NF)
    let curr = scaffold;
    while (curr) {
      let prev = curr.previousElementSibling;
      while (prev) {
        const textMatch = prev.textContent?.trim().match(/^(?:\*\*)?(?:Check|Compute|Operation|Task|Concept|Mode)\s*(?:\*\*)?\s*:\s*([a-zA-Z0-9_,\-\s]+)$/i);
        if (textMatch) {
          const parsed = parseCheckString(textMatch[1]);
          if (parsed.length > 0) return parsed;
        }
        prev = prev.previousElementSibling;
      }
      curr = curr.parentElement;
      if (curr && (curr.tagName === 'BODY' || curr.classList.contains('content') || curr.tagName === 'MAIN')) break;
    }

    // 5. Code heuristics
    if (codeText) {
      if (codeText.match(/F1\s*[:=]|F2\s*[:=]|\bequivalence\b|\bequiv\b/i)) return ['equivalence'];
      if (codeText.match(/extraneous/i)) return ['extraneous-attribute'];
      if (codeText.match(/decompose\s*[:=]/i)) return ['lossless-join', 'dependency-preservation'];
      if (codeText.match(/query\s*[:=]|closure\s*[:=]/i)) return ['closure'];
      if (codeText.match(/canonical\s*cover|minimal\s*cover|\bFc\b/i)) return ['canonical-cover'];
      if (codeText.match(/\bbcnf\b/i)) return ['bcnf'];
      if (codeText.match(/\b3nf\b/i)) return ['3nf'];
      if (codeText.match(/\b2nf\b/i)) return ['2nf'];
      if (codeText.match(/\b1nf\b/i)) return ['1nf'];
    }

    return [];
  }

  function getCheckInfo(check) {
    switch (check) {
      case '1nf':
        return { label: 'Check 1NF', shortPill: '1NF', defaultTab: '1nf' };
      case '2nf':
        return { label: 'Check 2NF', shortPill: '2NF', defaultTab: '2nf' };
      case '3nf':
        return { label: 'Check 3NF', shortPill: '3NF', defaultTab: '3nf' };
      case 'bcnf':
        return { label: 'Check BCNF', shortPill: 'BCNF', defaultTab: 'bcnf' };
      case 'lossless-join':
        return { label: 'Lossless Join Check', shortPill: 'Lossless Join', defaultTab: 'lossless-join' };
      case 'dependency-preservation':
        return { label: 'Dependency Preservation Check', shortPill: 'Dependency Preservation', defaultTab: 'dependency-preservation' };
      case 'extraneous-attribute':
        return { label: 'Extraneous Attribute Check', shortPill: 'Extraneous Attr', defaultTab: 'extraneous-attribute' };
      case 'equivalence':
        return { label: 'Equivalence Check (F ≡ G)', shortPill: 'Equivalence', defaultTab: 'equivalence' };
      case 'canonical-cover':
        return { label: 'Canonical Cover (F_c)', shortPill: 'Canonical Cover', defaultTab: 'canonical-cover' };
      case 'candidate-keys':
        return { label: 'Candidate Keys', shortPill: 'Keys', defaultTab: 'candidate-keys' };
      case 'closure':
        return { label: 'Attribute Closure (α⁺)', shortPill: 'Closure (α⁺)', defaultTab: 'closure' };
      case 'all-nf':
      default:
        return { label: 'All Normal Forms', shortPill: 'All NF', defaultTab: 'all-nf' };
    }
  }

  function extractCleanCode(codeEl) {
    const clone = codeEl.cloneNode(true);
    clone.querySelectorAll('.ln, .line-numbers, .c-copy, .copy-button, a, button, .code-annotation, .code-copy-button').forEach(e => e.remove());
    return (clone.innerText || clone.textContent || '').trim();
  }

  function setupFDBlock(scaffold, codeEl) {
    if (scaffold.dataset.fdRunnerInit) return;

    if (!codeEl) {
      codeEl = scaffold.querySelector('pre > code, code');
    }
    if (!codeEl) return;

    const initialCode = extractCleanCode(codeEl);
    if (!initialCode) return;

    // Rule 1: Only blocks with explicit checks are made executable
    const detectedChecks = detectChecks(scaffold, codeEl, initialCode);
    if (!detectedChecks || detectedChecks.length === 0) {
      // If no check is mentioned, leave it as static code block (just like SQL runner)
      return;
    }

    scaffold.dataset.fdRunnerInit = "true";

    let currentCode = initialCode;
    let activeTab = detectedChecks[0];
    let isEditing = false;
    let selectedAttrs = new Set();
    let selectedExtraneousFdIdx = 0;
    let selectedExtraneousAttr = null;
    let selectedExtraneousSide = null;
    let aceInstance = null;

    const parsed = parseFDText(initialCode);

    // Also check attributes for query, e.g. query="A", closure="A", or check="closure(A)"
    const rawCheck = scaffold?.getAttribute?.('check') || codeEl?.getAttribute?.('check') || '';
    const closureArgMatch = rawCheck.match(/closure\s*\(\s*([A-Za-z0-9,\s]+)\s*\)/i);
    const attrQuery = scaffold?.getAttribute?.('query') || scaffold?.getAttribute?.('data-query') ||
      scaffold?.getAttribute?.('closure') || scaffold?.getAttribute?.('data-closure') ||
      codeEl?.getAttribute?.('query') || codeEl?.getAttribute?.('data-query') ||
      codeEl?.getAttribute?.('closure') || codeEl?.getAttribute?.('data-closure') ||
      (closureArgMatch ? closureArgMatch[1] : null);

    if (attrQuery && !parsed.query) {
      parsed.query = attrQuery.replace(/[^A-Za-z0-9]/g, '');
    }

    if (parsed.query) {
      parsed.query.split('').forEach(a => selectedAttrs.add(a));
    } else if (parsed.attributes.length > 0) {
      selectedAttrs.add(parsed.attributes[0]);
    }

    // Create wrapper matching SQL runner
    const wrapper = document.createElement('div');
    wrapper.className = 'fd-runner-wrapper';
    scaffold.parentNode.insertBefore(wrapper, scaffold);

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'fd-runner-toolbar';

    const leftDiv = document.createElement('div');
    leftDiv.className = 'fd-runner-left';

    const checkInfo = getCheckInfo(activeTab);

    // Concept Check Badge
    const checkBadge = document.createElement('span');
    checkBadge.className = 'fd-runner-badge fd-runner-badge-op';
    checkBadge.innerHTML = `<span class="fd-check-title">${checkInfo.label}</span>`;
    leftDiv.appendChild(checkBadge);

    // Schema Badge
    const schemaBadge = document.createElement('span');
    schemaBadge.className = 'fd-runner-badge';
    if (parsed.hasMultipleSets) {
      schemaBadge.innerHTML = `<span class="fd-runner-icon">${ICONS.table}</span><span class="fd-schema-text">R(${parsed.attributes.join(', ') || 'Schema'}) &bull; F₁ (${parsed.f1Fds.length}) &bull; F₂ (${parsed.f2Fds.length})</span>`;
    } else {
      schemaBadge.innerHTML = `<span class="fd-runner-icon">${ICONS.table}</span><span class="fd-schema-text">R(${parsed.attributes.join(', ') || 'Schema'})</span>`;
    }
    leftDiv.appendChild(schemaBadge);

    const rightDiv = document.createElement('div');
    rightDiv.className = 'fd-runner-right';

    // Show tabs ONLY if multiple checks were specified!
    let tabsContainer = null;
    if (detectedChecks.length > 1) {
      tabsContainer = document.createElement('div');
      tabsContainer.className = 'fd-runner-tabs';
      tabsContainer.innerHTML = detectedChecks.map(checkId => {
        const info = getCheckInfo(checkId);
        return `<button class="fd-tab-pill ${activeTab === checkId ? 'active' : ''}" data-tab="${checkId}">${info.shortPill || info.label}</button>`;
      }).join('');
      rightDiv.appendChild(tabsContainer);
    }

    const editBtn = document.createElement('button');
    editBtn.className = 'fd-runner-btn fd-runner-edit-btn';
    editBtn.title = 'Edit relation & FDs inline';
    editBtn.innerHTML = `${ICONS.edit} <span>Edit</span>`;

    const runBtn = document.createElement('button');
    runBtn.className = 'fd-runner-btn fd-runner-run-btn';
    runBtn.title = 'Run analysis (Ctrl+Enter)';
    runBtn.innerHTML = `${ICONS.play} <span>Run</span>`;

    rightDiv.appendChild(editBtn);
    rightDiv.appendChild(runBtn);

    toolbar.appendChild(leftDiv);
    toolbar.appendChild(rightDiv);
    wrapper.appendChild(toolbar);

    // Code area containing the original pre block and Ace Editor container
    const codeArea = document.createElement('div');
    codeArea.className = 'fd-runner-code-area';
    codeArea.appendChild(scaffold);

    const aceContainer = document.createElement('div');
    aceContainer.className = 'fd-runner-ace-container';
    aceContainer.style.display = 'none';
    codeArea.appendChild(aceContainer);

    const textarea = document.createElement('textarea');
    textarea.className = 'fd-runner-textarea';
    textarea.value = initialCode;
    textarea.style.display = 'none';
    textarea.spellcheck = false;
    codeArea.appendChild(textarea);

    wrapper.appendChild(codeArea);

    // Output container - HIDDEN BY DEFAULT (displays only after Run)
    const outputContainer = document.createElement('div');
    outputContainer.className = 'fd-runner-output';
    outputContainer.style.display = 'none';
    wrapper.appendChild(outputContainer);

    async function initAceEditor() {
      if (aceInstance) {
        aceInstance.setTheme(getAceTheme());
        return aceInstance;
      }
      const ace = await loadAce();
      aceInstance = ace.edit(aceContainer);
      aceInstance.session.setMode("ace/mode/text");
      aceInstance.setTheme(getAceTheme());
      aceInstance.setFontSize(14);
      aceInstance.setShowPrintMargin(false);
      aceInstance.session.setUseWrapMode(true);
      aceInstance.setValue(currentCode, -1);

      aceInstance.commands.addCommand({
        name: 'runAnalysis',
        bindKey: { win: 'Ctrl-Enter', mac: 'Command-Enter' },
        exec: () => runBtn.click()
      });

      aceInstance.session.on('change', () => {
        currentCode = aceInstance.getValue();
        const liveParsed = parseFDText(currentCode);
        const schemaText = schemaBadge.querySelector('.fd-schema-text');
        if (schemaText) {
          if (liveParsed.hasMultipleSets) {
            schemaText.innerHTML = `R(${liveParsed.attributes.join(', ') || 'Schema'}) &bull; F₁ (${liveParsed.f1Fds.length}) &bull; F₂ (${liveParsed.f2Fds.length})`;
          } else {
            schemaText.textContent = `R(${liveParsed.attributes.join(', ') || 'Schema'})`;
          }
        }
      });

      const observer = new MutationObserver(() => {
        aceInstance.setTheme(getAceTheme());
      });
      observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

      return aceInstance;
    }

    function getCodeToRun() {
      if (aceInstance && aceContainer.style.display !== 'none') {
        return aceInstance.getValue();
      }
      if (textarea && textarea.style.display !== 'none') {
        return textarea.value;
      }
      return currentCode || initialCode;
    }

    textarea.addEventListener('input', () => {
      currentCode = textarea.value;
      const liveParsed = parseFDText(currentCode);
      const schemaText = schemaBadge.querySelector('.fd-schema-text');
      if (schemaText) {
        if (liveParsed.hasMultipleSets) {
          schemaText.innerHTML = `R(${liveParsed.attributes.join(', ') || 'Schema'}) &bull; F₁ (${liveParsed.f1Fds.length}) &bull; F₂ (${liveParsed.f2Fds.length})`;
        } else {
          schemaText.textContent = `R(${liveParsed.attributes.join(', ') || 'Schema'})`;
        }
      }
    });

    // Edit button (Toggles Edit and Revert, identical to SQL runner)
    editBtn.addEventListener('click', async () => {
      isEditing = !isEditing;
      if (isEditing) {
        const height = Math.max(90, scaffold.offsetHeight || 120);
        scaffold.style.display = 'none';
        try {
          aceContainer.style.display = 'block';
          aceContainer.style.height = height + 'px';
          const editor = await initAceEditor();
          editor.setValue(currentCode, -1);
          editor.resize();
          editor.focus();
        } catch (e) {
          aceContainer.style.display = 'none';
          textarea.style.display = 'block';
          textarea.style.height = height + 'px';
          textarea.value = currentCode;
          textarea.focus();
        }
        editBtn.innerHTML = `${ICONS.revert} <span>Revert</span>`;
        editBtn.title = 'Revert to original relation and FDs';
        editBtn.classList.add('active');
      } else {
        // Revert action
        currentCode = initialCode;
        if (aceInstance) aceInstance.setValue(initialCode, -1);
        textarea.value = initialCode;
        aceContainer.style.display = 'none';
        textarea.style.display = 'none';
        scaffold.style.display = '';
        editBtn.innerHTML = `${ICONS.edit} <span>Edit</span>`;
        editBtn.title = 'Edit relation & FDs inline';
        editBtn.classList.remove('active');

        const restoredParsed = parseFDText(initialCode);
        const schemaText = schemaBadge.querySelector('.fd-schema-text');
        if (schemaText) schemaText.textContent = `R(${restoredParsed.attributes.join(', ') || 'Schema'})`;

        if (outputContainer.style.display !== 'none') {
          renderResults();
        }
      }
    });

    // Run button
    runBtn.addEventListener('click', () => {
      currentCode = getCodeToRun();
      outputContainer.style.display = 'block';
      renderResults();
    });

    // Tab buttons event listeners (only if multiple checks)
    if (tabsContainer) {
      tabsContainer.querySelectorAll('.fd-tab-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          tabsContainer.querySelectorAll('.fd-tab-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          activeTab = btn.dataset.tab;
          const tabInfo = getCheckInfo(activeTab);
          const checkTitle = checkBadge.querySelector('.fd-check-title');
          if (checkTitle) checkTitle.textContent = tabInfo.label;
          const checkIcon = checkBadge.querySelector('.fd-runner-icon');
          if (checkIcon) checkIcon.innerHTML = tabInfo.icon;
          if (outputContainer.style.display !== 'none') {
            renderResults();
          }
        });
      });
    }

    function renderResults() {
      const codeToRun = getCodeToRun();
      const t0 = performance.now();
      const p = parseFDText(codeToRun);
      const t1 = performance.now();
      const elapsed = (t1 - t0).toFixed(2);

      const schemaText = schemaBadge.querySelector('.fd-schema-text');
      if (schemaText) {
        if (p.hasMultipleSets) {
          schemaText.innerHTML = `R(${p.attributes.join(', ') || 'Schema'}) &bull; F₁ (${p.f1Fds.length}) &bull; F₂ (${p.f2Fds.length})`;
        } else {
          schemaText.textContent = `R(${p.attributes.join(', ') || 'Schema'})`;
        }
      }

      // Update badge label based on activeTab
      const curTabInfo = getCheckInfo(activeTab);
      const checkTitle = checkBadge.querySelector('.fd-check-title');
      if (checkTitle) checkTitle.textContent = curTabInfo.label;
      const checkIcon = checkBadge.querySelector('.fd-runner-icon');
      if (checkIcon) checkIcon.innerHTML = curTabInfo.icon;

      // Update active tab button style (safe null check)
      if (tabsContainer) {
        tabsContainer.querySelectorAll('.fd-tab-pill').forEach(b => {
          b.classList.toggle('active', b.dataset.tab === activeTab);
        });
      }

      let targetAttrs = Array.from(selectedAttrs);
      if (p.query) {
        targetAttrs = p.query.split('').filter(a => p.attributes.includes(a));
      }
      if (targetAttrs.length === 0 && p.attributes.length > 0) {
        targetAttrs = [p.attributes[0]];
      }

      const closureRes = computeClosure(targetAttrs, p.fds, p.attributes);
      const nf = checkNormalForms(p.attributes, p.fds);
      const canonicalData = computeCanonicalCover(p.attributes, p.fds);

      let contentHtml = '';

      const renderKeysAndAttrsBox = () => `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-bottom:0.6rem;">
          <div class="fd-card-box">
            <span style="font-size:0.74rem;font-weight:700;color:var(--fd-primary);">Candidate Keys:</span>
            <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.25rem;">
              ${nf.candidateKeys.map(k => `<span class="fd-badge key">{${k}}</span>`).join('') || '<span style="font-size:0.75rem;color:var(--fd-text-muted);">None</span>'}
            </div>
          </div>
          <div class="fd-card-box">
            <span style="font-size:0.74rem;font-weight:700;color:var(--fd-text-muted);">Attributes Breakdown:</span>
            <div style="margin-top:0.25rem;font-size:0.74rem;display:flex;flex-wrap:wrap;align-items:center;gap:0.3rem;">
              <b>Prime:</b> ${nf.primeAttrs.map(a => `<span class="fd-badge prime">${a}</span>`).join('') || '<span style="color:var(--fd-text-muted);">None</span>'}
              <span style="color:var(--fd-border-color);margin:0 0.15rem;">&bull;</span>
              <b>Non-Prime:</b> ${nf.nonPrimeAttrs.map(a => `<span class="fd-badge">${a}</span>`).join('') || '<span style="color:var(--fd-text-muted);">None</span>'}
            </div>
          </div>
        </div>
      `;

      if (activeTab === '1nf') {
        contentHtml = `
          <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div>
              <span style="font-weight:700;font-size:0.92rem;">1NF Compliance Check: Satisfied ✓</span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                Schema consists of atomic domain values with zero multivalued attributes.
              </div>
            </div>
            <span class="fd-badge pass">1NF Satisfied</span>
          </div>
          <div style="font-size:0.76rem;color:var(--fd-text-muted);line-height:1.4;">
            Every attribute in R(${p.attributes.join(', ')}) holds single, indivisible values.
          </div>
        `;
      } else if (activeTab === '2nf') {
        contentHtml = `
          <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div>
              <span style="font-weight:700;font-size:0.92rem;">
                2NF Evaluation: ${nf.is2NF ? 'Satisfies 2NF ✓' : 'Violates 2NF ✗'}
              </span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                Rule: No non-prime attribute should depend on a proper subset of any candidate key (zero partial dependencies).
              </div>
            </div>
            <span class="fd-badge ${nf.is2NF ? 'pass' : 'fail'}">${nf.is2NF ? '2NF Satisfied' : '2NF Violated'}</span>
          </div>

          ${renderKeysAndAttrsBox()}

          <table class="fd-table">
            <thead>
              <tr>
                <th style="width: 140px;">FD</th>
                <th style="width: 130px;">Partial Dependency?</th>
                <th style="width: 75px;">2NF</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              ${nf.fdAnalysis.map(item => `
                <tr>
                  <td><b>${item.fd}</b></td>
                  <td>${item.isPartial ? '<span class="fd-badge fail">Partial Dependency</span>' : (item.isLhsProperSubsetOfCk ? '<span class="fd-badge pass" title="LHS is proper subset of candidate key, but RHS is prime">No (RHS Prime)</span>' : '<span class="fd-badge pass">Full Dependency</span>')}</td>
                  <td><span class="fd-badge ${item.satisfies2NF ? 'pass' : 'fail'}">${item.satisfies2NF ? 'Pass' : 'Fail'}</span></td>
                  <td>${item.reason2NF}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (activeTab === '3nf') {
        contentHtml = `
          <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div>
              <span style="font-weight:700;font-size:0.92rem;">
                3NF Evaluation: ${nf.is3NF ? 'Satisfies 3NF ✓' : 'Violates 3NF ✗'}
              </span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                Rule: For every non-trivial FD X → Y, either <b>X is a superkey</b> (Condition 1) OR <b>Y is a prime attribute</b> (Condition 2).
              </div>
            </div>
            <span class="fd-badge ${nf.is3NF ? 'pass' : 'fail'}">${nf.is3NF ? '3NF Satisfied' : '3NF Violated'}</span>
          </div>

          ${renderKeysAndAttrsBox()}

          <table class="fd-table">
            <thead>
              <tr>
                <th style="width: 130px;">FD</th>
                <th style="width: 120px;">LHS Superkey?</th>
                <th style="width: 110px;">RHS Prime?</th>
                <th style="width: 65px;">3NF</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              ${nf.fdAnalysis.map(item => `
                <tr>
                  <td><b>${item.fd}</b></td>
                  <td><span class="fd-badge ${item.isSuperKey ? 'pass' : 'fail'}">${item.isSuperKey ? 'Yes' : 'No'}</span></td>
                  <td><span class="fd-badge ${item.allRightPrime ? 'pass' : 'fail'}">${item.allRightPrime ? 'Yes' : 'No'}</span></td>
                  <td><span class="fd-badge ${item.satisfies3NF ? 'pass' : 'fail'}">${item.satisfies3NF ? 'Pass' : 'Fail'}</span></td>
                  <td>${item.reason3NF}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (activeTab === 'bcnf') {
        contentHtml = `
          <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div>
              <span style="font-weight:700;font-size:0.92rem;">
                BCNF Evaluation: ${nf.isBCNF ? 'Satisfies BCNF ✓' : 'Fails BCNF ✗'}
              </span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                Strict Rule: For every non-trivial FD X → Y, <b>X must be a superkey</b> (no prime attribute exception).
              </div>
            </div>
            <span class="fd-badge ${nf.isBCNF ? 'pass' : 'fail'}">${nf.isBCNF ? 'BCNF Satisfied' : 'BCNF Failed'}</span>
          </div>

          ${renderKeysAndAttrsBox()}

          <table class="fd-table">
            <thead>
              <tr>
                <th style="width: 130px;">FD</th>
                <th style="width: 130px;">LHS Closure (X⁺)</th>
                <th style="width: 110px;">LHS Superkey?</th>
                <th style="width: 65px;">BCNF</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              ${nf.fdAnalysis.map(item => `
                <tr>
                  <td><b>${item.fd}</b></td>
                  <td><code>{ ${item.lhsClosure.join(', ')} }</code></td>
                  <td><span class="fd-badge ${item.isSuperKey ? 'pass' : 'fail'}">${item.isSuperKey ? 'Yes' : 'No'}</span></td>
                  <td><span class="fd-badge ${item.satisfiesBCNF ? 'pass' : 'fail'}">${item.satisfiesBCNF ? 'Pass' : 'Fail'}</span></td>
                  <td>${item.reasonBCNF}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (activeTab === 'all-nf') {
        contentHtml = `
          <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div>
              <span style="font-weight:700;font-size:0.92rem;">Highest Normal Form Satisfied: ${nf.highestOverall}</span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                1NF: Passed &bull; 2NF: ${nf.is2NF ? 'Passed' : 'Violated'} &bull; 3NF: ${nf.is3NF ? 'Passed' : 'Violated'} &bull; BCNF: ${nf.isBCNF ? 'Passed' : 'Violated'}
              </div>
            </div>
            <span class="fd-badge ${nf.highestOverall === 'BCNF' || nf.highestOverall === '3NF' ? 'pass' : 'fail'}">${nf.highestOverall}</span>
          </div>

          ${renderKeysAndAttrsBox()}

          <table class="fd-table">
            <thead>
              <tr>
                <th style="width: 120px;">FD</th>
                <th style="width: 60px;">2NF</th>
                <th style="width: 60px;">3NF</th>
                <th style="width: 65px;">BCNF</th>
                <th>Explanation</th>
              </tr>
            </thead>
            <tbody>
              ${nf.fdAnalysis.map(item => `
                <tr>
                  <td><b>${item.fd}</b></td>
                  <td><span class="fd-badge ${item.satisfies2NF ? 'pass' : 'fail'}">${item.satisfies2NF ? 'Pass' : 'Fail'}</span></td>
                  <td><span class="fd-badge ${item.satisfies3NF ? 'pass' : 'fail'}">${item.satisfies3NF ? 'Pass' : 'Fail'}</span></td>
                  <td><span class="fd-badge ${item.satisfiesBCNF ? 'pass' : 'fail'}">${item.satisfiesBCNF ? 'Pass' : 'Fail'}</span></td>
                  <td>${item.reason}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (activeTab === 'canonical-cover') {
        contentHtml = `
          <div class="fd-card-box">
            <span style="font-size:0.76rem;font-weight:700;color:var(--fd-primary);">Canonical Cover (Fc):</span>
            <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-top:0.4rem;">
              ${canonicalData.canonicalCover.map(f => `<span class="fd-badge key">${f}</span>`).join('')}
            </div>
            <div style="font-size:0.76rem;color:var(--fd-text-muted);line-height:1.4;margin-top:0.45rem;">
              Minimal equivalent functional dependency set with zero extraneous LHS attributes and zero redundant dependencies.
            </div>
          </div>

          <table class="fd-table">
            <thead>
              <tr>
                <th style="width: 170px;">Reduction Step</th>
                <th>Audit / Proof</th>
              </tr>
            </thead>
            <tbody>
              ${canonicalData.steps.map(s => `
                <tr>
                  <td><b>${s.phase}</b></td>
                  <td>${s.detail}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (activeTab === 'lossless-join') {
        const lossData = evaluateLosslessJoin(p.attributes, p.fds, p.decompositions);
        if (!lossData.isValid) {
          contentHtml = `
            <div class="fd-card-box">
              <span style="font-weight:700;font-size:0.88rem;">No Decomposition Specified</span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:4px;">
                Click <b>Edit</b> and add e.g. <code>Decompose: R1(A, B), R2(B, C), R3(C, D)</code> to test for Lossless Join.
              </div>
            </div>
          `;
        } else {
          contentHtml = `
            <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
              <div>
                <span style="font-weight:700;font-size:0.92rem;">
                  Decomposition: ${lossData.decompositions.map((r, i) => `R${i + 1}(${r.join(', ')})`).join(', ')}
                </span>
                <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                  Testing if natural join of decomposed pieces reconstructs R(${p.attributes.join(', ')}) without spurious tuples.
                </div>
              </div>
              <span class="fd-badge ${lossData.isLossless ? 'pass' : 'fail'}">${lossData.isLossless ? 'Lossless Join ✓' : 'Lossy ✗'}</span>
            </div>

            <!-- Step 1: Attribute Union Check -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-weight:700;font-size:0.82rem;color:var(--fd-text-main);margin-bottom:4px;">
                Step 1: Attribute Union Check (R₁ ∪ R₂ ∪ ... ∪ Rₖ = R)
              </div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.45;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.3rem;">
                <div>
                  Union: <code>{ ${lossData.union.join(', ')} }</code> ${lossData.satisfiesUnion ? '=' : '≠'} <code>{ ${p.attributes.join(', ')} }</code>
                  ${!lossData.satisfiesUnion ? ` &nbsp;<span style="color:var(--fd-danger-text);">(Missing attributes from R)</span>` : ''}
                </div>
                <span class="fd-badge ${lossData.satisfiesUnion ? 'pass' : 'fail'}" style="padding:1px 5px;font-size:0.7rem;">
                  ${lossData.satisfiesUnion ? 'Satisfied ✓' : 'Violated ✗'}
                </span>
              </div>
            </div>

            <!-- Step 2: Progressive Pairwise Join Audit -->
            <div style="font-weight:700;font-size:0.82rem;color:var(--fd-text-main);margin:0.75rem 0 0.35rem 0;">
              Step 2: Progressive Natural Join Steps:
            </div>
            <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-bottom:0.5rem;">
              Testing successive joins: at each step, shared attributes must form a superkey of at least one joined relation.
            </div>

            ${lossData.steps.map(s => `
              <div class="fd-card-box" style="border-left:3px solid ${s.stepLossless ? 'var(--fd-success-text)' : 'var(--fd-danger-text)'};margin-bottom:0.55rem;">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.3rem;margin-bottom:4px;">
                  <span style="font-weight:700;font-size:0.84rem;">
                    Step 2.${s.stepNum}: Join <code>${s.leftName}(${s.leftAttrs.join(', ')}) ⋈ ${s.rightName}(${s.rightAttrs.join(', ')})</code>
                  </span>
                  <span class="fd-badge ${s.stepLossless ? 'pass' : 'fail'}">
                    ${s.stepLossless ? 'Lossless Join Step ✓' : 'Lossy Step ✗'}
                  </span>
                </div>

                <table class="fd-table" style="margin-top:0.25rem;">
                  <tbody>
                    <tr>
                      <td style="width: 175px; font-weight: 600;">Shared Attributes:</td>
                      <td><code>${s.leftName} ∩ ${s.rightName} = { ${s.intersection.join(', ') || '∅'} }</code></td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Closure of Shared Attributes:</td>
                      <td><code>(${formatAttrs(s.intersection, 'fd')})⁺ = { ${s.interClosure.join(', ')} }</code></td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Lossless join condition:</td>
                      <td>
                        ${s.stepLossless
              ? `<span style="color:var(--fd-success-text);font-weight:600;">Lossless join Condition Holds:</span> <code>(${formatAttrs(s.intersection, 'fd')})⁺</code> covers <b>${s.superkeyOf}</b>`
              : `<span style="color:var(--fd-danger-text);font-weight:600;">Condition Failed:</span> <code>(${formatAttrs(s.intersection, 'fd')})⁺</code> does NOT cover either ${s.leftName} or ${s.rightName}`
            }
                      </td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Resulting Intermediate:</td>
                      <td>
                        ${s.stepLossless && s.resultName
              ? `<code>${s.resultName}(${s.resultAttrs.join(', ')})</code>`
              : `<span style="color:var(--fd-danger-text);font-style:italic;">None</span>`
            }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `).join('')}

            <!-- Step 3: Final Result -->
            <div class="fd-card-box" style="margin-top:0.65rem;border-left:3px solid ${lossData.isLossless ? 'var(--fd-success-text)' : 'var(--fd-danger-text)'};">
              <div style="font-size:0.75rem;font-weight:700;color:var(--fd-text-main);margin-bottom:2px;">Step 3: Final Result:</div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.45;">${lossData.explanation}</div>
            </div>
          `;
        }
      } else if (activeTab === 'dependency-preservation') {
        const depPres = testDependencyPreservation(p.attributes, p.fds, p.decompositions);
        if (!depPres.isValid) {
          contentHtml = `
            <div class="fd-card-box">
              <span style="font-weight:700;font-size:0.88rem;">No Decomposition Specified</span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:4px;">
                Click <b>Edit</b> and add e.g. <code>Decompose: R1(A, B), R2(B, C), R3(C, D)</code> to test for Dependency Preservation.
              </div>
            </div>
          `;
        } else {
          contentHtml = `
            <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;">
              <div>
                <span style="font-weight:700;font-size:0.92rem;">
                  Dependency Preservation: ${depPres.decompositions.map((r, i) => `R${i + 1}(${r.join(', ')})`).join(', ')}
                </span>
                <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                  Testing if all original functional dependencies can be enforced locally on decomposed relations without joins.
                </div>
              </div>
              <span class="fd-badge ${depPres.isPreserving ? 'pass' : 'fail'}">
                ${depPres.isPreserving ? 'Dependency Preserved ✓' : 'Dependency Lost ✗'}
              </span>
            </div>

            <!-- Step 1: Local Projections Fi -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-weight:700;font-size:0.82rem;color:var(--fd-text-main);margin-bottom:4px;">
                Step 1: Compute Local Dependencies (Fᵢ for each Rᵢ)
              </div>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-bottom:0.35rem;">
                Projecting functional dependencies holding locally within each decomposed relation:
              </div>
              <table class="fd-table">
                <thead>
                  <tr>
                    <th style="width: 80px;">Relation</th>
                    <th style="width: 150px;">Attributes</th>
                    <th>Local Functional Dependencies (Fᵢ)</th>
                  </tr>
                </thead>
                <tbody>
                  ${depPres.localProjections.map(lp => `
                    <tr>
                      <td><b>${lp.relationName}</b></td>
                      <td><code>{ ${lp.attrs.join(', ')} }</code></td>
                      <td>
                        ${lp.fds.length > 0
              ? `<code>F_${lp.subscript} = { ${lp.fds.map(formatFD).join(', ')} }</code>`
              : `<span style="color:var(--fd-text-muted);font-style:italic;">None (∅)</span>`
            }
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Step 2: Combined Dependencies F' -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-weight:700;font-size:0.82rem;color:var(--fd-text-main);margin-bottom:4px;">
                Step 2: Combined Dependencies (F' = F₁ ∪ F₂ ∪ ... ∪ Fₖ)
              </div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.45;">
                <code>F' = { ${depPres.unionFds.map(formatFD).join(', ') || '∅'} }</code>
              </div>
            </div>

            <!-- Step 3: Verification of Original Functional Dependencies -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-weight:700;font-size:0.82rem;color:var(--fd-text-main);margin-bottom:4px;">
                Step 3: Verification of Original Functional Dependencies
              </div>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-bottom:0.35rem;">
                Check if each original FD in <code>F</code> is present directly in some <code>Fᵢ</code>, or if its RHS is contained in its closure under <code>F'</code>:
              </div>
              <table class="fd-table">
                <thead>
                  <tr>
                    <th style="width: 130px;">Original FD</th>
                    <th style="width: 155px;">Presence in F'</th>
                    <th>Closure Under F' (α⁺)</th>
                    <th style="width: 85px;">Preserved?</th>
                  </tr>
                </thead>
                <tbody>
                  ${depPres.fdChecks.map(fc => `
                    <tr>
                      <td><b>${fc.fdStr}</b></td>
                      <td>
                        ${fc.directlyIn
                ? `<span class="fd-badge pass" style="padding:1px 5px;font-size:0.7rem;">Directly in ${fc.directlyIn}</span>`
                : `<span style="font-size:0.74rem;color:var(--fd-text-muted);">Missing in F' (checked via closure)</span>`
              }
                      </td>
                      <td>
                        <code>(${fc.leftStr})⁺ = { ${fc.closureUnderUnion.join(', ')} }</code>
                        ${fc.isPreserved
                ? ` &nbsp;<span style="color:var(--fd-success-text);font-size:0.74rem;">(contains ${fc.rightStr})</span>`
                : ` &nbsp;<span style="color:var(--fd-danger-text);font-size:0.74rem;">(misses ${fc.rightStr})</span>`
              }
                      </td>
                      <td>
                        <span class="fd-badge ${fc.isPreserved ? 'pass' : 'fail'}">${fc.isPreserved ? 'Yes ✓' : 'No ✗'}</span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Expandable Derivation Steps for Missing FDs -->
            ${depPres.fdChecks.filter(fc => !fc.directlyIn).map(fc => `
              <details class="fd-steps-details" open>
                <summary>
                  <span>Step-by-Step Derivation for missing FD: <code>${fc.fdStr}</code> using F'</span>
                  <span class="fd-badge ${fc.isPreserved ? 'pass' : 'fail'}" style="margin-left:auto;">${fc.isPreserved ? 'Preserved ✓' : 'Lost ✗'}</span>
                </summary>
                <div class="fd-steps-body">
                  <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-bottom:6px;">
                    Computing closure <code>(${fc.leftStr})⁺</code> using <code>F' = { ${depPres.unionFds.map(formatFD).join(', ')} }</code>:
                  </div>
                  <table class="fd-table" style="margin-top:0;">
                    <thead>
                      <tr>
                        <th style="width: 50px;">Step</th>
                        <th style="width: 140px;">Rule Applied</th>
                        <th>Reason / Explanation</th>
                        <th style="width: 140px;">Current Closure</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${fc.closureSteps.map(s => `
                        <tr>
                          <td><b>${s.step}</b></td>
                          <td><code>${s.rule}</code></td>
                          <td>${s.reason}</td>
                          <td><code>{ ${s.current.join(', ')} }</code></td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                  <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:6px;line-height:1.4;">
                    <b>Outcome:</b> Since RHS <code>{ ${fc.rightStr} }</code> ${fc.isPreserved ? '⊆' : '⊈'} final closure <code>{ ${fc.closureUnderUnion.join(', ')} }</code>, <b>${fc.fdStr} is ${fc.isPreserved ? 'Preserved ✓' : 'Lost ✗'}</b>.
                  </div>
                </div>
              </details>
            `).join('')}

            <!-- Step 4: Final Result -->
            <div class="fd-card-box" style="margin-top:0.65rem;border-left:3px solid ${depPres.isPreserving ? 'var(--fd-success-text)' : 'var(--fd-danger-text)'};">
              <div style="font-size:0.75rem;font-weight:700;color:var(--fd-text-main);margin-bottom:2px;">Step 4: Final Result:</div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.45;">${depPres.explanation}</div>
            </div>
          `;
        }
      } else if (activeTab === 'closure') {
        contentHtml = `
          <div class="fd-card-box" style="margin-bottom:0.6rem;">
            <div style="font-size:0.74rem;font-weight:700;color:var(--fd-text-muted);margin-bottom:0.35rem;">
              Click attribute(s) to compute closure:
            </div>
            <div class="fd-closure-pills" style="display:flex;flex-wrap:wrap;gap:0.3rem;">
              ${p.attributes.map(a => `
                <button type="button" class="fd-attr-pill ${targetAttrs.includes(a) ? 'selected' : ''}" data-attr="${a}">${a}</button>
              `).join('')}
            </div>
          </div>

          <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.5rem;">
            <div>
              <span style="font-weight:700;font-size:0.9rem;">
                Closure { ${targetAttrs.join(', ')} }⁺ = { ${closureRes.closure.join(', ')} }
              </span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                Determines ${closureRes.closure.length} of ${p.attributes.length} attributes in R
              </div>
            </div>
            <span class="fd-badge ${closureRes.isSuperKey ? 'pass' : ''}">
              ${closureRes.isSuperKey ? 'Superkey ✓' : 'Non-Key'}
            </span>
          </div>

          <table class="fd-table">
            <thead>
              <tr>
                <th style="width: 50px;">Step</th>
                <th style="width: 140px;">FD Applied</th>
                <th>Current Closure Set</th>
                <th>Reasoning</th>
              </tr>
            </thead>
            <tbody>
              ${closureRes.steps.map(s => `
                <tr>
                  <td><b>${s.step}</b></td>
                  <td><code>${s.rule}</code></td>
                  <td><code>{ ${s.current.join(', ')} }</code></td>
                  <td>${s.reason}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      } else if (activeTab === 'candidate-keys') {
        contentHtml = `
          <div class="fd-card-box">
            <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.35rem;">
              Candidate Keys: ${nf.candidateKeys.length > 0 ? nf.candidateKeys.map(k => `<span class="fd-badge key" style="margin-left:0.3rem;">{${k}}</span>`).join('') : '<span style="color:var(--fd-text-muted);">None</span>'}
            </div>
            <div style="font-size:0.76rem;color:var(--fd-text-muted);line-height:1.4;">
              Minimal superkeys that uniquely determine every tuple in R without redundant attributes.
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-top:0.6rem;">
            <div class="fd-card-box">
              <span style="font-size:0.75rem;font-weight:700;color:var(--fd-primary);">Prime Attributes:</span>
              <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.3rem;">
                ${nf.primeAttrs.map(a => `<span class="fd-badge prime">${a}</span>`).join('') || '<span style="font-size:0.75rem;color:var(--fd-text-muted);">None</span>'}
              </div>
              <div style="font-size:0.72rem;color:var(--fd-text-muted);margin-top:0.35rem;">Part of at least one candidate key</div>
            </div>
            <div class="fd-card-box">
              <span style="font-size:0.75rem;font-weight:700;color:var(--fd-text-muted);">Non-Prime Attributes:</span>
              <div style="display:flex;flex-wrap:wrap;gap:0.25rem;margin-top:0.3rem;">
                ${nf.nonPrimeAttrs.map(a => `<span class="fd-badge">${a}</span>`).join('') || '<span style="font-size:0.75rem;color:var(--fd-text-muted);">None</span>'}
              </div>
              <div style="font-size:0.72rem;color:var(--fd-text-muted);margin-top:0.35rem;">Not part of any candidate key</div>
            </div>
          </div>
        `;
      } else if (activeTab === 'extraneous-attribute') {
        if (p.fds.length === 0) {
          contentHtml = `
            <div class="fd-card-box">
              <span style="font-weight:700;font-size:0.88rem;">No Functional Dependencies Found</span>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:4px;">
                Add functional dependencies to test for extraneous attributes.
              </div>
            </div>
          `;
        } else {
          if (selectedExtraneousFdIdx >= p.fds.length || selectedExtraneousFdIdx < 0) {
            selectedExtraneousFdIdx = 0;
          }
          const currentFd = p.fds[selectedExtraneousFdIdx];
          const leftAttrs = currentFd.left;
          const rightAttrs = currentFd.right;

          const hasAttr = (selectedExtraneousSide === 'left' && leftAttrs.includes(selectedExtraneousAttr)) ||
                          (selectedExtraneousSide === 'right' && rightAttrs.includes(selectedExtraneousAttr));
          if (!hasAttr) {
            if (leftAttrs.length > 0) {
              selectedExtraneousAttr = leftAttrs[0];
              selectedExtraneousSide = 'left';
            } else if (rightAttrs.length > 0) {
              selectedExtraneousAttr = rightAttrs[0];
              selectedExtraneousSide = 'right';
            }
          }

          const currentTest = testExtraneous(currentFd, selectedExtraneousAttr, selectedExtraneousSide, p.fds, p.attributes);

          contentHtml = `
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-weight:700;font-size:0.92rem;color:var(--fd-text-main);margin-bottom:4px;">
                Extraneous Attribute Verification
              </div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.45;">
                An attribute of a functional dependency is <b>extraneous</b> if we can remove it without changing the closure (F⁺) of the set of functional dependencies.
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">
                <div style="padding:0.4rem 0.5rem;background:var(--fd-bg-subtle);border-radius:4px;border:1px solid var(--fd-border-color);font-size:0.73rem;">
                  <b>Condition 1 (LHS X ∈ α):</b> If <code>(α - {X})⁺</code> contains <code>β</code>, then X is an extraneous attribute.
                </div>
                <div style="padding:0.4rem 0.5rem;background:var(--fd-bg-subtle);border-radius:4px;border:1px solid var(--fd-border-color);font-size:0.73rem;">
                  <b>Condition 2 (RHS X ∈ β):</b> Compute <code>α⁺</code> under <code>F' = (F - {α → β}) ∪ {α → (β - {X})}</code>. If <code>α⁺</code> contains X, then X is an extraneous attribute.
                </div>
              </div>
            </div>

            <!-- Step A: Select Dependency -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-size:0.74rem;font-weight:700;color:var(--fd-text-muted);margin-bottom:0.35rem;">
                Step 1: Select a Functional Dependency to Inspect:
              </div>
              <div class="fd-extraneous-fd-pills" style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                ${p.fds.map((f, idx) => `
                  <button type="button" class="fd-attr-pill fd-extraneous-fd-btn ${selectedExtraneousFdIdx === idx ? 'selected' : ''}" data-fd-idx="${idx}">
                    ${formatFD(f)}
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Step B: Select Attribute in chosen FD -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-size:0.74rem;font-weight:700;color:var(--fd-text-muted);margin-bottom:0.35rem;">
                Step 2: Select an Attribute from <code>${formatFD(currentFd)}</code> to Test:
              </div>
              <div class="fd-extraneous-attr-pills" style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                ${leftAttrs.map(a => `
                  <button type="button" class="fd-attr-pill fd-extraneous-attr-btn ${(selectedExtraneousAttr === a && selectedExtraneousSide === 'left') ? 'selected' : ''}" data-attr="${a}" data-side="left">
                    ${a} <span class="fd-side-tag lhs">LHS</span>
                  </button>
                `).join('')}
                ${rightAttrs.map(a => `
                  <button type="button" class="fd-attr-pill fd-extraneous-attr-btn ${(selectedExtraneousAttr === a && selectedExtraneousSide === 'right') ? 'selected' : ''}" data-attr="${a}" data-side="right">
                    ${a} <span class="fd-side-tag rhs">RHS</span>
                  </button>
                `).join('')}
              </div>
            </div>

            <!-- Single Attribute Test Result Card -->
            <div class="fd-card-box" style="border-left:3px solid ${currentTest.isExtraneous ? 'var(--fd-success-text)' : 'var(--fd-danger-text)'};margin-bottom:0.6rem;">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.35rem;">
                <div>
                  <span style="font-weight:700;font-size:0.88rem;">
                    Testing Attribute: <code>${currentTest.targetAttr}</code> on ${currentTest.sideLabel} of <code>${currentTest.fdStr}</code>
                  </span>
                  <div style="font-size:0.74rem;color:var(--fd-text-muted);margin-top:2px;">
                    Applied Rule: <b>Condition ${currentTest.conditionNumber} (${currentTest.sideLabel})</b>
                  </div>
                </div>
                <span class="fd-badge ${currentTest.isExtraneous ? 'pass' : 'fail'}">
                  ${currentTest.isExtraneous ? 'Extraneous Attribute ✓' : 'Essential (Not Extraneous) ✗'}
                </span>
              </div>

              <table class="fd-table" style="margin-top:0.35rem;">
                <tbody>
                  ${currentTest.side === 'left' ? `
                    <tr>
                      <td style="width: 190px; font-weight: 600;">Left Side Without Attribute:</td>
                      <td><code>α - {${currentTest.targetAttr}} = { ${currentTest.testSetStr} }</code></td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Closure under F:</td>
                      <td><code>(${currentTest.testSetStr})⁺ = { ${currentTest.closure.join(', ')} }</code></td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Condition 1 Check:</td>
                      <td>
                        Does <code>(${currentTest.testSetStr})⁺</code> contain RHS <code>{ ${currentFd.right.join(', ')} }</code>?
                        <b>${currentTest.isExtraneous ? 'Yes ✓' : 'No ✗'}</b>
                      </td>
                    </tr>
                  ` : `
                    <tr>
                      <td style="width: 190px; font-weight: 600;">Reduced Set F':</td>
                      <td><code>F' = { ${currentTest.fPrimeStrs.join(', ') || '∅'} }</code></td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Closure of α under F':</td>
                      <td><code>(${currentTest.testSetStr})⁺_F' = { ${currentTest.closure.join(', ')} }</code></td>
                    </tr>
                    <tr>
                      <td style="font-weight: 600;">Condition 2 Check:</td>
                      <td>
                        Does <code>(${currentTest.testSetStr})⁺_F'</code> contain <code>'${currentTest.targetAttr}'</code>?
                        <b>${currentTest.isExtraneous ? 'Yes ✓' : 'No ✗'}</b>
                      </td>
                    </tr>
                  `}
                  <tr>
                    <td style="font-weight: 600;">Conclusion / Reasoning:</td>
                    <td>${currentTest.reason}</td>
                  </tr>
                  <tr>
                    <td style="font-weight: 600;">Resulting Dependency:</td>
                    <td>
                      ${currentTest.isExtraneous
                        ? `<span class="fd-badge pass" style="font-size:0.76rem;">${currentTest.resultingFdStr}</span> (Extraneous attribute removed)`
                        : `<code>${currentTest.fdStr}</code> (Retained unchanged)`
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Expandable Steps for the Closure Calculation -->
            <details class="fd-steps-details" style="margin-bottom:0.6rem;">
              <summary>
                <span>Step-by-Step Derivation of Closure (${currentTest.side === 'left' ? `(${currentTest.testSetStr})⁺` : `(${currentTest.testSetStr})⁺ under F'`})</span>
              </summary>
              <div class="fd-steps-body">
                <table class="fd-table" style="margin-top:0;">
                  <thead>
                    <tr>
                      <th style="width: 50px;">Step</th>
                      <th style="width: 140px;">Rule / FD Applied</th>
                      <th>Reason / Explanation</th>
                      <th style="width: 140px;">Current Closure</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${currentTest.closureSteps.map(s => `
                      <tr>
                        <td><b>${s.step}</b></td>
                        <td><code>${s.rule}</code></td>
                        <td>${s.reason}</td>
                        <td><code>{ ${s.current.join(', ')} }</code></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </details>
          `;
        }
      } else if (activeTab === 'equivalence') {
        const isMulti = p.hasMultipleSets;
        const set1 = isMulti ? p.f1Fds : p.fds;
        const set2 = isMulti ? p.f2Fds : [];

        if (!isMulti || set2.length === 0) {
          contentHtml = `
            <div class="fd-card-box" style="margin-bottom:0.6rem;">
              <div style="font-weight:700;font-size:0.92rem;color:var(--fd-text-main);margin-bottom:4px;">
                Equivalence of Functional Dependencies (F₁ ≡ F₂)
              </div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.45;">
                Two sets of functional dependencies <b>F₁</b> and <b>F₂</b> are <b>equivalent</b> if and only if they generate the exact same closure: <code>F₁⁺ = F₂⁺</code>.
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;margin-top:0.5rem;">
                <div style="padding:0.4rem 0.5rem;background:var(--fd-bg-subtle);border-radius:4px;border:1px solid var(--fd-border-color);font-size:0.73rem;">
                  <b>1. F₁ covers F₂ (F₂ ⊆ F₁⁺):</b> For every <code>X → Y</code> in F₂, compute <code>X⁺</code> under F₁. If <code>X⁺</code> contains Y, F₁ covers F₂.
                </div>
                <div style="padding:0.4rem 0.5rem;background:var(--fd-bg-subtle);border-radius:4px;border:1px solid var(--fd-border-color);font-size:0.73rem;">
                  <b>2. F₂ covers F₁ (F₁ ⊆ F₂⁺):</b> For every <code>X → Y</code> in F₁, compute <code>X⁺</code> under F₂. If <code>X⁺</code> contains Y, F₂ covers F₁.
                </div>
              </div>
            </div>

            <div class="fd-card-box" style="border-left:3px solid var(--fd-primary);">
              <div style="font-weight:700;font-size:0.86rem;margin-bottom:4px;">
                How to Test Two Sets for Equivalence:
              </div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.5;">
                Click <b>Edit</b> above and define two sets using <code>F1:</code> and <code>F2:</code>:
              </div>
              <pre style="margin-top:0.4rem;padding:0.45rem 0.6rem;background:var(--fd-bg-subtle);border-radius:4px;font-size:0.76rem;line-height:1.4;"><code>R(P, Q, R)
F1:
P -> Q
Q -> R
R -> P

F2:
P -> R
Q -> R
R -> Q</code></pre>
            </div>
          `;
        } else {
          const equiv = evaluateEquivalence(set1, set2, p.attributes, 'F₁', 'F₂');

          contentHtml = `
            <!-- Top Status Card -->
            <div class="fd-card-box" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.4rem;margin-bottom:0.6rem;">
              <div>
                <span style="font-weight:700;font-size:0.92rem;">
                  Equivalence Test: ${equiv.isEquivalent ? 'F₁ is Equivalent to F₂ (F₁ ≡ F₂) ✓' : 'F₁ is NOT Equivalent to F₂ (F₁ ≢ F₂) ✗'}
                </span>
                <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-top:2px;">
                  Testing bidirectional covering: F₁ covers F₂ (F₂ ⊆ F₁⁺) and F₂ covers F₁ (F₁ ⊆ F₂⁺).
                </div>
              </div>
              <span class="fd-badge ${equiv.isEquivalent ? 'pass' : 'fail'}">
                ${equiv.isEquivalent ? 'Equivalent (F₁ ≡ F₂) ✓' : 'Not Equivalent ✗'}
              </span>
            </div>

            <!-- Set Summary -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.6rem;margin-bottom:0.6rem;">
              <div class="fd-card-box" style="margin-bottom:0;">
                <span style="font-size:0.76rem;font-weight:700;color:var(--fd-primary);">Set F₁:</span>
                <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.35rem;">
                  ${set1.map(f => `<span class="fd-badge">${formatFD(f)}</span>`).join('')}
                </div>
              </div>
              <div class="fd-card-box" style="margin-bottom:0;">
                <span style="font-size:0.76rem;font-weight:700;color:var(--fd-success-text);">Set F₂:</span>
                <div style="display:flex;flex-wrap:wrap;gap:0.3rem;margin-top:0.35rem;">
                  ${set2.map(f => `<span class="fd-badge">${formatFD(f)}</span>`).join('')}
                </div>
              </div>
            </div>

            <!-- Part 1: F1 covers F2 -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;border-left:3px solid ${equiv.f1CoversF2 ? 'var(--fd-success-text)' : 'var(--fd-danger-text)'};">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.3rem;margin-bottom:4px;">
                <span style="font-weight:700;font-size:0.84rem;">
                  Part 1: Check if F₁ covers F₂ (F₂ ⊆ F₁⁺)
                </span>
                <span class="fd-badge ${equiv.f1CoversF2 ? 'pass' : 'fail'}">
                  ${equiv.f1CoversF2 ? 'F₁ covers F₂ ✓' : 'F₁ does NOT cover F₂ ✗'}
                </span>
              </div>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-bottom:0.35rem;">
                Taking closure under F₁ for the LHS of each dependency in F₂:
              </div>
              <table class="fd-table">
                <thead>
                  <tr>
                    <th style="width: 120px;">FD in F₂</th>
                    <th style="width: 160px;">Closure Under F₁</th>
                    <th style="width: 90px;">Satisfied?</th>
                    <th>Reason / Verification</th>
                  </tr>
                </thead>
                <tbody>
                  ${equiv.f1CoversF2Checks.map(c => `
                    <tr>
                      <td><b>${c.fdStr}</b></td>
                      <td><code>(${c.leftStr})⁺ = { ${c.closureUnderOther.join(', ')} }</code></td>
                      <td><span class="fd-badge ${c.isSatisfied ? 'pass' : 'fail'}">${c.isSatisfied ? 'Yes ✓' : 'No ✗'}</span></td>
                      <td>${c.reason}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Part 2: F2 covers F1 -->
            <div class="fd-card-box" style="margin-bottom:0.6rem;border-left:3px solid ${equiv.f2CoversF1 ? 'var(--fd-success-text)' : 'var(--fd-danger-text)'};">
              <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.3rem;margin-bottom:4px;">
                <span style="font-weight:700;font-size:0.84rem;">
                  Part 2: Check if F₂ covers F₁ (F₁ ⊆ F₂⁺)
                </span>
                <span class="fd-badge ${equiv.f2CoversF1 ? 'pass' : 'fail'}">
                  ${equiv.f2CoversF1 ? 'F₂ covers F₁ ✓' : 'F₂ does NOT cover F₁ ✗'}
                </span>
              </div>
              <div style="font-size:0.76rem;color:var(--fd-text-muted);margin-bottom:0.35rem;">
                Taking closure under F₂ for the LHS of each dependency in F₁:
              </div>
              <table class="fd-table">
                <thead>
                  <tr>
                    <th style="width: 120px;">FD in F₁</th>
                    <th style="width: 160px;">Closure Under F₂</th>
                    <th style="width: 90px;">Satisfied?</th>
                    <th>Reason / Verification</th>
                  </tr>
                </thead>
                <tbody>
                  ${equiv.f2CoversF1Checks.map(c => `
                    <tr>
                      <td><b>${c.fdStr}</b></td>
                      <td><code>(${c.leftStr})⁺ = { ${c.closureUnderOther.join(', ')} }</code></td>
                      <td><span class="fd-badge ${c.isSatisfied ? 'pass' : 'fail'}">${c.isSatisfied ? 'Yes ✓' : 'No ✗'}</span></td>
                      <td>${c.reason}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Part 3: Final Conclusion -->
            <div class="fd-card-box" style="margin-top:0.65rem;border-left:3px solid ${equiv.isEquivalent ? 'var(--fd-success-text)' : 'var(--fd-danger-text)'};">
              <div style="font-size:0.75rem;font-weight:700;color:var(--fd-text-main);margin-bottom:2px;">Conclusion:</div>
              <div style="font-size:0.78rem;color:var(--fd-text-muted);line-height:1.45;">${equiv.explanation}</div>
            </div>
          `;
        }
      }

      outputContainer.innerHTML = `
        <div class="fd-runner-status-bar">
          <div style="display:flex;align-items:center;gap:0.75rem;">
          </div>
          <button class="fd-runner-close-btn" title="Close Output" aria-label="Close Output">${ICONS.close} Close</button>
        </div>
        ${contentHtml}
      `;

      const closeBtn = outputContainer.querySelector('.fd-runner-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          outputContainer.style.display = 'none';
        });
      }

      outputContainer.querySelectorAll('.fd-closure-pills .fd-attr-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const attr = btn.dataset.attr;
          if (selectedAttrs.has(attr)) {
            if (selectedAttrs.size > 1) {
              selectedAttrs.delete(attr);
            }
          } else {
            selectedAttrs.add(attr);
          }
          p.query = Array.from(selectedAttrs).join('');
          renderResults();
        });
      });

      outputContainer.querySelectorAll('.fd-extraneous-fd-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const idx = parseInt(btn.dataset.fdIdx, 10);
          if (!isNaN(idx)) {
            selectedExtraneousFdIdx = idx;
            selectedExtraneousAttr = null;
            renderResults();
          }
        });
      });

      outputContainer.querySelectorAll('.fd-extraneous-attr-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const attr = btn.dataset.attr;
          const side = btn.dataset.side;
          if (attr && side) {
            selectedExtraneousAttr = attr;
            selectedExtraneousSide = side;
            renderResults();
          }
        });
      });
    }
  }

  function scanAndInit() {
    ensureCSSLoaded();

    // Select all potential code elements generated by Quarto for {.fd} and {.normalization}
    const selectors = [
      'pre.normalization > code',
      'pre.fd > code',
      'div.normalization pre > code',
      'div.fd pre > code',
      'div[data-check] pre > code',
      'div[check] pre > code',
      'pre[data-check] > code',
      'pre[check] > code',
      'div[data-compute] pre > code',
      'div[compute] pre > code',
      'pre[data-compute] > code',
      'pre[compute] > code',
      'code.sourceCode.normalization',
      'code.sourceCode.fd',
      'code.normalization',
      'code.fd'
    ];

    const codeElements = document.querySelectorAll(selectors.join(', '));
    codeElements.forEach(codeEl => {
      const scaffold = codeEl.closest('.code-copy-outer-scaffold') || codeEl.closest('.sourceCode') || codeEl.closest('pre');
      if (scaffold && !scaffold.dataset.fdRunnerInit) {
        setupFDBlock(scaffold, codeEl);
      }
    });

    // Fallback: scan all pre or div elements with normalization or fd or check markers
    document.querySelectorAll('pre.normalization, pre.fd, pre[data-check], pre[check], div[data-check], div[check]').forEach(el => {
      const code = el.querySelector('code');
      if (code) {
        const scaffold = code.closest('.code-copy-outer-scaffold') || code.closest('.sourceCode') || code.closest('pre') || el;
        if (scaffold && !scaffold.dataset.fdRunnerInit) {
          setupFDBlock(scaffold, code);
        }
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAndInit);
  } else {
    scanAndInit();
  }

  setTimeout(scanAndInit, 300);
  setTimeout(scanAndInit, 1000);
})();
