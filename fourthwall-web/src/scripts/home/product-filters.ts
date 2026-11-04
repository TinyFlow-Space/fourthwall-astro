const initialized=new WeakSet<HTMLElement>();
export function initProductFilters() {
 const section=document.querySelector<HTMLElement>('.products-section');
 const nav=section?.querySelector<HTMLElement>('#product-categories');
 if(!section||!nav||initialized.has(nav))return;
 initialized.add(nav);
 const applyCategory = (category: string) => {
  section.querySelectorAll<HTMLElement>('[data-product-category]').forEach(card=>{
   const visible=category==='bestsellers'?card.dataset.productBestseller==='true':card.dataset.productCategory===category;
   // Inline display only while filtered out preserves the existing card classes,
   // hover/reveal effects and responsive grid when a card is shown again.
   card.hidden=!visible;
   card.style.display=visible?'':'none';
  });
 };
 nav.addEventListener('selection-change',(event)=>{
  applyCategory((event as CustomEvent<{value:string}>).detail.value);
 });
 const selected = nav.querySelector<HTMLElement>('[aria-pressed="true"]')?.dataset.value;
 if (selected) applyCategory(selected);
}
