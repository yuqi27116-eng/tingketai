async ()=>{
  // New features: offline demo end-to-end, slide tracking accuracy, transcript follow / scroll-back, Markdown notes.
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  const out={};
  demo={speed:6};               // play the demo fast
  const run=runDemo();
  // halfway through: the reader scrolls up — following must stop, the live strip must appear
  await sleep(4500);
  const box=document.getElementById("transcript");
  box.scrollTop=0; box.dispatchEvent(new Event("scroll")); await sleep(50);
  const linesAtScroll=cur.lines.length;
  await sleep(2500);
  out.follow={afterScrollUp:follow, stripShown:!document.getElementById("liveStrip").hidden, stayedAtTop:box.scrollTop<5,
    newLinesMeanwhile:cur.lines.length-linesAtScroll, stripText:document.getElementById("liveGo").textContent};
  document.getElementById("liveStrip").click(); await sleep(50);
  out.follow.backToLatest=follow&&box.scrollHeight-box.scrollTop-box.clientHeight<48;
  await run;
  for(let i=0;i<80&&(recording||!cur.notes);i++) await sleep(100);
  const s=cur;
  // expected slide (0-based) for each script sentence
  const expect=[0,0,1,1,1,2,2,3,3,3,3,4,4,4,5,5,5,5,5];
  const which=o=>{ const n=norm(o).slice(0,25); return DEMO_SCRIPT.findIndex(x=>norm(x[0]).includes(n)); };
  let ok=0, tot=0; const wrong=[];
  s.lines.forEach(l=>{ const k=which(l.o); if(k<0) return; tot++; if(l.pg===expect[k]) ok++; else wrong.push([k,l.pg,l.o.slice(0,40)]); });
  out.tracking={lines:s.lines.length, matched:tot, correct:ok, accuracy:Math.round(ok/tot*100)+"%", wrong};
  out.ai={timeline:(s.timeline||[]).map(x=>x.text), keyPoints:(s.keyPoints||[]).map(k=>k.title), questions:(s.questions||[]).map(q=>q.qt), notesHasFick:/菲克/.test(s.notes||""), title:s.title, usage:s.ai};
  // slide pane during review: click a page chip → transcript jumps, lines on that page get highlighted
  showSlide(3,{user:true,jumpTranscript:true}); await sleep(100);
  out.review={viewPg:sv.pg, onpgLines:document.querySelectorAll(".tline.onpg").length, cardMarked:!!document.querySelector(".scard p.here")||null};
  const chip=document.querySelector(".pgchip"); chip&&chip.click(); await sleep(60);
  out.review.chipFocus=sv.focus&&sv.focus.slice(0,30); out.review.reviewMarker=!!document.querySelector(".scard p.here.review");
  // markdown notes
  showTab("Mine");
  const md="# 标题\n## 小节\n- 一\n  - 一.1\n- [x] 完成\n1. 甲\n2. 乙\n\n| 词 | 意思 |\n|---|---|\n| alveolo | 肺泡 |\n\n> 引用 [@00:12] [P4] [#2]\n\n**粗** *斜* ~~删~~ `code`\n\n```\nx=1\n```\n![图](data:image/png;base64,iVBORw0KGgo=)\n---\n<script>alert(1)</script>";
  const ta=document.getElementById("mdIn"); ta.value=md; ta.dispatchEvent(new Event("input")); await sleep(250);
  const o=document.getElementById("mdOut");
  out.md={h2:o.querySelectorAll("h2").length,h3:o.querySelectorAll("h3").length,nestedUl:o.querySelectorAll("ul ul").length,ol:o.querySelectorAll("ol li").length,task:o.querySelectorAll("input[type=checkbox]:checked").length,
    table:o.querySelectorAll("td").length,quote:o.querySelectorAll("blockquote").length,refs:[...o.querySelectorAll(".ref")].map(b=>b.textContent),
    b:o.querySelectorAll("b").length,i:o.querySelectorAll("i").length,del:o.querySelectorAll("del").length,code:o.querySelectorAll("code").length,pre:o.querySelectorAll("pre").length,img:o.querySelectorAll(".mdimg img").length,hr:o.querySelectorAll("hr").length,
    scriptEscaped:!o.querySelector("script")&&o.textContent.includes("<script>"), savedToSession:(s.mynotes||"").length===md.length};
  return out;
}
