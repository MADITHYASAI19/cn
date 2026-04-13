/**
 * doubts.js - NPTEL Doubts Tracking System
 * Global script injected into all pages.
 */

(function () {
    const STORAGE_KEY = 'nptel_doubts';
    let doubts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    let currentSelection = null;
    
    // ── DOM ELEMENTS ──
    let tooltip, overlay, panel, fab, fabBadge;

    function init() {
        createUIElements();
        attachEventListeners();
        restoreHighlights();
        updateFAB();

        // If on home page, render the hub
        if (document.getElementById('doubtsView')) {
            renderDoubtsHub();
        }
    }

    // ── UI CREATION ──
    function createUIElements() {
        // Tooltip
        tooltip = document.createElement('div');
        tooltip.className = 'dbt-tooltip';
        tooltip.innerText = '📌 Mark Doubt';
        document.body.appendChild(tooltip);

        // Overlay & Panel
        overlay = document.createElement('div');
        overlay.className = 'dbt-panel-overlay';
        
        panel = document.createElement('div');
        panel.className = 'dbt-panel';
        panel.innerHTML = `
            <div class="dbt-panel-header">
                <div class="dbt-panel-title">📌 Save Doubt</div>
                <button class="dbt-panel-close">&times;</button>
            </div>
            <div class="dbt-panel-content">
                <div class="dbt-selected-text-box" id="dbtSelectedText"></div>
                
                <div class="dbt-input-group">
                    <label>Your Note / Question</label>
                    <textarea class="dbt-textarea" id="dbtNoteInput" placeholder="What's confusing you about this?"></textarea>
                </div>
                
                <div class="dbt-input-group">
                    <label>Tags (comma separated)</label>
                    <input type="text" class="dbt-input" id="dbtTagsInput" placeholder="e.g. formula, urgent, exam">
                </div>
            </div>
            <div class="dbt-panel-footer">
                <button class="dbt-btn dbt-btn-outline" id="dbtCancelBtn">Cancel</button>
                <button class="dbt-btn dbt-btn-primary" id="dbtSaveBtn">Save Doubt</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.appendChild(panel);

        // Floating Action Button
        fab = document.createElement('button');
        fab.className = 'dbt-fab';
        fab.innerHTML = '📌';
        fab.title = 'View all doubts';
        
        fabBadge = document.createElement('div');
        fabBadge.className = 'dbt-fab-badge dbt-hidden';
        fab.appendChild(fabBadge);
        document.body.appendChild(fab);
    }

    // ── EVENT LISTENERS ──
    function attachEventListeners() {
        document.addEventListener('mouseup', handleSelection);
        document.addEventListener('keyup', (e) => {
            if (e.key === 'd' || e.key === 'D') {
                const sel = window.getSelection();
                if (!sel.isCollapsed && sel.toString().trim().length > 0) {
                    showPanel();
                }
            }
        });

        tooltip.addEventListener('click', (e) => {
            e.stopPropagation();
            showPanel();
        });

        // Panel controls
        overlay.addEventListener('click', closePanel);
        panel.querySelector('.dbt-panel-close').addEventListener('click', closePanel);
        document.getElementById('dbtCancelBtn').addEventListener('click', closePanel);
        document.getElementById('dbtSaveBtn').addEventListener('click', saveDoubt);

        // FAB
        fab.addEventListener('click', () => {
            // Navigate to home page doubts section
            const isHome = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
            if (isHome) {
                // If already on home, scroll to doubts or trigger doubts view
                if(typeof showDoubtsView === 'function') showDoubtsView();
                else {
                   const dv = document.getElementById('doubtsView');
                   if(dv) dv.scrollIntoView({behavior: 'smooth'});
                }
            } else {
                window.location.href = 'index.html?view=doubts';
            }
        });

        // Handle flash navigation
        window.addEventListener('load', () => {
            const urlParams = new URLSearchParams(window.location.search);
            const doubtId = urlParams.get('flashDoubt');
            if (doubtId) {
                setTimeout(() => flashHighlight(doubtId), 500);
            }
        });
    }

    // ── SELECTION LOGIC ──
    function handleSelection(e) {
        if (panel.classList.contains('show')) return;
        
        const sel = window.getSelection();
        const text = sel.toString().trim();

        if (text.length > 0 && !e.target.closest('.dbt-panel') && !e.target.closest('.dbt-fab')) {
            const range = sel.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            // Save context
            currentSelection = {
                text: text,
                xpath: getXPathForElement(range.startContainer.parentElement),
                offset: range.startOffset
            };

            // Calculate Tooltip position correctly considering scroll
            const top = rect.top + window.scrollY;
            const left = rect.left + window.scrollX + (rect.width / 2);

            tooltip.style.left = left + 'px';
            tooltip.style.top = top + 'px';
            tooltip.classList.add('show');
        } else {
            if (!e.target.closest('.dbt-tooltip')) {
                tooltip.classList.remove('show');
            }
        }
    }

    // ── PANEL LOGIC ──
    function showPanel() {
        if (!currentSelection || !currentSelection.text) return;
        
        tooltip.classList.remove('show');
        document.getElementById('dbtSelectedText').innerText = `"${currentSelection.text}"`;
        document.getElementById('dbtNoteInput').value = '';
        document.getElementById('dbtTagsInput').value = '';
        
        overlay.classList.add('show');
        panel.classList.add('show');
        setTimeout(() => document.getElementById('dbtNoteInput').focus(), 300);
    }

    function closePanel() {
        overlay.classList.remove('show');
        panel.classList.remove('show');
        window.getSelection().removeAllRanges();
    }

    // ── DATA MANAGEMENT ──
    function saveDoubt() {
        const note = document.getElementById('dbtNoteInput').value.trim();
        const tagsStr = document.getElementById('dbtTagsInput').value.trim();
        const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

        // Check duplicates
        const isDupe = doubts.some(d => d.text === currentSelection.text && d.url === window.location.pathname);
        if (isDupe && !confirm("You have already marked this exact text. Save again?")) {
            closePanel();
            return;
        }

        const newDoubt = {
            id: 'doubt_' + Date.now() + Math.random().toString(36).substr(2, 5),
            text: currentSelection.text,
            note: note,
            tags: tags,
            url: window.location.pathname.split('/').pop() || 'index.html',
            pageTitle: document.title.split('—')[0].trim() || 'Untitled Page',
            xpath: currentSelection.xpath,
            timestamp: Date.now(),
            resolved: false
        };

        doubts.push(newDoubt);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
        
        closePanel();
        updateFAB();
        applyHighlight(newDoubt);
    }

    function updateFAB() {
        const activeDoubts = doubts.filter(d => !d.resolved).length;
        if (activeDoubts > 0) {
            fabBadge.innerText = activeDoubts > 99 ? '99+' : activeDoubts;
            fabBadge.classList.remove('dbt-hidden');
        } else {
            fabBadge.classList.add('dbt-hidden');
        }
    }

    // ── HIGHLIGHTING ──
    function getXPathForElement(el) {
        if (el.id !== '') return 'id("' + el.id + '")';
        if (el === document.body) return el.tagName;

        let ix = 0;
        let siblings = el.parentNode.childNodes;
        for (let i = 0; i < siblings.length; i++) {
            let sibling = siblings[i];
            if (sibling === el) return getXPathForElement(el.parentNode) + '/' + el.tagName + '[' + (ix + 1) + ']';
            if (sibling.nodeType === 1 && sibling.tagName === el.tagName) ix++;
        }
    }

    function getElementByXPath(path) {
        try {
            return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        } catch(e) {
            return null;
        }
    }

    function restoreHighlights() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const pageDoubts = doubts.filter(d => d.url === currentPage);
        
        pageDoubts.forEach(applyHighlight);
    }

    function applyHighlight(doubt) {
        if (!doubt.xpath || doubt.resolved) return;
        
        // Simple fallback: If exact xpath fails, we just don't highlight or we could use text-search.
        // Doing proper robust text-range highlighting is complex; we'll wrap the parent element or find the text.
        const el = getElementByXPath(doubt.xpath);
        if (el) {
            // Basic implementation: we'll just add a class to the container for now,
            // or if it's text, we can do a innerHTML replace (risky for event listeners).
            // Since this is a static site, innerHTML replace is fast but might break tooltips.
            // A safer robust way: wrapping text nodes.
            highlightTextInNode(el, doubt.text, doubt.id);
        }
    }

    function highlightTextInNode(node, text, id) {
        // Very basic text replacement mechanism
        if (node.nodeType === 3) {
            const index = node.nodeValue.indexOf(text);
            if (index >= 0) {
                const mark = document.createElement('mark');
                mark.className = 'dbt-mark';
                mark.id = id;
                mark.title = "Click to view doubt";
                mark.onclick = () => window.location.href = `index.html?view=doubts&flash=${id}`;
                
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + text.length);
                range.surroundContents(mark);
                return;
            }
        } else if (node.nodeType === 1 && node.childNodes && node.tagName !== 'MARK' && node.tagName !== 'SCRIPT') {
            for (let i = 0; i < node.childNodes.length; i++) {
                highlightTextInNode(node.childNodes[i], text, id);
            }
        }
    }

    function flashHighlight(id) {
        const mark = document.getElementById(id);
        if (mark) {
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
            mark.classList.add('flash');
            setTimeout(() => mark.classList.remove('flash'), 2000);
        }
    }

    // ── HUB RENDERING (FOR INDEX.HTML) ──
    window.renderDoubtsHub = function() {
        const container = document.getElementById('doubtsView');
        if (!container) return;

        const total = doubts.length;
        const resolvedCount = doubts.filter(d => d.resolved).length;
        const activeCount = total - resolvedCount;

        let html = `
            <div class="doubts-hub-header">
                <div>
                    <h2 class="section-title" style="margin-bottom:0">💭 Your Doubts Hub</h2>
                    <p style="color:var(--text-dim);font-size:0.9rem;">Review and resolve your marked confusions.</p>
                </div>
                <div class="doubts-hub-stats">
                    <div class="dh-stat">
                        <span class="dh-val">${total}</span>
                        <span class="dh-lbl">Total</span>
                    </div>
                    <div class="dh-stat">
                        <span class="dh-val" style="color:var(--red)">${activeCount}</span>
                        <span class="dh-lbl">Active</span>
                    </div>
                    <div class="dh-stat">
                        <span class="dh-val" style="color:var(--green)">${resolvedCount}</span>
                        <span class="dh-lbl">Resolved</span>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="exportDoubts()">📥 Export JSON</button>
                </div>
            </div>
        `;

        if (total === 0) {
            html += `<div class="not-available-msg"><span>You haven't marked any doubts yet. Highlight text on any notes page to start!</span></div>`;
        } else {
            html += `<div class="doubts-grid">`;
            
            // Sort: unresolved first, newest first
            const sortedDoubts = [...doubts].sort((a, b) => {
                if (a.resolved === b.resolved) return b.timestamp - a.timestamp;
                return a.resolved ? 1 : -1;
            });

            sortedDoubts.forEach(d => {
                const date = new Date(d.timestamp).toLocaleDateString('en-US', {month:'short', day:'numeric'});
                const tagsHtml = d.tags && d.tags.length > 0 
                    ? `<div class="dc-tags">${d.tags.map(t => `<span class="dc-tag">#${t}</span>`).join('')}</div>` 
                    : '';
                
                html += `
                    <div class="doubt-card ${d.resolved ? 'resolved' : ''}">
                        <div class="dc-header">
                            <a href="${d.url}" class="dc-page">${d.pageTitle}</a>
                            <span class="dc-date">${date}</span>
                        </div>
                        <div class="dc-quote">"${d.text}"</div>
                        <div class="dc-note">${d.note || '<span style="color:var(--text-muted);font-style:italic">No additional notes</span>'}</div>
                        ${tagsHtml}
                        <div class="dc-actions">
                            <button class="dc-btn resolve" onclick="toggleResolveDoubt('${d.id}')">
                                ${d.resolved ? '↩ Re-open' : '✓ Resolve'}
                            </button>
                            <button class="dc-btn delete" onclick="deleteDoubt('${d.id}')">🗑 Delete</button>
                            <a href="${d.url}?flashDoubt=${d.id}" class="dc-btn nav-btn">Jump to text →</a>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;
    };

    window.toggleResolveDoubt = function(id) {
        doubts = doubts.map(d => d.id === id ? {...d, resolved: !d.resolved} : d);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
        if(window.renderDoubtsHub) window.renderDoubtsHub();
        updateFAB();
    };

    window.deleteDoubt = function(id) {
        if(confirm("Are you sure you want to delete this doubt?")) {
            doubts = doubts.filter(d => d.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(doubts));
            if(window.renderDoubtsHub) window.renderDoubtsHub();
            updateFAB();
        }
    };

    window.exportDoubts = function() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(doubts, null, 2));
        const element = document.createElement('a');
        element.setAttribute("href", dataStr);
        element.setAttribute("download", "nptel_doubts_backup.json");
        document.body.appendChild(element);
        element.click();
        element.remove();
    };

    // Initialize on load
    document.addEventListener('DOMContentLoaded', init);

})();
