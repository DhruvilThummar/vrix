"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchDb } from "@/utils/api";

const DEFAULT_DATA = {
  homepage: {
    heroTitle: "the moments that belong only to you.",
    heroSubtitle: "Luxury for",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCKm3tn95_-TIhyvUMx8vgFS38HrCWsOHrBrnyyeFJBjd_z2sFkgf5ElPRFPGEnwOnMlGRiBDK_yZli7qo7IWe6wwJ1VqDr340H5hr9tu8L6hDEscfaEIE7CKE6wyny9Ao-FKjI5oEmmy28ll5qNZ3iJT-IvgjyY1T2K-tX9l-V1BKl1fvhmcgjLXq_FDQh_OhA0YEk29NB0ijya6TEA6ezmJwuFFzj7vo4A-AooABaJafBIBd-hoJo6vtg5MoS_rDu9I325sFCuVY",
    tagline: "Pieces that speak in silence.",
    philosophyTitle: "More than jewelry.\nIt's a way of being.",
    philosophy: [
      {
        icon: "flare",
        title: "Intentional Design",
        description: "Every piece has\na deeper meaning."
      },
      {
        icon: "hourglass_empty",
        title: "Timeless Quality",
        description: "Crafted to last.\nMade to be lived in."
      },
      {
        icon: "eco",
        title: "Conscious Luxury",
        description: "Ethical materials.\nThoughtful process."
      },
      {
        icon: "favorite_border",
        title: "Personal Connection",
        description: "A piece for every\nchapter of you."
      }
    ]
  },
  collections: [
    {
      id: "solitude",
      title: "Solitude",
      tagline: "For your inner world",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvjqmByDlRaJiifUTxVoINswXXm-PAkkbVJ9hcfeaPCrqjzkhDhne1pVofS21ApvXAeGd-OJFnGRzVL8xM1zqRCFmpkvOkIowL3V5vx4O5w-jEkPUpaAjd3iMY1jo-f1BXRbiYG4udPbS3MQHLhriu6sBx3BzN7lMwreEZ1yb4ZK1AR6DhvzuF6SFzUjcqZWiXVPPkEHA2TrBgX495Y9x6krS50C7hS02F_3H0td5UhiUYM92VuwUaofA_QbD6kd14XQ5N6xQdRN8",
    },
    {
      id: "presence",
      title: "Presence",
      tagline: "For your everyday",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDphu-s5pByRrI5yOYV0iUrAQhJYlFn9pL56eus7YnulYdC3nxZphQV-dBchzOg9F9C9LvMP1pu7Z-pLdoAmvfuYBpwUk4oJ5auvdPVe_jU2tO6Ldyghkc_ftk25VpTLHGq_4DKkpFIC_w_TgCVCFNwT7xlIzlR6i-4QQwgJHFq41jST-K1fySNIMaWHIa6EMO_OoRUmmcTTgSqML2SGB8jMU92aBukkLElsZJVzQ6iVNHyjlgVNaAN0M56RCO3uUNhT8hu1AAtAqw",
    },
    {
      id: "silent-center",
      title: "Silent Center",
      tagline: "For your balance",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCJ1SV0eXJGZrnjfsm6WOrr3dKft0IVZvS2oM6Wf_4vqwndBPocrNSLKtPsbIWUU4g7YWrwgFZmE16ipICZ0QKg6NulSK0D4DTI4FLnuehTPqcKDF-MPdTTbMRnYiwYRh3zsWojYE3R1iHTC60ZfQ8QWGmDD8mnP3JETge_mPnGQPnFepdY66OuKQsUgWIiwNWQZhfsJ00eO2IOXl7WoHUmQypxFUQFslrgHABiUUv1WrU2ZYbRgDbO_H6gk84g6nofQG2mXVqa538",
    },
    {
      id: "light",
      title: "Light",
      tagline: "For your becoming",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA2QH2OVjZuf5WcRIEP7F8npj47F7LSlY4eXFlP_4urMQx5FXf9gd87o02ZumQ7pm2WKo25BGUt1bsNce0d7I-HD7QC5boW3dnerz7a62sWZjsKrvbRlbS01UwRXiArH8ZtnywdNRZ25CDJfp2abQpz-434ejKZ6OU9sBKPqqq3g10R3Dft5zyZcRp64hHVhotbtoe1SR8QHkWs_cLCp2FAQd7pl75u-fLJSWWvSsfYYBJ2TJ0V4keUY4FKlbyDFJSKzK5hMm4-Huc",
    },
  ],
};

export default function Home() {
  const [store, setStore] = useState(DEFAULT_DATA);

  useEffect(() => {
    fetchDb()
      .then((res) => {
        if (res.homepage && res.collections) {
          setStore({
            homepage: {
              ...DEFAULT_DATA.homepage,
              ...res.homepage,
            },
            collections: res.collections,
          });
        }
      })
      .catch((err) => console.error("Error loading home page content:", err));
  }, []);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative h-[819px] md:h-[calc(100vh-65px)] w-full flex items-center bg-deep-navy overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            alt="Hero Background"
            fill
            className="object-cover object-center opacity-60 mix-blend-overlay"
            src={store.homepage.heroImage}
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative z-10 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop w-full">
          <div className="max-w-xl text-pure-white">
            <p className="font-label-caps text-label-caps mb-stack-md tracking-widest uppercase opacity-80">
              {store.homepage.heroSubtitle}
            </p>
            <h1 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg mb-stack-lg leading-tight uppercase">
              {store.homepage.heroTitle}
            </h1>
            <Link
              href="/collections/silent-center"
              className="inline-block font-button text-button uppercase px-8 py-3 border border-pure-white text-pure-white hover:bg-pure-white hover:text-deep-navy transition-colors duration-300 cursor-pointer"
            >
              Discover Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-section-gap max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="text-center mb-section-gap">
          <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
            Our Collections
          </p>
          <h2 className="font-headline-md text-headline-md text-deep-navy">
            {store.homepage.tagline}
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          {store.collections.map((col) => (
            <Link
              key={col.id}
              href={`/collections/silent-center?collection=${col.id}`}
              className="group cursor-pointer"
            >
              <div className="aspect-[4/5] bg-soft-linen mb-stack-md overflow-hidden relative">
                <Image
                  alt={`${col.title} Collection`}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  src={col.image}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="text-center">
                <h3 className="font-label-caps text-label-caps text-deep-navy uppercase mb-1">
                  {col.title}
                </h3>
                <p className="font-body-md text-slate-grey text-sm">
                  {col.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-stack-lg text-center">
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 font-button text-button text-deep-navy hover:text-slate-grey transition-colors uppercase tracking-widest border-b border-deep-navy pb-1 cursor-pointer"
          >
            Explore All Collections <i className="fa-solid fa-arrow-right text-xs"></i>
          </Link>
        </div>
      </section>

      {/* Brand Philosophy / Features */}
      <section className="bg-soft-linen py-section-gap border-t border-b border-slate-grey/20">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <p className="font-label-caps text-label-caps text-slate-grey uppercase tracking-widest mb-stack-sm">
            The World of VRIX
          </p>
          <h2 className="font-headline-md text-headline-md text-deep-navy mb-section-gap leading-tight uppercase whitespace-pre-line">
            {store.homepage.philosophyTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-stack-lg">
            {store.homepage.philosophy.map((item, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className="material-symbols-outlined text-deep-navy mb-stack-md text-3xl font-light">
                  {item.icon}
                </span>
                <h4 className="font-label-caps text-label-caps text-deep-navy uppercase mb-2">
                  {item.title}
                </h4>
                <p className="font-body-md text-sm text-slate-grey whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
