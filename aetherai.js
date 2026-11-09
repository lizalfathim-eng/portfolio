const data = window.AETHERAI_DATA;
const FIXED_TOP_K = data.fixedTopK;
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-query");
const searchStatus = document.querySelector("#search-status");
const resultsRegion = document.querySelector("#search-results");
const comparisonToggle = document.querySelector("#compare-toggle");
const comparisonPanel = document.querySelector("#comparison-panel");
const keywordResults = document.querySelector("#keyword-results");
const hybridResults = document.querySelector("#hybrid-results");
const previewSection = document.querySelector("#document-preview");
const previewContent = document.querySelector("#preview-content");
const previewBack = document.querySelector("#preview-back");
let latestResults = null;
let returnFocusElement = null;

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "been", "being", "but",
  "by", "can", "could", "did", "do", "does", "for", "from", "get", "how",
  "i", "in", "into", "is", "it", "may", "might", "must", "of", "on", "or",
  "should", "that", "the", "their", "there", "these", "this", "to", "was",
  "were", "what", "when", "where", "which", "who", "will", "with", "would"
]);

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function tokenize(value) {
  return value.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function normalizePhrase(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function queryTerms(query) {
  return [...new Set(tokenize(query).filter((term) => !STOP_WORDS.has(term)))];
}

function getSemanticConcepts(query) {
  const normalized = normalizePhrase(query);
  const terms = new Set(queryTerms(query));
  return data.concepts.flatMap((concept) => {
    const matched = concept.terms.filter((term) => {
      if (term.includes(" ")) return ` ${normalized} `.includes(` ${term} `);
      return terms.has(term);
    });
    return matched.length ? [{ id: concept.id, matched }] : [];
  });
}

function getDocumentTerms(document) {
  return new Set(tokenize(`${document.title} ${document.category} ${document.text}`));
}

function getScores(query, document, matchedConcepts) {
  const terms = queryTerms(query);
  const indexedTerms = getDocumentTerms(document);
  const matchedTerms = terms.filter((term) => indexedTerms.has(term));
  const keywordScore = terms.length ? matchedTerms.length / terms.length : 0;
  const matchingConcept = matchedConcepts.find((concept) => concept.id === document.topic);
  const semanticScore = matchingConcept
    ? Math.min(0.94, 0.62 + 0.055 * (matchingConcept.matched.length - 1))
    : 0;
  const exactPhraseMatch = document.text.toLowerCase().includes(query.trim().toLowerCase());

  return {
    matchedTerms,
    keywordScore,
    semanticScore,
    exactPhraseMatch,
    matchingConcept
  };
}

function keywordOnlySearch(query) {
  const terms = queryTerms(query);
  if (!terms.length) return [];

  return data.documents
    .map((document) => {
      const indexedTerms = getDocumentTerms(document);
      const matchedTerms = terms.filter((term) => indexedTerms.has(term));
      return {
        document,
        matchedTerms,
        keywordScore: matchedTerms.length / terms.length
      };
    })
    .filter((result) => result.matchedTerms.length > 0)
    .sort((left, right) =>
      right.keywordScore - left.keywordScore ||
      right.matchedTerms.length - left.matchedTerms.length ||
      left.document.id.localeCompare(right.document.id)
    )
    .slice(0, FIXED_TOP_K);
}

function hybridSearch(query) {
  const concepts = getSemanticConcepts(query);
  return data.documents
    .map((document) => {
      const scores = getScores(query, document, concepts);
      const conceptMatched = concepts.some((concept) => concept.id === document.topic);
      const keywordBoost = scores.matchedTerms.length > 0 && scores.exactPhraseMatch ? 0.1 : 0;
      return {
        document,
        ...scores,
        conceptMatched,
        keywordBoost,
        hybridScore: (conceptMatched ? scores.semanticScore : 0) + keywordBoost
      };
    })
    .filter((result) => result.conceptMatched || keywordCandidateFor(result))
    .sort((left, right) =>
      right.hybridScore - left.hybridScore ||
      right.keywordScore - left.keywordScore ||
      left.document.id.localeCompare(right.document.id)
    )
    .slice(0, FIXED_TOP_K);
}

function keywordCandidateFor(result) {
  return result.matchedTerms.length > 0 && result.exactPhraseMatch;
}

function formattedScore(value) {
  return value.toFixed(3);
}

function search(query) {
  const keyword = keywordOnlySearch(query);
  const hybrid = hybridSearch(query);
  latestResults = { query, keyword, hybrid };
  comparisonToggle.disabled = false;
  comparisonPanel.hidden = true;
  comparisonToggle.setAttribute("aria-expanded", "false");
  comparisonToggle.innerHTML = 'COMPARE KEYWORD-ONLY <span aria-hidden="true">＋</span>';
  previewSection.hidden = true;
  resultsRegion.hidden = false;
  renderPrimaryResults();
  renderComparisonResults();

  const concepts = getSemanticConcepts(query);
  if (hybrid.length) {
    searchStatus.textContent = `${hybrid.length} DOCUMENT${hybrid.length === 1 ? "" : "S"} RETRIEVED · FIXED TOP-${FIXED_TOP_K} · ${concepts.length} CURATED CONCEPT${concepts.length === 1 ? "" : "S"} MATCHED`;
  } else if (keyword.length) {
    searchStatus.textContent = `NO HYBRID MATCH · ${keyword.length} KEYWORD-ONLY MATCH${keyword.length === 1 ? "" : "ES"} · OPEN THE COMPARISON`;
  } else {
    searchStatus.textContent = "NO DOCUMENTS MATCHED · TRY A DIFFERENT KEYWORD OR EXAMPLE QUERY";
  }
}

function renderPrimaryResults() {
  resultsRegion.replaceChildren();
  if (!latestResults.hybrid.length) {
    const empty = element("div", "results-empty");
    empty.append(
      element("span", "empty-cross", "+"),
      element("p", "mono", "NO SAMPLE DOCUMENTS MATCHED THIS QUERY"),
      element("small", "", "Try one of the sample queries, or compare the keyword-only results.")
    );
    if (latestResults.keyword.length) {
      const compare = element("button", "inline-compare", "Show keyword-only matches");
      compare.type = "button";
      compare.addEventListener("click", showComparison);
      empty.append(compare);
    }
    resultsRegion.append(empty);
    return;
  }

  const list = element("div", "result-list");
  latestResults.hybrid.forEach((result, index) => list.append(renderSearchResult(result, index)));

  const emptyPreview = element("aside", "preview-placeholder");
  emptyPreview.append(
    element("span", "preview-glyph", "↖"),
    element("p", "mono", "SELECT A RESULT"),
    element("small", "", "Open an indexed sample document preview.")
  );
  resultsRegion.append(list, emptyPreview);
}

function renderSearchResult(result, index, mode = "hybrid") {
  const document = result.document;
  const article = element("article", "result-row");
  const rank = element("span", "result-rank mono", String(index + 1).padStart(2, "0"));
  const main = element("div", "result-main");
  const openButton = element("button", "result-open", document.title);
  openButton.type = "button";
  openButton.addEventListener("click", () => openPreview(document, openButton));

  const metadata = element("div", "result-meta mono");
  [document.category.toUpperCase(), document.id, document.date].forEach((value) => {
    metadata.append(element("span", "", value));
  });
  main.append(openButton, metadata);

  const score = mode === "hybrid" ? result.hybridScore : result.keywordScore;
  const scoreBlock = element("div", "result-score");
  scoreBlock.append(
    element("span", "score-value mono", formattedScore(score)),
    element("span", "score-caption mono", mode === "hybrid" ? "HYBRID" : "KEYWORD")
  );

  const detail = element("details", "result-detail");
  const summary = element(
    "summary",
    "mono",
    mode === "hybrid" ? "INSPECT RANKING CONTRIBUTIONS" : "INSPECT KEYWORD MATCHES"
  );
  const breakdown = element("div", "result-breakdown");
  if (mode === "hybrid") {
    const semantic = result.conceptMatched ? result.semanticScore : 0;
    breakdown.append(
      makeScoreRow("SEMANTIC SIMULATION", semantic, formattedScore(semantic)),
      makeScoreRow("LITERAL COVERAGE · INFO", result.keywordScore, `${Math.round(result.keywordScore * 100)}%`),
      makeScoreRow("EXACT-QUERY BOOST", result.keywordBoost / 0.1, result.keywordBoost ? "+0.100" : "+0.000"),
      element(
        "p",
        "contribution-note",
        `Matched words: ${result.matchedTerms.join(", ") || "none"} · Curated query concepts: ${result.matchingConcept ? `${result.matchingConcept.id} (${result.matchingConcept.matched.join(", ")})` : "none"} · Similarity is illustrative, not model output.`
      )
    );
  } else {
    breakdown.append(
      element("p", "contribution-note", `${result.matchedTerms.length} of ${queryTerms(latestResults.query).length} query terms matched literally: ${result.matchedTerms.join(", ")}.`)
    );
  }
  detail.append(summary, breakdown);
  article.append(rank, main, scoreBlock, detail);
  return article;
}

function makeScoreRow(label, value, scoreLabel) {
  const row = element("div", "score-row");
  const track = element("span", "score-track");
  const fill = document.createElement("span");
  fill.style.width = `${Math.max(0, Math.min(value, 1)) * 100}%`;
  track.append(fill);
  row.append(element("span", "", label), track, element("span", "mono", scoreLabel));
  return row;
}

function renderComparisonResults() {
  keywordResults.replaceChildren();
  hybridResults.replaceChildren();

  if (!latestResults) return;
  const keyword = latestResults.keyword;
  const hybrid = latestResults.hybrid;
  if (!keyword.length) keywordResults.append(element("p", "comparison-empty", "No literal query terms matched."));
  if (!hybrid.length) hybridResults.append(element("p", "comparison-empty", "No sample concept matched."));

  keyword.forEach((result, index) => {
    keywordResults.append(renderComparisonItem(result.document, index, result.keywordScore, "KEYWORD"));
  });
  hybrid.forEach((result, index) => {
    hybridResults.append(renderComparisonItem(result.document, index, result.hybridScore, "HYBRID"));
  });
}

function renderComparisonItem(document, index, score, label) {
  const item = element("article", "comparison-item");
  const rank = element("span", "comparison-rank mono", String(index + 1).padStart(2, "0"));
  const body = element("div", "comparison-item-main");
  const open = element("button", "comparison-open", document.title);
  open.type = "button";
  open.addEventListener("click", () => openPreview(document, open));
  body.append(open, element("span", "mono", `${document.category.toUpperCase()} · ${document.id}`));
  item.append(rank, body, element("span", "comparison-score mono", formattedScore(score)));
  item.dataset.method = label.toLowerCase();
  return item;
}

function showComparison() {
  if (!latestResults) return;
  const isExpanded = comparisonToggle.getAttribute("aria-expanded") === "true";
  comparisonPanel.hidden = isExpanded;
  comparisonToggle.setAttribute("aria-expanded", String(!isExpanded));
  comparisonToggle.innerHTML = isExpanded
    ? 'COMPARE KEYWORD-ONLY <span aria-hidden="true">＋</span>'
    : 'HIDE COMPARISON <span aria-hidden="true">−</span>';
  if (!isExpanded) comparisonPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function openPreview(document, trigger) {
  returnFocusElement = trigger;
  const heading = element("h3", "", document.title);
  const metadata = element("div", "preview-meta mono");
  [document.category.toUpperCase(), document.id, document.date].forEach((value) => {
    metadata.append(element("span", "", value));
  });
  const content = element("p", "preview-text", document.text);
  previewContent.replaceChildren(heading, metadata, content);
  resultsRegion.hidden = true;
  comparisonPanel.hidden = true;
  previewSection.hidden = false;
  previewSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

previewBack.addEventListener("click", () => {
  previewSection.hidden = true;
  resultsRegion.hidden = false;
  if (comparisonToggle.getAttribute("aria-expanded") === "true") comparisonPanel.hidden = false;
  returnFocusElement?.focus();
});

comparisonToggle.addEventListener("click", showComparison);

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) search(query);
});

document.querySelectorAll("[data-query]").forEach((button) => {
  button.addEventListener("click", () => {
    searchInput.value = button.dataset.query;
    searchForm.requestSubmit();
  });
});
