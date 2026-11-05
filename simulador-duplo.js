
const COST={2:{10:4020,20:4820,30:5720},3:{10:4520,20:5320,30:6370},4:{10:4750,20:5750,30:6790},5:{10:4890,20:6090,30:7590}};
const BASE={1:890,2:1390,4:2390,6:3390,8:4390,10:5090,12:5400,14:5740,16:5920};
const MAX={2:24,3:28,4:32,5:36};
const money=x=>Number(x||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const positive=x=>Math.max(0,Number(x)||0);
const key='acheinopao_dual_campaign_v2';
const defaults=()=>({model:'5',qty1:30,qty2:30,capacity:34,laterals:2,extra:30,prices:{...BASE},cost1:7590,cost2:7590,other1:500,other2:500,cam1:'',cam2:'',rows:[]});
let state=defaults();
try{const x=JSON.parse(localStorage.getItem(key)||'null');if(x)state={...state,...x,prices:{...BASE,...x.prices},rows:Array.isArray(x.rows)?x.rows:[]}}catch{}
const save=()=>{try{localStorage.setItem(key,JSON.stringify(state))}catch{}};
let getCRM=()=>({campaigns:[],orders:[],spaces:[],installments:[]});
const root=()=>document.getElementById('duoSimulator');
const id=x=>document.getElementById('ds_'+x);
const price=(n,mode)=>positive(state.prices[n])*(mode==='both'?1+positive(state.extra)/100:1);
const input=(name,label,value,type='number')=>'<div><label>'+label+'</label><input id="ds_'+name+'" type="'+type+'" '+(type==='number'?'min="0" step=".01"':'')+' value="'+esc(value)+'"></div>';
function live(cid,crm){
 if(!cid)return {revenue:0,received:0,used:0,held:0};
 const valid=crm.orders.filter(o=>String(o.campaign_id)===cid&&o.status!=='cancelado');
 const confirmed=valid.filter(o=>o.status==='confirmado');
 const active=new Set(valid.filter(o=>['confirmado','reservado'].includes(o.status)).map(o=>String(o.id)));
 const used=new Set(crm.spaces.filter(sp=>String(sp.campaign_id)===cid&&active.has(String(sp.order_id))&&/^[fv]-/.test(sp.space_code)).map(sp=>sp.space_code)).size;
 const orderIds=new Set(confirmed.map(o=>String(o.id)));
 return {revenue:confirmed.reduce((s,o)=>s+positive(o.total_amount),0),received:crm.installments.filter(i=>orderIds.has(String(i.order_id))).reduce((s,i)=>s+positive(i.paid_amount),0),used,held:valid.filter(o=>o.status==='reservado').length};
}
function html(crm){
 const options='<option value="">Nenhuma — simulação independente</option>'+crm.campaigns.filter(c=>String(c.bag_model||'').startsWith(state.model+'-')&&c.status!=='cancelada').map(c=>'<option value="'+esc(c.id)+'">'+esc(c.name)+' ('+esc(c.bag_model)+')</option>').join('');
 const packages=Object.keys(BASE).filter(n=>+n<=({2:10,3:12,4:14,5:16}[state.model]));
 root().innerHTML='<h2>Simulador financeiro — 30 mil / 60 mil sacos</h2><p class="muted">Duas tiragens independentes. Clientes recorrentes podem contratar ambas; outros clientes podem contratar só uma. Tudo aqui é simulação: não altera pedidos nem bloqueia espaços.</p>'+
 '<div class="fields"><div><label>Modelo do saco</label><select id="ds_model">'+[2,3,4,5].map(n=>'<option value="'+n+'" '+(state.model==n?'selected':'')+'>'+n+' kg — '+MAX[n]+' espaços</option>').join('')+'</select></div>'+
 input('extra','Acréscimo por dobrar a campanha (%)',state.extra)+input('capacity','Espaços convencionais por tiragem',state.capacity)+input('laterals','Laterais por tiragem (capacidade informativa)',state.laterals)+
 '<div><label>Tiragem 1 (mil sacos)</label><select id="ds_qty1">'+[10,20,30].map(n=>'<option value="'+n+'" '+(state.qty1==n?'selected':'')+'>'+n+' mil</option>').join('')+'</select></div>'+
 '<div><label>Tiragem 2 (mil sacos)</label><select id="ds_qty2">'+[10,20,30].map(n=>'<option value="'+n+'" '+(state.qty2==n?'selected':'')+'>'+n+' mil</option>').join('')+'</select></div>'+
 input('cost1','Custo produção 1 (R$)',state.cost1)+input('cost2','Custo produção 2 (R$)',state.cost2)+input('other1','Demais custos 1 (R$)',state.other1)+input('other2','Demais custos 2 (R$)',state.other2)+
 '<div><label>Campanha real 1 (opcional)</label><select id="ds_cam1">'+options+'</select></div><div><label>Campanha real 2 (opcional)</label><select id="ds_cam2">'+options+'</select></div></div>'+
 '<div class="notice">Confira a capacidade no gabarito: este simulador inicia o saco de 5 kg com 34 espaços comuns + 2 laterais. O CRM atual pode contar espaços de modo diferente. Custos extras devem incluir entregas, tributos e royalties para obter uma margem mais próxima da realidade.</div>'+
 '<h3>Preços editáveis para uma tiragem</h3><div class="scroll"><table><thead><tr><th>Espaços</th><th>Preço 30 mil (R$)</th><th>Oferta 60 mil (R$)</th><th>Economia comparada a 2 compras</th></tr></thead><tbody>'+
 packages.map(n=>'<tr><td>'+n+'</td><td><input type="number" min="0" step=".01" data-price="'+n+'" value="'+positive(state.prices[n])+'" style="max-width:150px"></td><td>'+money(price(n,'both'))+'</td><td>'+money(positive(state.prices[n])*2-price(n,'both'))+'</td></tr>').join('')+'</tbody></table></div>'+
 '<h3>Clientes para simular</h3><p class="muted">O valor de quem compra ambas é dividido igualmente entre os resultados das duas tiragens. Você pode alterar qualquer preço negociado. Laterais ficam fora desta simulação de pacotes comuns.</p><div class="row"><button type="button" id="ds_add">Adicionar cliente</button><button type="button" class="secondary" id="ds_export">Exportar CSV</button><button type="button" class="secondary" id="ds_reset">Restaurar preços e custos</button></div>'+
 '<div class="scroll"><table><thead><tr><th>Cliente</th><th>Espaços</th><th>Participação</th><th>Preço negociado (R$)</th><th></th></tr></thead><tbody>'+
 state.rows.map((r,i)=>'<tr><td><input data-row="'+i+'" data-field="name" value="'+esc(r.name)+'" placeholder="Empresa"></td><td><select data-row="'+i+'" data-field="n">'+packages.map(n=>'<option value="'+n+'" '+(+r.n===+n?'selected':'')+'>'+n+'</option>').join('')+'</select></td><td><select data-row="'+i+'" data-field="mode"><option value="both" '+(r.mode==='both'?'selected':'')+'>Ambas</option><option value="one" '+(r.mode==='one'?'selected':'')+'>Só 1ª</option><option value="two" '+(r.mode==='two'?'selected':'')+'>Só 2ª</option></select></td><td><input type="number" min="0" step=".01" data-row="'+i+'" data-field="value" value="'+positive(r.value).toFixed(2)+'"></td><td><button class="danger" data-remove="'+i+'" type="button">Excluir</button></td></tr>').join('')+'</tbody></table></div><h3>Memória de cálculo e resultados</h3><div id="ds_results"></div>';
 id('cam1').value=state.cam1;id('cam2').value=state.cam2;
 renderTotals(crm);
}
function renderTotals(crm){
 const records=[{name:'1ª campanha',live:live(state.cam1,crm),cost:positive(state.cost1)+positive(state.other1),idx:1},{name:'2ª campanha',live:live(state.cam2,crm),cost:positive(state.cost2)+positive(state.other2),idx:2}];
 for(const r of state.rows){const val=positive(r.value),n=positive(r.n);if(r.mode==='both'){records[0].draft=(records[0].draft||0)+val/2;records[1].draft=(records[1].draft||0)+val/2;records[0].spaces=(records[0].spaces||0)+n;records[1].spaces=(records[1].spaces||0)+n;}else{const rec=records[r.mode==='one'?0:1];rec.draft=(rec.draft||0)+val;rec.spaces=(rec.spaces||0)+n;}}
 const panel=records.map(x=>{const projected=x.live.revenue+(x.draft||0),occupied=x.live.used+(x.spaces||0),free=positive(state.capacity)-occupied,remaining=Math.max(0,x.cost-projected);return '<div class="panel" style="box-shadow:none"><h3>'+x.name+'</h3><div class="grid">'+[['Custo total',money(x.cost)],['Confirmado no CRM',money(x.live.revenue)],['Receita hipotética',money(x.draft||0)],['Receita projetada',money(projected)],['Falta para pagar custos',money(remaining)],['Saldo após custos informados',money(projected-x.cost)],['Espaços livres',free+' de '+state.capacity],['Recebido de verdade',money(x.live.received)]].map(([a,b])=>'<div class="metric"><span class="muted">'+a+'</span><strong>'+b+'</strong></div>').join('')+'</div><p class="muted">Memória: '+money(x.live.revenue)+' confirmados + '+money(x.draft||0)+' simulados − '+money(x.cost)+' custos = '+money(projected-x.cost)+'. Ocupação: '+x.live.used+' reais + '+(x.spaces||0)+' simulados = '+occupied+'. '+x.live.held+' reservas ativas.</p>'+(free<0?'<p class="notice error">Capacidade excedida. Ajuste os pacotes.</p>':'')+'</div>'}).join('');
 const totalRev=records.reduce((s,r)=>s+r.live.revenue+(r.draft||0),0),totalCost=records.reduce((s,r)=>s+r.cost,0);
 id('results').innerHTML=panel+'<div class="notice"><b>Consolidado: receita '+money(totalRev)+' − custos '+money(totalCost)+' = saldo projetado '+money(totalRev-totalCost)+'.</b><p class="muted">Falta para equilíbrio consolidado: '+money(Math.max(0,totalCost-totalRev))+'. Saldo projetado não é lucro líquido nem caixa recebido. Reservas não contam como venda.</p></div>';
 return {records,totalRev,totalCost};
}
export function mountDualSimulator(provider){
 getCRM=provider;
 const section=root();
 if(!section)return;
 function render(){html(getCRM())}
 section.addEventListener('change',e=>{
 const el=e.target;
 if(el.dataset.price){state.prices[el.dataset.price]=positive(el.value)}
 else if(el.dataset.row!==undefined){
 const r=state.rows[+el.dataset.row];if(!r)return;
 if(el.dataset.field==='name')r.name=el.value;
 else if(el.dataset.field==='value')r.value=positive(el.value);
 else {r[el.dataset.field]=el.dataset.field==='n'?+el.value:el.value;r.value=price(r.n,r.mode==='both'?'both':'one')}
 }else{
 const field=el.id?.replace('ds_','');if(!field||!(field in state))return;
 state[field]=['model','cam1','cam2'].includes(field)?el.value:positive(el.value);
 if(field==='model'){state.capacity=MAX[state.model]-2;state.laterals=2;state.rows=[];state.cam1='';state.cam2='';state.cost1=COST[state.model][state.qty1];state.cost2=COST[state.model][state.qty2]}
 if(field==='qty1')state.cost1=COST[state.model][state.qty1];
 if(field==='qty2')state.cost2=COST[state.model][state.qty2];
 if(field==='extra')for(const r of state.rows)if(r.mode==='both')r.value=price(r.n,'both');
 }
 save();render();
 });
 section.addEventListener('click',e=>{
 if(e.target.id==='ds_add'){state.rows.push({name:'',n:4,mode:'both',value:price(4,'both')});save();render()}
 if(e.target.dataset.remove!==undefined){state.rows.splice(+e.target.dataset.remove,1);save();render()}
 if(e.target.id==='ds_reset'&&confirm('Restaurar todos os custos e preços deste simulador?')){state=defaults();save();render()}
 if(e.target.id==='ds_export'){
 const calc=renderTotals(getCRM());
 const rows=[['Tipo','Descrição','Valor'],...state.rows.map(r=>['Cliente',r.name||'Sem nome',r.value]),...calc.records.map(r=>['Custo',r.name,r.cost]),['Total receita','',calc.totalRev],['Total custos','',calc.totalCost],['Saldo','',calc.totalRev-calc.totalCost]];
 const csv='\ufeff'+rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
 const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='memoria-calculo-achei-no-pao.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 });
 window.renderDuoSimulator=render;
 render();
}
