"use client";
import React, { useState, useEffect } from "react";
import { fetchDbPublic as fetchDb } from "@/utils/api";

export default function Page() {
  const [brandName, setBrandName] = useState("VRIX");
  const [email, setEmail] = useState("vrixjewels@gmail.com");
  const [phone, setPhone] = useState("905-428-5693");
  const [address, setAddress] = useState("");

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.brand) {
          if (res.brand.name) setBrandName(res.brand.name);
          if (res.brand.email) setEmail(res.brand.email);
          if (res.brand.phone) setPhone(res.brand.phone);
          if (res.brand.address) setAddress(res.brand.address);
        }
      })
      .catch((err) => console.error("Error loading contact brand info:", err));
  }, []);

  return (
    <div className="w-full">
      <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-section-gap flex flex-col md:flex-row gap-gutter">

<section className="w-full md:w-1/2 pr-0 md:pr-12 lg:pr-24 flex flex-col justify-center bg-pure-white">
<h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-deep-navy mb-stack-md">We are here to assist you.</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg max-w-md">
                Our client advisors are available to answer any questions regarding your {brandName} experience, from styling advice to order inquiries.
            </p>
<div className="space-y-stack-md mt-stack-lg border-t border-slate-grey/30 pt-stack-lg">
<div className="flex flex-col">
<span className="font-label-caps text-label-caps text-slate-grey mb-2 uppercase">Email Enquiries</span>
<a className="font-body-md text-body-md text-deep-navy hover:underline decoration-1 underline-offset-4 transition-all" href={`mailto:${email}`}>{email}</a>
</div>
<div className="flex flex-col mt-stack-md">
<span className="font-label-caps text-label-caps text-slate-grey mb-2 uppercase">Client Services</span>
<a className="font-body-md text-body-md text-deep-navy hover:underline decoration-1 underline-offset-4 transition-all" href={`tel:${phone}`}>{phone}</a>
<span className="font-body-md text-body-md text-on-surface-variant mt-1 text-sm">Mon - Fri: 9am - 6pm EST</span>
</div>
{address && (
<div className="flex flex-col mt-stack-md">
<span className="font-label-caps text-label-caps text-slate-grey mb-2 uppercase">Headquarters</span>
<p className="font-body-md text-body-md text-deep-navy">{address}</p>
</div>
)}
</div>

<div className="mt-section-gap h-64 w-full bg-soft-linen relative overflow-hidden" data-alt="A macro close-up of a sophisticated, minimalist diamond ring resting delicately on a softly textured, pure white linen cloth. The lighting is high-key, bright, and natural, casting very soft, diffused shadows. The aesthetic is clean, modern, and luxurious, emphasizing the pristine quality of the jewelry against the pure white and soft linen background. Deep navy accents are barely hinted at in the out-of-focus reflections.">

</div>
</section>

<section className="w-full md:w-1/2 mt-section-gap md:mt-0 bg-soft-linen p-8 md:p-12 lg:p-16 flex flex-col justify-center">
<h2 className="font-headline-md text-headline-md text-deep-navy mb-stack-lg">Send a Message</h2>
<form action="#" className="space-y-stack-lg" method="POST">
<div className="floating-label">
<input className="minimal-input w-full font-body-md text-body-md text-on-surface py-2 bg-transparent" id="name" name="name" placeholder="Name" required={true} type="text" />
<label className="font-body-md text-body-md" htmlFor="name">Full Name</label>
</div>
<div className="floating-label">
<input className="minimal-input w-full font-body-md text-body-md text-on-surface py-2 bg-transparent" id="email" name="email" placeholder="Email" required={true} type="email" />
<label className="font-body-md text-body-md" htmlFor="email">Email Address</label>
</div>
<div className="floating-label">
<input className="minimal-input w-full font-body-md text-body-md text-on-surface py-2 bg-transparent" id="order" name="order" placeholder="Order Number" type="text" />
<label className="font-body-md text-body-md" htmlFor="order">Order Number (Optional)</label>
</div>
<div className="floating-label pt-4">
<textarea className="minimal-input w-full font-body-md text-body-md text-on-surface py-2 resize-none bg-transparent" id="message" name="message" placeholder="Message" required={true} rows={4}></textarea>
<label className="font-body-md text-body-md" htmlFor="message">How can we help you?</label>
</div>
<button className="mt-stack-lg w-full md:w-auto bg-deep-navy text-pure-white font-button text-button uppercase py-4 px-12 tracking-widest hover:bg-on-primary-fixed-variant transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-deep-navy rounded-none" type="submit">
                    Send Message
                </button>
</form>
</section>
</main>
    </div>
  );
}
