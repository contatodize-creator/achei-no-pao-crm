// Simulador independente. Não escreve no banco nem altera pedidos.
// A receita de contratos de 60 mil sacos é atribuída proporcionalmente às produções.
const MODELS={
 "2":{slots:20,sides:4,cost:{10:4520,20:5320,30:6220}},
 "3":{slots:24,sides:4,cost:{10:5020,20:5820,30:6870}},
 "4":{slots:28,sides:4,cost:{10:5250,20:6250,30:7290}},
 "5":{slots:32,sides:4,cost:{10:5390,20:6590,30:8090}}
};
const PACKAGES=[1,2,4,6,8,10,12,14,16];
const DEFAULT_PRICES={1:890,2:1390,4:2390,6:3390,8:4390,10:5090,12:5400,14:5740,16:5920};
const KEY="acheinopao_simulador_carteira_v1";
const fresh=()=>({model:"5",firstQty:30,nextQty:30,costFirst:8090,costNext:8090,extraFirst:0,extraNext:0,markup60:45,markup50:35,markup40:30,target:10000,referencePackage:2,prices:{...DEFAULT_PRICES},counts:{1:10,2:4,4:2},renew:{1:5,2:2,4:1},newCounts:{},volume:60});
let state=fresh();
try{const s=JSON.parse(localStorage.getItem(KEY)||"null");if(s)state={...state,...s,prices:{...DEFAULT_PRICES,...s.prices},counts:{...s.counts},renew:{...s.renew},newCounts:{...s.newCounts}}}catch{}
const val=x=>Math.max(0,Number(x)||0);
const num=x=>Math.max(0,Math.floor(Number(x)||0));
const brl=x=>Number(x||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}};
const node=x=>document.getElementById("cs_"+x);
const moneyInput=(key,name)=>'<label>'+name+'<input type="number" min="0" step=".01" data-setting="'+key+'" value="'+val(state[key])+'"></label>';
const select=(key,name,options)=>'<label>'+name+'<select data-setting="'+key+'">'+options.map(([v,title])=>'<option value="'+v+'" '+(String(state[key])===String(v)?"selected":"")+'>'+title+'</option>').join("")+'</select></label>';
const countOf=(dict,n)=>num(dict[n]);
const quote=(n,v=state.volume)=>{
 const base=val(state.prices[n]);
 const uplift=v==60?val(state.markup60):v==50?val(state.markup50):v==40?val(state.markup40):0;
 return base*(1+uplift/100);
};
function calc(){
 let firstUse=0,secondUse=0,firstRevenue=0,secondRevenue=0;
 let initialClients=0,renewingClients=0,newClients=0,firstOnlyRevenue=0,committedValue=0;
 for(const p of PACKAGES){
  const c=countOf(state.counts,p),r=Math.min(c,countOf(state.renew,p)),freshClient=countOf(state.newCounts,p);
  const quoteFull=quote(p),single=val(state.prices[p]);
  const runsNext=state.volume>state.firstQty;
  const recurring=runsNext?r:0;
  const firstOnly=c-recurring;
  initialClients+=c;renewingClients+=recurring;newClients+=freshClient;
  firstUse+=p*c;secondUse+=p*(recurring+freshClient);
  // A compra de 40/50/60 mil usa espaço nas duas tiragens se passar da primeira.
  const secondPart=Math.max(0,Math.min(val(state.volume)-val(state.firstQty),val(state.nextQty)));
  const firstPart=Math.min(val(state.volume),val(state.firstQty));
  const fullUnits=Math.max(1,firstPart+secondPart);
  const earlyShare=firstPart/fullUnits;
  firstRevenue+=firstOnly*single+recurring*quoteFull*earlyShare;
  secondRevenue+=recurring*quoteFull*(1-earlyShare)+freshClient*single;
  committedValue+=firstOnly*single+recurring*quoteFull+freshClient*single;
  firstOnlyRevenue+=firstOnly*single;
 }
 const firstCost=val(state.costFirst)+val(state.extraFirst),nextCost=val(state.costNext)+val(state.extraNext);
 const cap=MODELS[state.model].slots;
 const firstFree=cap-firstUse,secondFree=cap-secondUse;
 const nextNeed=Math.max(0,nextCost-secondRevenue);
 const nextGoal=Math.max(0,nextCost+val(state.target)-secondRevenue);
 const refPrice=val(state.prices[state.referencePackage]);
 const needed=refPrice>0?Math.ceil(nextNeed/refPrice):null;
 const neededGoal=refPrice>0?Math.ceil(nextGoal/refPrice):null;
 const fits=refPrice>0?Math.max(0,Math.floor(secondFree/val(state.referencePackage))):0;
 return {cap,firstUse,secondUse,firstFree,secondFree,firstRevenue,secondRevenue,
 firstCost,nextCost,nextNeed,nextGoal,needed,neededGoal,fits,initialClients,renewingClients,newClients,
 totalRevenue:firstRevenue+secondRevenue,totalCost:firstCost+nextCost,committedValue,firstOnlyRevenue};
}
function render(){
 const host=document.getElementById("duoSimulator");if(!host)return;
 const d=calc();
 const KPI=(label,value)=>'<div class="metric"><span class="muted">'+label+'</span><strong>'+value+'</strong></div>';
 const options=[10,20,30].map(n=>[n,n+" mil sacos"]);
 host.innerHTML='<h2>Simulador de carteira — Verão 30/60 mil</h2>'+
 '<p class="muted">Experimente quantos clientes compram, quantos continuam e quantos novos precisam entrar. Não é necessário cadastrar campanha. Nenhuma simulação altera pedidos ou reservas.</p>'+
 '<div class="fields">'+select("model","Saco / capacidade",Object.keys(MODELS).map(k=>[k,k+" kg — "+MODELS[k].slots+" comuns + "+MODELS[k].sides+" laterais"]))+
 select("firstQty","1ª produção (uso interno)",options)+select("nextQty","Próxima produção (uso interno)",options)+
 select("volume","Pacote de sacos oferecido ao cliente",[[30,"30 mil"],[40,"40 mil"],[50,"50 mil"],[60,"60 mil"]])+
 moneyInput("markup40","Acréscimo 40 mil (%)")+moneyInput("markup50","Acréscimo 50 mil (%)")+moneyInput("markup60","Acréscimo 60 mil (%)")+'</div>'+
 '<h3>1. Clientes por pacote de espaços</h3><p class="muted">A primeira coluna indica a carteira inicial. A segunda indica quantos desses clientes aceitarão o pacote maior e continuarão na próxima produção. Os outros pagam somente a primeira. A terceira permite incluir clientes novos apenas na próxima produção.</p>'+
 '<div class="scroll"><table><thead><tr><th>Espaços / cliente</th><th>Preço 30 mil (R$)</th><th>Preço pacote maior (R$)</th><th>Clientes iniciais</th><th>Continuam</th><th>Novos no próximo</th></tr></thead><tbody>'+
 PACKAGES.filter(n=>n<=({2:10,3:12,4:14,5:16}[state.model])).map(n=>'<tr><th>'+n+'</th><td><input type="number" min="0" step=".01" data-price="'+n+'" value="'+val(state.prices[n])+'" style="min-width:105px"></td><td>'+brl(quote(n))+'</td>'+
 ['counts','renew','newCounts'].map(key=>'<td><input style="min-width:74px;max-width:105px" type="number" min="0" step="1" data-count="'+key+'" data-package="'+n+'" value="'+countOf(state[key],n)+'"></td>').join("")+'</tr>').join("")+'</tbody></table></div>'+
 '<div class="row" style="margin-top:12px"><button id="cs_half" type="button" class="secondary">Simular 50% de renovação</button><button id="cs_all" type="button" class="secondary">Todos continuam</button><button id="cs_none" type="button" class="secondary">Ninguém continua</button><button id="cs_reset" type="button" class="danger">Restaurar exemplo</button></div>'+
 '<h3>2. Custos e meta</h3><div class="fields">'+moneyInput("costFirst","Custo 1ª produção (R$)")+moneyInput("extraFirst","Outros custos 1ª (R$)")+moneyInput("costNext","Custo próxima produção (R$)")+moneyInput("extraNext","Outros custos próxima (R$)")+moneyInput("target","Saldo desejado na próxima (R$)")+
 select("referencePackage","Pacote usado para calcular novos clientes",PACKAGES.filter(n=>n<=({2:10,3:12,4:14,5:16}[state.model])).map(n=>[n,n+" espaço(s)"]))+'</div>'+
 '<h3>3. Resultado financeiro e ocupação</h3><div class="grid">'+KPI("Clientes na primeira",d.initialClients)+KPI("Clientes que continuam",d.renewingClients)+KPI("Novos na segunda",d.newClients)+KPI("Espaços ocupados na primeira",d.firstUse+" / "+d.cap)+KPI("Espaços ocupados na segunda",d.secondUse+" / "+d.cap)+KPI("Espaços livres na próxima",Math.max(0,d.secondFree))+'</div>'+
 '<div class="grid" style="margin-top:12px">'+KPI("Receita alocada à 1ª",brl(d.firstRevenue))+KPI("Custo total da 1ª",brl(d.firstCost))+KPI("Saldo da 1ª",brl(d.firstRevenue-d.firstCost))+KPI("Receita alocada à próxima",brl(d.secondRevenue))+KPI("Custo total da próxima",brl(d.nextCost))+KPI("Saldo da próxima",brl(d.secondRevenue-d.nextCost))+'</div>'+
 '<div class="notice"><b>Para pagar a próxima produção:</b> faltam '+brl(d.nextNeed)+'. Com o pacote de '+state.referencePackage+' espaço(s) vendido a '+brl(state.prices[state.referencePackage])+', são necessários <b>'+(d.needed===null?'—':d.needed)+' novos clientes</b>. Para pagar a produção e alcançar saldo de '+brl(state.target)+', seriam '+(d.neededGoal===null?'—':d.neededGoal)+' clientes. Cabem '+d.fits+' pacotes desse tamanho nos espaços livres.</div>'+
 '<div class="grid">'+KPI("Receita contratada projetada",brl(d.totalRevenue))+KPI("Custo total das produções",brl(d.totalCost))+KPI("Saldo consolidado",brl(d.totalRevenue-d.totalCost))+'</div>'+
 '<p class="muted">Memória de cálculo: receita da 1ª '+brl(d.firstRevenue)+' + receita da próxima '+brl(d.secondRevenue)+' − custo da 1ª '+brl(d.firstCost)+' − custo da próxima '+brl(d.nextCost)+' = '+brl(d.totalRevenue-d.totalCost)+'. A receita de contratos de volume maior é rateada pelo número de sacos de cada produção.</p>'+
 (d.firstFree<0||d.secondFree<0?'<div class="notice error">Capacidade excedida em uma das produções. Reduza o número de clientes ou os espaços contratados.</div>':'')+
 (state.volume>state.firstQty+state.nextQty?'<div class="notice error">O pacote vendido exige mais sacos do que as duas produções configuradas conseguem oferecer.</div>':'')+
 (state.volume!==state.firstQty&&state.volume!==state.firstQty+state.nextQty?'<div class="notice">Para entregar exatamente '+state.volume+' mil sacos, verifique as quantidades produzidas. Se o mesmo anúncio ocupar toda a segunda produção, ele poderá circular em mais sacos do que os contratados. Os espaços permanecem ocupados integralmente em cada produção usada.</div>':'')+
 (Object.keys(state.counts).some(n=>countOf(state.renew,n)>countOf(state.counts,n))?'<div class="notice error">A quantidade de clientes que continuam não pode ultrapassar a carteira inicial do mesmo pacote. O cálculo limita automaticamente a renovação.</div>':'')+
 '<div class="row"><button id="cs_export" type="button" class="secondary">Exportar memória de cálculo (CSV)</button></div>'+
 '<p class="muted">Este é um planejamento independente e salvo neste navegador. Não representa vendas confirmadas, lucro líquido ou recebimentos em caixa. As laterais não entram nos pacotes convencionais. Os preços podem ser alterados livremente.</p>';
}
export function mountCarteiraSimulator(){
 const host=document.getElementById("duoSimulator");if(!host)return;
 const defaultsForModel=()=>{state.costFirst=MODELS[state.model].cost[state.firstQty];state.costNext=MODELS[state.model].cost[state.nextQty];};
 host.addEventListener("change",e=>{
  const t=e.target;
  if(t.dataset.price!==undefined)state.prices[t.dataset.price]=val(t.value);
  else if(t.dataset.count){state[t.dataset.count][t.dataset.package]=num(t.value)}
  else if(t.dataset.setting){
   const field=t.dataset.setting;
   state[field]=field==="model"?t.value:val(t.value);
   if(["model","firstQty","nextQty"].includes(field))defaultsForModel();
  }else return;
  save();render();
 });
 host.addEventListener("click",e=>{
  const id=e.target.id;
  if(id==="cs_half")for(const n of PACKAGES)state.renew[n]=Math.floor(countOf(state.counts,n)/2);
  else if(id==="cs_all")for(const n of PACKAGES)state.renew[n]=countOf(state.counts,n);
  else if(id==="cs_none")for(const n of PACKAGES)state.renew[n]=0;
  else if(id==="cs_reset"){if(!confirm("Restaurar o exemplo inicial e descartar esta simulação?"))return;state=fresh()}
  else if(id==="cs_export"){
   const d=calc();
   const rows=[["Pacote","Clientes iniciais","Continuam","Novos","Preço 30 mil","Preço pacote maior"],...PACKAGES.map(n=>[n,countOf(state.counts,n),countOf(state.renew,n),countOf(state.newCounts,n),state.prices[n],quote(n)]),[],["Indicador","Valor"],["Receita 1ª",d.firstRevenue],["Receita próxima",d.secondRevenue],["Custo 1ª",d.firstCost],["Custo próxima",d.nextCost],["Saldo consolidado",d.totalRevenue-d.totalCost],["Falta para pagar próxima",d.nextNeed],["Espaços livres próximos",d.secondFree],["Novos clientes necessários",d.needed]];
   const csv="\ufeff"+rows.map(row=>row.map(x=>'"'+String(x??"").replace(/"/g,'""')+'"').join(";")).join("\r\n");
   const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="carteira-clientes-simulador-achei-no-pao.csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);return;
  }else return;
  save();render();
 });
 window.renderCarteiraSimulator=render;render();
}
