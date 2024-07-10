document.getElementById("init").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => {
        document.querySelectorAll(".read-read").forEach((el) => el.remove());
        unwrapSpan(".span-wrap");
      },
    });
  });
});

document.getElementById("run").addEventListener("click", () => {
  const s = performance.now();
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ["src/content.js"],
    });
    document.getElementById("timer").textContent =
      Math.round((performance.now() - s) * 100) / 100 + "ms";
    googleTranslateElementInit();
  });
});

chrome.runtime.onMessage.addListener(function (message) {
  console.log({ message });
  if (message.type === "textNodes") {
    let dataFromContent = message.data;
    dataFromContent = dataFromContent.map((v, i) => {
      return JSON.stringify([i + 1, v, checkNoWhitespace(v) ? "=1" : ">1"]);
    });
    document.getElementById("result").innerHTML = [
      dataFromContent.length,
      dataFromContent.join("<br>"),
    ].join("<br>");
  }
});

function googleTranslateElementInit() {
  new google.translate.TranslateElement(
    {
      pageLanguage: "en", // 페이지 기본 언어 설정
      includedLanguages: "en,ko", // 포함할 언어 설정
      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
    },
    "google_translate_element"
  );
}

function checkNoWhitespace(str) {
  return /^\S+$/.test(str);
}

function unwrapSpan(selector) {
  const spans = document.querySelectorAll(selector);

  spans.forEach((span) => {
    const parent = span.parentNode;

    while (span.firstChild) {
      parent.insertBefore(span.firstChild, span);
    }

    parent.removeChild(span);
  });
}
