async ()=>{
  // v18: live question detection (<200 ms, completeness, context), Obsidian-style notes, live caption on top.
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={};
  // stub AI: translation batches + question classification
  const fn=async(p,o={})=>({text:"译文"});
  fn.json=async(p)=>{ p=String(p);
    if(/Translate every numbered item/.test(p)){ const it=[...p.matchAll(/^\d+\. \[(piece|sentence|unfinished)\] (.*)$/gm)]; return {t:it.map(()=>"译文")}; }
    if(/may contain a question/.test(p)){ const rhet=/Por qué pasa esto\?/.test(p.split("as detected")[1]||""); return rhet?{kind:"none"}:{kind:"question",q_src:"¿Alguien sabe de qué depende la difusión del oxígeno?",q_tgt:"有人知道氧气的扩散取决于什么吗？",answers:{precise:{zh:"取决于面积、分压差和膜厚度。",say:"Depende del área, del gradiente y del grosor."},simple:{zh:"压差。",say:"Del gradiente."},safe:{zh:"和分压差有关。",say:"Creo que del gradiente."}}}; }
    return {}; };
  sample=fn; document.getElementById("srcLang").value="es";
  beginRecording(); listening=true;
  const said=t=>onPartialText(t);
  // context before the question
  said("Hemos visto la membrana alveolocapilar."); onFinalText("Hemos visto la membrana alveolocapilar."); await sleep(20);
  said("Su grosor es muy pequeño."); onFinalText("Su grosor es muy pequeño."); await sleep(20);
  // the question arrives word by word; measure how fast the card appears
  let words="¿Alguien sabe de qué depende la difusión del".split(" "), acc="", tShow=null;
  for(const w of words){ acc+=(acc?" ":"")+w; const t0=performance.now(); said(acc); if(!tShow&&document.querySelector("#tqbar .qbar")) tShow=performance.now()-t0; }
  out.live={msToCard:tShow!=null?+tShow.toFixed(2):null, header:document.querySelector("#tqbar .qh span")?.textContent, before:[...document.querySelectorAll("#tqbar .qctx.before")].map(e=>e.textContent.slice(0,30)), incompleteShown:!!document.querySelector("#tqbar .qmore")};
  // a pause closes the sentence while the question is unfinished ("…del") → it waits for the rest
  onFinalText(acc); await sleep(20);
  out.afterPause={waiting:!!cur.liveQ.waiting, done:cur.liveQ.done};
  said("oxígeno en el pulmón?"); onFinalText("oxígeno en el pulmón?"); await sleep(20);
  out.completed={text:cur.liveQ.text, done:cur.liveQ.done, pending:(cur.questions||[]).map(q=>q.kind)};
  // lines that follow are added as context after
  said("Pensadlo un momento."); onFinalText("Pensadlo un momento."); await sleep(20);
  out.after=(cur.questions[0].after||[]).map(x=>x.o);
  // AI confirms and writes the three answers
  await sleep(50); await checkQuestions(cur,true); await sleep(30);
  out.ai={kind:cur.questions[0].kind, qt:cur.questions[0].qt, answers:Object.keys(cur.questions[0].answers||{})};
  // a rhetorical question: shown at once, removed after the AI says it is not a real question
  recStart-=20000;   // 20 s later in the lecture
  said("¿Por qué pasa esto?"); onFinalText("¿Por qué pasa esto?"); await sleep(20);
  const shownRhet=document.querySelector("#tqbar .qo")?.textContent;
  said("Pues porque el gradiente es alto."); onFinalText("Pues porque el gradiente es alto."); await sleep(20);
  await checkQuestions(cur,true); await sleep(30);
  out.rhetorical={shown:shownRhet, kinds:cur.questions.map(q=>q.kind), barNow:document.querySelector("#tqbar .qo")?.textContent};
  // live caption on top
  said("La siguiente parte trata de");
  const ls=document.getElementById("liveStrip"), tr=document.getElementById("transcript");
  out.caption={visible:!ls.hidden, aboveTranscript:ls.getBoundingClientRect().bottom<=tr.getBoundingClientRect().top+1, text:document.getElementById("liveTxt").textContent.slice(0,30), label:document.getElementById("liveLbl").textContent};
  onFinalText("La siguiente parte trata de la ventilación.");
  await endRecording(); await sleep(100);
  // ---------- notes vault ----------
  const s=cur;
  sessions.push({id:"old1",title:"旧录音",src:"es",tgt:"zh",created:1,startedAt:1,durationMs:1000,lines:[{ms:0,o:"x",t:"x"}],mynotes:"旧笔记内容 #复习"});
  migrateMyNotes();
  out.migrated=notes.filter(n=>n.sessionId==="old1").map(n=>n.body);
  showTab("Mine");
  const ta=document.getElementById("mdIn");
  ta.value="# 菲克定律\n面积越大扩散越快 #考点\n见 [[分压差"; ta.setSelectionRange(ta.value.length,ta.value.length); ta.dispatchEvent(new Event("input",{bubbles:true}));
  await sleep(30);
  out.autocomplete={open:!document.getElementById("acPop").hidden, items:[...document.querySelectorAll("#acPop button")].map(b=>b.textContent)};
  ta.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true})); await sleep(250);
  const first=notes.find(n=>n.id===noteCur);
  out.note1={title:first.title, body:first.body, sessionId:first.sessionId===s.id, missingLinkStyle:!!document.querySelector("#mdOut a.wl.missing"), tag:document.querySelector("#mdOut .ntag")?.textContent};
  // follow the link → creates the note, which shows the backlink
  document.querySelector("#mdOut a.wl").click(); await sleep(50);
  const second=notes.find(n=>n.id===noteCur);
  out.note2={title:second.title, backlinks:[...document.querySelectorAll("#nvFoot .bl b")].map(b=>b.textContent)};
  // rename the second note: the link in the first one follows
  const tin=document.getElementById("nvTitle"); tin.value="分压与扩散"; tin.dispatchEvent(new Event("change")); await sleep(30);
  out.rename={firstBodyNow:notes.find(n=>n===first).body.split("\n").pop()};
  // quick switcher
  document.dispatchEvent(new KeyboardEvent("keydown",{key:"o",ctrlKey:true,bubbles:true})); await sleep(20);
  const qi=document.getElementById("qsIn"); qi.value="菲克"; qi.dispatchEvent(new Event("input")); await sleep(20);
  out.switcher={open:!document.getElementById("qsModal").hidden, items:[...document.querySelectorAll("#qsList button")].map(b=>b.textContent)};
  qi.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true})); await sleep(30);
  out.switcher.opened=notes.find(n=>n.id===noteCur).title;
  // vault list + tag filter
  document.getElementById("nvList").click(); await sleep(20);
  out.vault={groups:[...document.querySelectorAll("#nvItems h5")].map(h=>h.textContent), tags:[...document.querySelectorAll("#nvTags .ntag")].map(t=>t.textContent)};
  return out;
}
