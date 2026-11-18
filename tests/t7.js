async ()=>{
  // Token-usage benchmark: plays tests/lecture.js through the real segmentation pipeline with a stub AI
  // that records every prompt, then ends the session and asks two chat questions.
  // Works on old and new versions (only uses functions both have).
  const est=s=>{ s=typeof s==="string"?s:JSON.stringify(s); const cjk=(s.match(/[　-鿿가-힯]/g)||[]).length; return Math.round(cjk*1.1+(s.length-cjk)/3.6); };
  const log=[];
  const kindOf=p=>{ p=typeof p==="string"?p:JSON.stringify(p);
    if(/unfinished sentence/.test(p)) return "draft";
    if(/piece by piece|whole sentence/i.test(p)) return "whole";
    if(/may flag|important/.test(p)&&/"key"/.test(p)) return "keys";
    if(/may contain a question/.test(p)) return "question";
    if(/Outline so far|outline/i.test(p)&&/extend/.test(p)) return "outline";
    if(/course folder|short Chinese title/.test(p)) return "classify";
    if(/revising a finished lecture/.test(p)) return "refine";
    if(/study notes/.test(p)) return "notes";
    if(/answer questions about a lecture|Question:/.test(p)) return "chat";
    return "translate"; };
  const fn=async(p,o={})=>{ const out="这是一段模拟译文，用来计量。"; log.push([kindOf(p),est(p),est(out),o.modelTier||""]); if(o.onText) o.onText({text:out}); return {text:out}; };
  fn.json=async(p,o={})=>{ const k=kindOf(p); let r={};
    if(/Translate every numbered item/.test(p)){ const it=[...String(p).matchAll(/^\d+\. \[(piece|sentence|unfinished)\] (.*)$/gm)]; r={t:it.map(()=>"模拟译文")}; }
    if(k==="outline") r={extend:false,summary:"肺泡结构与气体交换"};
    if(k==="keys") r={key:true,start:1,end:2,title:"菲克定律",explain:"扩散量与面积和分压差成正比、与厚度成反比。"};
    if(k==="question") r={kind:"question",q_src:"x",q_tgt:"y",answer:"CO2 溶解度高。",say:"Porque es más soluble."};
    if(k==="classify") r={folder:"生理学",isNew:true,title:"肺的气体交换"};
    if(k==="refine") r={lines:[]};
    log.push([k,est(p),est(r),o.modelTier||""]); return r; };
  fn.limits=async()=>({images:false});
  sample=fn;
  if(typeof prefs!=="undefined"){ Object.assign(prefs,{autoRefine:false}); }
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  // fixed folder with a 40-term glossary, like a real course after importing slides
  const f={id:"fx",name:"生理学",terms:Array.from({length:40},(_,i)=>`término${i} = 术语${i}`).concat(["ley de Fick = 菲克定律","alveolo = 肺泡","surfactante = 表面活性物质","shunt = 分流","espacio muerto = 死腔"]).join("\n"),brief:"呼吸生理学：肺泡结构、气体扩散、通气血流比。",docs:[],created:Date.now()};
  folders.push(f); renderFolderSel(); document.getElementById("folderSel").value="fx";
  document.getElementById("srcLang").value="es"; document.getElementById("tgtLang").value="zh";
  beginRecording(); listening=true;
  const T0=Date.now();
  for(const [sent,pause] of window.__LECTURE){
    let said=""; for(const w of sent.split(" ")){ said+=(said?" ":"")+w; onPartialText(said); if(typeof scheduleDraft==="function") scheduleDraft(); await sleep(70); }
    await sleep(pause); onFinalText(said); await sleep(150);
    // compress the clock so the per-minute outline fires as it would over ~3 real minutes
    recStart-=9000;
    maybeSummarize(cur); checkKeys(cur); checkQuestions(cur);
  }
  await endRecording();
  await new Promise(r=>setTimeout(r,800));
  const s=cur||sessions[sessions.length-1]; cur=s;
  await ask("老师说的菲克定律是什么意思？"); await ask("有没有作业？");
  const by={}; let tin=0,tout=0;
  for(const [k,i,o] of log){ by[k]=by[k]||{calls:0,in:0,out:0}; by[k].calls++; by[k].in+=i; by[k].out+=o; tin+=i; tout+=o; }
  return {calls:log.length,in:tin,out:tout,by,lines:s.lines.length,ms:Date.now()-T0};
}
