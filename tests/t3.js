async ()=>{
  const seen=[];
  const fn=async()=>({text:"译文"});
  fn.json=async(p)=>{ if(/Translate every numbered item/.test(p)){ const it=[...String(p).matchAll(/^\d+\. \[(piece|sentence|unfinished)\] (.*)$/gm)]; return {t:it.map(()=>"译文")}; } if(p.includes("may flag")){ seen.push(p.match(/Line (\d+) contains a phrase that may flag something as important \("([^"]+)"\)/).slice(1)); return p.match(/Line (\d+)/)[1]==="1"?{key:false}:{key:true,start:3,end:5,title:"酶的活性位点决定特异性",explain:"底物只能与形状互补的活性位点结合，这决定了酶的特异性。"}; } return {extend:false,summary:"x"}; };
  sample=fn; beginRecording();
  const L=["Recordad que la semana pasada vimos las proteínas.","Hoy hablamos de enzimas.","La enzima tiene un sitio activo con una forma concreta.","Lo más importante es que solo el sustrato complementario encaja en el sitio activo.","Por eso las enzimas son específicas.","Ahora pasamos a la cinética.","Vamos a ver la ecuación de Michaelis-Menten."];
  for(const x of L){ addLine(x); await new Promise(r=>setTimeout(r,30)); }
  await translateIdle(); await checkKeys(cur,true);
  return {queueCues:seen, keyPoints:cur.keyPoints, hl:[...document.querySelectorAll(".tline.key .o")].map(e=>e.textContent)};
}
