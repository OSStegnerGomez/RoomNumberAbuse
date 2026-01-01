if (true) {
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
//const gmp = require("bigint-gmp");
// 1. FAST BIGINT TO STRING (Divide and Conquer)
//function fastToString(n) {
  // Optimization: Use default for smaller numbers to avoid recursion overhead
//  const bitLen = n.toString(2).length;
//  if (bitLen < 65536) return n.toString();
//  const mid = Math.floor(bitLen / 6.64385); // Approx: log10(n)/2
//  const p = 10n ** BigInt(mid);
//  const high = n / p;
//  const low = n % p;
//  return fastToString(high) + fastToString(low).padStart(mid, '0');
//}
function fastToString(n) {
  const bitLen = n.toString(2).length;
  if (bitLen < 65536) return n.toString();
  const stack = [{ n, bitLen }];
  const out = [];
  while (stack.length) {
    const { n, bitLen } = stack.pop();
    if (bitLen < 65536) {
      out.push(n.toString()); continue;
    }
    const mid = Math.floor(bitLen / 6.64385);
    const p = 10n ** BigInt(mid);
    const high = n / p; const low = n % p;
    // Push in reverse order because stack is LIFO
    stack.push({ n: low, bitLen: (low === 0n ? 1 : low.toString(2).length), mid });
    stack.push({ n: high, bitLen: high.toString(2).length });
  }
  // Now rebuild the string with correct zero‑padding
  let result = "";
  let pendingPad = null;
  for (const part of out) {
    if (typeof part === "string") {
      if (pendingPad !== null) {
        result += part.padStart(pendingPad, "0"); pendingPad = null;
      } else {result += part;}
    } else {pendingPad = part;}
  }
  return result;
}

// 2. ULTRALIGHT PATTERN SCANNER
  function scanMax(str) {
  const len = str.length;
  if (len < 6) return { seg: null, max: 0 };
  let max = 0; let matches = new Map(); let bestSeg = null;
  for (let i = 0; i <= len - 6; i++) {
    const c0 = str.charCodeAt(i), c1 = str.charCodeAt(i+1), c2 = str.charCodeAt(i+2);
    const c3 = str.charCodeAt(i+3), c4 = str.charCodeAt(i+4), c5 = str.charCodeAt(i+5);
    const C1 = (c0 === c1 && c1 === c2) &&
               (c0 !== c3 && c0 !== c4 && c0 !== c5 && c3 !== c4 && c4 !== c5 && c3 !== c5);
    const C2 = !C1 && (c3 === c4 && c4 === c5) &&
               (c0 !== c1 && c1 !== c2 && c2 !== c3 && c0 !== c2 && c0 !== c3 && c1 !== c3);
    if (C1 || C2) {const seg = str.slice(i, i + 6); const count = (matches.get(seg)||0)+1; matches.set(seg,count); 
      if (count > max) {max = count;bestSeg = seg;}
    }}; return { seg: bestSeg, max };
}

//Für die Einfeildsporthalle.
function scanMaxNoAlloc(str) {
  const len = str.length;
  if (len < 6) return 0;
  // 10^6 possible 6-digit combinations → fits in array
  const counts = new Uint16Array(1_000_000);
  let max = 0;
  // Preload first 6 digits into a rolling hash
  let h = 0;
  for (let i = 0; i < 6; i++) {
    h = h * 10 + (str.charCodeAt(i) - 48);
  }
  // Helper to check patterns without allocating
  function matchesPattern(i) {
    const c0 = str.charCodeAt(i),     c1 = str.charCodeAt(i+1), c2 = str.charCodeAt(i+2),   c3 = str.charCodeAt(i+3),c4 = str.charCodeAt(i+4),   c5 = str.charCodeAt(i+5);
    const C1 = (c0 === c1 && c1 === c2) && (c0 !== c3 && c0 !== c4 && c0 !== c5 && c3 !== c4 && c4 !== c5 && c3 !== c5);
    const C2 = !C1 && (c3 === c4 && c4 === c5) && (c0 !== c1 && c1 !== c2 && c2 !== c3 &&  c0 !== c2 && c0 !== c3 && c1 !== c3);
    return C1 || C2;
  }
  // Scan
  for (let i = 0; i <= len - 6; i++) {
    if (matchesPattern(i)) {
      const v = ++counts[h];
      if (v > max) {  max = v; if (max >= 1e10) return max;}
    }
    // Advance rolling hash: remove left digit, add right digit
    if (i + 6 < len) {
      const left = str.charCodeAt(i) - 48; const right = str.charCodeAt(i + 6) - 48; h = (h % 100000) * 10 + right;
    }
  }
  return max;
}

  function scan(str) {
    const len = str.length;
    if (len < 6) return null;
    const matches = new Map();
    for (let i = 0; i <= len - 6; i++) {
    const c0 = str.charCodeAt(i), c1 = str.charCodeAt(i+1), c2 = str.charCodeAt(i+2);
    const c3 = str.charCodeAt(i+3), c4 = str.charCodeAt(i+4), c5 = str.charCodeAt(i+5);
    // AAABCD
    const C1 = (c0 === c1 && c1 === c2) && 
               (c0 !== c3 && c0 !== c4 && c0 !== c5 && c3 !== c4 && c4 !== c5 && c3 !== c5);
    // ABCDDD
    const C2 = !C1 && (c3 === c4 && c4 === c5) && 
               (c0 !== c1 && c1 !== c2 && c2 !== c3 && c0 !== c2 && c0 !== c3 && c1 !== c3);
    if (C1 || C2) {
      const seg = str.slice(i, i + 6);
      matches.set(seg, (matches.get(seg) || 0) + 1);
    }
  }
  return matches;
}
function fibPair(n) {
  let a = 0n, b = 1n; let stack = [];
  for (let bit = n; bit > 0; bit >>= 1) stack.push(bit & 1);
  while (stack.length) {const bit = stack.pop();const c = a * (b * 2n - a);const d = a*a + b*b;  if (bit === 0) { a = c; b = d; } else { a = d; b = c + d; }}
  return [a, b];
}

// 3. MULTI-THREADED COORDINATOR
if (isMainThread) {
  let n = 4652000; //Du kannst hier eine beliebige Zahl eingeben.
  const threadCount = require('os').cpus().length;
  console.log(`[${new Date().toTimeString().split(" ")[0]}] Starting search at n=${n} with ${threadCount} threads...`);
  for (let i = 0; i < threadCount; i++) {
    const worker = new Worker(__filename, { workerData: { startN: n + i * 2 } });
    worker.on('message', (msg) => console.log(`[${new Date().toTimeString().split(" ")[0]}] "Einfeldsporthalle, PJS, Mainz 55122" weint ${msg.max}-fach auf die ${msg.n}-te Sequenzzahl.`));
    worker.on("uncaughtException", err => console.error("Crash:", err));
    worker.on("unhandledRejection", err => console.error("Rejection:", err));
  }
} else {
  // Worker Logic
  let n = workerData.startN; const directionUp = true
  const numThreads = require('os').cpus().length; const s = numThreads*2
  let [step,Step] = fibPair(s); //F(n)
  let [f0,f1] = fibPair(n); //F(m)
  let stepM = Step-step;
  (async function loop() {
    while (true) {
      for (let i = 0; i < 100; ++i){
      if (n%1000 == 0) console.log(`[${new Date().toTimeString().split(" ")[0]}] ${n}. Reihenfolgenzahl erreicht`)
          let max = 0;
	  [scanMaxNoAlloc(fastToString(f0))].forEach(v=>{if(v>max)max=v});
	  [scanMaxNoAlloc(fastToString(f1))].forEach(v=>{if(v>max)max=v});
	  if (max >=10) {parentPort.postMessage({ n, max })}
          if (directionUp) {const temp = f0*stepM+f1*step;f1 = f1*Step+f0*step;f0 = temp;n+=s;} else {
const temp = f0*Step-step*f1; f1 = Step*f1-(f0+f1)*step; f0 = temp;n-=s;} //DER COUNTDOWN
      }
      await new Promise(r => setImmediate(r));
    }
  })();
}}
