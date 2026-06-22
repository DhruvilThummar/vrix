"use client";
import React, { useState } from "react";

export default function Page() {
  return (
    <div className="w-full">
      <main className="flex-1 relative w-full h-full camera-feed" data-alt="A POV shot looking down at a person's elegant hand resting naturally. The lighting is soft, natural daylight typical of a modern luxury environment. The overall aesthetic is clean, sophisticated, and perfect for showcasing high-end jewelry. The image serves as a realistic live camera feed background for an AR try-on experience.">

<div className="absolute top-0 left-0 w-full flex justify-between items-center p-margin-mobile z-10 pt-12">
<button aria-label="Close AR view" className="w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center border border-slate-grey/20 active:scale-95 transition-transform">
<span className="material-symbols-outlined text-on-surface">close</span>
</button>
<div className="flex gap-4">
<button aria-label="Take Photo" className="w-10 h-10 rounded-full bg-surface-container-lowest/80 backdrop-blur-md flex items-center justify-center border border-slate-grey/20 active:scale-95 transition-transform">
<span className="material-symbols-outlined text-on-surface">photo_camera</span>
</button>
</div>
</div>

<div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
<div className="w-48 h-48 ar-overlay mt-[-100px]" data-alt="A photorealistic 3D render of a minimalist, lab-grown diamond solitaire ring with a thin band. The render is high-fidelity, catching bright, clean studio light to emphasize luxury and precision. It floats as if overlaid on the hand beneath it."></div>
</div>

<div className="absolute bottom-0 w-full bg-gradient-to-t from-surface-container-lowest/90 via-surface-container-lowest/60 to-transparent pt-section-gap pb-margin-mobile px-margin-mobile z-20 backdrop-blur-[2px]">
<div className="flex flex-col items-center max-w-md mx-auto space-y-stack-lg">

<div className="text-center">
<h1 className="font-headline-md text-headline-md text-on-surface mb-2">Ethereal Solitaire Ring</h1>
<p className="font-body-md text-body-md text-slate-grey">2.0ct Lab-Grown Diamond</p>
<p className="font-headline-md text-headline-md text-deep-navy mt-1">$4,250</p>
</div>

<div className="flex gap-4 items-center justify-center">

<button aria-label="Select White Gold" className="w-12 h-12 rounded-full border-2 border-deep-navy bg-surface-container-highest flex items-center justify-center p-1">
<div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-400"></div>
</button>

<button aria-label="Select Yellow Gold" className="w-12 h-12 rounded-full border border-slate-grey/30 bg-surface-container-highest flex items-center justify-center p-1 hover:border-slate-grey transition-colors">
<div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-200 to-yellow-500"></div>
</button>

<button aria-label="Select Rose Gold" className="w-12 h-12 rounded-full border border-slate-grey/30 bg-surface-container-highest flex items-center justify-center p-1 hover:border-slate-grey transition-colors">
<div className="w-full h-full rounded-full bg-gradient-to-br from-pink-200 to-rose-400"></div>
</button>
</div>

<button className="w-full bg-deep-navy text-pure-white font-button text-button uppercase py-4 rounded-full active:bg-deep-navy/90 transition-colors flex items-center justify-center gap-2">
<span className="material-symbols-outlined icon-fill text-lg">shopping_bag</span>
                    Add to Bag
                </button>
</div>
</div>
</main>
    </div>
  );
}
