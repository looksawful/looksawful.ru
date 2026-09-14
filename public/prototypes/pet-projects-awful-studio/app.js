const dialog=document.querySelector('#lightbox'),image=dialog.querySelector('img');
document.querySelectorAll('[data-lightbox]').forEach(b=>b.addEventListener('click',()=>{image.src=b.dataset.lightbox;dialog.showModal()}));
dialog.querySelector('.close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close()});

document.querySelectorAll('[data-media-deck]').forEach(deck=>{
  const slides=[...deck.querySelectorAll('[data-slide]')];
  const prev=deck.querySelector('[data-deck-prev]'),next=deck.querySelector('[data-deck-next]'),count=deck.querySelector('[data-deck-count]');
  const title=deck.querySelector('[data-deck-caption-title]'),text=deck.querySelector('[data-deck-caption-text]');
  const captions=[
    ['AWFUL STUDIO / quick start','Общий вид сцены, структура Outliner, N-panel и пресеты движения продукта и камеры.'],
    ['Product Studio Infographic','Сцена, Outliner, панель управления, product motion, camera motion и presets света в одной карте.'],
    ['AWFUL STUDIO / Lighting','Световые схемы для пресетов: product, fashion / beauty и cinematic / drama.']
  ];
  let index=Math.max(0,slides.findIndex(slide=>slide.hasAttribute('data-active')));
  const render=()=>{
    slides.forEach((slide,i)=>slide.toggleAttribute('data-active',i===index));
    count.textContent=`${String(index+1).padStart(2,'0')} / ${String(slides.length).padStart(2,'0')}`;
    title.textContent=captions[index][0];text.textContent=captions[index][1];
  };
  const move=delta=>{index=(index+delta+slides.length)%slides.length;render()};
  prev.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  deck.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();move(-1)}if(e.key==='ArrowRight'){e.preventDefault();move(1)}});
  let startX=null;
  deck.querySelector('.mockup__viewport').addEventListener('pointerdown',e=>{startX=e.clientX});
  deck.querySelector('.mockup__viewport').addEventListener('pointerup',e=>{if(startX===null)return;const dx=e.clientX-startX;startX=null;if(Math.abs(dx)>48)move(dx>0?-1:1)});
  render();
});
