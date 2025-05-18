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

  function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="error">${message}</div>`;
    resultDiv.style.display = 'block';
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
      loading.textContent = 'Processing… this may take up to 20 seconds 🙂';
      form.querySelector('button').disabled = true;
      
      try {
        const res = await fetch('/api/supplement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplement, outcome })
        });
        
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
        showResult(`<div class="result-card" style="color:#ffb4b4;">Network error. Please check your connection and try again.</div>`);
      }
    });
  }

  // Add CSS for loading state transitions
  const style = document.createElement('style');
  style.textContent = `
    .loading {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.3s ease, transform 0.3s ease;
      font-size: 1.2em;
      color: #666;
      text-align: center;
      padding: 20px;
    }
    
    #result {
      opacity: 1;
      transform: translateY(0);
      transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .error {
      color: #dc3545;
      text-align: center;
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
    }

    .fade-out {
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .fade-in {
      opacity: 1;
      transition: opacity 0.3s ease;
    }

    .reset-btn {
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s ease;
    }

    .reset-btn:hover {
      background-color: #0056b3;
    }
  `;
  document.head.appendChild(style);

  attachFormHandler();
}); 