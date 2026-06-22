"use client";
import React, { useState } from "react";

export default function Page() {
  return (
    <div className="w-full">
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pt-section-gap pb-section-gap flex flex-col items-center">

<div className="w-full max-w-3xl relative mb-stack-lg animate-fade-in-up">
<span className="material-symbols-outlined absolute left-0 top-1/2 transform -translate-y-1/2 text-slate-grey text-[28px]">search</span>
<input autoFocus={true} className="search-input w-full bg-transparent border-0 border-b border-slate-grey/30 py-4 pl-12 pr-4 text-display-lg-mobile md:text-display-lg font-display-lg placeholder:text-slate-grey/50 transition-colors duration-300" placeholder="Search VRIX..." type="text" />
<button aria-label="Close Search" className="absolute right-0 top-1/2 transform -translate-y-1/2 text-slate-grey hover:text-deep-navy transition-colors duration-300">
<span className="material-symbols-outlined text-[28px]">close</span>
</button>
</div>

<div className="w-full max-w-3xl mb-section-gap animate-fade-in-up" style={{animationDelay: "100ms"}}>
<h2 className="font-label-caps text-label-caps text-slate-grey mb-stack-md uppercase tracking-widest">Trending Searches</h2>
<div className="flex flex-wrap gap-x-stack-lg gap-y-stack-sm font-trending text-body-lg text-secondary">
<a className="hover:text-deep-navy transition-colors duration-300 relative group" href="#">
                    Lab-grown rings
                    <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-deep-navy transition-all duration-300 group-hover:w-full"></span>
</a>
<a className="hover:text-deep-navy transition-colors duration-300 relative group" href="#">
                    Tennis bracelets
                    <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-deep-navy transition-all duration-300 group-hover:w-full"></span>
</a>
<a className="hover:text-deep-navy transition-colors duration-300 relative group" href="#">
                    Bespoke necklaces
                    <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-deep-navy transition-all duration-300 group-hover:w-full"></span>
</a>
<a className="hover:text-deep-navy transition-colors duration-300 relative group" href="#">
                    Gold hoops
                    <span className="absolute left-0 bottom-0 w-0 h-[1px] bg-deep-navy transition-all duration-300 group-hover:w-full"></span>
</a>
</div>
</div>

<div className="w-full animate-fade-in-up" style={{animationDelay: "200ms"}}>
<h2 className="font-label-caps text-label-caps text-slate-grey mb-stack-lg uppercase tracking-widest border-b border-slate-grey/20 pb-4">Suggested Results</h2>
<div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">

<a className="group block relative cursor-pointer" href="#">
<div className="aspect-[4/5] bg-soft-linen mb-stack-sm overflow-hidden relative">
<img alt="Product" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A macro studio shot of a brilliant cut diamond ring resting on a smooth, dark grey stone surface. The lighting is dramatic and precise, highlighting the facets of the lab-grown diamond against a stark, minimalist background. The aesthetic conveys quiet luxury, high-end craftsmanship, and modern sophistication." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2UBndJAxWkW-pP2XFZT5MTOnF_jOEDF-YJRH-woMwBh12nHteNO17XkJmc7aSpbN2qinsqOZnrbUDlfs73MXTIVIJjlwh5r_khwe8CvN7AQRF8F2GbK5qiVZwtLu_T_q_FUGu4bicdtk0I5Dz4KSmQqotlyvOM9xSDrAJAOU6RuvIV0Bj_-f_fSgeglpb1ZJ3PtPv6jfB9bJ5vZ5nWJGKz7iScTXFCAU7gUsoYyWBM4m8gspJgIUSrdnnEbwsPvToVccWGn0wrIA" />
</div>
<div className="flex justify-between items-start">
<div>
<h3 className="font-body-md text-body-md text-on-background mb-1 group-hover:text-deep-navy transition-colors">The Solstice Ring</h3>
<p className="font-label-caps text-label-caps text-slate-grey">Lab-Grown Diamond</p>
</div>
<span className="font-body-md text-body-md text-on-background">$2,450</span>
</div>
</a>

<a className="group block relative cursor-pointer" href="#">
<div className="aspect-[4/5] bg-soft-linen mb-stack-sm overflow-hidden relative">
<img alt="Product" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="An elegant, thin gold tennis bracelet draped carefully over a textured, off-white linen fabric. Soft, diffused natural light catches the delicate links and embedded stones, emphasizing the minimalist and sophisticated design. The composition is calm, showcasing conscious luxury and architectural minimalism." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWVrAbWDEsWcWCQrIZhs7Ga01yuMZB1IAfUdCz-muVy3slrGfWi6uZTT8zQVyWLjifpFoE6FXd-yscF_XKd5rIIW9H88KF19oHqm_mqBQg398VQHyVIhYIGT-MOU6eM7Q35JDKNMDiuyyWUI_qBVcV6cWXKHOAawlO1jgLnGj2pUvm-2sSc4wMCW7YvD6iL4v8sUmrPeua-9wD_F_oVs-6P-gO_3YipFzPji3FhplXrDkVF7u6Ox1kP2VdorL891jRDqx5rrkMuN4" />
</div>
<div className="flex justify-between items-start">
<div>
<h3 className="font-body-md text-body-md text-on-background mb-1 group-hover:text-deep-navy transition-colors">Aura Tennis Bracelet</h3>
<p className="font-label-caps text-label-caps text-slate-grey">18k Yellow Gold</p>
</div>
<span className="font-body-md text-body-md text-on-background">$3,100</span>
</div>
</a>

<a className="group block relative cursor-pointer" href="#">
<div className="aspect-[4/5] bg-soft-linen mb-stack-sm overflow-hidden relative">
<img alt="Product" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A pair of architectural, sculptural silver hoop earrings resting on a matte, pure white pedestal. The lighting is crisp and high-key, casting sharp but subtle shadows that accentuate the clean lines and modern geometry of the jewelry. The mood is gallery-like, pristine, and premium." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAECULU9tqlsCcZsvh1LwUE4dBFRb92Ztzwqy84rbYApwTmKJLp8gTDKy5pGIO7-2R7dAlsBQuo1elKREIb0qGccXBe9XTyoduytrS8guIQNLy9Z1qrb34bxbCdKLQW64_5HgQ9hLzLtFiGvcA6_Leoiq6DB3jfuybkyBAX_S5sQy0wK8wSwGq6U1rPQHaPS3-pXpFVOmjpUWfGy2dWXjt_rUpl1AWx_ozjD6pdvxw4T5MrImIJCiDnMH_Br-fJ9PqtmJHmATA2vcY" />
</div>
<div className="flex justify-between items-start">
<div>
<h3 className="font-body-md text-body-md text-on-background mb-1 group-hover:text-deep-navy transition-colors">Crescent Hoops</h3>
<p className="font-label-caps text-label-caps text-slate-grey">Sterling Silver</p>
</div>
<span className="font-body-md text-body-md text-on-background">$450</span>
</div>
</a>

<a className="group block relative cursor-pointer hidden md:block" href="#">
<div className="aspect-[4/5] bg-soft-linen mb-stack-sm overflow-hidden relative">
<img alt="Product" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A minimalist pendant necklace featuring a single, uniquely shaped geometric stone, displayed flat against a smooth, pale grey background. The thin, delicate chain creates a subtle line across the frame. The overall image exudes a quiet permanence, refined simplicity, and elevated aesthetic typical of an editorial lookbook." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4w_o-su0jbKvUSPKOa7xTYNqECHDs-MxdzL-U0orxhB3vqPzzFfsDAE4zxyzp7uBdCiv6SrERqzyW3hHxrm64jnUco1KhbZ2sl1cTFvVTv-7Hcp5EvH79MLzg9mId1UvF_2yow6staOoLwsu9WPMfCeMePRnybrL89glsNkTRjkHnqgYOFu2YYC8M11a2r-MEIj-C5VthM05jUNjST-wA8OzzxSc6Kcd9X3X-DDz6saxDXAHN8cCukGjGmASJNmc7mfDGbgrkx0A" />
</div>
<div className="flex justify-between items-start">
<div>
<h3 className="font-body-md text-body-md text-on-background mb-1 group-hover:text-deep-navy transition-colors">Zenith Pendant</h3>
<p className="font-label-caps text-label-caps text-slate-grey">White Gold &amp; Sapphire</p>
</div>
<span className="font-body-md text-body-md text-on-background">$1,850</span>
</div>
</a>
</div>
</div>
</main>
    </div>
  );
}
