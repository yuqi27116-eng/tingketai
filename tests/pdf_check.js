// PDF slide path: builds a 6-page PDF from the demo deck, loads it like an upload, plays the demo script,
// then reports tracking accuracy and whether the red marker sits on a text line of the rendered page.
// Usage: node tests/pdf_check.js <dir with pdfjs-dist-3.11.174 and jszip-3.10.1 unpacked> [screenshot.png]
const {chromium}=require('playwright'); const fs=require('fs'); const path=require('path');
(async()=>{
  const libs=process.argv[2], shot=process.argv[3];
  const b=await chromium.launch();
  // 1) make the PDF
  const mk=await b.newPage();
  await mk.goto('file://'+path.resolve(__dirname,'..','index.html')); await mk.waitForTimeout(200);
  const deck=await mk.evaluate(()=>DEMO_DECK);
  await mk.setContent(`<style>@page{size:1280px 720px;margin:0}body{margin:0;font-family:sans-serif}section{width:1280px;height:720px;padding:60px 80px;box-sizing:border-box;page-break-after:always}h1{font-size:54px;color:#123}li{font-size:30px;margin:14px 0}</style>`+
    deck.map(p=>`<section><h1>${p[0]}</h1><ul>${p.slice(1).map(x=>`<li>${x}</li>`).join("")}</ul></section>`).join(""));
  const pdf=await mk.pdf({width:'1280px',height:'720px',printBackground:true}); await mk.close();
  // 2) app with cdnjs served from local copies
  const p=await b.newPage({viewport:{width:1440,height:900}});
  await p.route(/^https?:/,r=>{ const u=r.request().url();
    const m={"pdf.min.js":"pdfjs-dist-3.11.174/package/build/pdf.min.js","pdf.worker.min.js":"pdfjs-dist-3.11.174/package/build/pdf.worker.min.js","jszip.min.js":"jszip-3.10.1/package/dist/jszip.min.js"};
    const k=Object.keys(m).find(k=>u.includes("cdnjs")&&u.endsWith("/"+k)); if(k) return r.fulfill({body:fs.readFileSync(path.join(libs,m[k])),contentType:"text/javascript"}); r.abort(); });
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto('file://'+path.resolve(__dirname,'..','index.html')); await p.waitForTimeout(300);
  const res=await p.evaluate(async b64=>{
    const sleep=ms=>new Promise(r=>setTimeout(r,ms));
    const bytes=Uint8Array.from(atob(b64),c=>c.charCodeAt(0));
    const file=new File([bytes],"Tema4_intercambio.pdf",{type:"application/pdf"});
    const d=await deckFromFile(file,null); decks.push(d); lay.lastDeck=d.id;
    document.getElementById("srcLang").value="es";
    beginRecording(); listening=true;
    const expect=[0,0,1,1,1,2,2,3,3,3,3,4,4,4,5,5,5,5,5]; const marks=[];
    for(const [k,[sent]] of DEMO_SCRIPT.entries()){
      let said=""; for(const w of sent.split(" ")){ said+=(said?" ":"")+w; onPartialText(said); renderTranscript(); await sleep(15); }
      await sleep(80); onFinalText(said); await renderSlides(); await sleep(60);
      const hl=document.querySelector("#sView .lhl"); marks.push(hl?1:0);
      if(k===8) document.getElementById("transcript").dataset.k8=document.querySelector("#sView .pmark b")?.textContent||"";
    }
    const which=o=>{ const n=norm(o).slice(0,25); return DEMO_SCRIPT.findIndex(x=>norm(x[0]).includes(n)); };
    let ok=0,tot=0; cur.lines.forEach(l=>{ const k=which(l.o); if(k<0) return; tot++; if(l.pg===expect[k]) ok++; });
    return {pages:d.pages.length, titles:d.pages.map(x=>x.title), stored:d.file.split(":")[0], accuracy:`${ok}/${tot}`, canvas:!!document.querySelector("#sView canvas"), lineMarkerShownAfterSentences:marks.join(""), label:document.querySelector("#sView .pmark b")?.textContent};
  },pdf.toString('base64'));
  console.log(JSON.stringify(res,null,1)); if(errs.length) console.log("pageerrors",errs);
  if(shot) await p.screenshot({path:shot});
  await b.close();
})();
