const titleInput = document.getElementById('announcementTitle');
const dateInput = document.getElementById('announcementDate');
const sourceUrlInput = document.getElementById('sourceUrl');
const bodyInput = document.getElementById('announcementBody');
const output = document.getElementById('output');
const formatButton = document.getElementById('formatButton');
const copyButton = document.getElementById('copyButton');

function normalizeLines(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function inferAgency(text) {
  const agencyPattern = /(こども家庭庁|文部科学省|厚生労働省|農林水産省|経済産業省|国土交通省|内閣官房|デジタル庁|消費者庁|総務省|外務省|財務省|防衛省|環境省|金融庁|復興庁|関係府省|内閣府|[一-龥々]+省|[一-龥々]+庁|[一-龥々]+委員会|[一-龥々]+本部|[一-龥々]+局)/g;
  const matched = text.match(agencyPattern) || [];
  const generalWords = new Set(['政府', '内閣', '関係府省']);
  const filtered = matched.filter((name) => !generalWords.has(name));

  if (filtered.length === 0) {
    return '不明';
  }

  return [...new Set(filtered)].join('、');
}

function parseSections(text) {
  const lines = normalizeLines(text);
  const sectionNames = new Set(['国会提出案件', '公布（法律）', '政令', '人事', '配布']);
  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const lineBody = line.replace(/^・+\s*/, '').trim();
    if (!lineBody) {
      return;
    }

    if (sectionNames.has(lineBody)) {
      currentSection = { heading: lineBody, items: [] };
      sections.push(currentSection);
      return;
    }

    if (!currentSection) {
      currentSection = { heading: 'その他', items: [] };
      sections.push(currentSection);
    }

    if (/^（[^）]+）$/.test(lineBody) && currentSection.items.length > 0) {
      const lastIndex = currentSection.items.length - 1;
      currentSection.items[lastIndex] = `${currentSection.items[lastIndex]}${lineBody}`;
      return;
    }

    currentSection.items.push(lineBody);
  });

  return sections;
}

function collectDecisionItems(text) {
  const sections = parseSections(text);
  if (sections.length === 0) {
    return ['・不明'];
  }

  const result = [];
  sections.forEach((section) => {
    result.push(`・${section.heading}`);
    if (section.items.length === 0) {
      result.push('・不明');
      return;
    }
    section.items.forEach((item) => result.push(`・${item}`));
    result.push('');
  });

  if (result[result.length - 1] === '') {
    result.pop();
  }

  return result;
}

function organizeContent(text) {
  const sections = parseSections(text);

  if (sections.length === 0) {
    return ['・不明'];
  }

  const result = [];
  sections.forEach((section) => {
    result.push(`・${section.heading}`);
    if (section.items.length === 0) {
      result.push('・不明');
      return;
    }
    section.items.forEach((item) => result.push(`・${item}`));
  });

  return result;
}

function mediaNameFromUrl(url) {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return host || '不明';
  } catch {
    return '不明';
  }
}

function formatArticle() {
  const title = titleInput.value.trim() || '不明';
  const date = dateInput.value || '不明';
  const sourceUrl = sourceUrlInput.value.trim() || '不明';
  const body = bodyInput.value.trim();

  const decisions = collectDecisionItems(body).join('\n');
  const agency = inferAgency(body);
  const organized = organizeContent(body).join('\n');
  const mediaName = mediaNameFromUrl(sourceUrl);

  const noteTitle = `【公式発表】${title}`;
  const imagePrompt = [
    '文字なし、横長16:9、報道・資料整理風、note見出し向け。',
    '黒背景ベース、落ち着いたトーン、整然とした資料とデータ整理の印象。',
    `題材: ${title}`
  ].join(' ');

  const xPost = [
    `【公式発表】${title}`,
    `発表日: ${date}`,
    '決定事項を本文ベースで整理しました。',
    sourceUrl !== '不明' ? sourceUrl : ''
  ].filter(Boolean).join('\n');

  const formatted = [
    `note記事タイトル`,
    `${noteTitle}`,
    '',
    `発表日`,
    `${date}`,
    '',
    `決定事項`,
    `${decisions}`,
    '',
    `所管または関係機関`,
    `${agency}`,
    '',
    `本文に書かれている範囲での内容整理`,
    `${organized}`,
    '',
    `出典URL一覧`,
    `- ${mediaName} ${sourceUrl}`,
    '',
    `note見出し画像用プロンプト`,
    `${imagePrompt}`,
    '',
    `X投稿文`,
    `${xPost}`
  ].join('\n');

  output.value = formatted;
}

async function copyOutput() {
  if (!output.value.trim()) {
    return;
  }

  try {
    await navigator.clipboard.writeText(output.value);
    copyButton.textContent = 'コピー完了';
  } catch {
    output.select();
    document.execCommand('copy');
    copyButton.textContent = 'コピー完了';
  }

  setTimeout(() => {
    copyButton.textContent = 'コピー';
  }, 1400);
}

formatButton.addEventListener('click', formatArticle);
copyButton.addEventListener('click', copyOutput);
