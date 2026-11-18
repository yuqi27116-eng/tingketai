// Background / gesture resume: runs t11 (state before the click), then a real mouse click anywhere, then checks.
// Also exercises rate limiting with a stub AI that refuses the first calls.
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage(); await p.route(/^https?:/,r=>r.abort());
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(300);
  const a=await p.evaluate(`(${fs.readFileSync(path.join(__dirname,'t11.js'),'utf8')})()`);
  await p.mouse.click(700,600); await p.waitForTimeout(100);
  a.afterClickAnywhere=await p.evaluate(()=>{ h=null; return {listening, interrupted, segments:cur.segments.map(s=>s.kind||"first")}; });
  await p.evaluate(()=>{ cur.lines.length; });
  const r=await p.evaluate(async()=>{ const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    await endRecording(); await sleep(100);
    // ---------- (b) rate limiting ----------
    let refuse=4, calls=[]; const fn=async(pr,o={})=>{ calls.push(["text",Date.now()]); if(refuse>0){ refuse--; throw {code:"rate_limited",message:"rate limited"}; } const t="译"+String(pr).split("\n").pop().slice(0,12); o.onText&&o.onText({text:t}); return {text:t}; };
    fn.json=async(pr)=>{ calls.push(["json",Date.now()]); if(refuse>0){ refuse--; throw {code:"rate_limited",message:"rate limited"}; } const n=(pr.match(/^\d+\. /gm)||[]).length; return {t:Array.from({length:n},(_,k)=>"批译"+(k+1))}; };
    sample=fn; dict=null;
    document.getElementById("newRec").click(); document.getElementById("micBtn").click(); listening=true;
    const t0=Date.now();
    for(let i=1;i<=8;i++){ addLine(`Frase número ${i} de la clase.`); await sleep(40); }
    await sleep(300);
    const mid={chip:document.getElementById("netTxt").textContent, until:Math.round((rl.until-Date.now())/1000), conc:rl.conc, pendingText:document.querySelector(".tline .t.pending")?.textContent, throttled:throttled()};
    for(let i=0;i<280&&cur.lines.some(l=>l.t==null);i++) await sleep(250);
    return {mid, done:{secs:Math.round((Date.now()-t0)/1000), allTranslated:cur.lines.every(l=>l.t), translations:cur.lines.map(l=>l.t), calls:calls.length, jsonBatches:calls.filter(c=>c[0]==="json").length}};
  });
  console.log(JSON.stringify({background:a,rateLimit:r},null,1)); if(errs.length) console.log('pageerrors',errs);
  await b.close();
})();
