// script.js - Nexus Calculator

(function() {
  // ---------- DOM Elements ----------
  const expressionDisplay = document.getElementById('expression');
  const resultDisplay = document.getElementById('result');
  const memoryIndicator = document.getElementById('memoryIndicator');
  const historyPanel = document.getElementById('historyPanel');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistory');
  const historyToggle = document.getElementById('historyToggle');
  const settingsToggle = document.getElementById('settingsToggle');
  const voiceBtn = document.getElementById('voiceBtn');
  const micIcon = document.getElementById('micIcon');
  const voiceText = document.getElementById('voiceText');
  const converterPanel = document.getElementById('converterPanel');
  const closeConverter = document.getElementById('closeConverter');
  
  // Install elements
  const installContainer = document.getElementById('installContainer');
  const installBtn = document.getElementById('installBtn');
  let deferredPrompt;
  
  // ---------- Calculator State ----------
  let currentExpression = '';
  let lastResult = '0';
  let memory = 0;
  let history = [];
  let isListening = false;
  let recognition = null;
  
  // Constants
  const CONSTANTS = {
    'π': Math.PI,
    'e': Math.E,
    'φ': (1 + Math.sqrt(5)) / 2, // Golden ratio
    'c': 299792458, // Speed of light
    'h': 6.62607015e-34 // Planck constant
  };
  
  // ---------- Initialize Speech Recognition ----------
  function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        isListening = true;
        voiceBtn.classList.add('listening');
        voiceText.textContent = 'Listening...';
        micIcon.src = 'icons/mic-off.svg';
      };
      
      recognition.onend = () => {
        isListening = false;
        voiceBtn.classList.remove('listening');
        voiceText.textContent = 'Tap to speak';
        micIcon.src = 'icons/mic.svg';
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        processVoiceInput(transcript);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        voiceText.textContent = 'Try again';
        setTimeout(() => {
          voiceText.textContent = 'Tap to speak';
        }, 2000);
      };
    }
  }
  
  // ---------- Process Voice Input ----------
  function processVoiceInput(text) {
    // Convert spoken words to math expression
    let expression = text.toLowerCase()
      .replace(/plus/g, '+')
      .replace(/minus/g, '-')
      .replace(/times/g, '*')
      .replace(/multiplied by/g, '*')
      .replace(/divided by/g, '/')
      .replace(/over/g, '/')
      .replace(/x/g, '*')
      .replace(/[÷×]/g, (m) => m === '÷' ? '/' : '*')
      .replace(/\s+/g, '');
    
    // Handle "squared", "cubed", etc.
    if (expression.includes('squared')) {
      const number = parseFloat(expression.replace('squared', ''));
      if (!isNaN(number)) {
        expression = `${number}*${number}`;
      }
    }
    
    if (expression.includes('cubed')) {
      const number = parseFloat(expression.replace('cubed', ''));
      if (!isNaN(number)) {
        expression = `${number}*${number}*${number}`;
      }
    }
    
    // Handle "to the power of"
    if (expression.includes('^') || expression.includes('**')) {
      // Keep as is - will be handled by math.js
    }
    
    // Update display with spoken expression
    currentExpression = expression;
    updateDisplay();
    
    // Automatically calculate
    calculate();
  }
  
  // ---------- Safe Evaluation with Math ----------
  function evaluateExpression(expr) {
    // Replace constants
    Object.keys(CONSTANTS).forEach(key => {
      const regex = new RegExp(key, 'g');
      expr = expr.replace(regex, CONSTANTS[key]);
    });
    
    // Handle percentage
    expr = expr.replace(/(\d+)%/g, '($1/100)');
    
    // Handle power operator
    expr = expr.replace(/\^/g, '**');
    
    try {
      // Use Function constructor for safer evaluation (still has risks, but better than eval)
      const fn = new Function('return ' + expr);
      const result = fn();
      
      if (isNaN(result) || !isFinite(result)) {
        return 'Error';
      }
      
      // Format result (limit decimals)
      if (Number.isInteger(result)) {
        return result.toString();
      } else {
        // Limit to 10 decimal places
        return result.toFixed(10).replace(/\.?0+$/, '');
      }
    } catch (e) {
      return 'Error';
    }
  }
  
  // ---------- Calculate ----------
  function calculate() {
    if (!currentExpression) {
      lastResult = '0';
      resultDisplay.textContent = '0';
      return;
    }
    
    const result = evaluateExpression(currentExpression);
    lastResult = result;
    resultDisplay.textContent = result;
    
    // Add to history
    if (result !== 'Error') {
      addToHistory(currentExpression, result);
    }
  }
  
  // ---------- Add to History ----------
  function addToHistory(expression, result) {
    const historyItem = {
      expression,
      result,
      timestamp: Date.now()
    };
    
    history.unshift(historyItem);
    
    // Keep only last 20 items
    if (history.length > 20) {
      history.pop();
    }
    
    renderHistory();
    saveToLocalStorage();
  }
  
  // ---------- Render History ----------
  function renderHistory() {
    if (history.length === 0) {
      historyList.innerHTML = '<div class="history-item">No calculations yet</div>';
      return;
    }
    
    historyList.innerHTML = history.map(item => `
      <div class="history-item" data-expression="${item.expression}" data-result="${item.result}">
        <div class="history-expression">${item.expression}</div>
        <div class="history-result">= ${item.result}</div>
      </div>
    `).join('');
    
    // Add click handlers to history items
    document.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        const result = item.dataset.result;
        currentExpression = result;
        lastResult = result;
        updateDisplay();
        resultDisplay.textContent = result;
      });
    });
  }
  
  // ---------- Clear History ----------
  function clearHistory() {
    history = [];
    renderHistory();
    saveToLocalStorage();
  }
  
  // ---------- Memory Functions ----------
  function memoryClear() {
    memory = 0;
    updateMemoryIndicator();
  }
  
  function memoryRecall() {
    currentExpression += memory.toString();
    updateDisplay();
  }
  
  function memoryAdd() {
    const current = parseFloat(resultDisplay.textContent);
    if (!isNaN(current)) {
      memory += current;
      updateMemoryIndicator();
    }
  }
  
  function memorySubtract() {
    const current = parseFloat(resultDisplay.textContent);
    if (!isNaN(current)) {
      memory -= current;
      updateMemoryIndicator();
    }
  }
  
  function updateMemoryIndicator() {
    if (memory !== 0) {
      memoryIndicator.textContent = 'M';
    } else {
      memoryIndicator.textContent = '';
    }
  }
  
  // ---------- Handle Number Input ----------
  function handleNumber(num) {
    currentExpression += num;
    updateDisplay();
  }
  
  // ---------- Handle Operator ----------
  function handleOperator(op) {
    // Convert display operator to actual operator
    const actualOp = op === '×' ? '*' : op === '÷' ? '/' : op === '−' ? '-' : op;
    
    // Don't add operator if expression is empty and operator is not minus
    if (!currentExpression && op !== '-') {
      return;
    }
    
    // Handle minus as negative sign
    if (!currentExpression && op === '-') {
      currentExpression = '-';
    } else {
      // Check if last character is operator
      const lastChar = currentExpression.slice(-1);
      if (['+', '-', '*', '/'].includes(lastChar)) {
        // Replace last operator
        currentExpression = currentExpression.slice(0, -1) + actualOp;
      } else {
        currentExpression += actualOp;
      }
    }
    
    updateDisplay();
  }
  
  // ---------- Handle Decimal ----------
  function handleDecimal() {
    // Split by operators to check last number
    const parts = currentExpression.split(/[+\-*/]/);
    const lastPart = parts[parts.length - 1];
    
    if (!lastPart.includes('.')) {
      if (lastPart === '') {
        currentExpression += '0.';
      } else {
        currentExpression += '.';
      }
    }
    
    updateDisplay();
  }
  
  // ---------- Handle Backspace ----------
  function handleBackspace() {
    currentExpression = currentExpression.slice(0, -1);
    updateDisplay();
  }
  
  // ---------- Handle Clear ----------
  function handleClear() {
    currentExpression = '';
    lastResult = '0';
    updateDisplay();
    resultDisplay.textContent = '0';
  }
  
  // ---------- Handle Percentage ----------
  function handlePercent() {
    if (currentExpression) {
      currentExpression += '/100';
      calculate();
    }
  }
  
  // ---------- Handle Constant ----------
  function handleConstant(constant) {
    currentExpression += constant;
    updateDisplay();
  }
  
  // ---------- Update Display ----------
  function updateDisplay() {
    expressionDisplay.textContent = currentExpression || '0';
  }
  
  // ---------- Unit Converter ----------
  function initConverter() {
    const converterTabs = document.querySelectorAll('.converter-tab');
    const converterContent = document.getElementById('converterContent');
    
    const conversionRates = {
      length: {
        m: 1,
        km: 0.001,
        cm: 100,
        mm: 1000,
        mi: 0.000621371,
        yd: 1.09361,
        ft: 3.28084,
        in: 39.3701
      },
      weight: {
        kg: 1,
        g: 1000,
        mg: 1000000,
        lb: 2.20462,
        oz: 35.274
      },
      temperature: {
        c: 'celsius',
        f: 'fahrenheit',
        k: 'kelvin'
      }
    };
    
    function renderConverter(type) {
      let html = '';
      
      if (type === 'temperature') {
        html = `
          <div class="converter-row">
            <input type="number" id="convertFrom" class="converter-input" placeholder="Value">
            <select id="convertFromUnit" class="converter-select">
              <option value="c">Celsius</option>
              <option value="f">Fahrenheit</option>
              <option value="k">Kelvin</option>
            </select>
          </div>
          <div class="converter-row">
            <select id="convertToUnit" class="converter-select">
              <option value="c">Celsius</option>
              <option value="f">Fahrenheit</option>
              <option value="k">Kelvin</option>
            </select>
            <span class="converter-result" id="convertResult">0</span>
          </div>
        `;
      } else {
        const units = Object.keys(conversionRates[type]);
        html = `
          <div class="converter-row">
            <input type="number" id="convertFrom" class="converter-input" placeholder="Value">
            <select id="convertFromUnit" class="converter-select">
              ${units.map(u => `<option value="${u}">${u}</option>`).join('')}
            </select>
          </div>
          <div class="converter-row">
            <select id="convertToUnit" class="converter-select">
              ${units.map(u => `<option value="${u}">${u}</option>`).join('')}
            </select>
            <span class="converter-result" id="convertResult">0</span>
          </div>
        `;
      }
      
      converterContent.innerHTML = html;
      
      // Add event listeners
      document.getElementById('convertFrom').addEventListener('input', () => performConversion(type));
      document.getElementById('convertFromUnit').addEventListener('change', () => performConversion(type));
      document.getElementById('convertToUnit').addEventListener('change', () => performConversion(type));
    }
    
    function performConversion(type) {
      const value = parseFloat(document.getElementById('convertFrom').value);
      const fromUnit = document.getElementById('convertFromUnit').value;
      const toUnit = document.getElementById('convertToUnit').value;
      const resultEl = document.getElementById('convertResult');
      
      if (isNaN(value)) {
        resultEl.textContent = '0';
        return;
      }
      
      let result;
      
      if (type === 'temperature') {
        // Temperature conversions
        if (fromUnit === 'c' && toUnit === 'f') result = value * 9/5 + 32;
        else if (fromUnit === 'c' && toUnit === 'k') result = value + 273.15;
        else if (fromUnit === 'f' && toUnit === 'c') result = (value - 32) * 5/9;
        else if (fromUnit === 'f' && toUnit === 'k') result = (value - 32) * 5/9 + 273.15;
        else if (fromUnit === 'k' && toUnit === 'c') result = value - 273.15;
        else if (fromUnit === 'k' && toUnit === 'f') result = (value - 273.15) * 9/5 + 32;
        else result = value;
      } else {
        // Standard conversions
        const inBaseUnit = value / conversionRates[type][fromUnit];
        result = inBaseUnit * conversionRates[type][toUnit];
      }
      
      resultEl.textContent = result.toFixed(4);
    }
    
    converterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        converterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        renderConverter(tab.dataset.converter);
      });
    });
    
    // Initialize with length converter
    renderConverter('length');
  }
  
  // ---------- Local Storage ----------
  function saveToLocalStorage() {
    localStorage.setItem('calculatorHistory', JSON.stringify(history));
    localStorage.setItem('calculatorMemory', memory.toString());
  }
  
  function loadFromLocalStorage() {
    const savedHistory = localStorage.getItem('calculatorHistory');
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
        renderHistory();
      } catch (e) {
        history = [];
      }
    }
    
    const savedMemory = localStorage.getItem('calculatorMemory');
    if (savedMemory) {
      memory = parseFloat(savedMemory) || 0;
      updateMemoryIndicator();
    }
  }
  
  // ---------- PWA Install ----------
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installContainer.classList.remove('hidden');
  });
  
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    deferredPrompt = null;
    installContainer.classList.add('hidden');
  });
  
  window.addEventListener('appinstalled', () => {
    installContainer.classList.add('hidden');
    deferredPrompt = null;
  });
  
  // ---------- Event Listeners ----------
  
  // Number buttons
  document.querySelectorAll('[data-number]').forEach(btn => {
    btn.addEventListener('click', () => handleNumber(btn.dataset.number));
  });
  
  // Operator buttons
  document.querySelectorAll('[data-operator]').forEach(btn => {
    btn.addEventListener('click', () => handleOperator(btn.dataset.operator));
  });
  
  // Function buttons
  document.querySelector('[data-action="clear"]').addEventListener('click', handleClear);
  document.querySelector('[data-action="backspace"]').addEventListener('click', handleBackspace);
  document.querySelector('[data-action="percent"]').addEventListener('click', handlePercent);
  document.querySelector('[data-action="calculate"]').addEventListener('click', calculate);
  
  // Decimal button
  document.querySelector('[data-number="."]').addEventListener('click', handleDecimal);
  
  // Memory buttons
  document.querySelector('[data-memory="mc"]').addEventListener('click', memoryClear);
  document.querySelector('[data-memory="mr"]').addEventListener('click', memoryRecall);
  document.querySelector('[data-memory="m+"]').addEventListener('click', memoryAdd);
  document.querySelector('[data-memory="m-"]').addEventListener('click', memorySubtract);
  
  // Constant buttons
  document.querySelectorAll('.constant-btn').forEach(btn => {
    btn.addEventListener('click', () => handleConstant(btn.dataset.constant));
  });
  
  // History toggle
  historyToggle.addEventListener('click', () => {
    historyPanel.classList.toggle('hidden');
  });
  
  // Clear history
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Settings/Converter toggle
  settingsToggle.addEventListener('click', () => {
    converterPanel.classList.toggle('hidden');
    historyPanel.classList.add('hidden');
  });
  
  // Close converter
  closeConverter.addEventListener('click', () => {
    converterPanel.classList.add('hidden');
  });
  
  // Voice input
  voiceBtn.addEventListener('click', () => {
    if (!recognition) {
      initSpeechRecognition();
    }
    
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      voiceText.textContent = 'Not supported';
      setTimeout(() => {
        voiceText.textContent = 'Tap to speak';
      }, 2000);
    }
  });
  
  // Keyboard support
  document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    // Numbers
    if (/^[0-9]$/.test(key)) {
      handleNumber(key);
    }
    
    // Operators
    if (key === '+') handleOperator('+');
    if (key === '-') handleOperator('-');
    if (key === '*') handleOperator('*');
    if (key === '/') {
      e.preventDefault();
      handleOperator('/');
    }
    
    // Decimal
    if (key === '.') handleDecimal();
    
    // Enter/Return for calculate
    if (key === 'Enter' || key === '=') {
      e.preventDefault();
      calculate();
    }
    
    // Backspace
    if (key === 'Backspace') {
      handleBackspace();
    }
    
    // Escape for clear
    if (key === 'Escape') {
      handleClear();
    }
    
    // Percentage
    if (key === '%') {
      handlePercent();
    }
  });
  
  // Prevent page scroll on spacebar
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
    }
  });
  
  // ---------- Initialize ----------
  function init() {
    loadFromLocalStorage();
    initConverter();
    updateDisplay();
    resultDisplay.textContent = '0';
    
    // Add haptic feedback if supported
    if ('vibrate' in navigator) {
      document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          navigator.vibrate(50);
        });
      });
    }
  }
  
  // Start the app
  init();
})();
