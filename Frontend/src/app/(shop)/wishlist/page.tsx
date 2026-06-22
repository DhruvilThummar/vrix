"use client";
import React, { useState } from "react";

export default function Page() {
  return (
    <div className="w-full">
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg md:py-section-gap">

<header className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-grey/30 pb-stack-lg mb-stack-lg">
<div>
<h1 className="font-display-lg text-display-lg md:font-display-lg md:text-display-lg text-on-surface tracking-tight">Your Wishlist</h1>
</div>
<div className="mt-4 md:mt-0">
<span className="font-label-caps text-label-caps text-secondary uppercase tracking-widest">4 Items Saved</span>
</div>
</header>

<div className="grid grid-cols-2 md:grid-cols-4 gap-x-gutter gap-y-section-gap">

<article className="bg-pure-white flex flex-col h-full border border-slate-grey/10 hover:border-slate-grey/30 transition-colors duration-300">
<div className="aspect-[4/5] bg-surface-container-low overflow-hidden relative">
<img alt="Product Image" className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 hover:scale-105" data-alt="A minimalist, high-end studio photograph of a delicate gold architectural ring resting on a pristine white marble pedestal. The lighting is soft and cinematic, casting subtle, elegant shadows that highlight the geometric precision of the jewelry. The overall aesthetic perfectly aligns with a quiet luxury brand, utilizing generous negative space and a clean, high-contrast composition." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMOEEPML7dpx5ItnOx4IRcF_3WeZ8PmYo4Lp2AgJcaq9hyG_H7IphcqzSiXDInGr-joD2AjtFamVhu9G60lf_ynw7WTGnUG_UyjI3TxoVax_VTNATBQZIQsBugE9kwJoOTFXeqYiBgb_2SjVKF2x9HG0rTEzUc3x0HPbW47K397xuLRkPSelysggmAVQT1l4BdaIchTaRDUru2qCol4E11jXBI40vdjwUi3JOubcfUWnG4fHnMExhhv08QRRjJlh8LjakxS1AflIA" />
</div>
<div className="p-stack-md flex flex-col flex-grow justify-between">
<div className="mb-stack-lg">
<h2 className="font-body-lg text-body-lg text-on-surface mb-2">Equinox Gold Ring</h2>
<p className="font-body-md text-body-md text-secondary">$1,450</p>
</div>
<div className="space-y-4">
<button className="w-full bg-deep-navy text-pure-white font-button text-button py-4 uppercase tracking-widest hover:bg-on-surface transition-colors duration-300">
                            Move to Bag
                        </button>
<button className="w-full text-center font-label-caps text-label-caps text-slate-grey hover:text-deep-navy hover:underline underline-offset-4 transition-all duration-300">
                            Remove
                        </button>
</div>
</div>
</article>

<article className="bg-pure-white flex flex-col h-full border border-slate-grey/10 hover:border-slate-grey/30 transition-colors duration-300">
<div className="aspect-[4/5] bg-surface-container-low overflow-hidden relative">
<img alt="Product Image" className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 hover:scale-105" data-alt="A sophisticated macro shot of a sleek silver cuff bracelet positioned against a stark, pure white background. The image embraces architectural minimalism, focusing entirely on the flawless, reflective surface of the metal and its perfect, unadorned curvature. The lighting is pristine and highly controlled, creating a modern, premium light-mode visual experience devoid of distracting elements." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgPHLizh_JwGyUOYdbdi_dIUlWmi5BHNHCir9KyVL5LjdWntWUlknSLP2c4e3Rt4btaJeBdBJHTM6Oz7C5tiHXF6n7pZkrsr1lQVzpRW4OcQ7Xne2J6j0HdD90pz6xgDjiBKH2mgKqT0WVzMubGFxFtfFgwY1uVWKIrU9pn15SQx6Jr5JwLQVljnOPK5rpDwDpvZIT3k1T7IRJl3wSpy6e5PRzSWxl5Ll2vo3C1mL8lq8ZQCg00GwTatAjY_2VOZJeQO6wSo3fTYs" />
</div>
<div className="p-stack-md flex flex-col flex-grow justify-between">
<div className="mb-stack-lg">
<h2 className="font-body-lg text-body-lg text-on-surface mb-2">Linear Silver Cuff</h2>
<p className="font-body-md text-body-md text-secondary">$950</p>
</div>
<div className="space-y-4">
<button className="w-full bg-deep-navy text-pure-white font-button text-button py-4 uppercase tracking-widest hover:bg-on-surface transition-colors duration-300">
                            Move to Bag
                        </button>
<button className="w-full text-center font-label-caps text-label-caps text-slate-grey hover:text-deep-navy hover:underline underline-offset-4 transition-all duration-300">
                            Remove
                        </button>
</div>
</div>
</article>

<article className="bg-pure-white flex flex-col h-full border border-slate-grey/10 hover:border-slate-grey/30 transition-colors duration-300">
<div className="aspect-[4/5] bg-surface-container-low overflow-hidden relative">
<img alt="Product Image" className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 hover:scale-105" data-alt="An editorial-style close-up of geometric gold earrings suspended elegantly in mid-air against a soft linen-colored backdrop. The composition is highly intentional, utilizing a 12-column grid-like structure in its negative space. The lighting emphasizes the sharp angles and meticulous craftsmanship of the luxury jewelry, conveying a sense of quiet permanence and refined taste." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkaaSI2U7mE1d6cGpuCid-1e7j-mI02ZqRhLCo-tn_g6ujke-VGi68OgxdLSpf7of0cjlpqyp_fZNxT3nF2-2cCKz4OqetlMMH6vheUWAGjR5G4gCQD9BLw4qEFIx_uNuA6EsBjhCPcowCDuxsFLKgJMDYPj__-X9GJE9vy2nDUsYRbGF76gp1ggxIIymDdXkPSC2kznvFp5w64Ik4mcr3reZ3uCSiFb7izVDIkrVxIrFWayIFXqeD0aWlb59WxNhDL-c0YPMgEUI" />
</div>
<div className="p-stack-md flex flex-col flex-grow justify-between">
<div className="mb-stack-lg">
<h2 className="font-body-lg text-body-lg text-on-surface mb-2">Vertex Drop Earrings</h2>
<p className="font-body-md text-body-md text-secondary">$1,800</p>
</div>
<div className="space-y-4">
<button className="w-full bg-deep-navy text-pure-white font-button text-button py-4 uppercase tracking-widest hover:bg-on-surface transition-colors duration-300">
                            Move to Bag
                        </button>
<button className="w-full text-center font-label-caps text-label-caps text-slate-grey hover:text-deep-navy hover:underline underline-offset-4 transition-all duration-300">
                            Remove
                        </button>
</div>
</div>
</article>

<article className="bg-pure-white flex flex-col h-full border border-slate-grey/10 hover:border-slate-grey/30 transition-colors duration-300">
<div className="aspect-[4/5] bg-surface-container-low overflow-hidden relative">
<img alt="Product Image" className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 hover:scale-105" data-alt="A meticulously styled photograph of a minimalist chain necklace draped over a smooth, brutalist concrete form, juxtaposed against a pure white setting. The image captures the essence of conscious luxury, focusing on the interplay between the delicate jewelry and the raw, architectural prop. The visual palette is restrained, relying on subtle tonal shifts and sharp 1px details to create depth." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkwP3HXAm_gR2x0PxlnYtDcBEx4oPMU9NSQe-JzesBMr_0zJ5zsHqDHOFMbXFIYwEeokKI8MFpCvqEVhN6s0YHOY7jNLSv0RMOgdkwx3C-1n-VNIkEu3Atzjk4FVIFzZ56d06IJJKTmkXKDJJbdH2Ev4r6218otksbpHaGUgt4CnsL57gCiJ-TZy0haxwki60AonW8SXbnX2XKtl3mVAcQ2DJ6XdKvQnIl3mOXsFMF74zTTE4ooTzpq7_wqUiys7XJxp-PWCUeHEI" />
</div>
<div className="p-stack-md flex flex-col flex-grow justify-between">
<div className="mb-stack-lg">
<h2 className="font-body-lg text-body-lg text-on-surface mb-2">Essence Chain</h2>
<p className="font-body-md text-body-md text-secondary">$650</p>
</div>
<div className="space-y-4">
<button className="w-full bg-deep-navy text-pure-white font-button text-button py-4 uppercase tracking-widest hover:bg-on-surface transition-colors duration-300">
                            Move to Bag
                        </button>
<button className="w-full text-center font-label-caps text-label-caps text-slate-grey hover:text-deep-navy hover:underline underline-offset-4 transition-all duration-300">
                            Remove
                        </button>
</div>
</div>
</article>
</div>
</main>
    </div>
  );
}
