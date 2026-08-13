"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { fetchDbPublic as fetchDb } from "@/utils/api";
import FormattedText from "@/components/FormattedText";

const FAQ_ITEMS = [
  {
    q: "How soon will I receive a response to my enquiry?",
    a: "Our dedicated VRIX Client Concierge team responds to all email and message enquiries within 24 hours."
  },
  {
    q: "Can I visit the VRIX Surat Atelier or book a private consultation?",
    a: "Yes. Our flagship studio in Surat, Gujarat is open daily until 7:00 PM. You can visit us at Hari Om Apartment 101 or book a private virtual consultation."
  },
  {
    q: "How do I check the status of an existing order?",
    a: "You can track your order status in real time by logging into your VRIX Account or by providing your Order ID when calling or emailing Client Services."
  },
  {
    q: "What is the VRIX lifetime craftsmanship warranty?",
    a: "Every piece of VRIX fine jewellery is covered under our lifetime craftsmanship warranty against manufacturing defects, including complimentary stone inspection and professional cleaning."
  }
];

// Official VRIX Contact & Atelier Metadata
const VRIX_CONTACT_INFO = {
  address: "Hari Om Apartment, 101, Surat, Gujarat 395008",
  mapsLink: "https://maps.app.goo.gl/t4WmnkTCFy2vvD8E8",
  googleShareLink: "https://share.google/XHHGL27ByWwzkSREW",
  phoneDisplay: "090542 85693",
  phoneTel: "+919054285693",
  hours: "Open Daily · Closes 7:00 PM",
  email: "vrixjewels@gmail.com",
  brandBio:
    "VRIX Jewels is a premium jewelry brand creating minimalist lab-grown diamond pieces for modern luxury. Each design is crafted with precision, emotion, and elegance—allowing every piece to express individuality through simplicity."
};

