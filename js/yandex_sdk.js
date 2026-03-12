// === YANDEX GAMES SDK PLACEHOLDER ===
// Здесь позже появится интеграция Яндекс SDK:
// - Инициализация SDK
// - Показ рекламы (rewarded / interstitial)
// - Облачные сохранения (рекорд, настройки)
// - Шеринг/соц. функции

// Пример (заглушка):
// async function initYandexSDK() {}
// async function showInterstitialAd() {}
// async function showRewardedAd() {}
// async function saveCloudHighScore(score) {}
// async function loadCloudHighScore() {}

function saveHiScore(score) {
  const s = Math.max(0, Math.floor(score || 0));
  try {
    const ysdk = window.ysdk;
    if (!ysdk) return;

    // Вариант 1: прямой метод (если прокинули)
    if (typeof ysdk.setLeaderboardScore === 'function') {
      ysdk.setLeaderboardScore(s);
      return;
    }

    // Вариант 2: стандартный API Leaderboards
    if (typeof ysdk.getLeaderboards === 'function') {
      ysdk.getLeaderboards()
        .then((lb) => {
          if (!lb) return;
          if (typeof lb.setLeaderboardScore === 'function') {
            // ID лидерборда задаётся на стороне Яндекс Игр
            lb.setLeaderboardScore('bestScore', s).catch(() => {});
          }
        })
        .catch(() => {});
    }
  } catch (_) {
    // игнор
  }
}

window.saveHiScore = saveHiScore;
