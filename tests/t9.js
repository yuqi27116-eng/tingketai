async ()=>{
  // Review mode: after the demo ends, clicking any one of mind map / transcript / player bar / slide / key point
  // must move the other modules to the same moment.
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  demo={speed:8}; await runDemo();
  for(let i=0;i<80&&!(cur.mindmap&&cur.mindmap.root);i++) await sleep(100);
  const s=cur, out={reviewing:reviewing(), stageReview:document.getElementById("stage").classList.contains("review"), tab:document.querySelector(".tabs .on").textContent, endBtnHidden:document.getElementById("endBtn").hidden, mapSource:s.mindmap?"ai":"local"};
  const state=()=>({ms:pl.ms, line:revLine+1, lineNow:document.querySelector(".tline.now")?.id, slide:sv.pg+1, map:document.querySelector(".mmn.on")?.textContent, key:document.querySelector(".kpi.on b")?.textContent||null, bar:document.getElementById("plFill").style.width});
  // 1) click a transcript line (the Fick sentence)
  const fick=s.lines.findIndex(l=>/Fick/.test(l.o));
  document.getElementById("L"+(fick+1)).querySelector(".o").click(); await sleep(80);
  out.clickTranscript=state();
  // 2) click a mind map node (dead space)
  const node=[...document.querySelectorAll(".mmn")].find(b=>/死腔/.test(b.textContent)); node.click(); await sleep(80);
  out.clickMap=state();
  // 3) click a key point
  document.querySelector(".kpi").click(); await sleep(80);
  out.clickKey=state();
  // 4) click a slide in the strip (page 5)
  document.querySelector('#sStrip [data-spg="4"]').click(); await sleep(80);
  out.clickSlide=state();
  // 5) drag the player bar to 10%
  const bar=document.getElementById("plBar"), r=bar.getBoundingClientRect();
  bar.dispatchEvent(new PointerEvent("pointerdown",{clientX:r.left+r.width*0.1,clientY:r.top+5,pointerId:1,bubbles:true})); bar.dispatchEvent(new PointerEvent("pointerup",{pointerId:1,bubbles:true})); await sleep(80);
  out.clickBar=state();
  // 6) play (no audio in the demo: the silent timeline clock) at 2× for 1.5 s
  pl.rate=2; plPlay(); await sleep(1500); plPause();
  out.played=state();
  out.notesHideMap=!/思维导图/.test(document.getElementById("notes").textContent);
  out.mapNodes=document.querySelectorAll(".mmn").length;
  return out;
}
