
let canvas,ctx,bagImg=null,adImg=null,previewReady=false;
const $=id=>document.getElementById(id);
const loadImage=file=>new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{URL.revokeObjectURL(url);resolve(im)};im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Não foi possível abrir a imagem.'))};im.src=url});
const moneyText=(s)=>String(s||'').trim();
function bagDraw(){
 if(!canvas)return;const w=900,h=1250;canvas.width=w;canvas.height=h;ctx=canvas.getContext('2d');ctx.fillStyle='#eef1f4';ctx.fillRect(0,0,w,h);
 ctx.fillStyle='#fff';ctx.fillRect(25,25,850,1200);
 ctx.fillStyle='#17375f';ctx.font='bold 36px Arial';ctx.fillText('PRÉVIA DO ANÚNCIO NO SACO',66,82);
 const bx=160,by=130,bw=580,bh=930;
 ctx.fillStyle='#cbb58f';ctx.beginPath();ctx.moveTo(bx,by+26);ctx.lineTo(bx+22,by);ctx.lineTo(bx+bw-22,by);ctx.lineTo(bx+bw,by+26);ctx.lineTo(bx+bw,by+bh);ctx.lineTo(bx,by+bh);ctx.closePath();ctx.fill();
 if(bagImg){const scale=Math.max(bw/bagImg.width,bh/bagImg.height),iw=bagImg.width*scale,ih=bagImg.height*scale;ctx.save();ctx.beginPath();ctx.rect(bx,by,bw,bh);ctx.clip();ctx.drawImage(bagImg,bx+(bw-iw)/2,by+(bh-ih)/2,iw,ih);ctx.restore();}
 else{ctx.fillStyle='#c2a77d';ctx.fillRect(bx+15,by+24,bw-30,bh-48);ctx.fillStyle='#e9d9b9';ctx.fillRect(bx+31,by+41,bw-62,bh-82);ctx.fillStyle='#8d7452';ctx.font='bold 23px Arial';ctx.textAlign='center';ctx.fillText('MODELO ILUSTRATIVO',bx+bw/2,by+88);ctx.textAlign='left';}
 const centerX=bx+bw/2,slotY=by+370,slotW=244,slotH=205,gap=8;
 for(let i=0;i<2;i++){const x=centerX-(slotW*2+gap)/2+i*(slotW+gap);
 ctx.fillStyle='#fff';ctx.fillRect(x,slotY,slotW,slotH);
 ctx.strokeStyle='#17375f';ctx.lineWidth=4;ctx.strokeRect(x,slotY,slotW,slotH);
 if(i===0&&adImg){const scale=Math.min(slotW/adImg.width,slotH/adImg.height),iw=adImg.width*scale,ih=adImg.height*scale;ctx.drawImage(adImg,x+(slotW-iw)/2,slotY+(slotH-ih)/2,iw,ih);}
 else{ctx.fillStyle='#36506d';ctx.textAlign='center';ctx.font='bold 20px Arial';ctx.fillText(i===0?'ESPAÇO DA ARTE':'ESPAÇO LIVRE',x+slotW/2,slotY+slotH/2);ctx.textAlign='left';}
 }
 ctx.fillStyle='#17375f';ctx.font='bold 25px Arial';ctx.fillText('CLIENTE: '+moneyText($('mockClient').value).slice(0,35),66,1110);
 ctx.font='21px Arial';ctx.fillText('MODELO: '+$('mockSize').value+'  |  Simulação visual, não gabarito de impressão',66,1155);
 ctx.fillStyle='#6b7280';ctx.font='18px Arial';ctx.fillText('Confirme medidas e posicionamento com o gabarito da franquia.',66,1193);
 previewReady=true;
}
function fileDownload(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
function fileFromCanvas(){const bin=atob(canvas.toDataURL('image/png').split(',')[1]);const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new File([bytes],'previa-achei-no-pao.png',{type:'image/png'});}
export function mountMockup(){
 canvas=$('mockCanvas');if(!canvas)return;
 $('mockBag').addEventListener('change',async e=>{if(!e.target.files?.[0])return;try{bagImg=await loadImage(e.target.files[0]);bagDraw();}catch(err){alert(err.message);}});
 $('mockArtwork').addEventListener('change',async e=>{if(!e.target.files?.[0])return;try{adImg=await loadImage(e.target.files[0]);bagDraw();}catch(err){alert(err.message);}});
 for(const id of ['mockClient','mockSize'])$(id).addEventListener('input',bagDraw);
 $('mockClear').addEventListener('click',()=>{adImg=null;$('mockArtwork').value='';bagDraw()});
 $('mockDownload').addEventListener('click',()=>{if(!previewReady)bagDraw();fileDownload(fileFromCanvas(),'previa-achei-no-pao.png')});
 $('mockShare').addEventListener('click',()=>{if(!previewReady)bagDraw();const file=fileFromCanvas();if(navigator.share&&navigator.canShare?.({files:[file]})){navigator.share({files:[file],title:'Prévia do anúncio no saco de pão'}).catch(e=>{if(e.name!=='AbortError')alert(e.message)})}else{fileDownload(file,file.name);alert('Prévia salva. Envie o PNG pelo WhatsApp.')}});
 $('mockPdf').addEventListener('click',()=>{if(!previewReady)bagDraw();const w=window.open('','_blank');if(!w){alert('Permita pop-ups para salvar como PDF.');return;}w.document.write('<!doctype html><html><head><title>Prévia de anúncio</title><style>body{margin:0}img{display:block;max-width:100%;margin:auto}@page{size:A4;margin:0}</style></head><body><img src="'+canvas.toDataURL('image/png')+'"><script>onload=()=>setTimeout(()=>print(),300)<\/script></body></html>');w.document.close()});
 bagDraw();
}
