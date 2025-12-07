let bulkInput,bulkAddBtn,clearBtn,namesTable,eventDetails,parseBtn,clearDetailsBtn,pageSizeSelect,prevPageBtn,nextPageBtn,pageInfo,copyNamesBtn;
let state={names:[],rules:null,fines:{},pager:{pageSize:10,page:1},sort:{col:"index",dir:"asc"}};
let collator=(typeof Intl!=="undefined" && typeof Intl.Collator==="function")?new Intl.Collator("zh-CN"):null;
function cleanName(s){return String(s||"").replace(/[\s\u3000]+/g,"")}
function keyName(s){return cleanName(s).toLowerCase()}
function normalize(text){const t=String(text||"");const a=t.replace(/\r?\n+/g,"、").replace(/[，,]+/g,"、");const b=a.replace(/、+/g,"、");return b.split("、").map(x=>cleanName(x)).filter(Boolean)}
function addNames(list){if(!Array.isArray(list)||list.length===0)return;const set=new Set(state.names.map(n=>keyName(n)));list.forEach(n=>{const raw=cleanName(n);const k=keyName(raw);if(!set.has(k)){state.names.push(raw);set.add(k);if(state.fines[raw]==null)state.fines[raw]=0}});state.pager.page=1;render()}
function totalPages(){const ps=state.pager.pageSize||10;const len=state.names.length;return Math.max(1,Math.ceil(len/ps))}
function render(){const table=document.getElementById("namesTable");const ps=state.pager.pageSize||10;const rows=state.names.map((n,i)=>({n,i,amt:Number(state.fines[n]||0)}));rows.sort((a,b)=>{const dir=state.sort.dir==="asc"?1:-1;switch(state.sort.col){case "name":{const diff=a.n.length-b.n.length;if(diff!==0)return diff*dir;const cmp=collator?collator.compare(a.n,b.n):a.n.localeCompare(b.n);return cmp*dir}case "amount":return (a.amt-b.amt)*dir;case "index":default:return (a.i-b.i)*dir}});const pages=Math.max(1,Math.ceil(rows.length/ps));let p=state.pager.page||1;p=Math.min(Math.max(1,p),pages);state.pager.page=p;if(table){table.innerHTML="";const start=(p-1)*ps;const end=Math.min(start+ps,rows.length);for(let i=start;i<end;i++){const r=rows[i];const tr=document.createElement("tr");const td1=document.createElement("td");td1.textContent=String(i+1);const td2=document.createElement("td");td2.textContent=r.n;const td3=document.createElement("td");td3.textContent=r.amt.toFixed(2);tr.appendChild(td1);tr.appendChild(td2);tr.appendChild(td3);table.appendChild(tr)}}const info=document.getElementById("pageInfo");if(info)info.textContent=`第 ${p} / ${pages} 页`;const prev=document.getElementById("prevPageBtn");const next=document.getElementById("nextPageBtn");if(prev)prev.disabled=p<=1;if(next)next.disabled=p>=pages;const sel=document.getElementById("pageSizeSelect");if(sel){const val=String(state.pager.pageSize||10);if(sel.value!==val)sel.value=val}renderSortIndicators();renderTotalAmount()}
function renderSortIndicators(){const nameIcon=document.getElementById("sortNameIcon");const amtIcon=document.getElementById("sortAmountIcon");if(nameIcon){nameIcon.textContent=state.sort.col==="name"?(state.sort.dir==="asc"?"▲":"▼"):"↕";nameIcon.classList.toggle("active",state.sort.col==="name")}if(amtIcon){amtIcon.textContent=state.sort.col==="amount"?(state.sort.dir==="asc"?"▲":"▼"):"↕";amtIcon.classList.toggle("active",state.sort.col==="amount")}}
function renderTotalAmount(){const el=document.getElementById("totalAmount");if(!el)return;const sum=state.names.reduce((s,n)=>s+Number(state.fines[n]||0),0);el.textContent=`扣款总金额：¥${sum.toFixed(2)}`}
function setSort(col){if(state.sort.col===col){state.sort.dir=state.sort.dir==="asc"?"desc":"asc"}else{state.sort.col=col;state.sort.dir="asc"}render()}
function setPageSize(){const el=document.getElementById("pageSizeSelect");if(!el)return;const v=parseInt(el.value,10);state.pager.pageSize=isFinite(v)&&v>0?v:10;state.pager.page=1;render()}
function prevPage(){state.pager.page=Math.max(1,(state.pager.page||1)-1);render()}
function nextPage(){state.pager.page=Math.min(totalPages(),(state.pager.page||1)+1);render()}
function splitSentences(text){const t=String(text||"").replace(/\r\n/g,"\n").replace(/\r/g,"\n");return t.split(/(?:[。；;]+|\n+)/)}
function aggregateFines(text){const details=String(text||"").replace(/[\s\u3000]+/g,"");const sentences=splitSentences(details).filter(Boolean);const totals={};state.names.forEach(n=>totals[n]=0);const re=/(乐捐|计)\s*([0-9]+(?:\.[0-9]+)?)\s*元/g;sentences.forEach(s=>{let m;while((m=re.exec(s))){const amt=parseFloat(m[2]);if(!isFinite(amt))continue;const prefix=s.slice(0,m.index);const namesMatched=new Set();
      let lastSep=-1;for(let i=prefix.length-1;i>=0;i--){if(/[，,；;。\n]/.test(prefix[i])){lastSep=i;break}}const clause=prefix.slice(lastSep+1);state.names.forEach(n=>{if(clause.includes(n))namesMatched.add(n)});namesMatched.forEach(n=>{totals[n]+=amt})}});return totals}
