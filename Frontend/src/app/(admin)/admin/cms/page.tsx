"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { fetchDb, updateCMS, createJournalPost, updateJournalPost, deleteJournalPost } from "@/utils/api";

type TabType = "hero-philosophy" | "story" | "nav-brand" | "legal" | "journal" | "api-integrations";

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<TabType>("hero-philosophy");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- API Configuration States ---
  const [cloudinaryEnabled, setCloudinaryEnabled] = useState(false);
  const [cloudinaryCloudName, setCloudinaryCloudName] = useState("");
  const [cloudinaryApiKey, setCloudinaryApiKey] = useState("");
  const [cloudinaryApiSecret, setCloudinaryApiSecret] = useState("");

  const [razorpayEnabled, setRazorpayEnabled] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState("");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState("");

  const [nodemailerEnabled, setNodemailerEnabled] = useState(false);
  const [nodemailerHost, setNodemailerHost] = useState("");
  const [nodemailerPort, setNodemailerPort] = useState("");
  const [nodemailerUser, setNodemailerUser] = useState("");
  const [nodemailerPass, setNodemailerPass] = useState("");

  const [truecallerEnabled, setTruecallerEnabled] = useState(false);
  const [truecallerSandboxMode, setTruecallerSandboxMode] = useState(true);
  const [truecallerPartnerKey, setTruecallerPartnerKey] = useState("");
  const [truecallerAppId, setTruecallerAppId] = useState("");

  // --- Homepage Hero & Philosophy States ---
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [homepageTagline, setHomepageTagline] = useState("");
  const [philosophyTitle, setPhilosophyTitle] = useState("");
  const [philosophyCards, setPhilosophyCards] = useState<any[]>([]);

  // --- Brand Story States ---
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [storyBanner, setStoryBanner] = useState("");
  const [storyHeroTitle, setStoryHeroTitle] = useState("");
  const [storyEthosTitle, setStoryEthosTitle] = useState("");
  const [storyEthos, setStoryEthos] = useState<any[]>([]);
  const [storyAnchorTitle, setStoryAnchorTitle] = useState("");
  const [storyAnchorContent, setStoryAnchorContent] = useState("");
  const [storyAnchorImage, setStoryAnchorImage] = useState("");
  const [storyAnchorLink, setStoryAnchorLink] = useState("");

  // --- Navbar & Brand States ---
  const [navLinks, setNavLinks] = useState<any[]>([]);
  const [brandName, setBrandName] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [brandEmail, setBrandEmail] = useState("");
  const [brandPhone, setBrandPhone] = useState("");
  const [brandAddress, setBrandAddress] = useState("");

  // --- Features Toggles States ---
  const [bespokeEnabled, setBespokeEnabled] = useState(true);

  // --- Legal Documents States ---
  const [legalData, setLegalData] = useState<any>({});
  const [selectedLegalKey, setSelectedLegalKey] = useState("privacy");

  // --- Journal Articles States ---
  const [journalArticles, setJournalArticles] = useState<any[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [editingArticle, setEditingArticle] = useState<any>({
    title: "",
    excerpt: "",
    content: "",
    image: "",
    readTime: ""
  });

  useEffect(() => {
    loadCMSData();
  }, []);

  const loadCMSData = () => {
    setLoading(true);
    fetchDb()
      .then((res) => {
        // Hero & Philosophy
        if (res.homepage) {
          setHeroTitle(res.homepage.heroTitle || "");
          setHeroSubtitle(res.homepage.heroSubtitle || "");
          setHeroImage(res.homepage.heroImage || "");
          setHomepageTagline(res.homepage.tagline || "");
          setPhilosophyTitle(res.homepage.philosophyTitle || "");
          setPhilosophyCards(res.homepage.philosophy || []);
        }
        // Story
        if (res.story) {
          setStoryTitle(res.story.title || "");
          setStoryContent(res.story.content || "");
          setStoryBanner(res.story.bannerImage || "");
          setStoryHeroTitle(res.story.heroTitle || "");
          setStoryEthosTitle(res.story.ethosTitle || "");
          setStoryEthos(res.story.ethos || []);
          setStoryAnchorTitle(res.story.anchorTitle || "");
          setStoryAnchorContent(res.story.anchorContent || "");
          setStoryAnchorImage(res.story.anchorImage || "");
          setStoryAnchorLink(res.story.anchorLinkText || "");
        }
        // Navigation & Brand
        if (res.navigation) {
          setNavLinks(res.navigation);
        }
        if (res.brand) {
          setBrandName(res.brand.name || "");
          setBrandLogo(res.brand.logoUrl || "");
          setBrandEmail(res.brand.email || "");
          setBrandPhone(res.brand.phone || "");
          setBrandAddress(res.brand.address || "");
        }
        // Features
        if (res.features) {
          setBespokeEnabled(res.features.bespokeEnabled !== undefined ? res.features.bespokeEnabled : true);
        }
        // Legal
        if (res.legal) {
          setLegalData(res.legal);
        }
        // Journal
        if (res.journal) {
          setJournalArticles(res.journal);
        }
        // API Settings
        if (res.api_settings) {
          setCloudinaryEnabled(res.api_settings.cloudinaryEnabled !== undefined ? res.api_settings.cloudinaryEnabled : false);
          setCloudinaryCloudName(res.api_settings.cloudinaryCloudName || "");
          setCloudinaryApiKey(res.api_settings.cloudinaryApiKey || "");
          setCloudinaryApiSecret(res.api_settings.cloudinaryApiSecret || "");

          setRazorpayEnabled(res.api_settings.razorpayEnabled !== undefined ? res.api_settings.razorpayEnabled : false);
          setRazorpayKeyId(res.api_settings.razorpayKeyId || "");
          setRazorpayKeySecret(res.api_settings.razorpayKeySecret || "");

          setNodemailerEnabled(res.api_settings.nodemailerEnabled !== undefined ? res.api_settings.nodemailerEnabled : false);
          setNodemailerHost(res.api_settings.nodemailerHost || "");
          setNodemailerPort(res.api_settings.nodemailerPort || "");
          setNodemailerUser(res.api_settings.nodemailerUser || "");
          setNodemailerPass(res.api_settings.nodemailerPass || "");

          setTruecallerEnabled(res.api_settings.truecallerEnabled !== undefined ? res.api_settings.truecallerEnabled : false);
          setTruecallerSandboxMode(res.api_settings.truecallerSandboxMode !== undefined ? res.api_settings.truecallerSandboxMode : true);
          setTruecallerPartnerKey(res.api_settings.truecallerPartnerKey || "");
          setTruecallerAppId(res.api_settings.truecallerAppId || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Error loading CMS configurations.");
      });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);

    try {
      await updateCMS({
        homepage: {
          heroTitle,
          heroSubtitle,
          heroImage,
          tagline: homepageTagline,
          philosophyTitle,
          philosophy: philosophyCards,
        },
        story: {
          title: storyTitle,
          content: storyContent,
          bannerImage: storyBanner,
          heroTitle: storyHeroTitle,
          ethosTitle: storyEthosTitle,
          ethos: storyEthos,
          anchorTitle: storyAnchorTitle,
          anchorContent: storyAnchorContent,
          anchorImage: storyAnchorImage,
          anchorLinkText: storyAnchorLink
        },
        navigation: navLinks,
        brand: {
          name: brandName,
          logoUrl: brandLogo,
          email: brandEmail,
          phone: brandPhone,
          address: brandAddress
        },
        features: {
          bespokeEnabled
        },
        legal: legalData,
        api_settings: {
          cloudinaryEnabled,
          cloudinaryCloudName,
          cloudinaryApiKey,
          cloudinaryApiSecret,
          razorpayEnabled,
          razorpayKeyId,
          razorpayKeySecret,
          nodemailerEnabled,
          nodemailerHost,
          nodemailerPort,
          nodemailerUser,
          nodemailerPass,
          truecallerEnabled,
          truecallerSandboxMode,
          truecallerPartnerKey,
          truecallerAppId
        }
      });
      showToast("CMS updated successfully.");
      loadCMSData();
    } catch (error) {
      console.error(error);
      showToast("Error updating CMS.");
    } finally {
      setSaveLoading(false);
    }
  };

  // --- Journal Helper Functions ---
  const handleSelectArticle = (article: any) => {
    setSelectedArticleId(article.id);
    setEditingArticle({ ...article });
  };

  const handleNewArticle = () => {
    setSelectedArticleId("");
    setEditingArticle({
      title: "",
      excerpt: "",
      content: "",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcdSpPRuZyOFUUJWKwm3afGsU9w9KpeUWno8Pa42A3pGYlx1-vN0KKCKvmLJPL_EFfXLzobCo-BC0d2ku2Y7xvw6-c6PqmPba6dqp88n5JeiiFO3b1oi7F0Jes10YaLZMvbActMGPD-i7hLlh-8O8lKIAWu2lNOd5NowaV5Bx5bBvA7WNnXtH_DM7asrOcYuRbufZEoke_TcPK1e6Jfu89JigYO7RWowWl4ItJ-wTKDT4ncdBjNZ71p0MOODMz1Qw5ooa5DL3cdyI",
      readTime: "5 min read"
    });
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      if (selectedArticleId) {
        // Update
        await updateJournalPost(selectedArticleId, editingArticle);
        showToast("Journal article updated successfully.");
      } else {
        // Create
        await createJournalPost(editingArticle);
        showToast("Journal article created successfully.");
      }
      loadCMSData();
      setSelectedArticleId(null);
    } catch (error) {
      console.error(error);
      showToast("Error saving journal article.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    setSaveLoading(true);
    try {
      await deleteJournalPost(id);
      showToast("Journal article deleted successfully.");
      loadCMSData();
      setSelectedArticleId(null);
    } catch (error) {
      console.error(error);
      showToast("Error deleting article.");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-soft-linen/50 p-6 md:p-12 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="border-b border-slate-grey/20 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="font-display-lg text-headline-md text-deep-navy uppercase">
              Storefront CMS Editor
            </h1>
            <p className="text-slate-grey font-body-md text-sm">
              Dynamically modify navigation menu links, contact info, policy documents, and brand copy.
            </p>
          </div>
          <div className="flex gap-2 font-label-caps text-xs">
            <button
              onClick={() => setActiveTab("hero-philosophy")}
              className={`px-4 py-2 border cursor-pointer ${
                activeTab === "hero-philosophy"
                  ? "bg-deep-navy text-pure-white border-deep-navy"
                  : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black"
              }`}
            >
              Hero & Philosophy
            </button>
            <button
              onClick={() => setActiveTab("story")}
              className={`px-4 py-2 border cursor-pointer ${
                activeTab === "story"
                  ? "bg-deep-navy text-pure-white border-deep-navy"
                  : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black"
              }`}
            >
              Brand Story
            </button>
            <button
              onClick={() => setActiveTab("nav-brand")}
              className={`px-4 py-2 border cursor-pointer ${
                activeTab === "nav-brand"
                  ? "bg-deep-navy text-pure-white border-deep-navy"
                  : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black"
              }`}
            >
              Navbar & Brand
            </button>
            <button
              onClick={() => setActiveTab("legal")}
              className={`px-4 py-2 border cursor-pointer ${
                activeTab === "legal"
                  ? "bg-deep-navy text-pure-white border-deep-navy"
                  : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black"
              }`}
            >
              Legal Policies
            </button>
            <button
              onClick={() => setActiveTab("journal")}
              className={`px-4 py-2 border cursor-pointer ${
                activeTab === "journal"
                  ? "bg-deep-navy text-pure-white border-deep-navy"
                  : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black"
              }`}
            >
              Journal
            </button>
            <button
              onClick={() => setActiveTab("api-integrations")}
              className={`px-4 py-2 border cursor-pointer ${
                activeTab === "api-integrations"
                  ? "bg-deep-navy text-pure-white border-deep-navy"
                  : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black"
              }`}
            >
              API Configuration
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-grey font-label-caps text-xs tracking-widest">
            Loading CMS Editor Data...
          </div>
        ) : (
          <div>
            {/* General Settings Submit Form */}
            {activeTab !== "journal" ? (
              <form onSubmit={handleSaveCMS} className="space-y-8">
                {/* 1. HERO & PHILOSOPHY TAB */}
                {activeTab === "hero-philosophy" && (
                  <div className="space-y-6">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Homepage Hero Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Hero Subtitle
                          </label>
                          <input
                            type="text"
                            value={heroSubtitle}
                            onChange={(e) => setHeroSubtitle(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Hero Title
                          </label>
                          <input
                            type="text"
                            value={heroTitle}
                            onChange={(e) => setHeroTitle(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 pt-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Hero Image URL
                        </label>
                        <input
                          type="url"
                          value={heroImage}
                          onChange={(e) => setHeroImage(e.target.value)}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          required
                        />
                      </div>
                    </section>

                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Collections Slogan & Brand Philosophy
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Collections Grid Slogan
                          </label>
                          <input
                            type="text"
                            value={homepageTagline}
                            onChange={(e) => setHomepageTagline(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Philosophy Section Title
                          </label>
                          <textarea
                            value={philosophyTitle}
                            onChange={(e) => setPhilosophyTitle(e.target.value)}
                            className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                            rows={2}
                            required
                          />
                        </div>
                      </div>

                      {/* Philosophy Cards Editor */}
                      <div className="space-y-4 pt-4 border-t border-slate-grey/10">
                        <h4 className="font-label-caps text-xs text-slate-grey uppercase tracking-widest">Philosophy Cards (4 Items)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {philosophyCards.map((card, i) => (
                            <div key={i} className="border border-slate-grey/20 p-4 space-y-4 bg-soft-linen/20">
                              <div className="flex gap-4">
                                <div className="flex flex-col gap-1 flex-1">
                                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Card Icon (Google Icon Name)</label>
                                  <input
                                    type="text"
                                    value={card.icon}
                                    onChange={(e) => {
                                      const next = [...philosophyCards];
                                      next[i].icon = e.target.value;
                                      setPhilosophyCards(next);
                                    }}
                                    className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                                  />
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Card Title</label>
                                  <input
                                    type="text"
                                    value={card.title}
                                    onChange={(e) => {
                                      const next = [...philosophyCards];
                                      next[i].title = e.target.value;
                                      setPhilosophyCards(next);
                                    }}
                                    className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="font-label-caps text-[9px] text-slate-grey uppercase">Card Description</label>
                                <textarea
                                  value={card.description}
                                  onChange={(e) => {
                                    const next = [...philosophyCards];
                                    next[i].description = e.target.value;
                                    setPhilosophyCards(next);
                                  }}
                                  className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                                  rows={2}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* 2. BRAND STORY TAB */}
                {activeTab === "story" && (
                  <div className="space-y-6">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Brand Story Main Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Story Hero Banner Text
                          </label>
                          <input
                            type="text"
                            value={storyHeroTitle}
                            onChange={(e) => setStoryHeroTitle(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Story Title
                          </label>
                          <input
                            type="text"
                            value={storyTitle}
                            onChange={(e) => setStoryTitle(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Story Banner Cover Image URL
                        </label>
                        <input
                          type="url"
                          value={storyBanner}
                          onChange={(e) => setStoryBanner(e.target.value)}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Story Narrative Body Text
                        </label>
                        <textarea
                          value={storyContent}
                          onChange={(e) => setStoryContent(e.target.value)}
                          className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          rows={4}
                          required
                        />
                      </div>
                    </section>

                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Ethos & VRIX Standard Cards
                      </h3>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Ethos Title Header
                        </label>
                        <input
                          type="text"
                          value={storyEthosTitle}
                          onChange={(e) => setStoryEthosTitle(e.target.value)}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                          required
                        />
                      </div>

                      {/* Story Ethos Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                        {storyEthos.map((item, i) => (
                          <div key={i} className="border border-slate-grey/20 p-4 space-y-3 bg-soft-linen/20">
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Ethos Icon (Google Icon)</label>
                              <input
                                type="text"
                                value={item.icon}
                                onChange={(e) => {
                                  const next = [...storyEthos];
                                  next[i].icon = e.target.value;
                                  setStoryEthos(next);
                                }}
                                className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Ethos Title</label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const next = [...storyEthos];
                                  next[i].title = e.target.value;
                                  setStoryEthos(next);
                                }}
                                className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Ethos Description</label>
                              <textarea
                                value={item.description}
                                onChange={(e) => {
                                  const next = [...storyEthos];
                                  next[i].description = e.target.value;
                                  setStoryEthos(next);
                                }}
                                className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                                rows={3}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Visual Anchor & Editorial Callout
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Anchor Title Header
                          </label>
                          <input
                            type="text"
                            value={storyAnchorTitle}
                            onChange={(e) => setStoryAnchorTitle(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Anchor Link Text
                          </label>
                          <input
                            type="text"
                            value={storyAnchorLink}
                            onChange={(e) => setStoryAnchorLink(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Anchor Image URL
                        </label>
                        <input
                          type="url"
                          value={storyAnchorImage}
                          onChange={(e) => setStoryAnchorImage(e.target.value)}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          required
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Anchor Content Copy
                        </label>
                        <textarea
                          value={storyAnchorContent}
                          onChange={(e) => setStoryAnchorContent(e.target.value)}
                          className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          rows={3}
                          required
                        />
                      </div>
                    </section>
                  </div>
                )}

                {/* 3. NAVBAR & BRAND TAB */}
                {activeTab === "nav-brand" && (
                  <div className="space-y-6">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Features Configuration Toggles
                      </h3>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="bespoke-enabled"
                          checked={bespokeEnabled}
                          onChange={(e) => setBespokeEnabled(e.target.checked)}
                          className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                        />
                        <label htmlFor="bespoke-enabled" className="font-body-md text-sm text-ink-black cursor-pointer font-semibold">
                          Enable Bespoke Solitaire Configurator Page (Toggle ON/OFF)
                        </label>
                      </div>
                      <p className="text-xs text-slate-grey font-body-md leading-relaxed">
                        If disabled, customers attempting to visit the Bespoke configurator page will see a capacity waitlist page, and the link will handle gracefully.
                      </p>
                    </section>

                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Navigation Menu Links
                      </h3>
                      
                      <div className="space-y-4">
                        {navLinks.map((link, i) => (
                          <div key={i} className="flex gap-4 items-center bg-soft-linen/10 p-2 border border-slate-grey/5">
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <input
                                type="text"
                                value={link.label}
                                onChange={(e) => {
                                  const next = [...navLinks];
                                  next[i].label = e.target.value;
                                  setNavLinks(next);
                                }}
                                className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                                placeholder="Link Label"
                                required
                              />
                              <input
                                type="text"
                                value={link.path}
                                onChange={(e) => {
                                  const next = [...navLinks];
                                  next[i].path = e.target.value;
                                  setNavLinks(next);
                                }}
                                className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                                placeholder="Link Path"
                                required
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setNavLinks(navLinks.filter((_, idx) => idx !== i));
                              }}
                              className="text-error hover:text-error/80 cursor-pointer font-label-caps text-[10px]"
                            >
                              DELETE
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => setNavLinks([...navLinks, { label: "", path: "" }])}
                        className="border border-deep-navy text-deep-navy px-4 py-2 font-button uppercase text-[10px] tracking-wider hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
                      >
                        Add Navigation Link
                      </button>
                    </section>

                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Brand Identity & Contacts
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Brand Name
                          </label>
                          <input
                            type="text"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Contact Phone
                          </label>
                          <input
                            type="text"
                            value={brandPhone}
                            onChange={(e) => setBrandPhone(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            value={brandEmail}
                            onChange={(e) => setBrandEmail(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Store Logo URL
                          </label>
                          <input
                            type="text"
                            value={brandLogo}
                            onChange={(e) => setBrandLogo(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Headquarters Address
                        </label>
                        <input
                          type="text"
                          value={brandAddress}
                          onChange={(e) => setBrandAddress(e.target.value)}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                          required
                        />
                      </div>
                    </section>
                  </div>
                )}

                {/* 4. LEGAL POLICIES TAB */}
                {activeTab === "legal" && (
                  <div className="space-y-6">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                        <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                          Legal Policy Document Editor
                        </h3>
                        <select
                          value={selectedLegalKey}
                          onChange={(e) => setSelectedLegalKey(e.target.value)}
                          className="bg-pure-white border border-slate-grey/30 py-1.5 px-3 font-label-caps text-xs text-deep-navy rounded-none focus:outline-none"
                        >
                          <option value="privacy">Privacy Policy</option>
                          <option value="shipping">Shipping Policy</option>
                          <option value="returns">Returns Policy</option>
                          <option value="terms">Terms & Conditions</option>
                          <option value="faq">FAQ</option>
                          <option value="care">Care Guide</option>
                        </select>
                      </div>

                      {legalData[selectedLegalKey] ? (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Document Title</label>
                              <input
                                type="text"
                                value={legalData[selectedLegalKey].title || ""}
                                onChange={(e) => {
                                  const next = { ...legalData };
                                  next[selectedLegalKey].title = e.target.value;
                                  setLegalData(next);
                                }}
                                className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Last Updated Date</label>
                              <input
                                type="text"
                                value={legalData[selectedLegalKey].lastUpdated || ""}
                                onChange={(e) => {
                                  const next = { ...legalData };
                                  next[selectedLegalKey].lastUpdated = e.target.value;
                                  setLegalData(next);
                                }}
                                className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                              />
                            </div>
                          </div>

                          {/* Sections array */}
                          <div className="space-y-6 pt-4 border-t border-slate-grey/10">
                            <h4 className="font-label-caps text-xs text-slate-grey uppercase tracking-widest">Document Sections</h4>
                            {legalData[selectedLegalKey].sections && legalData[selectedLegalKey].sections.map((section: any, idx: number) => (
                              <div key={idx} className="border border-slate-grey/15 p-4 space-y-4 bg-soft-linen/10 relative">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = { ...legalData };
                                    next[selectedLegalKey].sections = next[selectedLegalKey].sections.filter((_: any, sidx: number) => sidx !== idx);
                                    setLegalData(next);
                                  }}
                                  className="absolute top-4 right-4 text-error font-label-caps text-[9px] tracking-wider cursor-pointer"
                                >
                                  REMOVE SECTION
                                </button>
                                <div className="flex flex-col gap-1 max-w-md">
                                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Section Heading</label>
                                  <input
                                    type="text"
                                    value={section.title || ""}
                                    onChange={(e) => {
                                      const next = { ...legalData };
                                      next[selectedLegalKey].sections[idx].title = e.target.value;
                                      setLegalData(next);
                                    }}
                                    className="border-b border-slate-grey/30 py-1 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                                    placeholder="Section title"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Section Content Body</label>
                                  <textarea
                                    value={section.content || ""}
                                    onChange={(e) => {
                                      const next = { ...legalData };
                                      next[selectedLegalKey].sections[idx].content = e.target.value;
                                      setLegalData(next);
                                    }}
                                    className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black text-sm"
                                    rows={4}
                                    placeholder="Content copy"
                                  />
                                </div>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => {
                                const next = { ...legalData };
                                next[selectedLegalKey].sections = next[selectedLegalKey].sections || [];
                                next[selectedLegalKey].sections.push({ title: "", content: "" });
                                setLegalData(next);
                              }}
                              className="border border-deep-navy text-deep-navy px-4 py-2 font-button uppercase text-[10px] tracking-wider hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer"
                            >
                              Add Document Section
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-grey text-sm">No legal document data found.</div>
                      )}
                    </section>
                  </div>
                )}

                {/* 6. API CONFIGURATION TAB */}
                {activeTab === "api-integrations" && (
                  <div className="space-y-6">
                    {/* Cloudinary */}
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                        <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                          Cloudinary CDN Integration
                        </h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="cloudinary-enabled"
                            checked={cloudinaryEnabled}
                            onChange={(e) => setCloudinaryEnabled(e.target.checked)}
                            className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                          />
                          <label htmlFor="cloudinary-enabled" className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest cursor-pointer">
                            Enable
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-slate-grey font-body-md -mt-4">
                        Togglable image and media uploading directly to Cloudinary CDN instead of local uploads/ filesystem storage.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Cloud Name</label>
                          <input
                            type="text"
                            value={cloudinaryCloudName}
                            onChange={(e) => setCloudinaryCloudName(e.target.value)}
                            disabled={!cloudinaryEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50"
                            placeholder="your-cloud-name"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">API Key</label>
                          <input
                            type="text"
                            value={cloudinaryApiKey}
                            onChange={(e) => setCloudinaryApiKey(e.target.value)}
                            disabled={!cloudinaryEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50"
                            placeholder="your-api-key"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">API Secret</label>
                          <input
                            type="password"
                            value={cloudinaryApiSecret}
                            onChange={(e) => setCloudinaryApiSecret(e.target.value)}
                            disabled={!cloudinaryEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50"
                            placeholder="••••••••••••••••"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Razorpay */}
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                        <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                          Razorpay Payment Gateway
                        </h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="razorpay-enabled"
                            checked={razorpayEnabled}
                            onChange={(e) => setRazorpayEnabled(e.target.checked)}
                            className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                          />
                          <label htmlFor="razorpay-enabled" className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest cursor-pointer">
                            Enable
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-slate-grey font-body-md -mt-4">
                        Configure payment gateways for customer checkouts. If disabled, checkout functions in local dev/mock payment mode.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Razorpay Key ID</label>
                          <input
                            type="text"
                            value={razorpayKeyId}
                            onChange={(e) => setRazorpayKeyId(e.target.value)}
                            disabled={!razorpayEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50"
                            placeholder="rzp_test_..."
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Razorpay Key Secret</label>
                          <input
                            type="password"
                            value={razorpayKeySecret}
                            onChange={(e) => setRazorpayKeySecret(e.target.value)}
                            disabled={!razorpayEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50"
                            placeholder="••••••••••••••••"
                          />
                        </div>
                      </div>
                    </section>

                    {/* SMTP Nodemailer */}
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                        <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                          Nodemailer SMTP Configuration
                        </h3>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="nodemailer-enabled"
                            checked={nodemailerEnabled}
                            onChange={(e) => setNodemailerEnabled(e.target.checked)}
                            className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                          />
                          <label htmlFor="nodemailer-enabled" className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest cursor-pointer">
                            Enable
                          </label>
                        </div>
                      </div>
                      <p className="text-xs text-slate-grey font-body-md -mt-4">
                        Sends OTP verification codes and delivery details notifications to customer emails via SMTP server.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">SMTP Host</label>
                          <input
                            type="text"
                            value={nodemailerHost}
                            onChange={(e) => setNodemailerHost(e.target.value)}
                            disabled={!nodemailerEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">SMTP Port</label>
                          <input
                            type="text"
                            value={nodemailerPort}
                            onChange={(e) => setNodemailerPort(e.target.value)}
                            disabled={!nodemailerEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="587"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Sender Username</label>
                          <input
                            type="text"
                            value={nodemailerUser}
                            onChange={(e) => setNodemailerUser(e.target.value)}
                            disabled={!nodemailerEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="user@gmail.com"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">SMTP Password</label>
                          <input
                            type="password"
                            value={nodemailerPass}
                            onChange={(e) => setNodemailerPass(e.target.value)}
                            disabled={!nodemailerEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="••••••••••••••••"
                          />
                        </div>
                      </div>
                    </section>

                    {/* Truecaller */}
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                        <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                          Truecaller Quick Verification
                        </h3>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="truecaller-enabled"
                              checked={truecallerEnabled}
                              onChange={(e) => setTruecallerEnabled(e.target.checked)}
                              className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                            />
                            <label htmlFor="truecaller-enabled" className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest cursor-pointer">
                              Enable
                            </label>
                          </div>
                          <div className="flex items-center gap-2 border-l border-slate-grey/20 pl-4">
                            <input
                              type="checkbox"
                              id="truecaller-sandbox"
                              checked={truecallerSandboxMode}
                              onChange={(e) => setTruecallerSandboxMode(e.target.checked)}
                              disabled={!truecallerEnabled}
                              className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer disabled:opacity-50"
                            />
                            <label htmlFor="truecaller-sandbox" className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest cursor-pointer disabled:opacity-50">
                              Sandbox Simulator Mode
                            </label>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-grey font-body-md -mt-4">
                        Enables 1-click customer profile verification and checkout form autofill. Sandbox Simulator mode triggers a mock interface on frontend for development.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Truecaller App / Partner Key</label>
                          <input
                            type="text"
                            value={truecallerPartnerKey}
                            onChange={(e) => setTruecallerPartnerKey(e.target.value)}
                            disabled={!truecallerEnabled || truecallerSandboxMode}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="Partner key from developer dashboard"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">App ID / Package Name (Domain)</label>
                          <input
                            type="text"
                            value={truecallerAppId}
                            onChange={(e) => setTruecallerAppId(e.target.value)}
                            disabled={!truecallerEnabled || truecallerSandboxMode}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="e.g. localhost or yourdomain.com"
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* Save Button for Forms */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="font-button text-button uppercase px-12 py-4 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    {saveLoading ? (
                      <div className="w-5 h-5 border-2 border-pure-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      "Publish CMS Changes"
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* 5. JOURNAL ARTICLES MANAGER TAB */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <aside className="lg:col-span-4 bg-pure-white border border-slate-grey/25 p-6 space-y-4 shadow-sm">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                    <h3 className="font-headline-md text-sm text-deep-navy uppercase">Articles Catalogue</h3>
                    <button
                      onClick={handleNewArticle}
                      className="font-label-caps text-[10px] text-deep-navy hover:underline cursor-pointer"
                    >
                      + ADD NEW
                    </button>
                  </div>
                  <ul className="flex flex-col gap-2 max-h-[450px] overflow-y-auto divide-y divide-slate-grey/10 pr-2">
                    {journalArticles.map((article) => (
                      <li key={article.id} className="pt-2">
                        <button
                          onClick={() => handleSelectArticle(article)}
                          className={`w-full text-left p-2 font-body-md text-sm transition-colors cursor-pointer ${
                            selectedArticleId === article.id
                              ? "bg-soft-linen/50 text-deep-navy font-semibold"
                              : "text-slate-grey hover:bg-soft-linen/20"
                          }`}
                        >
                          <div className="text-[10px] font-label-caps text-slate-grey/70">{article.date}</div>
                          <div className="truncate text-deep-navy">{article.title}</div>
                        </button>
                      </li>
                    ))}
                  </ul>
                </aside>

                <div className="lg:col-span-8 bg-pure-white border border-slate-grey/25 p-8 shadow-sm">
                  {selectedArticleId !== null ? (
                    <form onSubmit={handleSaveArticle} className="space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2 flex justify-between items-center">
                        <span>{selectedArticleId ? "Edit Journal Article" : "Create New Article"}</span>
                        {selectedArticleId && (
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(selectedArticleId)}
                            className="text-error font-label-caps text-[10px] hover:underline cursor-pointer"
                          >
                            DELETE POST
                          </button>
                        )}
                      </h3>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase">Article Title</label>
                          <input
                            type="text"
                            value={editingArticle.title}
                            onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                            className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase">Read Time (e.g. 5 min read)</label>
                          <input
                            type="text"
                            value={editingArticle.readTime}
                            onChange={(e) => setEditingArticle({ ...editingArticle, readTime: e.target.value })}
                            className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase">Cover Image URL</label>
                        <input
                          type="url"
                          value={editingArticle.image}
                          onChange={(e) => setEditingArticle({ ...editingArticle, image: e.target.value })}
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase">Brief Summary Excerpt</label>
                        <input
                          type="text"
                          value={editingArticle.excerpt}
                          onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                          className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-label-caps text-[9px] text-slate-grey uppercase">Article Body Content</label>
                        <textarea
                          value={editingArticle.content}
                          onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                          className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          rows={8}
                          required
                        />
                      </div>

                      <div className="flex gap-4">
                        <button
                          type="submit"
                          disabled={saveLoading}
                          className="font-button text-xs uppercase px-8 py-3 bg-deep-navy text-pure-white hover:bg-ink-black transition-colors cursor-pointer"
                        >
                          {saveLoading ? "Saving..." : "Save Article"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedArticleId(null)}
                          className="font-button text-xs uppercase px-8 py-3 border border-slate-grey/30 text-slate-grey hover:text-ink-black transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-grey gap-2 bg-soft-linen/10 border border-dashed border-slate-grey/25">
                      <span className="material-symbols-outlined text-4xl">book</span>
                      <p className="font-body-md text-sm">Select an article from the catalogue to edit, or click add new.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
