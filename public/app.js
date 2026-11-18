const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const today = new Date();
const iso = d => { const x = new Date(d); return new Date(x.getTime() - x.getTimezoneOffset()*60000).toISOString().slice(0,10); };
const plusDays = n => { const d = new Date(); d.setDate(d.getDate()+n); return iso(d); };
let tripType = "roundtrip";
let segments = [{from:"",to:"",date:plusDays(14)},{from:"",to:"",date:plusDays(21)}];
let pax = {adults:1,children:[],infants:0,infantsWithSeat:0};

function renderSegments(){
  const host=$("#segments"); host.innerHTML="";
  const count=tripType==="oneway"?1:tripType==="roundtrip"?2:segments.length;
  segments=segments.slice(0,count);
  segments.forEach((s,i)=>{
    const row=document.createElement("div"); row.className="segment-row";
    row.innerHTML=`<div class="field"><label>${tripType==="multicity"?"CHẶNG "+(i+1)+" · ĐIỂM ĐI":"ĐIỂM ĐI"}</label><input data-i="${i}" data-k="from" maxlength="3" autocapitalize="characters" placeholder="SGN · TP. HỒ CHÍ MINH" value="${s.from}" aria-label="Mã sân bay đi chặng ${i+1}"></div>
    <div class="field"><label>ĐIỂM ĐẾN</label><input data-i="${i}" data-k="to" maxlength="3" autocapitalize="characters" placeholder="YYZ · TORONTO" value="${s.to}" aria-label="Mã sân bay đến chặng ${i+1}"></div>
    <div class="field"><label>NGÀY BAY</label><input type="date" min="${plusDays(0)}" data-i="${i}" data-k="date" value="${s.date}" aria-label="Ngày bay chặng ${i+1}"></div>`;
    if(tripType==="multicity"&&i>1){const remove=document.createElement("button");remove.className="segment-remove";remove.type="button";remove.textContent="Xóa chặng";remove.onclick=()=>{segments.splice(i,1);renderSegments()};row.append(remove)}
    host.append(row);
  });
  $("#addSegment").hidden=tripType!=="multicity"||segments.length>=6;
}
function updatePax(){
  $("#adultsCount").textContent=pax.adults;
  $("#childrenCount").textContent=pax.children.length;
  $("#infantsCount").textContent=pax.infants;
  $("#infantsWithSeatCount").textContent=pax.infantsWithSeat;
  $("#childrenAges").innerHTML=pax.children.map((age,i)=>`<select data-child="${i}" aria-label="Tuổi trẻ em ${i+1}">${Array.from({length:10},(_,j)=>`<option value="${j+2}" ${age===j+2?"selected":""}>${j+2} tuổi</option>`).join("")}</select>`).join("");
  const total=pax.adults+pax.children.length+pax.infants+pax.infantsWithSeat;
  $("#passengerSummary").textContent=`${total} hành khách · ${pax.adults} người lớn`;
}
function showProviderCards(providers){
  $("#providerGrid").innerHTML=providers.map(p=>`<div class="provider-card"><b>${p.name}</b><span class="provider-status">${p.status==="not_configured"?"CHƯA CẤU HÌNH":"CẦN QUYỀN ĐỐI TÁC"}</span><small>${p.note}</small></div>`).join("");
}
$$(".trip-tab").forEach(btn=>btn.addEventListener("click",()=>{
  $$(".trip-tab").forEach(x=>x.classList.toggle("active",x===btn));
  tripType=btn.dataset.trip;
  if(tripType==="oneway")segments=segments.slice(0,1);
  if(tripType==="roundtrip"){segments=[segments[0]||{from:"",to:"",date:plusDays(14)},{from:segments[1]?.from||"",to:segments[1]?.to||"",date:segments[1]?.date||plusDays(21)}]}
  if(tripType==="multicity"&&segments.length<2)segments.push({from:"",to:"",date:plusDays(21)});
  renderSegments();
}));
$("#segments").addEventListener("input",e=>{
  const el=e.target;if(!el.dataset.k)return;
  const i=Number(el.dataset.i),k=el.dataset.k;
  segments[i][k]=k==="date"?el.value:el.value.toUpperCase().replace(/[^A-Z]/g,"").slice(0,3);
  if(k!=="date"){const start=el.selectionStart;el.value=segments[i][k];el.setSelectionRange(start,start)}
});
$("#addSegment").addEventListener("click",()=>{if(segments.length<6){segments.push({from:segments.at(-1)?.to||"",to:"",date:plusDays(28)});renderSegments()}});
$("#passengerToggle").addEventListener("click",()=>$("#passengerPopover").hidden=!$("#passengerPopover").hidden);
$("#passengerDone").addEventListener("click",()=>$("#passengerPopover").hidden=true);
$("#passengerPopover").addEventListener("click",e=>{
  const b=e.target.closest("[data-count]");if(!b)return;
  const key=b.dataset.count,delta=Number(b.dataset.delta),total=pax.adults+pax.children.length+pax.infants+pax.infantsWithSeat;
  if(delta>0&&total>=9)return;
  if(key==="adults")pax.adults=Math.max(1,Math.min(9,pax.adults+delta));
  if(key==="children"){if(delta>0)pax.children.push(8);else pax.children.pop()}
  if(key==="infants")pax.infants=Math.max(0,Math.min(pax.adults,pax.infants+delta));
  if(key==="infantsWithSeat")pax.infantsWithSeat=Math.max(0,Math.min(8,pax.infantsWithSeat+delta));
  if(pax.infants>pax.adults)pax.infants=pax.adults;
  updatePax();
});
$("#childrenAges").addEventListener("change",e=>{if(e.target.dataset.child!==undefined)pax.children[Number(e.target.dataset.child)]=Number(e.target.value)});
function showErrors(errors){$("#results").hidden=false;$("#searchStatus").textContent="Cần kiểm tra";$("#resultMessage").innerHTML="<b>Vui lòng kiểm tra:</b><ul>"+errors.map(x=>"<li>"+x+"</li>").join("")+"</ul>";$("#offers").innerHTML="";$("#results").scrollIntoView({behavior:"smooth",block:"start"})}
$("#searchForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const data={tripType,segments:segments.map(s=>({...s,from:s.from.trim().toUpperCase(),to:s.to.trim().toUpperCase()})),passengers:{...pax,children:pax.children.map(age=>({age}))},cabin:$("#cabin").value,currency:$("#currency").value,options:{flexibleDates:$("#flexibleDates").checked,nearbyAirports:$("#nearbyAirports").checked,mixedAirlines:$("#mixedAirlines").checked,separateTickets:$("#separateTickets").checked}};
  if(data.segments.some(s=>!s.from||!s.to||!s.date)){showErrors(["Hãy nhập mã sân bay đi, đến và ngày bay cho tất cả các chặng."]);return}
  const button=$("#searchButton");button.disabled=true;button.textContent="ĐANG KIỂM TRA…";
  $("#results").hidden=false;$("#searchStatus").textContent="Đang gửi yêu cầu";$("#resultMessage").textContent="Đang kiểm tra dữ liệu hành trình…";$("#offers").innerHTML="";
  try{
    const res=await fetch("/api/search",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(data)});
    const body=await res.json();
    if(!res.ok){showErrors(body.details||[body.error||"Không thể tìm kiếm."]);return}
    $("#searchStatus").textContent="Chưa có nguồn giá trực tiếp";
    $("#resultMessage").innerHTML="<b>Chưa thể hiển thị giá vé thực tế.</b><br>"+body.notice+"<br><br><span>Yêu cầu: "+body.requestId+"</span>";
    $("#offers").innerHTML="";
  }catch(err){
    $("#searchStatus").textContent="Lỗi kết nối";
    $("#resultMessage").textContent="Không kết nối được API. Hãy kiểm tra trạng thái triển khai Cloudflare Worker rồi thử lại.";
  }finally{button.disabled=false;button.innerHTML="<span>⌕</span> TÌM CHUYẾN BAY"}
  $("#results").scrollIntoView({behavior:"smooth",block:"start"});
});
async function init(){
  renderSegments();updatePax();
  try{const r=await fetch("/api/providers");if(r.ok){const d=await r.json();showProviderCards(d.providers)}}catch{}
}
init();
