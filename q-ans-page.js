// q-ans-page.js
// Google Programmable Search Engine
// CX ID: 446c9ee6bde6a4643

const CX_ID = '446c9ee6bde6a4643';

const params = new URLSearchParams(location.search);
const query = params.get('q') || 'Tokyo';
const inputBox = document.querySelector("#q");
if (inputBox) inputBox.value = query;

let currentSearchType = 'all';

// Create or reuse results container
function createResultsContainer() {
    let container = document.getElementById('results-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'results-container';
        container.style.width = '100vw';
        container.style.minHeight = 'calc(100vh - 16vh)';
        container.style.marginTop = '16vh';
        container.style.padding = '20px';
        container.style.boxSizing = 'border-box';
        document.body.appendChild(container);
    }
    return container;
}

function loadResults(searchType) {
    currentSearchType = searchType;
    const searchQuery = (inputBox ? inputBox.value : query).trim();
    const container = createResultsContainer();

    if (!searchQuery) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:red;">Please enter a search term</div>';
        return;
    }

    // Remove old CSE script if present
    const oldScript = document.getElementById('cse-script');
    if (oldScript) oldScript.remove();

    // Remove old google CSE globals so it re-initializes cleanly
    if (window.google && window.google.search) {
        try { delete window.google.search; } catch(e) {}
    }

    // Set __gcse callback BEFORE loading script
    window.__gcse = {
        parsetags: 'explicit',
        callback: function() {
            const gname = 'searchResults';
            const isImage = searchType === 'image';

            // For image tab: use data-searchtype="image" attribute on the div
            const inner = document.getElementById('cse-inner');
            if (inner && isImage) {
                inner.setAttribute('data-searchtype', 'image');
            }

            google.search.cse.element.render({
                div: 'cse-inner',
                tag: 'searchresults-only',
                gname: gname,
                attributes: {
                    enableOrderBy: true,
                    // tells CSE to start on image refinement when true
                    ...(isImage && { defaultToImageSearch: true })
                }
            });

            setTimeout(function() {
                const el = google.search.cse.element.getElement(gname);
                if (el) {
                    if (isImage) {
                        // Execute with image refinement label
                        el.execute(searchQuery, { searchtype: 'image' });
                    } else {
                        el.execute(searchQuery);
                    }
                }
            }, 100);
        }
    };

    // Rebuild inner container fresh every time
    // For image tab pre-set the searchtype attribute
    const innerDiv = searchType === 'image'
        ? '<div id="cse-inner" data-searchtype="image"></div>'
        : '<div id="cse-inner"></div>';
    container.innerHTML = innerDiv;

    // Load CSE script fresh
    const script = document.createElement('script');
    script.id = 'cse-script';
    script.src = 'https://cse.google.com/cse.js?cx=' + CX_ID;
    script.async = true;
    document.head.appendChild(script);
}

function loadAllSearch()   { loadResults('all');   }
function loadImageSearch() { loadResults('image'); }
function loadVideoSearch() { loadResults('video'); }
function loadNewsSearch()  { loadResults('news');  }

document.addEventListener('DOMContentLoaded', function () {
    const allTab   = document.getElementById('all');
    const imageTab = document.getElementById('image');
    const videoTab = document.getElementById('video');
    const newsTab  = document.getElementById('news');

    function updateActiveTab(activeButton) {
        document.querySelectorAll('.tabs button').forEach(btn => {
            btn.style.background = '';
            btn.style.color = '';
            btn.style.border = '0.1vh solid blue';
        });
        activeButton.style.background = '#007bff';
        activeButton.style.color = 'white';
        activeButton.style.border = '0.1vh solid white';
    }

    if (allTab)   allTab.addEventListener('click',   () => { loadAllSearch();   updateActiveTab(allTab);   });
    if (imageTab) imageTab.addEventListener('click', () => { loadImageSearch(); updateActiveTab(imageTab); });
    if (videoTab) videoTab.addEventListener('click', () => { loadVideoSearch(); updateActiveTab(videoTab); });
    if (newsTab)  newsTab.addEventListener('click',  () => { loadNewsSearch();  updateActiveTab(newsTab);  });

    if (allTab) updateActiveTab(allTab);

    // Auto-load on page open
    loadAllSearch();
});
