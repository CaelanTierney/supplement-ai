document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('supplement-form');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const supplement = document.getElementById('supplement').value.trim();
    const outcome = document.getElementById('outcome').value.trim();
    result.innerHTML = '';
    loading.style.display = 'block';

    try {
      const res = await fetch('/api/supplement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplement, outcome })
      });
      const data = await res.json();
      loading.style.display = 'none';
      if (res.ok && data.result) {
        result.innerHTML = `<div class="result-card">${data.result.replace(/\n/g, '<br>')}</div>`;
      } else if (data.error) {
        result.innerHTML = `<div class="result-card" style="color:#ffb4b4;">${data.error}</div>`;
      } else {
        result.innerHTML = `<div class="result-card" style="color:#ffb4b4;">Sorry, something went wrong.</div>`;
      }
    } catch (err) {
      loading.style.display = 'none';
      result.innerHTML = `<div class="result-card" style="color:#ffb4b4;">Network error. Please try again.</div>`;
    }
  });
}); 