document.querySelectorAll(".read-read").forEach((el) => el.remove());
unwrapSpan(".span-wrap");
duplicateAndGrayTextNodes();

// 텍스트 노드를 찾고 아래에 회색으로 복사하고 notranslate 클래스를 추가하는 함수
function duplicateAndGrayTextNodes() {
  const textNodes = getTextNodes();

  chrome.runtime.sendMessage({
    type: "textNodes",
    data: textNodes.map((node) => node.nodeValue.trim()),
  });

  textNodes.forEach((node) => {
    const parentElementStyle = getComputedStyle(node.parentNode);
    const oldLetterSpacing = parentElementStyle.letterSpacing;

    let newLetterSpacing;
    const size = +oldLetterSpacing.replace("px", "");
    if (oldLetterSpacing === "normal") {
      newLetterSpacing = "-0.5px";
    } else if (size < 0) {
      newLetterSpacing = `${size - 0.5}px`;
    } else {
      newLetterSpacing = oldLetterSpacing;
    }

    const textContent = node.nodeValue.trim();
    const sentences = splitSentences(textContent);

    sentences.reverse().forEach((sentence) => {
      if (sentence.length > 20) {
        const oldSpan = document.createElement("span");
        oldSpan.textContent = sentence;
        oldSpan.classList.add("span-wrap");
        node.parentNode.insertBefore(oldSpan, node.nextSibling);

        const newSpan = document.createElement("span");
        newSpan.textContent = sentence;
        newSpan.style.cssText = `
          opacity: 0.7;
          display: block;
          letter-spacing: ${newLetterSpacing};
        `;
        newSpan.classList.add("notranslate");
        newSpan.classList.add("read-read");
        node.parentNode.insertBefore(newSpan, node.nextSibling);
      } else {
        const oldSpan = document.createElement("span");
        oldSpan.textContent = sentence;
        oldSpan.classList.add("notranslate");
        oldSpan.classList.add("span-wrap");
        node.parentNode.insertBefore(oldSpan, node.nextSibling);
      }
    });
    node.remove();
  });
}

// 텍스트가 있는 모든 노드를 찾는 함수
function getTextNodes() {
  const excludedTags = [
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "META",
    "LINK",
  ];

  const iterator = document.createNodeIterator(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function (node) {
        const parentNode = node.parentNode;
        const v = node.nodeValue.trim();
        if (
          v &&
          countEnglishLetters(v) > 3 &&
          !확장자포함한단어인지(v) &&
          !closest(parentNode, "code") &&
          !excludedTags.includes(parentNode.nodeName) &&
          isVisible(parentNode)
        ) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      },
    }
  );

  let textNodes = [];
  let currentNode;

  while ((currentNode = iterator.nextNode())) {
    textNodes.push(currentNode);
  }

  return textNodes;
}

// 노드가 보이는지 확인하는 함수
function isVisible(element) {
  while (element) {
    const style = getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") {
      return false;
    }
    element = element.parentElement;
  }
  return true;
}

function closest(element, selector) {
  while (element && element !== document) {
    if (element.matches(selector)) {
      return element;
    }
    element = element.parentNode;
  }

  return null;
}

function countEnglishLetters(text) {
  const regex = /[a-zA-Z]/g; // 영어 알파벳 패턴
  const matches = text.match(regex); // 정규식 패턴에 맞는 모든 문자 배열 반환

  if (matches) {
    return matches.length; // 영어 알파벳 개수 반환
  } else {
    return 0; // 매치된 것이 없으면 0 반환
  }
}

function 확장자포함한단어인지(text) {
  const regex = /\.(vue|ts|js)$/gi;
  return text.match(regex);
}

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+(?=\S)/); //. ! ?
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
