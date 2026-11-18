# Nexus Calculator

A calculator with a sci-fi control panel look. It reads whole expressions, takes voice input, and installs as a PWA that works offline.

Live demo: https://nexus-calculator-nine.vercel.app

## Features

- Type a full expression like `5 + 3 * 2` and get 11. It follows operator precedence and handles brackets, as in `(5 + 3) * 2`.
- Voice input: say "five plus three times two". It also understands "squared", "cubed" and "to the power of".
- Constants: π, e, φ (the golden ratio), c (the speed of light) and h (Planck's constant).
- Memory keys (MC, MR, M+, M-) and a history you can tap to reuse an earlier result.
- Unit converter for length, weight and temperature.
- Percentages, keyboard support (Enter to calculate, Esc to clear), and a short vibration on each key where the phone supports it.

## Design

The look is a dark navy panel with a single blue accent, thin borders and Share Tech Mono for all the text.

## Run it locally

It's plain HTML, CSS and JavaScript, so any static server works:

```bash
git clone https://github.com/Aisha-Aliyu/Nexus-Calculator.git
cd Nexus-Calculator
npx serve
```

Voice input uses the browser's Web Speech API, which works best in Chrome and Edge.
