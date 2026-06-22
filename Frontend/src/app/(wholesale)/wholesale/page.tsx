"use client";
import React, { useState } from "react";

export default function Page() {
  return (
    <div className="w-full">
      <div className="flex h-screen overflow-hidden">

<aside className="w-64 bg-pure-white border-r border-slate-grey/20 flex flex-col hidden md:flex h-full shrink-0">
<div className="p-margin-desktop py-stack-lg border-b border-slate-grey/20">
<h1 className="font-display-lg text-headline-md tracking-widest text-deep-navy">VRIX</h1>
<span className="font-label-caps text-label-caps text-slate-grey mt-2 block">Wholesale Portal</span>
</div>
<nav className="flex-1 overflow-y-auto py-stack-lg px-stack-md flex flex-col gap-stack-sm">
<a className="flex items-center gap-4 px-4 py-3 bg-soft-linen text-deep-navy rounded-none border-l-2 border-deep-navy transition-colors duration-300" href="#">
<span className="material-symbols-outlined text-xl">dashboard</span>
<span className="font-button text-button">Overview</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 text-slate-grey hover:bg-soft-linen/50 hover:text-deep-navy rounded-none border-l-2 border-transparent transition-colors duration-300" href="#">
<span className="material-symbols-outlined text-xl">inventory_2</span>
<span className="font-button text-button">Catalog</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 text-slate-grey hover:bg-soft-linen/50 hover:text-deep-navy rounded-none border-l-2 border-transparent transition-colors duration-300" href="#">
<span className="material-symbols-outlined text-xl">receipt_long</span>
<span className="font-button text-button">Orders</span>
</a>
<a className="flex items-center gap-4 px-4 py-3 text-slate-grey hover:bg-soft-linen/50 hover:text-deep-navy rounded-none border-l-2 border-transparent transition-colors duration-300" href="#">
<span className="material-symbols-outlined text-xl">account_balance_wallet</span>
<span className="font-button text-button">Invoices</span>
</a>
</nav>
<div className="p-stack-md border-t border-slate-grey/20">
<a className="flex items-center gap-4 px-4 py-3 text-slate-grey hover:text-deep-navy transition-colors duration-300" href="#">
<span className="material-symbols-outlined text-xl">settings</span>
<span className="font-button text-button">Settings</span>
</a>
<div className="mt-4 flex items-center gap-3 px-4">
<div className="w-8 h-8 rounded-full bg-slate-grey/20 flex items-center justify-center text-deep-navy font-label-caps text-label-caps">AB</div>
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-deep-navy">Atelier Boutique</span>
<span className="text-xs text-slate-grey">Tier: Platinum</span>
</div>
</div>
</div>
</aside>

<main className="flex-1 overflow-y-auto bg-soft-linen/50 relative">

<header className="md:hidden flex items-center justify-between p-margin-mobile bg-pure-white border-b border-slate-grey/20 sticky top-0 z-10">
<div className="flex items-center gap-3">
<button className="text-deep-navy">
<span className="material-symbols-outlined">menu</span>
</button>
<h1 className="font-display-lg-mobile text-headline-md tracking-widest text-deep-navy">VRIX</h1>
</div>
<div className="w-8 h-8 rounded-full bg-slate-grey/20 flex items-center justify-center text-deep-navy font-label-caps text-label-caps">AB</div>
</header>
<div className="p-margin-mobile md:p-margin-desktop max-w-container-max mx-auto space-y-section-gap pb-section-gap">

<section className="space-y-stack-lg">
<div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md">
<div>
<h2 className="font-display-lg text-display-lg text-deep-navy">Welcome back.</h2>
<p className="font-body-lg text-body-lg text-slate-grey mt-2">Here is your wholesale overview for Q3.</p>
</div>
<div className="flex gap-4 items-center">
<div className="relative">
<select className="appearance-none bg-pure-white border border-slate-grey/30 text-deep-navy font-button text-button py-2 pl-4 pr-10 rounded-none focus:outline-none focus:border-deep-navy focus:ring-1 focus:ring-deep-navy">
<option>USD ($)</option>
<option>EUR (€)</option>
<option>GBP (£)</option>
</select>
<span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-grey text-sm">expand_more</span>
</div>
<button className="bg-deep-navy text-pure-white font-button text-button px-6 py-3 uppercase tracking-wider hover:bg-deep-navy/90 transition-colors">
                                New Order
                            </button>
</div>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
<div className="bg-pure-white p-stack-lg border border-slate-grey/10 relative overflow-hidden group">
<div className="absolute inset-0 bg-gradient-to-br from-soft-linen/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
<span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest block mb-4">YTD Spend</span>
<div className="font-display-lg text-display-lg text-deep-navy mb-2">$142,500</div>
<div className="flex items-center gap-2 text-sm text-green-700">
<span className="material-symbols-outlined text-sm">trending_up</span>
<span>+12.4% vs last year</span>
</div>
</div>
<div className="bg-pure-white p-stack-lg border border-slate-grey/10 relative overflow-hidden group">
<div className="absolute inset-0 bg-gradient-to-br from-soft-linen/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
<span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest block mb-4">Active Orders</span>
<div className="font-display-lg text-display-lg text-deep-navy mb-2">4</div>
<div className="flex items-center gap-2 text-sm text-slate-grey">
<span className="material-symbols-outlined text-sm">local_shipping</span>
<span>2 arriving this week</span>
</div>
</div>
<div className="bg-pure-white p-stack-lg border border-slate-grey/10 relative overflow-hidden group">
<div className="absolute inset-0 bg-gradient-to-br from-soft-linen/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
<span className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest block mb-4">Available Credit</span>
<div className="font-display-lg text-display-lg text-deep-navy mb-2">$57,500</div>
<div className="flex items-center gap-2 text-sm text-slate-grey">
<span className="material-symbols-outlined text-sm">info</span>
<span>Net 60 Terms applied</span>
</div>
</div>
</div>
</section>

<section className="space-y-stack-lg">
<div className="flex items-center justify-between border-b border-slate-grey/20 pb-4">
<h3 className="font-headline-md text-headline-md text-deep-navy">Quick Order Pad</h3>
<a className="font-button text-button text-slate-grey hover:text-deep-navy transition-colors underline decoration-1 underline-offset-4" href="#">View Full Catalog</a>
</div>
<div className="bg-pure-white border border-slate-grey/10 overflow-x-auto">
<table className="w-full text-left border-collapse">
<thead>
<tr className="border-b border-slate-grey/20 bg-soft-linen/30">
<th className="py-4 px-6 font-label-caps text-label-caps text-slate-grey font-normal">SKU / Product</th>
<th className="py-4 px-6 font-label-caps text-label-caps text-slate-grey font-normal">Category</th>
<th className="py-4 px-6 font-label-caps text-label-caps text-slate-grey font-normal text-right">WHSL Price</th>
<th className="py-4 px-6 font-label-caps text-label-caps text-slate-grey font-normal text-center">Qty (Min: 5)</th>
<th className="py-4 px-6 font-label-caps text-label-caps text-slate-grey font-normal text-right">Line Total</th>
<th className="py-4 px-6"></th>
</tr>
</thead>
<tbody className="font-body-md text-body-md text-deep-navy divide-y divide-slate-grey/10">
<tr className="hover:bg-soft-linen/30 transition-colors group">
<td className="py-4 px-6">
<div className="flex items-center gap-4">
<div className="w-12 h-16 bg-soft-linen overflow-hidden">
<img alt="Minimalist gold necklace against a stark white background" className="w-full h-full object-cover grayscale mix-blend-multiply group-hover:grayscale-0 transition-all duration-500" data-alt="A sophisticated minimalist gold necklace displayed on a pristine white marble surface. The lighting is soft and studio-quality, creating subtle, luxurious shadows that emphasize the high-end jewelry design. The aesthetic is clean, modern, and aligned with a premium, conscious luxury brand. The mood is quiet and elegant, highlighting architectural minimalism." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA_Yshg-Vuild1Wlxtqi1ax1YJuWpWibdR4EgEvHz5IaLGmvP_u6Gp7KwRidmqPgSV_xeRUwhrGJxreUm5p00KAaPkttoPwRKavdYWObj7O56nUxWY8QOOSc5NpS9ZoHXXYcSinMaeYiWuph86tRyz7Tcc5lfLwAfjskH4kXCL27ji7_nep0XsrQHFZwNc62jA8N4hRqpys_pWvoUw3kT88L85h9SFbySLmg1h4ODJ3oYeAogV6s9HohfwgjvuKYqH8beMeKlFSyuM" />
</div>
<div>
<div className="font-button text-button">Aethel Gold Chain</div>
<div className="text-xs text-slate-grey mt-1">VRIX-N-042</div>
</div>
</div>
</td>
<td className="py-4 px-6 text-slate-grey">Necklaces</td>
<td className="py-4 px-6 text-right">$450.00</td>
<td className="py-4 px-6">
<div className="flex items-center justify-center gap-2">
<button className="w-8 h-8 border border-slate-grey/30 flex items-center justify-center hover:border-deep-navy hover:text-deep-navy transition-colors"><span className="material-symbols-outlined text-sm">remove</span></button>
<input className="w-16 text-center border-b border-slate-grey/30 focus:border-deep-navy focus:ring-0 p-1 bg-transparent" min="5" type="number" defaultValue="10" />
<button className="w-8 h-8 border border-slate-grey/30 flex items-center justify-center hover:border-deep-navy hover:text-deep-navy transition-colors"><span className="material-symbols-outlined text-sm">add</span></button>
</div>
</td>
<td className="py-4 px-6 text-right font-bold">$4,500.00</td>
<td className="py-4 px-6 text-center">
<button className="text-slate-grey hover:text-error transition-colors"><span className="material-symbols-outlined text-xl">delete_outline</span></button>
</td>
</tr>
<tr className="hover:bg-soft-linen/30 transition-colors group">
<td className="py-4 px-6">
<div className="flex items-center gap-4">
<div className="w-12 h-16 bg-soft-linen overflow-hidden">
<img alt="Sleek silver bracelet on grey" className="w-full h-full object-cover grayscale mix-blend-multiply group-hover:grayscale-0 transition-all duration-500" data-alt="An architectural silver cuff bracelet resting on a muted slate-grey textured background. The lighting is precise, highlighting the sharp lines and brushed metal finish of the piece. The overall composition breathes minimalism and sophisticated restraint. The aesthetic captures the essence of quiet luxury with a focus on form and materiality." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYjdZq_FN6_y29jCu76BwOInzJvUj96hWm7VP7tKdHbAVUCAKXDeHmC8Wt_VqbuA6Ec2BprZ63mWFc7m7qXH1NF9yYPHlleZevB4X9zZEIjxKycA9HZLyWcRdbFsCOKz1KewMeNNzZl4RRO_Vo1E01xoJbEmeceV6imx45YWwfDYZ4Cbiw0bvZfMP16tgwUYPStnbNViDdBforIeGCKyet7jzvuR9y-HtLMHp80vGaRcxu3DB9eo97ISeZodewd9ZTcX-DB66Os2w" />
</div>
<div>
<div className="font-button text-button">Onyx Cuff</div>
<div className="text-xs text-slate-grey mt-1">VRIX-B-118</div>
</div>
</div>
</td>
<td className="py-4 px-6 text-slate-grey">Bracelets</td>
<td className="py-4 px-6 text-right">$620.00</td>
<td className="py-4 px-6">
<div className="flex items-center justify-center gap-2">
<button className="w-8 h-8 border border-slate-grey/30 flex items-center justify-center hover:border-deep-navy hover:text-deep-navy transition-colors"><span className="material-symbols-outlined text-sm">remove</span></button>
<input className="w-16 text-center border-b border-slate-grey/30 focus:border-deep-navy focus:ring-0 p-1 bg-transparent" min="5" type="number" defaultValue="5" />
<button className="w-8 h-8 border border-slate-grey/30 flex items-center justify-center hover:border-deep-navy hover:text-deep-navy transition-colors"><span className="material-symbols-outlined text-sm">add</span></button>
</div>
</td>
<td className="py-4 px-6 text-right font-bold">$3,100.00</td>
<td className="py-4 px-6 text-center">
<button className="text-slate-grey hover:text-error transition-colors"><span className="material-symbols-outlined text-xl">delete_outline</span></button>
</td>
</tr>
</tbody>
</table>
<div className="p-6 bg-soft-linen/50 flex justify-end items-center gap-6 border-t border-slate-grey/20">
<div className="text-right">
<div className="font-label-caps text-label-caps text-slate-grey mb-1">Subtotal (15 items)</div>
<div className="font-headline-md text-headline-md text-deep-navy">$7,600.00</div>
</div>
<button className="bg-deep-navy text-pure-white font-button text-button px-8 py-4 uppercase tracking-wider hover:bg-deep-navy/90 transition-colors">
                                Add to Draft
                            </button>
</div>
</div>
</section>
</div>
</main>
</div>
    </div>
  );
}
