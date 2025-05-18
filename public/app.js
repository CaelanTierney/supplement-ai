document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('supplement-form');
  const loading = document.getElementById('loading');
  const result = document.getElementById('result');
  const container = document.querySelector('.container');

  function showResult(html) {
    container.classList.add('fade-out');
    setTimeout(() => {
      container.innerHTML = `
        <div class="result-card fade-in">
          ${html}
          <button id="reset-btn" class="reset-btn">Make Another Search</button>
        </div>
      `;
      container.classList.remove('fade-out');
      container.classList.add('fade-in');
      document.getElementById('reset-btn').onclick = resetUI;
    }, 300);
  }

  function showError(message) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = `<div class="error">${message}</div>`;
    resultDiv.style.display = 'block';
  }

  function resetUI() {
    container.classList.add('fade-out');
    setTimeout(() => {
      container.innerHTML = `
        <h1>Supplement AI</h1>
        <p class="subtitle">Evidence-based supplement advice, focused on human data.</p>
        <form id="supplement-form" autocomplete="off">
          <div class="input-wrapper">
            <input 
              type="text" 
              id="supplement" 
              name="supplement" 
              placeholder="Supplement Name" 
              required 
              autocomplete="off"
              inputmode="text"
              enterkeyhint="next"
              aria-label="Supplement Name"
            />
          </div>
          <div class="input-wrapper">
            <input 
              type="text" 
              id="outcome" 
              name="outcome" 
              placeholder="Health Outcome" 
              required 
              autocomplete="off"
              inputmode="text"
              enterkeyhint="search"
              aria-label="Health Outcome"
            />
          </div>
          <div class="button-wrapper">
            <button type="submit" aria-label="Submit">Tell Me</button>
          </div>
        </form>
        <div id="loading" style="display:none;">Loading...</div>
        <div id="result"></div>
      `;
      container.classList.remove('fade-out');
      container.classList.add('fade-in');
      attachFormHandler();
    }, 150);
  }

  function attachFormHandler() {
    const form = document.getElementById('supplement-form');
    const loading = document.getElementById('loading');
    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      const supplement = document.getElementById('supplement').value.trim();
      const outcome = document.getElementById('outcome').value.trim();
      
      // Show loading message
      loading.style.display = 'block';
      loading.textContent = 'Processing... this may take up to 20 seconds 😊';
      form.querySelector('button').disabled = true;
      
      try {
        const response = await fetch('/api/supplement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplement, outcome })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Something went wrong');
        }

        // Add a 0.75 second delay before showing the result
        await new Promise(resolve => setTimeout(resolve, 750));
        
        const data = await response.json();
        
        // Hide loading message
        loading.style.display = 'none';
        form.querySelector('button').disabled = false;
        
        // Create new container content with fade-in
        const newContent = `
          <div class="result-card fade-in">
            <h2 style="margin-top:0;font-size:1.1em;font-weight:700;color:#fefef1;">What do you think of ${supplement} for ${outcome}?</h2>
            <div class="streaming-content">${data.content}</div>
            <button class="reset-btn">Make Another Search</button>
          </div>
        `;
        
        // Update content without triggering a full reset
        container.innerHTML = newContent;
        container.classList.remove('fade-out');
        container.classList.add('fade-in');
        
        // Add click handler for reset button
        container.querySelector('.reset-btn').onclick = resetUI;
        
      } catch (err) {
        console.error('Fetch error:', err);
        loading.style.display = 'none';
        form.querySelector('button').disabled = false;
        showResult(`<div style="color:#ffb4b4;">${err.message || 'Network error. Please check your connection and try again.'}</div>`);
      }
    });
  }

  // Add CSS for loading state transitions
  const style = document.createElement('style');
  style.textContent = `
    .container {
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .fade-out {
      opacity: 0;
      transform: translateY(20px);
    }
    
    .fade-in {
      opacity: 1;
      transform: translateY(0);
    }
    
    .result-card {
      background: #233149;
      border-radius: 8px;
      padding: 20px 16px;
      color: #fefef1;
      text-align: left;
      font-size: 1.08em;
      line-height: 1.6;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(35, 49, 73, 0.2);
      max-height: 70vh;
      overflow-y: auto;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .result-card.fade-in {
      transform: translateY(0);
    }
    
    .result-card.fade-out {
      transform: translateY(20px);
    }
    
    .result-card h2 {
      color: #fefef1;
      margin-bottom: 0.5em;
    }
    
    .result-card h3 {
      color: #fefef1;
      margin: 1.5em 0 0.5em 0;
      font-size: 1.1em;
    }
    
    .result-card p {
      color: #fefef1;
      margin: 0.5em 0;
    }
    
    .result-card strong {
      color: #fefef1;
      font-weight: 600;
    }
    
    .result-card em {
      color: #fefef1;
      font-style: italic;
    }
    
    .streaming-content {
      color: #fefef1;
      min-height: 100px;
      background: #233149;
      padding: 15px;
      border-radius: 6px;
      margin-top: 0.5em;
      margin-bottom: 0;
      display: block;
      width: 100%;
      box-sizing: border-box;
    }
    
    .reset-btn {
      margin: 12px auto 0 auto;
      display: block;
      padding: 12px 24px;
      border-radius: 6px;
      border: none;
      background: #2d6cdf;
      color: #fff;
      font-weight: 700;
      font-size: 1em;
      cursor: pointer;
      transition: background 0.2s;
    }
    
    .reset-btn:hover {
      background: #1a4fa2;
    }
    
    .error {
      color: #ffb4b4;
      text-align: center;
      padding: 20px;
    }

    #loading {
      color: #666;
      text-align: center;
      margin: 20px 0;
      font-size: 1em;
    }

    form {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
    }

    .button-wrapper {
      margin-top: 8px;
    }

    .button-wrapper::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 100%;
      height: 100%;
      border: 1px solid transparent;
      border-radius: 6px;
      transform: translate(-50%, -50%);
      pointer-events: none;
    }

    .button-wrapper.loading::after {
      border-color: #FFD700;
      animation: borderRotate 1.5s linear infinite;
    }

    @keyframes borderRotate {
      0% {
        clip-path: polygon(0 0, 0 0, 0 0, 0 0);
      }
      25% {
        clip-path: polygon(0 0, 100% 0, 100% 0, 0 0);
      }
      50% {
        clip-path: polygon(100% 0, 100% 100%, 100% 100%, 100% 0);
      }
      75% {
        clip-path: polygon(0 100%, 100% 100%, 100% 100%, 0 100%);
      }
      100% {
        clip-path: polygon(0 0, 0 100%, 0 100%, 0 0);
      }
    }
  `;
  document.head.appendChild(style);

  attachFormHandler();
}); 