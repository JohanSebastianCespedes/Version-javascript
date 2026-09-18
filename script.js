// 1. CARGA DINÁMICA DE LIBRERÍAS EXTERNAS (Chart.js y ECharts)
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

Promise.all([
  loadScript('https://cdn.jsdelivr.net/npm/chart.js'),
  loadScript('https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js')
]).then(() => {
  initDashboard();
}).catch(err => {
  console.error("Error al cargar las librerías:", err);
});

// 2. DATOS
const realPrices = {
  BTC: 81102, ETH: 3450, SOL: 145, XRP: 1.40, DOGE: 0.087, LINK: 12.31, XLM: 0.193, BCH: 253.58, LTC: 56.96, SHIB: 0.0000054
};

const cryptoData = {
  btc: { label: 'Precio Bitcoin (BTC) - USD', data: [65000, 68000, 72000, 70000, 75000, 78000, 76300, 81102], borderColor: '#f0b90b', backgroundColor: 'rgba(240, 185, 11, 0.1)' },
  eth: { label: 'Precio Ethereum (ETH) - USD', data: [2800, 3100, 3500, 3200, 3400, 3600, 3300, 3450], borderColor: '#627eea', backgroundColor: 'rgba(98, 126, 234, 0.1)' },
  sol: { label: 'Precio Solana (SOL) - USD', data: [110, 130, 160, 140, 155, 150, 138, 145], borderColor: '#14f195', backgroundColor: 'rgba(20, 241, 149, 0.1)' }
};

let currentChart = null;

