async ()=>{
  // v15: network loss & recovery, three answers + refresh, outline with key points, editing source/outline, paragraphs.
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={};
  // --- network: AI fails like a dropped connection, then comes back
  let down=true, calls=0;
  const fn=async(p,o={})=>{ calls++; if(down) throw new TypeError("Failed to fetch"); const t="【译】"+String(p).split("\n").pop().slice(0,20); o.onText&&o.onText({text:t}); return {text:t}; };
  fn.json=async(p)=>{ calls++; if(down) throw new TypeError("Failed to fetch"); if(/Translate every numbered item/.test(p)){ const it=[...String(p).matchAll(/^\d+\. \[(piece|sentence|unfinished)\] (.*)$/gm)]; return {t:it.map(x=>"【译】"+x[2].slice(0,20))}; } return {}; };
  sample=fn; document.getElementById("srcLang").value="es";
  beginRecording(); listening=true;
  for(const x of ["Primera frase del profesor.","Segunda frase importante.","Tercera frase."]){ addLine(x); await sleep(30); }
  await translateIdle(); await sleep(50);
  out.offline={netOk:net.ok, chip:document.getElementById("netTxt").textContent, chipClass:document.getElementById("netChip").className, waiting:cur.lines.map(l=>l.t), pendingText:document.querySelector(".tline .t.pending")?.textContent, stillRecording:recording};
  down=false; setNetOk(true); await translateIdle(); await sleep(100);
  out.recovered={netOk:net.ok, chip:document.getElementById("netTxt").textContent, translated:cur.lines.map(l=>l.t)};
  await endRecording(); await sleep(200);
  // --- demo for questions / outline / paragraphs (offline stand-in AI)
  sample=null; demo={speed:8}; await runDemo();
  for(let i=0;i<150&&!(cur.mindmap&&cur.mindmap.root&&(cur.questions||[]).length);i++) await sleep(100);
  const s=cur, q=s.questions[0];
  out.answers={kinds:Object.keys(q.answers), pick:q.pick, precise:q.answers.precise.zh.slice(0,20)};
  q.open=true; renderTranscript(); await sleep(30);
  document.querySelector('.qbar [data-qpick][data-k="safe"]').click(); await sleep(30);
  out.answers.afterPickSafe={pick:q.pick, shown:document.querySelector(".qbar .qa p").textContent.slice(0,20)};
  document.querySelector('.qbar [data-qre]').click(); for(let i=0;i<30&&q.busy!==undefined;i++) await sleep(100); await sleep(50);
  out.answers.afterRefresh={simple:q.answers.simple.zh, shown:document.querySelector(".qbar .qa p").textContent.slice(0,20)};
  // --- outline with key points nested
  showTab("Notes"); renderLive();
  out.outline={entries:document.querySelectorAll("#live .tlrow").length, nestedKeys:document.querySelectorAll("#live .tlrow .tlkey").length, looseKeys:document.querySelectorAll("#live .keys button").length, starred:document.querySelectorAll("#live .tlb.haskey").length};
  // edit an outline entry
  document.querySelector("#live [data-tledit]").click(); await sleep(20);
  const inp=document.querySelector("#live .tlin"); inp.value="我改过的纲要"; inp.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true})); await sleep(30);
  out.outline.edited=s.timeline[0].text+" / edited="+!!s.timeline[0].edited;
  // --- paragraphs
  const info=computeParas(s);
  out.paras={lines:s.lines.length, paragraphs:info.filter(x=>x.start).length, reasons:info.map((x,i)=>x.start?`${i+1}:${x.why||"首段"}`:null).filter(Boolean), dividers:document.querySelectorAll("#transcript .pdiv").length};
  // manual: join paragraph 2 into 1, then split inside a paragraph
  const firstBreak=info.findIndex((x,i)=>i>0&&x.start);
  document.querySelector(`[data-br="${firstBreak}"]`).click(); await sleep(20);
  const inner=computeParas(s).findIndex((x,i)=>i>firstBreak+1&&!x.start);
  document.querySelector(`[data-br="${inner}"]`).click(); await sleep(20);
  const info2=computeParas(s);
  out.paras.manual={joined:!info2[firstBreak].start, split:info2[inner].start&&info2[inner].why, translationsUntouched:s.lines.every(l=>l.t!=null)};
  // --- edit a transcript line (offline demo AI retranslates it)
  const before=s.lines[2].t;
  document.querySelector('[data-edit="2"]').click(); await sleep(20);
  const ta=document.querySelector(".oedit"); ta.value="Cada pulmón tiene unos trescientos millones de alveolos."; ta.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
  for(let i=0;i<30&&s.lines[2].t==null;i++) await sleep(100);
  out.edit={o:s.lines[2].o, edited:s.lines[2].oEdited, tBefore:before.slice(0,15), tAfter:(s.lines[2].t||"").slice(0,30), marker:!!document.querySelector("#L3 small")};
  return out;
}
