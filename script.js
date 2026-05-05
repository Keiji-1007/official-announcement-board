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
  const keywords = [
    '内閣', '首相官邸', '衆議院', '参議院', '国会', '省', '庁', '委員会', '都', '道', '府', '県', '市', '区', '町', '村', '裁判所'
  ];

  const lines = normalizeLines(text);
  for (const line of lines) {
    for (const keyword of keywords) {
      if (line.includes(keyword)) {
        return line.length > 80 ? `${line.slice(0, 80)}...` : line;
      }
    }
  }

  return '不明';
}

function collectDecisionItems(text) {
  const lines = normalizeLines(text);
  const markers = ['決定', '決議', '承認', '施行', '公布', '発表', '公表', '開始', '改正', '成立'];
  const picked = [];

  for (const line of lines) {
    if (markers.some((marker) => line.includes(marker))) {
      picked.push(`- ${line}`);
    }
    if (picked.length >= 6) {
      break;
    }
  }

  if (picked.length === 0) {
    return ['- 不明'];
  }

  return picked;
}

function organizeContent(text) {
  const lines = normalizeLines(text);

  if (lines.length === 0) {
    return ['- 不明'];
  }

  return lines.slice(0, 10).map((line) => `- ${line}`);
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
