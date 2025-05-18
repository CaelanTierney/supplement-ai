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
        <form id="supplement-form">
          <input type="text" id="supplement" name="supplement" placeholder="Supplement Name" required />
          <input type="text" id="outcome" name="outcome" placeholder="Health Outcome" required />
          <button type="submit">Tell Me</button>
        </form>
        <div id="loading" style="display:none;">Loading...</div>
        <div id="result"></div>
      `;
      container.classList.remove('fade-out');
      container.classList.add('fade-in');
      attachFormHandler();
    }, 300);
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
      loading.textContent = 'You got it! 😊';
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

        // Add a 0.75 second delay before starting the stream
        await new Promise(resolve => setTimeout(resolve, 750));
        
        // Create new container content with fade-in
        container.innerHTML = `
          <div id="result" class="fade-in">
            <div class="result-card">
              <h2 style="margin-top:0;font-size:1.1em;font-weight:700;color:#fefef1;">What do you think of ${supplement} for ${outcome}?</h2>
              <div id="streaming-content" style="color:#fefef1;"></div>
            </div>
          </div>
        `;
        
        const streamingContent = document.getElementById('streaming-content');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const { content } = JSON.parse(data);
                if (content) {
                  accumulatedContent += content;
                  streamingContent.innerHTML = accumulatedContent;
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e);
              }
            }
          }
        }
        
        // Add reset button after streaming is complete
        const resetBtn = document.createElement('button');
        resetBtn.className = 'reset-btn';
        resetBtn.textContent = 'Make Another Search';
        resetBtn.onclick = resetUI;
        container.querySelector('#result').appendChild(resetBtn);
        
      } catch (err) {
        console.error('Fetch error:', err);
        loading.style.display = 'none';
        form.querySelector('button').disabled = false;
        showResult(`<div class="result-card" style="color:#ffb4b4;">${err.message || 'Network error. Please check your connection and try again.'}</div>`);
      }
    });
  }

  // Add CSS for loading state transitions
  const style = document.createElement('style');
  style.textContent = `
    .container {
      transition: opacity 0.3s ease;
    }
    
    .fade-out {
      opacity: 0;
    }
    
    .fade-in {
      opacity: 1;
    }
    
    .result-card {
      background: rgba(45, 108, 223, 0.1);
      border-radius: 8px;
      padding: 20px 16px;
      color: #fefef1;
      text-align: left;
      font-size: 1.08em;
      line-height: 1.6;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      width: 100%;
      box-sizing: border-box;
      border: 1px solid rgba(45, 108, 223, 0.2);
    }
    
    .result-card h2 {
      color: #fefef1;
      margin-bottom: 1em;
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
    
    #streaming-content {
      color: #fefef1;
      min-height: 100px;
      background: rgba(45, 108, 223, 0.05);
      padding: 15px;
      border-radius: 6px;
      margin-top: 1em;
    }
    
    .reset-btn {
      margin: 24px auto 0 auto;
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
      font-size: 1.2em;
    }
  `;
  document.head.appendChild(style);

  attachFormHandler();
}); 