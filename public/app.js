document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('supplement-form');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const container = document.querySelector('.container');

  function showResult(html) {
    container.classList.add('fade-out');
    setTimeout(() => {
      container.innerHTML = `
        <div id="result" class="fade-in">
          ${html}
          <button id="reset-btn" class="reset-btn">Make Another Search</button>
        </div>
      `;
      container.classList.remove('fade-out');
      container.classList.add('fade-in');
      document.getElementById('reset-btn').onclick = resetUI;
    }, 50);
  }

  function resetUI() {
    container.classList.remove('fade-in');
    setTimeout(() => {
      container.innerHTML = `
        <h1>Supplement AI</h1>
        <p class="subtitle">Evidence-based supplement advice, focused on human data.</p>
        <form id="supplement-form">
          <input type="text" id="supplement" name="supplement" placeholder="Supplement Name" required />
          <input type="text" id="outcome" name="outcome" placeholder="Health Outcome" required />
          <button type="submit">Tell Me</button>
        </form>
        <div id="loading" style="display:none;">Loading...</div>
        <div id="result"></div>
      `;
      attachFormHandler();
    }, 50);
  }

  function attachFormHandler() {
    const form = document.getElementById('supplement-form');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const supplement = document.getElementById('supplement').value.trim();
      const outcome = document.getElementById('outcome').value.trim();
      
      result.innerHTML = '';
      loading.style.display = 'block';
      form.querySelector('button').disabled = true;
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const res = await fetch('/api/supplement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplement, outcome }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await res.json();
        loading.style.display = 'none';
        
        if (res.ok && data.result) {
          showResult(`<div class="result-card"><h2 style="margin-top:0;font-size:1.1em;font-weight:700;">What do you think of ${supplement} for ${outcome}?</h2>${data.result}</div>`);
        } else if (data.error) {
          showResult(`<div class="result-card" style="color:#ffb4b4;">${data.error}</div>`);
        } else {
          showResult(`<div class="result-card" style="color:#ffb4b4;">Sorry, something went wrong.</div>`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        loading.style.display = 'none';
        form.querySelector('button').disabled = false;
        
        if (err.name === 'AbortError') {
          showResult(`<div class="result-card" style="color:#ffb4b4;">Request timed out. Please try again.</div>`);
        } else {
          showResult(`<div class="result-card" style="color:#ffb4b4;">Network error. Please check your connection and try again.</div>`);
        }
      }
    });
  }

  attachFormHandler();
}); 