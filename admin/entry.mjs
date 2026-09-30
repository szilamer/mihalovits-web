import { init } from "@sveltia/cms";

// Sveltia names its sign-in button after the backend, but the window it opens asks for the editor's
// own name and password (public/oauth/auth.php) – no GitHub account involved.
const LABELS = new Map([["Sign In with GitHub", "Belépés"]]);

// Sveltia wraps interpolated values in Unicode isolation marks: "Sign In with \u2068GitHub\u2069".
const relabelText = (node) => {
  const label = LABELS.get(node.data.replace(/[\u2066-\u2069]/g, "").trim());
  if (label) node.data = label;
};

const relabelTree = (node) => {
  if (node.nodeType === Node.TEXT_NODE) {
    relabelText(node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) relabelText(walker.currentNode);
  }
};

new MutationObserver((records) => {
  for (const record of records) {
    if (record.type === "characterData") relabelText(record.target);
    else record.addedNodes.forEach(relabelTree);
  }
}).observe(document.body, { childList: true, characterData: true, subtree: true });

init();