export default function ContactPage() {
  const [brandName, setBrandName] = useState("VRIX Jewels");
  const [email, setEmail] = useState(VRIX_CONTACT_INFO.email);
  const [phone, setPhone] = useState(VRIX_CONTACT_INFO.phoneDisplay);
  const [address, setAddress] = useState(VRIX_CONTACT_INFO.address);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General Inquiry",
    order: "",
    message: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "General Inquiry",
        order: "",
        message: ""
      });
    }, 1200);
  };

  return (
    <div className="w-full bg-pure-white text-ink-black min-h-screen">
      {/* ─── Hero Header Banner ─── */}
      <section className="bg-soft-linen/30 border-b border-slate-grey/15 py-16 md:py-24 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <span className="font-label-caps text-xs tracking-[0.3em] uppercase text-[#B59D7C] font-semibold block">
            ★ VRIX CLIENT SERVICES &amp; CONCIERGE
          </span>
          <h1 className="font-headline-md text-3xl md:text-5xl text-deep-navy font-light uppercase tracking-wider leading-tight">
            We are here to <FormattedText text="*assist you.*" highlightClass="font-chancery normal-case text-deep-navy font-normal italic text-4xl md:text-6xl px-1" />
          </h1>
          <p className="font-body-md text-xs md:text-sm text-slate-grey max-w-2xl mx-auto leading-relaxed">
            Our client advisors are available to answer any questions regarding your {brandName} experience, 
            from lab-grown diamond styling advice to bespoke orders and delivery inquiries.
          </p>
        </div>
      </section>

      <main className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12 md:py-20">
        {/* ─── Direct Contact Channels Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {/* Email Card */}
          <div className="p-8 border border-slate-grey/20 bg-pure-white rounded-xs shadow-xs space-y-4 hover:border-deep-navy/40 transition-all">
            <div className="w-10 h-10 rounded-full bg-soft-linen flex items-center justify-center text-deep-navy">
              <span className="material-symbols-outlined text-lg">mail</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block mb-1">
                Email Enquiries
              </span>
              <a
                href={`mailto:${email}`}
                className="font-body-md text-sm md:text-base font-semibold text-deep-navy hover:underline break-all"
              >
                {email}
              </a>
            </div>
            <p className="text-xs text-slate-grey/80 leading-relaxed">
              24-hour response pledge from our private atelier concierge advisors.
            </p>
          </div>

          {/* Phone & Operating Hours Card */}
          <div className="p-8 border border-slate-grey/20 bg-pure-white rounded-xs shadow-xs space-y-4 hover:border-deep-navy/40 transition-all">
            <div className="w-10 h-10 rounded-full bg-soft-linen flex items-center justify-center text-deep-navy">
              <span className="material-symbols-outlined text-lg">call</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block mb-1">
                Client Services Line
              </span>
              <a
                href={`tel:${VRIX_CONTACT_INFO.phoneTel}`}
                className="font-body-md text-sm md:text-base font-semibold text-deep-navy hover:underline"
              >
                {phone || VRIX_CONTACT_INFO.phoneDisplay}
              </a>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>{VRIX_CONTACT_INFO.hours}</span>
            </div>
          </div>

          {/* Location & Google Business Profile Card */}
          <div className="p-8 border border-slate-grey/20 bg-pure-white rounded-xs shadow-xs space-y-4 hover:border-deep-navy/40 transition-all">
            <div className="w-10 h-10 rounded-full bg-soft-linen flex items-center justify-center text-deep-navy">
              <span className="material-symbols-outlined text-lg">location_on</span>
            </div>
            <div>
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest block mb-1">
                Atelier Location
              </span>
              <p className="font-body-md text-xs font-semibold text-deep-navy leading-snug">
                {address || VRIX_CONTACT_INFO.address}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={VRIX_CONTACT_INFO.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-label-caps text-[10px] uppercase tracking-wider text-deep-navy font-bold hover:underline"
              >
                <span>Open in Google Maps</span>
                <span className="material-symbols-outlined text-xs">open_in_new</span>
              </a>
              <span className="text-slate-grey/30">•</span>
              <a
                href={VRIX_CONTACT_INFO.googleShareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-label-caps text-[10px] uppercase tracking-wider text-slate-grey hover:text-deep-navy font-medium"
              >
                <span>Share Profile</span>
              </a>
            </div>
          </div>
        </div>

        {/* ─── Contact Form & Brand Statement Section ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Form */}
          <div className="lg:col-span-7 bg-soft-linen/20 border border-slate-grey/20 p-8 md:p-12 rounded-xs shadow-xs space-y-6">
            <div>
              <span className="font-label-caps text-[10px] text-[#B59D7C] uppercase tracking-widest font-semibold block mb-1">
                GET IN TOUCH
              </span>
              <h2 className="font-headline-md text-2xl text-deep-navy font-light uppercase tracking-wider">
                Send a Message
              </h2>
            </div>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded space-y-3 animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-700">check_circle</span>
                  <h4 className="font-label-caps text-xs uppercase font-bold tracking-wider">Message Sent Successfully</h4>
                </div>
                <p className="text-xs leading-relaxed text-emerald-800">
                  Thank you for contacting VRIX. Your inquiry has been routed to our dedicated client advisor. We will be in touch within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="font-button text-[10px] uppercase tracking-widest text-emerald-900 underline cursor-pointer pt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Eleanor Vance"
                      className="border border-slate-grey/30 bg-pure-white p-3 text-xs outline-none focus:border-deep-navy rounded-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. eleanor@vrixjewels.com"
                      className="border border-slate-grey/30 bg-pure-white p-3 text-xs outline-none focus:border-deep-navy rounded-none transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. 090542 85693"
                      className="border border-slate-grey/30 bg-pure-white p-3 text-xs outline-none focus:border-deep-navy rounded-none transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                      Subject Matter
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="border border-slate-grey/30 bg-pure-white p-3 text-xs outline-none focus:border-deep-navy rounded-none transition-colors cursor-pointer"
                    >
                      <option value="General Inquiry">General Product Inquiry</option>
                      <option value="Bespoke Order">Bespoke Custom Jewelry</option>
                      <option value="Order Status">Order Status & Shipping</option>
                      <option value="VRIX+ Membership">VRIX+ Circle Membership</option>
                      <option value="Care & Repair">Care, Cleaning & Warranty</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    Order Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    placeholder="e.g. VRIX-9402"
                    className="border border-slate-grey/30 bg-pure-white p-3 text-xs outline-none focus:border-deep-navy rounded-none transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">
                    How can we help you? *
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Please describe your enquiry in detail..."
                    className="border border-slate-grey/30 bg-pure-white p-3 text-xs outline-none focus:border-deep-navy rounded-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-deep-navy text-pure-white py-4 font-button text-xs uppercase tracking-widest hover:bg-ink-black transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Message...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Atelier Info, Official Bio & Google Maps */}
          <div className="lg:col-span-5 space-y-8">
            {/* Atelier Headquarters Block */}
            <div className="p-8 border border-slate-grey/20 bg-pure-white rounded-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-label-caps text-[10px] text-[#B59D7C] uppercase tracking-widest font-semibold">
                  SURAT FLAGSHIP ATELIER
                </span>
                <span className="font-label-caps text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold uppercase rounded">
                  Open Today
                </span>
              </div>

              <h3 className="font-headline-md text-xl text-deep-navy font-light uppercase tracking-wider">
                VRIX Jewels Studio
              </h3>

              <div className="space-y-2 text-xs font-body-md text-slate-grey/90">
                <p className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-base text-deep-navy shrink-0 mt-0.5">pin_drop</span>
                  <span>{VRIX_CONTACT_INFO.address}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-deep-navy shrink-0">phone_in_talk</span>
                  <a href={`tel:${VRIX_CONTACT_INFO.phoneTel}`} className="hover:underline font-semibold text-deep-navy">
                    {VRIX_CONTACT_INFO.phoneDisplay}
                  </a>
                </p>
                <p className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span className="material-symbols-outlined text-base shrink-0">schedule</span>
                  <span>{VRIX_CONTACT_INFO.hours}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-slate-grey/15 flex items-center justify-between text-xs">
                <a
                  href={VRIX_CONTACT_INFO.mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-button text-[10px] text-deep-navy hover:underline uppercase tracking-wider font-bold inline-flex items-center gap-1"
                >
                  <span>Get Directions on Google Maps</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </a>
              </div>
            </div>

            {/* Official Brand Statement Box */}
            <div className="p-8 bg-soft-linen/40 border border-slate-grey/20 rounded-xs space-y-3">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold block">
                FROM VRIX
              </span>
              <p className="font-chancery text-lg md:text-xl text-deep-navy italic leading-relaxed">
                "{VRIX_CONTACT_INFO.brandBio}"
              </p>
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-grey font-label-caps uppercase tracking-wider">
                <span>Minimalist Lab-Grown Diamonds</span>
                <span>Crafted with Precision</span>
              </div>
            </div>

            {/* Concierge FAQ Accordion */}
            <div className="border border-slate-grey/20 bg-pure-white p-8 rounded-xs space-y-4">
              <span className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold block">
                FREQUENTLY ASKED QUESTIONS
              </span>
              <div className="divide-y divide-slate-grey/15">
                {FAQ_ITEMS.map((faq, idx) => (
                  <div key={idx} className="py-3.5">
                    <button
                      onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                      className="w-full flex justify-between items-center text-left font-label-caps text-xs text-deep-navy font-semibold uppercase tracking-wider cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <span className={`material-symbols-outlined text-base transition-transform duration-300 ${openFaq === idx ? "rotate-180" : ""}`}>
                        expand_more
                      </span>
                    </button>
                    {openFaq === idx && (
                      <p className="mt-2 text-xs text-slate-grey leading-relaxed font-body-md animate-fade-in">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