function getSelectedParticipants(){const sel=document.getElementById("eventParticipants");if(!sel)return[];return Array.from(sel.selectedOptions||[]).map(o=>o.value)}
function toggleSelectAll(){const sel=document.getElementById("eventParticipants");if(!sel)return;const opts=Array.from(sel.options||[]);const anyUnselected=opts.some(o=>!o.selected);opts.forEach(o=>o.selected=anyUnselected)}
function computeFineTotal(t,ps,r){const text=(document.getElementById("eventDetails")||{}).value||"";const totals=aggregateFines(text);return (Array.isArray(ps)?ps:[]).reduce((sum,n)=>sum+Number(totals[n]||0),0)}
function calcFine(){const t=(document.getElementById("eventTime")||{}).value||"";const ps=getSelectedParticipants();const total=computeFineTotal(t,ps,state.rules);const el=document.getElementById("fineResult");if(el)el.textContent=`参与人数：${ps.length}，总罚款：¥${Number(total||0).toFixed(2)}`}
function bulkAdd(){const el=bulkInput||document.getElementById("bulkInput");if(!el)return;const raw=(el.value||"");const items=normalize(raw);addNames(items);el.value=""}
function clearAll(){state.names=[];state.fines={};state.pager.page=1;render()}
function init(){
  bulkInput=document.getElementById("bulkInput");
  bulkAddBtn=document.getElementById("bulkAddBtn");
  clearBtn=document.getElementById("clearBtn");
  namesTable=document.getElementById("namesTable");
  eventDetails=document.getElementById("eventDetails");
  parseBtn=document.getElementById("parseBtn");
  clearDetailsBtn=document.getElementById("clearDetailsBtn");
  copyNamesBtn=document.getElementById("copyNamesBtn");
  const headerIndex=document.getElementById("namesHeaderIndex");
  const headerName=document.getElementById("namesHeaderName");
  const headerAmount=document.getElementById("namesHeaderAmount");
  pageSizeSelect=document.getElementById("pageSizeSelect");
  prevPageBtn=document.getElementById("prevPageBtn");
  nextPageBtn=document.getElementById("nextPageBtn");
  pageInfo=document.getElementById("pageInfo");
  if(bulkAddBtn)bulkAddBtn.addEventListener("click",bulkAdd);
  if(clearBtn)clearBtn.addEventListener("click",clearAll);
  if(parseBtn)parseBtn.addEventListener("click",parseAndAggregate);
  if(clearDetailsBtn)clearDetailsBtn.addEventListener("click",clearDetails);
  if(copyNamesBtn)copyNamesBtn.addEventListener("click",copyNamesList);
  if(headerIndex)headerIndex.addEventListener("click",()=>setSort("index"));
  if(headerName)headerName.addEventListener("click",()=>setSort("name"));
  if(headerAmount)headerAmount.addEventListener("click",()=>setSort("amount"));
  if(pageSizeSelect)pageSizeSelect.addEventListener("change",setPageSize);
  if(prevPageBtn)prevPageBtn.addEventListener("click",prevPage);
  if(nextPageBtn)nextPageBtn.addEventListener("click",nextPage);
  render()
}
if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",init)}else{init()}
window.addEventListener("load",init)
window.bulkAdd=bulkAdd;
window.clearAll=clearAll;
function parseAndAggregate(){const text=(eventDetails&&eventDetails.value||"").replace(/[\s\u3000]+/g,"");const totals=aggregateFines(text);state.fines=totals;render()}
function clearDetails(){if(eventDetails)eventDetails.value="";state.names.forEach(n=>{state.fines[n]=0});render()}
function copyNamesList(){const rows=state.names.map(n=>`${n},${Number(state.fines[n]||0).toFixed(2)}`).filter(line=>line&&line.replace(/,/g,"").trim().length>0);const text=rows.join("\n");const doCopy=(s)=>{if(navigator.clipboard&&navigator.clipboard.writeText){return navigator.clipboard.writeText(s)}const ta=document.createElement("textarea");ta.value=s;document.body.appendChild(ta);ta.select();try{document.execCommand("copy")}catch(e){}document.body.removeChild(ta);return Promise.resolve()};doCopy(text).then(()=>{alert("复制成功")}).catch(()=>{alert("复制失败")})}