// 3. GENERACIÓN DEL DISEÑO Y ESTILOS MEDIANTE JAVASCRIPT
function initDashboard() {
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    :root {
      --bg-color: #0d1117;
      --card-bg: #161b22;
      --border-color: #30363d;
      --text-color: #c9d1d9;
      --link-color: #58a6ff;
      --accent-green: #0ecb81;
      --accent-red: #f6465d;
      --accent-gold: #f0b90b;
    }
    body { background-color: var(--bg-color); color: var(--text-color); font-family: sans-serif; line-height: 1.6; padding: 30px; max-width: 950px; margin: 0 auto; }
    h1 { font-size: 2.2rem; border-bottom: 2px solid var(--border-color); padding-bottom: 12px; background: linear-gradient(90deg, #f0b90b, #58a6ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h2 { font-size: 1.5rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; margin-top: 30px; color: #fff; }
    h3 { font-size: 1.2rem; margin-top: 20px; color: #fff; }
    hr { border: 0; height: 1px; background: #30363d; margin: 30px 0; }
    a { color: var(--link-color); text-decoration: none; }
    .img-banner { width: 100%; max-height: 400px; object-fit: cover; border-radius: 8px; border: 1px solid var(--border-color); margin: 15px 0; display: block; }
    .section-card { background-color: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 20px; margin: 20px 0; }
    .btn-container { display: flex; gap: 15px; margin: 20px 0; }
    .btn { padding: 12px 24px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; }
    .btn-buy { background-color: var(--accent-green); color: #000; }
    .btn-sell { background-color: var(--accent-red); color: #fff; }
    .btn-gold { background-color: var(--accent-gold); color: #000; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid var(--border-color); padding: 12px; text-align: left; }
    th { background-color: #21262d; color: var(--accent-gold); }
    .crypto-tabs { display: flex; gap: 10px; margin-bottom: 15px; }
    .tab-btn { padding: 8px 18px; background-color: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-color); border-radius: 6px; cursor: pointer; font-weight: bold; }
    .tab-btn.active { border-color: var(--accent-gold); background-color: #21262d; color: var(--accent-gold); }
    .gauge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .gauge-box { height: 300px; }
    #chat-widget-button { position: fixed; bottom: 25px; right: 25px; width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #f0b90b, #0ecb81); border: none; font-size: 28px; cursor: pointer; z-index: 1000; }
    #chat-box-container { position: fixed; bottom: 95px; right: 25px; width: 350px; height: 450px; background-color: #161b22; border: 1px solid #30363d; border-radius: 12px; z-index: 1000; display: none; flex-direction: column; overflow: hidden; }
    .chat-header { background-color: #21262d; padding: 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #30363d; }
    .chat-messages { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
    .message { max-width: 85%; padding: 8px 12px; border-radius: 8px; font-size: 0.9rem; }
    .message.bot { background-color: #21262d; color: #c9d1d9; align-self: flex-start; }
    .message.user { background-color: #1f6beb; color: #ffffff; align-self: flex-end; }
    .chat-input-area { display: flex; padding: 10px; border-top: 1px solid #30363d; background-color: #0d1117; }
    .chat-input-area input { flex: 1; background-color: #161b22; border: 1px solid #30363d; border-radius: 6px; padding: 8px; color: #fff; outline: none; }
    .chat-input-area button { background-color: #f0b90b; border: none; color: #000; padding: 8px 14px; margin-left: 8px; border-radius: 6px; font-weight: bold; cursor: pointer; }
  `;
  document.head.appendChild(styleTag);

  document.body.innerHTML = `
    <h1>🪙 Johan | Cripto Trading & Análisis de Mercados Digitales 📈</h1>
    <p><strong>🚀 Crypto Trader & Developer</strong></p>
    <p>Welcome, I am passionate about financial markets, blockchain technology, and building automated trading strategies.</p>
    <hr>
    
    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80" alt="Bitcoin Image" class="img-banner">

    <div class="section-card">
      <h3>📊 Market Interests & Expertise</h3>
      <ul>
        <li><strong>Cryptocurrencies:</strong> Bitcoin (BTC), Ethereum (ETH), and Altcoin analysis.</li>
        <li><strong>Trading Style:</strong> Algorithmic trading, technical analysis, and risk management.</li>
        <li><strong>Tools & Tech:</strong> Python (Pandas, NumPy), Pine Script, and Crypto Exchange APIs.</li>
      </ul>
    </div>

    <div class="section-card">
      <h3>💻 What I'm Working On</h3>
      <ul>
        <li>🤖 Developing automated trading bots.</li>
        <li>📊 Backtesting strategies using historical crypto data.</li>
        <li>🧪 Exploring decentralized finance (DeFi) protocols.</li>
      </ul>
    </div>

    <h3>🌐 Connect with Me</h3>
    <ul>
      <li>💼 <a href="https://linkedin.com" target="_blank">LinkedIn</a></li>
      <li>🐦 <a href="https://x.com" target="_blank">Twitter/X</a></li>
      <li>💬 Ask me about: <strong>Crypto, Trading Strategies, and Python</strong></li>
    </ul>

    <hr>
    <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1000&q=80" alt="Trading Image" class="img-banner">

    <h2>📉 Conceptos Clave del Trading con Criptomonedas</h2>
    <p>El trading de criptomonedas consiste en especular sobre los movimientos de precio de los activos digitales mediante el estudio de la oferta y la demanda.</p>

    <h3>1. Tipos de Operativa en el Mercado</h3>
    <ul>
      <li><strong>Spot Trading:</strong> Compra y posesión directa del activo.</li>
      <li><strong>Trading de Futuros:</strong> Operativa apalancada en mercados alcistas (Long) y bajistas (Short).</li>
      <li><strong>Trading Algorítmico:</strong> Reglas automatizadas mediante código.</li>
    </ul>

    <div class="btn-container">
      <button class="btn btn-buy">🟢 Comprar (Long)</button>
      <button class="btn btn-sell">🔴 Vender (Short)</button>
      <button class="btn btn-gold">⚙️ Gestión de Riesgo</button>
    </div>

    <hr>
    <h2>📊 Matriz de Análisis de Activos Principales</h2>
    <table>
      <thead>
        <tr>
          <th>Activo</th>
          <th>Símbolo</th>
          <th>Tipo de Análisis</th>
          <th>Indicadores Clave</th>
          <th>Función</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Bitcoin</td><td><code>BTC</code></td><td>Macro & On-Chain</td><td>Dominancia, Halving</td><td>Reserva de Valor</td></tr>
        <tr><td>Ethereum</td><td><code>ETH</code></td><td>Fundamental & DeFi</td><td>Gas Fees, TVL</td><td>Utilidad DApps</td></tr>
        <tr><td>Solana</td><td><code>SOL</code></td><td>Técnico</td><td>RSI, MACD</td><td>Ecosistema Rápido</td></tr>
      </tbody>
    </table>

    <hr>
    <h2>📈 Evolución del Precio (Bitcoin, Ethereum, Solana)</h2>
    <div class="crypto-tabs">
      <button class="tab-btn active" id="btn-btc">Bitcoin (BTC)</button>
      <button class="tab-btn" id="btn-eth">Ethereum (ETH)</button>
      <button class="tab-btn" id="btn-sol">Solana (SOL)</button>
    </div>
    <div class="section-card"><canvas id="cryptoChart"></canvas></div>

    <h2>📊 Comparativa: Capitalización de Mercado</h2>
    <div class="section-card"><canvas id="barChart"></canvas></div>

    <hr>
    <h2>🚦 Indicadores de Sentimiento: COMPRA vs VENTA</h2>
    <div class="gauge-grid">
      <div class="section-card">
        <h3 style="text-align: center; color: var(--accent-green);">🟢 Sentimiento de COMPRA</h3>
        <div id="buyGauge" class="gauge-box"></div>
      </div>
      <div class="section-card">
        <h3 style="text-align: center; color: var(--accent-red);">🔴 Sentimiento de VENTA</h3>
        <div id="sellGauge" class="gauge-box"></div>
      </div>
    </div>

    <!-- Chatbot Widget -->
    <button id="chat-widget-button">💬</button>
    <div id="chat-box-container">
      <div class="chat-header">
        <h4 style="margin:0; color:#fff;">🤖 SebaCrypto AI Assistant</h4>
        <button id="chat-close" style="background:none; border:none; color:#8b949e; cursor:pointer;">✕</button>
      </div>
      <div class="chat-messages" id="chat-messages">
        <div class="message bot">¡Hola! 👋 Pregúntame sobre el precio de cualquier criptomoneda (ej. <i>"¿Precio de BTC?"</i>).</div>
      </div>
      <div class="chat-input-area">
        <input type="text" id="chat-input" placeholder="Escribe tu mensaje...">
        <button id="chat-send">Enviar</button>
      </div>
    </div>
  `;

  renderCharts();
  setupEvents();
}

// 4. RENDERIZAR GRÁFICAS
function renderCharts() {
  const ctx = document.getElementById('cryptoChart').getContext('2d');
  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Hoy'],
      datasets: [{
        label: cryptoData.btc.label,
        data: cryptoData.btc.data,
        borderColor: cryptoData.btc.borderColor,
        backgroundColor: cryptoData.btc.backgroundColor,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#c9d1d9' } } },
      scales: {
        x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } },
        y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }
      }
    }
  });

  const ctxBar = document.getElementById('barChart').getContext('2d');
  new Chart(ctxBar, {
    type: 'bar',
    data: {
      labels: ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)'],
      datasets: [{
        label: 'Market Cap (Billones USD)',
        data: [1600, 415, 68],
        backgroundColor: ['rgba(240, 185, 11, 0.8)', 'rgba(98, 126, 234, 0.8)', 'rgba(20, 241, 149, 0.8)'],
        borderColor: ['#f0b90b', '#627eea', '#14f195'],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#c9d1d9' } } },
      scales: {
        x: { ticks: { color: '#c9d1d9' }, grid: { display: false } },
        y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }
      }
    }
  });

  const buyChart = echarts.init(document.getElementById('buyGauge'));
  buyChart.setOption({
    series: [{
      type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100,
      itemStyle: { color: '#0ecb81' },
      progress: { show: true, width: 18 },
      axisLine: { lineStyle: { width: 18, color: [[1, '#30363d']] } },
      detail: { formatter: '{value}%', color: '#0ecb81', fontSize: 24, offsetCenter: [0, '-10%'] },
      data: [{ value: 78, name: 'Fuerza Compra' }]
    }]
  });

  const sellChart = echarts.init(document.getElementById('sellGauge'));
  sellChart.setOption({
    series: [{
      type: 'gauge', startAngle: 180, endAngle: 0, min: 0, max: 100,
      itemStyle: { color: '#f6465d' },
      progress: { show: true, width: 18 },
      axisLine: { lineStyle: { width: 18, color: [[1, '#30363d']] } },
      detail: { formatter: '{value}%', color: '#f6465d', fontSize: 24, offsetCenter: [0, '-10%'] },
      data: [{ value: 22, name: 'Fuerza Venta' }]
    }]
  });
}

// 5. EVENTOS CHATBOT Y BOTONES
function setupEvents() {
  const switchCrypto = (key, btnId) => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(btnId).classList.add('active');
    currentChart.data.datasets[0].label = cryptoData[key].label;
    currentChart.data.datasets[0].data = cryptoData[key].data;
    currentChart.data.datasets[0].borderColor = cryptoData[key].borderColor;
    currentChart.data.datasets[0].backgroundColor = cryptoData[key].backgroundColor;
    currentChart.update();
  };

  document.getElementById('btn-btc').onclick = () => switchCrypto('btc', 'btn-btc');
  document.getElementById('btn-eth').onclick = () => switchCrypto('eth', 'btn-eth');
  document.getElementById('btn-sol').onclick = () => switchCrypto('sol', 'btn-sol');

  const chatContainer = document.getElementById('chat-box-container');
  const toggleChat = () => {
    chatContainer.style.display = (chatContainer.style.display === 'flex') ? 'none' : 'flex';
  };

  document.getElementById('chat-widget-button').onclick = toggleChat;
  document.getElementById('chat-close').onclick = toggleChat;

  const sendMessage = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    input.value = '';

    const uppercaseText = text.toUpperCase();
    let matchedSymbol = null;
    const symbols = ['BTC', 'BITCOIN', 'ETH', 'ETHEREUM', 'SOL', 'SOLANA', 'XRP', 'DOGE', 'LINK', 'XLM', 'BCH', 'LTC', 'SHIB'];
    
    for (let sym of symbols) {
      if (uppercaseText.includes(sym)) {
        if (sym === 'BITCOIN') matchedSymbol = 'BTC';
        else if (sym === 'ETHEREUM') matchedSymbol = 'ETH';
        else if (sym === 'SOLANA') matchedSymbol = 'SOL';
        else matchedSymbol = sym;
        break;
      }
    }

    if (matchedSymbol) {
      appendMessage(`🔎 Consultando cotización actualizada de ${matchedSymbol}...`, 'bot');
      try {
        const res = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=${matchedSymbol}&tsyms=USD`);
        const data = await res.json();
        if (data && data.USD) {
          appendMessage(`📈 <b>${matchedSymbol}/USD:</b> $${data.USD.toLocaleString()} USD.`, 'bot');
        } else {
          throw new Error('Sin datos');
        }
      } catch (err) {
        const price = realPrices[matchedSymbol] || '81,102';
        appendMessage(`📊 <b>${matchedSymbol}/USD:</b> $${price.toLocaleString()} USD (Precio de referencia).`, 'bot');
      }
    } else {
      appendMessage('Escribe el nombre o símbolo de una criptomoneda (ej. BTC, ETH, SOL, XRP).', 'bot');
    }
  };

  document.getElementById('chat-send').onclick = sendMessage;
  document.getElementById('chat-input').onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
}

function appendMessage(text, sender) {
  const container = document.getElementById('chat-messages');
  const msgDiv = document.createElement('div');
  msgDiv.className = `message ${sender}`;
  msgDiv.innerHTML = text;
  container.appendChild(msgDiv);
  container.scrollTop = container.scrollHeight;
}

