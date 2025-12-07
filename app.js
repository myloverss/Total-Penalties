let bulkInput,bulkAddBtn,clearBtn,namesTable;
let state={names:[]};
function cleanName(s){return String(s||"").replace(/[\s\u3000]+/g,"")}
function keyName(s){return cleanName(s).toLowerCase()}
function normalize(text){const t=String(text||"");const a=t.replace(/\r?\n+/g,"、").replace(/[，,]+/g,"、");const b=a.replace(/、+/g,"、");return b.split("、").map(x=>cleanName(x)).filter(Boolean)}
function addNames(list){if(!Array.isArray(list)||list.length===0)return;const set=new Set(state.names.map(n=>keyName(n)));list.forEach(n=>{const k=keyName(n);if(!set.has(k)){state.names.push(cleanName(n));set.add(k)}});render()}
function render(){const table=document.getElementById("namesTable");if(!table)return;table.innerHTML="";state.names.forEach((n,i)=>{const tr=document.createElement("tr");const td1=document.createElement("td");td1.textContent=String(i+1);const td2=document.createElement("td");td2.textContent=n;tr.appendChild(td1);tr.appendChild(td2);table.appendChild(tr)})}
function bulkAdd(){const el=bulkInput||document.getElementById("bulkInput");if(!el)return;const raw=(el.value||"");const items=normalize(raw);addNames(items);el.value=""}
function clearAll(){state.names=[];render()}
function init(){
  bulkInput=document.getElementById("bulkInput");
  bulkAddBtn=document.getElementById("bulkAddBtn");
  clearBtn=document.getElementById("clearBtn");
  namesTable=document.getElementById("namesTable");
  if(bulkAddBtn)bulkAddBtn.addEventListener("click",bulkAdd);
  if(clearBtn)clearBtn.addEventListener("click",clearAll);
  render()
}
if(document.readyState==="loading"){window.addEventListener("DOMContentLoaded",init)}else{init()}
window.addEventListener("load",init)
document.addEventListener("click",(e)=>{const t=e.target;const id=t&&t.id;if(id==="bulkAddBtn"){bulkAdd()}else if(id==="clearBtn"){clearAll()}})
window.bulkAdd=bulkAdd;
window.clearAll=clearAll;
