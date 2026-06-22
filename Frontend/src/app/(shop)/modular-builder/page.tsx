"use client";
import React, { useState } from "react";
import Link from "next/link";

export default function Page() {
  const [droppedChain, setDroppedChain] = useState(false);
  const [activeTab, setActiveTab] = useState("chains");

  return (
    <div className="w-full">
      <main className="flex-grow flex flex-col md:flex-row overflow-hidden">

<section className="flex-grow bg-soft-linen relative flex flex-col">

<div className="absolute top-0 left-0 w-full p-stack-lg flex justify-between items-start z-10 pointer-events-none">
<div>
<h1 className="font-headline-md text-headline-md text-ink-black mb-stack-sm pointer-events-auto">Modular Builder</h1>
<p className="font-body-md text-body-md text-slate-grey pointer-events-auto">Drag components to construct your piece.</p>
</div>
<div className="flex gap-stack-md pointer-events-auto">
<button aria-label="Undo" className="p-2 rounded-full border border-slate-grey/30 text-slate-grey hover:text-ink-black hover:border-ink-black/50 transition-colors bg-pure-white/50 backdrop-blur-sm">
<span className="material-symbols-outlined" style={{fontVariationSettings: "'wght' 300"}}>undo</span>
</button>
<button aria-label="Reset Canvas" className="p-2 rounded-full border border-slate-grey/30 text-slate-grey hover:text-ink-black hover:border-ink-black/50 transition-colors bg-pure-white/50 backdrop-blur-sm">
<span className="material-symbols-outlined" style={{fontVariationSettings: "'wght' 300"}}>restart_alt</span>
</button>
</div>
</div>

<div className="flex-grow flex items-center justify-center relative overflow-hidden" id="drop-zone">

<div className="w-96 h-96 border-2 border-dashed border-slate-grey/30 rounded-full flex items-center justify-center relative opacity-50 transition-opacity" id="canvas-target">
<span className="font-label-caps text-label-caps text-slate-grey tracking-widest text-center uppercase">Drop Chain Base Here</span>
</div>

<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 drag-handle z-20 opacity-0 transition-opacity duration-500 hidden" id="mock-chain">
<img alt="Gold Chain Base" className="w-full h-full object-contain mix-blend-multiply" data-alt="A delicate, high-end 18k gold link chain laying perfectly flat against a pristine white background. The lighting is studio quality, creating soft, luxurious highlights on the curved metal surfaces without harsh shadows. The aesthetic is minimal, focused entirely on the craftsmanship of the chain, embodying modern quiet luxury jewelry design." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-lAAIskGYxRuECxtVaonKvtsouHByDeEYP1khRLVx20nU0Kci1Wetl9ZXAEkxr2K9kNgIgYpWsBAuIVv--vZf5JyckomGo5KzyLMZIMY7By1XBeDgYo7F5IlUD9KrGs4ilGAKG4JxXQzwC0vbfBIPBkEgtWBk-sLmlcVo2itAItjBVP2pszH0Wdd7MYSbUY0Lgm4vFcoIig9Sc-uY8eoFM60n8_aGuIV_pLu2L5j2stYByhMa_JUiPDwzXFnoj4AfCbTicE2qs5o" />

<div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full border-2 border-deep-navy bg-pure-white flex items-center justify-center shadow-sm cursor-pointer hover:scale-125 transition-transform z-30">
<div className="w-1 h-1 bg-deep-navy rounded-full"></div>
</div>
</div>
</div>

<div className="bg-pure-white border-t border-slate-grey/20 p-stack-md md:p-gutter flex justify-between items-center z-20">
<div className="hidden md:block">
<p className="font-label-caps text-label-caps text-slate-grey mb-1">Estimated Total</p>
<p className="font-headline-md text-headline-md text-ink-black">$0</p>
</div>
<button className="w-full md:w-auto bg-deep-navy text-pure-white font-button text-button uppercase tracking-widest py-4 px-8 hover:bg-deep-navy/90 transition-colors flex items-center justify-center gap-2">
                    Review Final Piece
                    <span className="material-symbols-outlined" style={{fontVariationSettings: "'wght' 400"}}>arrow_forward</span>
</button>
</div>
</section>

<aside className="w-full md:w-96 bg-pure-white border-l border-slate-grey/20 flex flex-col flex-none h-[409px] md:h-auto overflow-hidden">

<div className="flex border-b border-slate-grey/20 w-full overflow-x-auto hide-scrollbar">
<button className="flex-1 py-4 px-4 font-label-caps text-label-caps text-deep-navy border-b-2 border-deep-navy whitespace-nowrap text-center">Chains</button>
<button className="flex-1 py-4 px-4 font-label-caps text-label-caps text-slate-grey hover:text-ink-black transition-colors whitespace-nowrap text-center">Pendants</button>
<button className="flex-1 py-4 px-4 font-label-caps text-label-caps text-slate-grey hover:text-ink-black transition-colors whitespace-nowrap text-center">Charms</button>
</div>

<div className="p-stack-md flex gap-stack-sm overflow-x-auto hide-scrollbar border-b border-slate-grey/10">
<span className="px-3 py-1 border border-slate-grey/30 rounded-full font-label-caps text-label-caps text-ink-black text-[10px] whitespace-nowrap cursor-pointer hover:border-ink-black transition-colors">18K Gold</span>
<span className="px-3 py-1 border border-slate-grey/30 rounded-full font-label-caps text-label-caps text-slate-grey text-[10px] whitespace-nowrap cursor-pointer hover:border-ink-black transition-colors">White Gold</span>
<span className="px-3 py-1 border border-slate-grey/30 rounded-full font-label-caps text-label-caps text-slate-grey text-[10px] whitespace-nowrap cursor-pointer hover:border-ink-black transition-colors">Rose Gold</span>
</div>

<div className="flex-grow overflow-y-auto p-stack-md grid grid-cols-2 gap-stack-md content-start">

<div className="group cursor-grab flex flex-col border border-transparent hover:border-slate-grey/20 p-2 transition-colors relative" draggable="true" id="item-chain-1">
<div className="aspect-square bg-soft-linen mb-stack-sm flex items-center justify-center overflow-hidden relative">
<img alt="Essential Cable Chain" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="A close-up studio shot of a fine, delicate gold cable chain necklace resting on a soft, neutral off-white background. The lighting is elegant and diffused, emphasizing the reflective qualities of the premium metal. The composition is stark and minimalist, perfectly aligned with high-end luxury jewelry product photography." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDuha5zmxZjmeurSbFmLeS0A4scbLmS0sXOUGX3HGeCZW-0LBjj_EZi9uZGQzuA3WuliNq11lLrQ8z_cOgy-vDru_iw6qLTcqRRk0xu8ZOv1Gcn-Jm-etxAtw4fiG214lr7L__QlZPOqorts7ragMx_r2xOtdfHZF9TlnUVAXDEzmLDfU4G0zh3UwPwxrIWjAmw42H2ezmLCfKl7suIAU6aVZFV3Go_TmNkgzETOHGCM5zV_KhqOUYvZ5w2-28IMR_58hzXZQuKZbk" />
<button className="absolute top-2 right-2 text-slate-grey opacity-0 group-hover:opacity-100 transition-opacity">
<span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'wght' 300"}}>info</span>
</button>
</div>
<h3 className="font-label-caps text-label-caps text-ink-black mb-1">Essential Cable</h3>
<p className="font-body-md text-slate-grey text-[12px]">$450</p>
</div>

<div className="group cursor-grab flex flex-col border border-transparent hover:border-slate-grey/20 p-2 transition-colors relative" draggable="true">
<div className="aspect-square bg-soft-linen mb-stack-sm flex items-center justify-center overflow-hidden relative">
<img alt="Bold Link Chain" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="A modern, chunky gold link chain necklace displayed against a pale linen background. The studio lighting casts subtle, defined shadows that highlight the architectural structure of the heavy links. The image exudes a confident, minimalist luxury aesthetic, focusing entirely on the geometry and finish of the gold piece." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOoZW-WndYhfg6dhj4b4btq4TkiQJYFg0nxYOY2Q8hDGr2950GVLdZcD26JHKlwrI9u2I0uADIwyVR1Hq2j3SgxFBPtHyUpJr4VEbQyI4kO1uzzTUA0PGkc4i52QwOREMajoEOlJJtQbkOiZ5FKWE5Dw4VH45QEG0WW1N3Iy5_G9fFbys1qAdkFkTEP1seaODbQijANmq1TVzyaS2Kx_wAti1BrQlVVz6oAGPdZcpAS--9LIdzeX4YpqmPEtNqNl7U8nelFhdP-Mw" />
<button className="absolute top-2 right-2 text-slate-grey opacity-0 group-hover:opacity-100 transition-opacity">
<span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'wght' 300"}}>info</span>
</button>
</div>
<h3 className="font-label-caps text-label-caps text-ink-black mb-1">Bold Link</h3>
<p className="font-body-md text-slate-grey text-[12px]">$890</p>
</div>

<div className="group cursor-grab flex flex-col border border-transparent hover:border-slate-grey/20 p-2 transition-colors relative" draggable="true">
<div className="aspect-square bg-soft-linen mb-stack-sm flex items-center justify-center overflow-hidden relative">
<img alt="Snake Chain" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="A sleek, fluid gold snake chain necklace coiled perfectly on a smooth, bright white surface. The continuous, highly polished surface of the chain catches light evenly, creating a seamless metallic glow. The minimalist setting and architectural approach to the lighting emphasize the modern sophistication and quiet luxury of the jewelry piece." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqBMHZjO-U7MNrbFA31FOs0LWh9uPmO6HYWl0id2ZD0_0eoY-7bPY51TJfZYZTcCgcJnSbNSmZZZlRCvq1cavyTVinKlVy_KU3fv_hHOk5G89-TjUXpoRGJuQBMqSZIrZXnaYKB0bIiCvceW3_fS5jJQinZyjPVDvJ8s9DollB_1XDLKRp29h_vVv1o21BQtHzuB7WWCpBitO4hsraAA9z-J1h1_gs206flmjV9tHXHcrU1GeSJeBT7OXLRHIj3zoUPwflxwCFtk8" />
<button className="absolute top-2 right-2 text-slate-grey opacity-0 group-hover:opacity-100 transition-opacity">
<span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'wght' 300"}}>info</span>
</button>
</div>
<h3 className="font-label-caps text-label-caps text-ink-black mb-1">Fluid Snake</h3>
<p className="font-body-md text-slate-grey text-[12px]">$620</p>
</div>

<div className="group cursor-grab flex flex-col border border-transparent hover:border-slate-grey/20 p-2 transition-colors relative" draggable="true">
<div className="aspect-square bg-soft-linen mb-stack-sm flex items-center justify-center overflow-hidden relative">
<img alt="Box Chain" className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500" data-alt="An elegant gold box chain necklace photographed beautifully against a plain, soft neutral background. The lighting is carefully controlled to show the geometric detail of each box link, creating a sophisticated play of light and shadow. The overall mood is modern, clean, and representative of high-end minimal jewelry design." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBn0ya7aWZiUzvRR0W8voBIkrT_kQpJmTlRNfn0awIYeHtJTY6oTOWvp7p5iK1TK1EBGU0KrPmi5E0etMNY83VQ6-oi_rDAgsfKckAAzYj4kwGKqqVkyGjxFsYQKr72UKyAWazral0V4Rb9IRKeHLKHb83Aj2Q4qkIDu8eBknM_NN_F-2TtJkRZF_9fIPum9oINKOJMmYd9fIdtG0DANAOpyr8feOTRmwzfSDFvEpmxq_ocFnWCsWT7eWD18ziy6_rC00tS78WC26U" />
<button className="absolute top-2 right-2 text-slate-grey opacity-0 group-hover:opacity-100 transition-opacity">
<span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: "'wght' 300"}}>info</span>
</button>
</div>
<h3 className="font-label-caps text-label-caps text-ink-black mb-1">Structured Box</h3>
<p className="font-body-md text-slate-grey text-[12px]">$550</p>
</div>
</div>
</aside>
</main>
    </div>
  );
}
