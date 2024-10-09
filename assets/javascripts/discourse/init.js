// your_plugin_file.js
document.addEventListener("DOMContentLoaded", () => {
  console.log(window.moment().format('YYYY-MM-DD HH:mm:ss'));
});

// your_plugin_file.js

// DOMContentLoaded 이벤트를 사용하여 페이지가 로드된 후 실행
document.addEventListener("DOMContentLoaded", () => {
  // 글로벌 변수로 로드된 moment 사용
  const now = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(`현재 시간: ${now}`);

  // 예시: Discourse의 Ember 컴포넌트 내에서 사용
  // Ember 컴포넌트나 서비스 내에서도 window.moment 또는 전역 moment를 사용할 수 있습니다.
});
