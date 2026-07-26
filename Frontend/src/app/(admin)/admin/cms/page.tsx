"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { fetchDb, updateCMS, createJournalPost, updateJournalPost, deleteJournalPost } from "@/utils/api";

type TabType = "hero-philosophy" | "story" | "nav-brand" | "legal" | "journal" | "api-integrations" | "vrix-plus" | "announcement-bar" | "gift-wrapping" | "metal-types" | "bespoke-atelier" | "custom-pages";

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

  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleClientSecret, setGoogleClientSecret] = useState("");

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

  // --- VRIX+ States ---
  const [vrixPlusProgramName, setVrixPlusProgramName] = useState("VRIX+");
  const [vrixPlusMemberName, setVrixPlusMemberName] = useState("VRIX+ Member");
  const [vrixPlusTagline, setVrixPlusTagline] = useState("The world of VRIX, unlocked.");
  const [vrixPlusHeadline, setVrixPlusHeadline] = useState("Join VRIX+");
  const [vrixPlusSubheading, setVrixPlusSubheading] = useState("Become a VRIX+ Member and enjoy exclusive access, early releases, and premium services designed to elevate your experience with VRIX.");
  const [vrixPlusWelcomeGift, setVrixPlusWelcomeGift] = useState("Your first VRIX+ privilege awaits.");
  const [vrixPlusBannerImage, setVrixPlusBannerImage] = useState("");
  const [vrixPlusBenefit1Title, setVrixPlusBenefit1Title] = useState("Early Access");
  const [vrixPlusBenefit1Desc, setVrixPlusBenefit1Desc] = useState("Shop new collections before public release.");
  const [vrixPlusBenefit2Title, setVrixPlusBenefit2Title] = useState("Member-Exclusive Releases");
  const [vrixPlusBenefit2Desc, setVrixPlusBenefit2Desc] = useState("Access limited pieces available only to VRIX+ Members.");
  const [vrixPlusBenefit3Title, setVrixPlusBenefit3Title] = useState("Birthday Privilege");
  const [vrixPlusBenefit3Desc, setVrixPlusBenefit3Desc] = useState("Receive a special birthday surprise from VRIX.");

  // --- Bespoke Atelier Configurator States ---
  const [bespokeSlogan, setBespokeSlogan] = useState("THE SIGNATURE COLLECTION");
  const [bespokeTitle, setBespokeTitle] = useState("Bespoke Solitaire");
  const [bespokeSubtitle, setBespokeSubtitle] = useState("Crafted to your exact specifications. Begin building your legacy piece.");
  const [bespokeImage, setBespokeImage] = useState("https://lh3.googleusercontent.com/aida-public/AB6AXuAks29fjlA1gotrInXcRvND6geEa51LDm7VTLCZxzQ5SMp7ppo1sLy6YvXWHNXvmv8aU5VUCKZxNgW5V1LK4m9kpD_0gx3-rUg_1dE4tM-ddxE6LIxo6Co86x_O2yLAJmlADHnZJiJMMkiAkkmesYshx4QzL2WLq-rpFbMRQR3aMVFX7IjXVLijUS-lPVPY1hj4O3PV22zApoxyWBrnbLLkxgsqKHK4K9foEioe7RLFuP1K1emgpmp5yITLuyDe3rDmd-904NOjbvw");
  const [bespokeBasePrice, setBespokeBasePrice] = useState(3450);
  const [bespokeMetals, setBespokeMetals] = useState<any[]>([
    { name: "18K YELLOW GOLD", color: "#E6C762" },
    { name: "18K WHITE GOLD", color: "#E1E1E1" },
    { name: "18K ROSE GOLD", color: "#E8B2A1" },
    { name: "PLATINUM", color: "#D1D3D4" }
  ]);
  const [bespokeShapes, setBespokeShapes] = useState<string[]>(["ROUND", "OVAL", "EMERALD", "PEAR"]);
  const [bespokeCaratMin, setBespokeCaratMin] = useState(0.5);
  const [bespokeCaratMax, setBespokeCaratMax] = useState(3.0);
  const [bespokeCaratDefault, setBespokeCaratDefault] = useState(1.5);
  const [bespokeEngravingMax, setBespokeEngravingMax] = useState(15);

  // --- Gift Wrapping States ---
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(true);
  const [giftWrapTitle, setGiftWrapTitle] = useState("Monica Vinader Style Signature Gift Packaging");
  const [giftWrapPrice, setGiftWrapPrice] = useState(250);
  const [giftWrapImage, setGiftWrapImage] = useState("");
  const [giftWrapDesc, setGiftWrapDesc] = useState("");

  // --- Metal Types / Swatches States ---
  const [metalTypesList, setMetalTypesList] = useState<any[]>([]);

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

  // --- Announcement Bar States ---
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementInterval, setAnnouncementInterval] = useState(3000);
  const [announcementBgColor, setAnnouncementBgColor] = useState("#000000");
  const [announcementTextColor, setAnnouncementTextColor] = useState("#ffffff");
  const [announcementFontSize, setAnnouncementFontSize] = useState("11px");
  const [announcementLines, setAnnouncementLines] = useState<string[]>([]);

  // --- Custom Pages States ---
  const [customPages, setCustomPages] = useState<Record<string, any>>({
    craftsmanship: { title: "Craftsmanship", heroTitle: "Craftsmanship", bannerImage: "", content: "Every VRIX piece is meticulously crafted by master artisans." },
    materials: { title: "Materials", heroTitle: "Materials", bannerImage: "", content: "We source only the finest, consciously mined metals and conflict-free stones." },
    sustainability: { title: "Sustainability", heroTitle: "Sustainability", bannerImage: "", content: "True luxury shouldn't cost the earth." },
    careers: { title: "Careers", heroTitle: "Careers", bannerImage: "", content: "Join the team redefining modern jewelry." },
    "style-guide": { title: "Style Guide", heroTitle: "Style Guide", bannerImage: "", content: "Discover how to layer, stack, and curate your personal collection." },
    "behind-the-design": { title: "Behind The Design", heroTitle: "Behind The Design", bannerImage: "", content: "Step into our studios and witness the architectural precision." }
  });

  useEffect(() => {
    loadCMSData();
  }, []);

  function loadCMSData() {
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

          setGoogleEnabled(res.api_settings.googleEnabled !== undefined ? res.api_settings.googleEnabled : (res.api_settings.googleOAuthEnabled !== undefined ? res.api_settings.googleOAuthEnabled : true));
          setGoogleClientId(res.api_settings.googleClientId || "");
          setGoogleClientSecret(res.api_settings.googleClientSecret || "");
        }
        // VRIX+ Settings
        if (res.vrix_plus) {
          setVrixPlusProgramName(res.vrix_plus.programName || "VRIX+");
          setVrixPlusMemberName(res.vrix_plus.memberName || "VRIX+ Member");
          setVrixPlusTagline(res.vrix_plus.tagline || "The world of VRIX, unlocked.");
          setVrixPlusHeadline(res.vrix_plus.headline || "Join VRIX+");
          setVrixPlusSubheading(res.vrix_plus.subheading || "Become a VRIX+ Member and enjoy exclusive access, early releases, and premium services designed to elevate your experience with VRIX.");
          setVrixPlusWelcomeGift(res.vrix_plus.welcomeGift || "Your first VRIX+ privilege awaits.");
          setVrixPlusBannerImage(res.vrix_plus.bannerImage || "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop");
          if (Array.isArray(res.vrix_plus.benefits)) {
            if (res.vrix_plus.benefits[0]) {
              setVrixPlusBenefit1Title(res.vrix_plus.benefits[0].title || "Early Access");
              setVrixPlusBenefit1Desc(res.vrix_plus.benefits[0].description || "Shop new collections before public release.");
            }
            if (res.vrix_plus.benefits[1]) {
              setVrixPlusBenefit2Title(res.vrix_plus.benefits[1].title || "Member-Exclusive Releases");
              setVrixPlusBenefit2Desc(res.vrix_plus.benefits[1].description || "Access limited pieces available only to VRIX+ Members.");
            }
            if (res.vrix_plus.benefits[2]) {
              setVrixPlusBenefit3Title(res.vrix_plus.benefits[2].title || "Birthday Privilege");
              setVrixPlusBenefit3Desc(res.vrix_plus.benefits[2].description || "Receive a special birthday surprise from VRIX.");
            }
          }
        }
        if (res.bespoke_config) {
          if (res.bespoke_config.slogan) setBespokeSlogan(res.bespoke_config.slogan);
          if (res.bespoke_config.title) setBespokeTitle(res.bespoke_config.title);
          if (res.bespoke_config.subtitle) setBespokeSubtitle(res.bespoke_config.subtitle);
          if (res.bespoke_config.previewImage) setBespokeImage(res.bespoke_config.previewImage);
          if (res.bespoke_config.basePrice !== undefined) setBespokeBasePrice(res.bespoke_config.basePrice);
          if (Array.isArray(res.bespoke_config.metals)) setBespokeMetals(res.bespoke_config.metals);
          if (Array.isArray(res.bespoke_config.shapes)) setBespokeShapes(res.bespoke_config.shapes);
          if (res.bespoke_config.caratMin !== undefined) setBespokeCaratMin(res.bespoke_config.caratMin);
          if (res.bespoke_config.caratMax !== undefined) setBespokeCaratMax(res.bespoke_config.caratMax);
          if (res.bespoke_config.caratDefault !== undefined) setBespokeCaratDefault(res.bespoke_config.caratDefault);
          if (res.bespoke_config.engravingMax !== undefined) setBespokeEngravingMax(res.bespoke_config.engravingMax);
        }
        if (res.gift_wrapping) {
          setGiftWrapEnabled(res.gift_wrapping.isEnabled !== false);
          setGiftWrapTitle(res.gift_wrapping.title || "");
          setGiftWrapPrice(res.gift_wrapping.price || 250);
          setGiftWrapImage(res.gift_wrapping.image || "");
          setGiftWrapDesc(res.gift_wrapping.description || "");
        }
        if (Array.isArray(res.metal_types)) {
          setMetalTypesList(res.metal_types);
        }
        // Announcement Bar Settings
        if (res.announcement_bar) {
          setAnnouncementEnabled(res.announcement_bar.isEnabled !== false);
          setAnnouncementInterval(res.announcement_bar.interval || 3000);
          setAnnouncementBgColor(res.announcement_bar.backgroundColor || "#000000");
          setAnnouncementTextColor(res.announcement_bar.textColor || "#ffffff");
          setAnnouncementFontSize(res.announcement_bar.fontSize || "11px");
          setAnnouncementLines(Array.isArray(res.announcement_bar.lines) ? res.announcement_bar.lines : []);
        }
        // Custom Pages
        if (res.custom_pages) {
          setCustomPages((prev) => ({ ...prev, ...res.custom_pages }));
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
          truecallerAppId,
          googleEnabled,
          googleClientId,
          googleClientSecret
        },
        vrix_plus: {
          programName: vrixPlusProgramName,
          memberName: vrixPlusMemberName,
          tagline: vrixPlusTagline,
          headline: vrixPlusHeadline,
          subheading: vrixPlusSubheading,
          welcomeGift: vrixPlusWelcomeGift,
          bannerImage: vrixPlusBannerImage,
          benefits: [
            { title: vrixPlusBenefit1Title, description: vrixPlusBenefit1Desc },
            { title: vrixPlusBenefit2Title, description: vrixPlusBenefit2Desc },
            { title: vrixPlusBenefit3Title, description: vrixPlusBenefit3Desc }
          ]
        },
        bespoke_config: {
          slogan: bespokeSlogan,
          title: bespokeTitle,
          subtitle: bespokeSubtitle,
          previewImage: bespokeImage,
          basePrice: Number(bespokeBasePrice),
          metals: bespokeMetals,
          shapes: bespokeShapes,
          caratMin: Number(bespokeCaratMin),
          caratMax: Number(bespokeCaratMax),
          caratDefault: Number(bespokeCaratDefault),
          engravingMax: Number(bespokeEngravingMax),
        },
        gift_wrapping: {
          isEnabled: giftWrapEnabled,
          title: giftWrapTitle,
          price: Number(giftWrapPrice),
          image: giftWrapImage,
          description: giftWrapDesc
        },
        metal_types: metalTypesList,
        announcement_bar: {
          isEnabled: announcementEnabled,
          interval: Number(announcementInterval),
          backgroundColor: announcementBgColor,
          textColor: announcementTextColor,
          fontSize: announcementFontSize,
          lines: announcementLines
        },
        custom_pages: customPages
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

  // --- Module Tabs Definition & Filtering ---
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [tabSearch, setTabSearch] = useState<string>("");

  const CMS_TABS: { id: TabType; label: string; icon: string; category: "Storefront" | "Experience" | "System"; description: string }[] = [
    { id: "hero-philosophy", label: "Hero & Philosophy", icon: "view_carousel", category: "Storefront", description: "Banners, subtitles & cards" },
    { id: "story", label: "Brand Story", icon: "auto_stories", category: "Storefront", description: "Brand narrative & ethos" },
    { id: "nav-brand", label: "Navbar & Brand", icon: "navigation", category: "Storefront", description: "Links & identity" },
    { id: "announcement-bar", label: "Announcement Bar", icon: "campaign", category: "Storefront", description: "Top ticker & alerts" },
    { id: "journal", label: "Journal", icon: "newspaper", category: "Storefront", description: "Articles & editorial" },
    { id: "custom-pages", label: "Custom Pages", icon: "description", category: "Storefront", description: "CMS pages content" },
    { id: "bespoke-atelier", label: "Bespoke Atelier", icon: "diamond", category: "Experience", description: "3D Solitaire Configurator" },
    { id: "vrix-plus", label: "VRIX+ Club", icon: "stars", category: "Experience", description: "Membership privileges" },
    { id: "gift-wrapping", label: "Gift Wrapping", icon: "card_giftcard", category: "Experience", description: "Signature packaging" },
    { id: "metal-types", label: "Metal Swatches", icon: "palette", category: "Experience", description: "Gold & platinum types" },
    { id: "legal", label: "Legal Policies", icon: "gavel", category: "System", description: "Privacy & terms docs" },
    { id: "api-integrations", label: "API Configuration", icon: "api", category: "System", description: "Razorpay, Cloudinary, Auth" },
  ];

  const filteredTabs = CMS_TABS.filter((tab) => {
    const matchesCategory = selectedCategory === "all" || tab.category === selectedCategory;
    const matchesSearch = tab.label.toLowerCase().includes(tabSearch.toLowerCase()) ||
                          tab.description.toLowerCase().includes(tabSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
        {/* Luxury CMS Header & Navigation Bar */}
        <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
          {/* Top Subtle Luxury Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-deep-navy via-amber-600/40 to-deep-navy" />

          {/* Main Title & Action Tools Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-grey/15 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wide">
                  Storefront CMS Editor
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-label-caps tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/60 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Engine
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-label-caps tracking-widest text-slate-600 bg-slate-100 border border-slate-200 uppercase">
                  {CMS_TABS.length} Modules
                </span>
              </div>
              <p className="text-slate-grey font-body-md text-sm max-w-3xl">
                Dynamically modify navigation menu links, contact info, policy documents, brand copy, and interactive bespoke experiences.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 self-start lg:self-center flex-wrap">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-grey/30 bg-pure-white text-deep-navy hover:bg-slate-50 font-label-caps text-xs tracking-wider transition-all"
              >
                <span className="material-symbols-outlined text-base">visibility</span>
                Preview Store
              </a>
              <button
                type="button"
                onClick={() => loadCMSData()}
                className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-grey/30 bg-pure-white text-slate-grey hover:text-ink-black hover:bg-slate-50 font-label-caps text-xs tracking-wider transition-all cursor-pointer"
                title="Reload CMS Data"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Reload Data
              </button>
            </div>
          </div>

          {/* Navigation Controls: Categories & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 font-label-caps text-[11px] overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: "all", label: "All Modules", count: CMS_TABS.length },
                { id: "Storefront", label: "Storefront & Copy", count: CMS_TABS.filter((t) => t.category === "Storefront").length },
                { id: "Experience", label: "Atelier & Features", count: CMS_TABS.filter((t) => t.category === "Experience").length },
                { id: "System", label: "System & APIs", count: CMS_TABS.filter((t) => t.category === "System").length },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 border transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? "bg-deep-navy text-pure-white border-deep-navy"
                      : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black hover:border-slate-grey/40"
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* Quick Tab Search */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                search
              </span>
              <input
                type="text"
                placeholder="Search modules..."
                value={tabSearch}
                onChange={(e) => setTabSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 border border-slate-grey/25 bg-pure-white text-xs font-body-md focus:border-deep-navy outline-none text-ink-black transition-all"
              />
              {tabSearch && (
                <button
                  type="button"
                  onClick={() => setTabSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Module Navigation Tabs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 pt-1">
            {filteredTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative flex flex-col p-3 border cursor-pointer text-left transition-all duration-200 ${
                    isActive
                      ? "bg-deep-navy text-pure-white border-deep-navy shadow-md translate-y-[-1px]"
                      : "bg-pure-white text-slate-grey border-slate-grey/20 hover:text-ink-black hover:border-slate-grey/50 hover:bg-slate-50/80"
                  }`}
                >
                  {/* Top Icon & Active Indicator */}
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`material-symbols-outlined text-lg transition-transform group-hover:scale-110 ${
                        isActive ? "text-amber-300" : "text-slate-600 group-hover:text-deep-navy"
                      }`}
                    >
                      {tab.icon}
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </div>

                  {/* Module Title */}
                  <span
                    className={`font-label-caps text-xs tracking-wider line-clamp-1 ${
                      isActive ? "text-pure-white font-medium" : "text-deep-navy"
                    }`}
                  >
                    {tab.label}
                  </span>

                  {/* Sub-description */}
                  <span className={`text-[10px] line-clamp-1 mt-0.5 ${isActive ? "text-slate-300" : "text-slate-400"}`}>
                    {tab.description}
                  </span>
                </button>
              );
            })}
          </div>
          {filteredTabs.length === 0 && (
            <div className="py-8 text-center text-slate-grey text-xs font-label-caps tracking-widest border border-dashed border-slate-grey/30">
              No CMS modules found matching "{tabSearch}"
            </div>
          )}
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
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-slate-grey font-medium">Quick Presets:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setNodemailerHost("smtp.hostinger.com");
                            setNodemailerPort("465");
                          }}
                          disabled={!nodemailerEnabled}
                          className="px-2 py-1 text-[11px] bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 rounded font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Hostinger Mail (smtp.hostinger.com:465)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNodemailerHost("smtp.gmail.com");
                            setNodemailerPort("465");
                          }}
                          disabled={!nodemailerEnabled}
                          className="px-2 py-1 text-[11px] bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded font-semibold cursor-pointer disabled:opacity-50"
                        >
                          Gmail (smtp.gmail.com:465)
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2 md:col-span-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">SMTP Host</label>
                          <input
                            type="text"
                            value={nodemailerHost}
                            onChange={(e) => setNodemailerHost(e.target.value)}
                            disabled={!nodemailerEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="smtp.hostinger.com"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">SMTP Port</label>
                          <select
                            value={nodemailerPort || "465"}
                            onChange={(e) => setNodemailerPort(e.target.value)}
                            disabled={!nodemailerEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm cursor-pointer"
                          >
                            <option value="465">465 (SSL - Recommended)</option>
                            <option value="587">587 (TLS)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">Sender Username</label>
                          <input
                            type="text"
                            value={nodemailerUser}
                            onChange={(e) => setNodemailerUser(e.target.value)}
                            disabled={!nodemailerEnabled}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black disabled:opacity-50 text-sm"
                            placeholder="hello@vrix.in"
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

                        {/* Google OAuth Login */}
                        <div className="border border-slate-grey/20 p-6 space-y-4 col-span-1 md:col-span-2 bg-soft-linen/20">
                          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-deep-navy text-xl">account_circle</span>
                              <div>
                                <h4 className="font-headline-md text-base text-deep-navy uppercase">Google OAuth Sign-In</h4>
                                <p className="text-xs text-slate-grey font-body-md">Allows customers to log in using their Google account in 1 click.</p>
                              </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={googleEnabled}
                                onChange={(e) => setGoogleEnabled(e.target.checked)}
                                className="w-4 h-4 accent-deep-navy cursor-pointer"
                              />
                              <span className="font-label-caps text-[10px] uppercase text-deep-navy font-semibold">Enable Google Login</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Google Client ID</label>
                              <input
                                type="text"
                                value={googleClientId}
                                onChange={(e) => setGoogleClientId(e.target.value)}
                                placeholder="xxxxxx.apps.googleusercontent.com"
                                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black bg-transparent"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Google Client Secret</label>
                              <input
                                type="password"
                                value={googleClientSecret}
                                onChange={(e) => setGoogleClientSecret(e.target.value)}
                                placeholder="GOCSPX-xxxxxx"
                                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black bg-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* ═══ LIVE SETUP STATUS BANNER ═══ */}
                    <section className="bg-deep-navy text-pure-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-headline-md text-base uppercase tracking-widest">Integration Setup Status</h3>
                          <p className="text-xs text-slate-grey/70 font-body-md mt-0.5">Services marked ✓ are currently enabled and configured.</p>
                        </div>
                        <span className="material-symbols-outlined text-2xl text-slate-grey/50">integration_instructions</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: "Razorpay Payments", active: razorpayEnabled, icon: "payments" },
                          { label: "Email (SMTP)", active: nodemailerEnabled, icon: "mail" },
                          { label: "Image Storage", active: cloudinaryEnabled, icon: "image" },
                          { label: "Truecaller Verify", active: truecallerEnabled, icon: "verified_user" },
                        ].map((svc) => (
                          <div key={svc.label} className={`flex items-center gap-3 p-3 border ${svc.active ? "border-green-500/40 bg-green-500/10" : "border-slate-grey/20 bg-pure-white/5"}`}>
                            <span className={`material-symbols-outlined text-lg ${svc.active ? "text-green-400" : "text-slate-grey/40"}`}>{svc.icon}</span>
                            <div>
                              <div className="text-[9px] font-label-caps tracking-widest text-slate-grey/60 uppercase">{svc.label}</div>
                              <div className={`text-xs font-body-md mt-0.5 ${svc.active ? "text-green-400" : "text-slate-grey/50"}`}>{svc.active ? "✓ Active" : "○ Not set up"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-grey/40 font-label-caps mt-4 tracking-wider">Scroll down for step-by-step setup guides for each service →</p>
                    </section>

                    {/* ═══ CLIENT-FRIENDLY SETUP GUIDE ═══ */}
                    <section className="bg-pure-white border border-slate-grey/25 shadow-sm overflow-hidden">
                      {/* Section Header */}
                      <div className="bg-soft-linen/60 border-b border-slate-grey/15 px-8 py-5 flex items-center justify-between">
                        <div>
                          <h3 className="font-headline-md text-lg text-deep-navy uppercase">How to Get Your Keys &amp; Passwords</h3>
                          <p className="text-xs text-slate-grey font-body-md mt-1">No coding needed. Just follow the steps, copy-paste what you find, and click Save.</p>
                        </div>
                        <div className="hidden md:flex flex-col items-end gap-1">
                          <span className="text-[9px] font-label-caps text-slate-grey uppercase tracking-widest">Setup time</span>
                          <span className="text-sm font-body-md text-deep-navy">≈ 15 minutes total</span>
                        </div>
                      </div>

                      <div className="p-8 space-y-10">

                        {/* ── 1. RAZORPAY ── */}
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-deep-navy text-pure-white flex items-center justify-center font-headline-md text-xl flex-shrink-0 shadow">₹</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-headline-md text-base text-deep-navy uppercase">Razorpay — Payment Gateway</h4>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 border border-green-200">Free to start</span>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-200">~5 min setup</span>
                              </div>
                              <p className="text-xs text-slate-grey font-body-md mt-0.5">Lets customers pay by UPI, card, net banking, or wallet on your store. Razorpay charges a 2% fee per transaction — no monthly fee.</p>
                            </div>
                          </div>

                          <div className="ml-16 space-y-4">
                            <ol className="space-y-3">
                              {[
                                { text: "Go to razorpay.com and click \"Sign Up\". Create an account with your business email.", tag: "Website" },
                                { text: "After login, click Settings in the left sidebar → then API Keys at the top of that page.", tag: "Settings" },
                                { text: "Click \"Generate Test Key\" for now. You can switch to Live Key once your store is ready to sell.", tag: "Test Mode" },
                                { text: "A box will appear showing Key ID (starts with rzp_test_…) and Key Secret. Copy both — the secret disappears when you close this box!", tag: "⚠ Copy Now" },
                                { text: "Go back to the Razorpay Payment Gateway section above. Paste Key ID in the first box, Key Secret in the second. Tick \"Enable\".", tag: "Paste Here" },
                              ].map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-6 h-6 bg-deep-navy text-pure-white rounded-full flex items-center justify-center text-[10px] font-label-caps flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <div>
                                    <span className="text-xs text-ink-black font-body-md leading-relaxed">{step.text}</span>
                                    {step.tag && <span className="ml-2 text-[9px] font-label-caps uppercase bg-slate-grey/10 text-slate-grey px-1.5 py-0.5">{step.tag}</span>}
                                  </div>
                                </li>
                              ))}
                            </ol>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-amber-50 border border-amber-200 p-3 flex gap-2 items-start">
                                <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">warning</span>
                                <div>
                                  <p className="text-[10px] font-label-caps text-amber-700 uppercase tracking-wider mb-1">Test Mode vs Live Mode</p>
                                  <p className="text-xs text-amber-800 font-body-md">Use Test Keys while building your store — no real money moves. Switch to Live Keys only when you're ready to accept real orders from customers.</p>
                                </div>
                              </div>
                              <div className="bg-slate-grey/5 border border-slate-grey/15 p-3 flex gap-2 items-start">
                                <span className="material-symbols-outlined text-slate-grey text-sm mt-0.5">help</span>
                                <div>
                                  <p className="text-[10px] font-label-caps text-slate-grey uppercase tracking-wider mb-1">Common Problem</p>
                                  <p className="text-xs text-slate-grey font-body-md">Can't see \"API Keys\" in Settings? Your account might need KYC verification first. Complete your business details under the \"My Profile\" section.</p>
                                </div>
                              </div>
                            </div>

                            <a href="https://dashboard.razorpay.com/app/website-app-settings/api-keys" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-deep-navy text-deep-navy px-5 py-2.5 text-[10px] font-label-caps uppercase tracking-wider hover:bg-deep-navy hover:text-pure-white transition-colors">
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Open Razorpay API Keys Page
                            </a>
                          </div>
                        </div>

                        <div className="border-t border-slate-grey/10" />

                        {/* ── 2. GMAIL SMTP ── */}
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#EA4335] text-pure-white flex items-center justify-center font-headline-md text-xl flex-shrink-0 shadow">G</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-headline-md text-base text-deep-navy uppercase">Gmail — Email Sending (SMTP)</h4>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 border border-green-200">100% Free</span>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-200">~5 min setup</span>
                              </div>
                              <p className="text-xs text-slate-grey font-body-md mt-0.5">Sends OTP codes, order confirmations, and shipping updates to your customers via your own Gmail address.</p>
                            </div>
                          </div>

                          <div className="ml-16 space-y-4">
                            <div className="bg-blue-50 border border-blue-200 p-3 flex gap-2 items-start">
                              <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">info</span>
                              <p className="text-xs text-blue-800 font-body-md">Gmail needs a special <strong>"App Password"</strong> — not your regular Gmail login password. It's a 16-letter code generated specifically for this store. Your main Gmail password stays private and unchanged.</p>
                            </div>

                            <ol className="space-y-3">
                              {[
                                { text: "First turn on 2-Step Verification: go to myaccount.google.com → click Security on the left → scroll to \"2-Step Verification\" → Turn On.", tag: "Required First" },
                                { text: "Now go to myaccount.google.com → Security → scroll down and click \"App passwords\" (only appears after 2FA is on).", tag: "Security Page" },
                                { text: "You may be asked to re-enter your Gmail password. Enter it and continue.", tag: "" },
                                { text: "In the \"App passwords\" page, type a name like \"Vrix Store\" in the text box and click \"Create\".", tag: "Name It" },
                                { text: "Google shows a 16-character password (like: abcd efgh ijkl mnop). Copy it exactly — including spaces removed.", tag: "⚠ Copy Now" },
                                { text: "In the SMTP section above: Host → smtp.gmail.com | Port → 587 | Username → your full Gmail | Password → paste the 16-char code.", tag: "Paste Here" },
                              ].map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-6 h-6 bg-[#EA4335] text-pure-white rounded-full flex items-center justify-center text-[10px] font-label-caps flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <div>
                                    <span className="text-xs text-ink-black font-body-md leading-relaxed">{step.text}</span>
                                    {step.tag && <span className="ml-2 text-[9px] font-label-caps uppercase bg-slate-grey/10 text-slate-grey px-1.5 py-0.5">{step.tag}</span>}
                                  </div>
                                </li>
                              ))}
                            </ol>

                            {/* Quick Reference Chips */}
                            <div>
                              <p className="text-[10px] font-label-caps text-slate-grey uppercase tracking-widest mb-2">Quick Reference — What to Enter in SMTP Fields</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {[
                                  { label: "SMTP Host", value: "smtp.gmail.com" },
                                  { label: "SMTP Port", value: "587" },
                                  { label: "Sender Username", value: "your@gmail.com" },
                                  { label: "SMTP Password", value: "16-char App Password" },
                                ].map((item) => (
                                  <div key={item.label} className="bg-slate-grey/5 border border-slate-grey/15 p-3">
                                    <div className="text-[9px] font-label-caps text-slate-grey uppercase tracking-widest">{item.label}</div>
                                    <div className="text-xs font-mono text-deep-navy mt-1 break-all">{item.value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-grey/5 border border-slate-grey/15 p-3 flex gap-2 items-start">
                              <span className="material-symbols-outlined text-slate-grey text-sm mt-0.5">help</span>
                              <div>
                                <p className="text-[10px] font-label-caps text-slate-grey uppercase tracking-wider mb-1">Common Problem — "App passwords" option not showing?</p>
                                <p className="text-xs text-slate-grey font-body-md">This option only appears <em>after</em> 2-Step Verification is fully turned on. Make sure you completed Step 1 and saved it. Also make sure you are signed in to the correct Google account.</p>
                              </div>
                            </div>

                            <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#EA4335] text-[#EA4335] px-5 py-2.5 text-[10px] font-label-caps uppercase tracking-wider hover:bg-[#EA4335] hover:text-pure-white transition-colors">
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Open Gmail App Passwords Page
                            </a>
                          </div>
                        </div>

                        <div className="border-t border-slate-grey/10" />

                        {/* ── 3. HOSTINGER BUSINESS MAIL ── */}
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#673de6] text-pure-white flex items-center justify-center font-headline-md text-xl flex-shrink-0 shadow">H</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-headline-md text-base text-deep-navy uppercase">Hostinger Business Mail — Professional Email</h4>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-orange-50 text-orange-600 px-2 py-0.5 border border-orange-200">Paid (from ₹50/mo)</span>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-purple-50 text-purple-600 px-2 py-0.5 border border-purple-200">Recommended</span>
                              </div>
                              <p className="text-xs text-slate-grey font-body-md mt-0.5">Use your own branded email (e.g. hello@vrix.in) instead of Gmail. Looks far more professional to customers. Use this OR Gmail — not both.</p>
                            </div>
                          </div>

                          <div className="ml-16 space-y-4">
                            <ol className="space-y-3">
                              {[
                                { text: "Login to your Hostinger control panel at hpanel.hostinger.com with your username and password.", tag: "Hostinger Login" },
                                { text: "In the top menu, click \"Emails\" and choose your domain name (e.g. vrix.in) from the list.", tag: "Email Section" },
                                { text: "You'll see your email accounts. Click \"Manage\" next to the email you want to send store emails from.", tag: "" },
                                { text: "On that email's manage page, look for \"Configuration\" or \"SMTP Settings\". Click on it.", tag: "Find SMTP" },
                                { text: "You'll see the SMTP details listed. Write them down: Hostname, Port, Username (your email), and Password.", tag: "Note Down" },
                                { text: "Enter those exact values in the SMTP section in the Nodemailer panel above. Your username is your full email address. Password is what you use to log in to that email.", tag: "Paste Here" },
                              ].map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-6 h-6 bg-[#673de6] text-pure-white rounded-full flex items-center justify-center text-[10px] font-label-caps flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <div>
                                    <span className="text-xs text-ink-black font-body-md leading-relaxed">{step.text}</span>
                                    {step.tag && <span className="ml-2 text-[9px] font-label-caps uppercase bg-slate-grey/10 text-slate-grey px-1.5 py-0.5">{step.tag}</span>}
                                  </div>
                                </li>
                              ))}
                            </ol>

                            <div>
                              <p className="text-[10px] font-label-caps text-slate-grey uppercase tracking-widest mb-2">Quick Reference — Hostinger SMTP Values</p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {[
                                  { label: "SMTP Host", value: "smtp.hostinger.com" },
                                  { label: "SMTP Port", value: "465 (SSL) or 587" },
                                  { label: "Sender Username", value: "hello@yourdomain.com" },
                                  { label: "SMTP Password", value: "Your email password" },
                                ].map((item) => (
                                  <div key={item.label} className="bg-slate-grey/5 border border-slate-grey/15 p-3">
                                    <div className="text-[9px] font-label-caps text-slate-grey uppercase tracking-widest">{item.label}</div>
                                    <div className="text-xs font-mono text-deep-navy mt-1 break-all">{item.value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="bg-purple-50 border border-purple-200 p-3 flex gap-2 items-start">
                                <span className="material-symbols-outlined text-purple-500 text-sm mt-0.5">star</span>
                                <p className="text-xs text-purple-800 font-body-md"><strong>Why choose this over Gmail?</strong> Sending from hello@vrix.in builds trust with customers. Gmail addresses can end up in spam folders for order emails. Hostinger Business Mail avoids this.</p>
                              </div>
                              <div className="bg-slate-grey/5 border border-slate-grey/15 p-3 flex gap-2 items-start">
                                <span className="material-symbols-outlined text-slate-grey text-sm mt-0.5">help</span>
                                <div>
                                  <p className="text-[10px] font-label-caps text-slate-grey uppercase tracking-wider mb-1">Common Problem — Can't find SMTP Settings?</p>
                                  <p className="text-xs text-slate-grey font-body-md">In hPanel, go to Emails → Manage → scroll to the bottom to find \"Email Client Configuration\". If you see \"IMAP\" and \"SMTP\" tabs, click SMTP.</p>
                                </div>
                              </div>
                            </div>

                            <a href="https://hpanel.hostinger.com/emails" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#673de6] text-[#673de6] px-5 py-2.5 text-[10px] font-label-caps uppercase tracking-wider hover:bg-[#673de6] hover:text-pure-white transition-colors">
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Open Hostinger Email Panel
                            </a>
                          </div>
                        </div>

                        <div className="border-t border-slate-grey/10" />

                        {/* ── 4. CLOUDINARY ── */}
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#3448C5] text-pure-white flex items-center justify-center font-headline-md text-xl flex-shrink-0 shadow">☁</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-headline-md text-base text-deep-navy uppercase">Cloudinary — Product Image Storage</h4>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-green-100 text-green-700 px-2 py-0.5 border border-green-200">Free (25 GB)</span>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-0.5 border border-blue-200">~3 min setup</span>
                              </div>
                              <p className="text-xs text-slate-grey font-body-md mt-0.5">All product photos you upload are stored here and served to customers at high speed worldwide. The free plan is enough for hundreds of products.</p>
                            </div>
                          </div>

                          <div className="ml-16 space-y-4">
                            <ol className="space-y-3">
                              {[
                                { text: "Go to cloudinary.com and click \"Sign Up For Free\". You can sign up instantly with your Google account.", tag: "Free Account" },
                                { text: "After signing up, you land on your Dashboard. At the very top, look for \"Cloud Name\" — it looks like a unique word. Copy it.", tag: "Cloud Name" },
                                { text: "Just below that on the Dashboard, find \"API Key\" — a long number. Copy it.", tag: "API Key" },
                                { text: "Next to the API Key you'll see \"API Secret\" with dots hiding it. Click the eye icon to show it, then copy it.", tag: "API Secret" },
                                { text: "In the Cloudinary section above, paste Cloud Name, API Key, and API Secret into their matching fields. Tick \"Enable\".", tag: "Paste Here" },
                              ].map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-6 h-6 bg-[#3448C5] text-pure-white rounded-full flex items-center justify-center text-[10px] font-label-caps flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <div>
                                    <span className="text-xs text-ink-black font-body-md leading-relaxed">{step.text}</span>
                                    {step.tag && <span className="ml-2 text-[9px] font-label-caps uppercase bg-slate-grey/10 text-slate-grey px-1.5 py-0.5">{step.tag}</span>}
                                  </div>
                                </li>
                              ))}
                            </ol>

                            <div>
                              <p className="text-[10px] font-label-caps text-slate-grey uppercase tracking-widest mb-2">What you'll find on the Dashboard</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {[
                                  { label: "Cloud Name", value: "Shown at top of Dashboard", where: "Paste → Cloud Name field" },
                                  { label: "API Key", value: "12-digit number on Dashboard", where: "Paste → API Key field" },
                                  { label: "API Secret", value: "Hidden — click eye icon", where: "Paste → API Secret field" },
                                ].map((item) => (
                                  <div key={item.label} className="bg-slate-grey/5 border border-slate-grey/15 p-3">
                                    <div className="text-[9px] font-label-caps text-slate-grey uppercase tracking-widest">{item.label}</div>
                                    <div className="text-xs font-mono text-deep-navy mt-1">{item.value}</div>
                                    <div className="text-[9px] text-slate-grey/60 mt-1 font-body-md">{item.where}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="bg-slate-grey/5 border border-slate-grey/15 p-3 flex gap-2 items-start">
                              <span className="material-symbols-outlined text-slate-grey text-sm mt-0.5">help</span>
                              <div>
                                <p className="text-[10px] font-label-caps text-slate-grey uppercase tracking-wider mb-1">Common Problem — Image not uploading?</p>
                                <p className="text-xs text-slate-grey font-body-md">Double-check that you copied all three values correctly with no extra spaces. The Cloud Name should have no capital letters or special characters. If your API Secret starts with a letter — that's normal.</p>
                              </div>
                            </div>

                            <a href="https://console.cloudinary.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#3448C5] text-[#3448C5] px-5 py-2.5 text-[10px] font-label-caps uppercase tracking-wider hover:bg-[#3448C5] hover:text-pure-white transition-colors">
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Open Cloudinary Dashboard
                            </a>
                          </div>
                        </div>

                        <div className="border-t border-slate-grey/10" />

                        {/* ── 5. TRUECALLER ── */}
                        <div className="space-y-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#1da1f2] text-pure-white flex items-center justify-center font-headline-md text-xl flex-shrink-0 shadow">
                              <span className="material-symbols-outlined text-xl">phone_in_talk</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-headline-md text-base text-deep-navy uppercase">Truecaller — 1-Click Phone Verification</h4>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-yellow-50 text-yellow-700 px-2 py-0.5 border border-yellow-200">Optional</span>
                                <span className="text-[9px] font-label-caps uppercase tracking-widest bg-slate-grey/10 text-slate-grey px-2 py-0.5 border border-slate-grey/20">Sandbox = No key needed</span>
                              </div>
                              <p className="text-xs text-slate-grey font-body-md mt-0.5">Lets customers verify their phone number instantly using Truecaller without typing it manually. Speeds up checkout. Works in Sandbox mode for testing without any keys.</p>
                            </div>
                          </div>

                          <div className="ml-16 space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 p-3 flex gap-2 items-start">
                              <span className="material-symbols-outlined text-yellow-600 text-sm mt-0.5">info</span>
                              <p className="text-xs text-yellow-800 font-body-md"><strong>Good news:</strong> If "Sandbox Simulator Mode" is checked in the Truecaller section above, you don't need any keys. It simulates the flow. Only get real keys when you're ready to go live with real customers.</p>
                            </div>

                            <ol className="space-y-3">
                              {[
                                { text: "Go to developer.truecaller.com and create an account.", tag: "Website" },
                                { text: "Click \"Create New App\". Fill in your app name (e.g. Vrix Store) and your website URL.", tag: "Create App" },
                                { text: "After creating, you'll see a Partner Key — a long string of letters and numbers. Copy it.", tag: "Partner Key" },
                                { text: "Your App ID is usually your website domain (e.g. vrix.in). Copy this too.", tag: "App ID" },
                                { text: "In the Truecaller section above: uncheck Sandbox Mode, paste Partner Key and App ID, and tick Enable.", tag: "Paste Here" },
                              ].map((step, i) => (
                                <li key={i} className="flex gap-3 items-start">
                                  <span className="w-6 h-6 bg-[#1da1f2] text-pure-white rounded-full flex items-center justify-center text-[10px] font-label-caps flex-shrink-0 mt-0.5">{i + 1}</span>
                                  <div>
                                    <span className="text-xs text-ink-black font-body-md leading-relaxed">{step.text}</span>
                                    {step.tag && <span className="ml-2 text-[9px] font-label-caps uppercase bg-slate-grey/10 text-slate-grey px-1.5 py-0.5">{step.tag}</span>}
                                  </div>
                                </li>
                              ))}
                            </ol>

                            <a href="https://developer.truecaller.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border border-[#1da1f2] text-[#1da1f2] px-5 py-2.5 text-[10px] font-label-caps uppercase tracking-wider hover:bg-[#1da1f2] hover:text-pure-white transition-colors">
                              <span className="material-symbols-outlined text-sm">open_in_new</span>
                              Open Truecaller Developer Portal
                            </a>
                          </div>
                        </div>

                        <div className="border-t border-slate-grey/10" />

                        {/* ── SECURITY GOLDEN RULES ── */}
                        <div className="bg-deep-navy text-pure-white p-6 space-y-4">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="material-symbols-outlined text-2xl text-amber-400">shield</span>
                            <h4 className="font-headline-md text-base uppercase tracking-widest">Security Golden Rules</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                              { icon: "lock", title: "Never Share Secrets", desc: "API Secrets, Key Secrets, and App Passwords are like bank PINs. Never share them via WhatsApp, email, or screenshots. Only enter them here in this private admin panel." },
                              { icon: "no_photography", title: "Don't Screenshot Keys", desc: "Avoid taking screenshots of API keys or secrets. If someone sees them, they can charge your Razorpay account or misuse your services." },
                              { icon: "sync", title: "Rotate Keys if Exposed", desc: "If you accidentally shared a key, immediately go to that service and regenerate it. Then update it here. Old keys will stop working automatically." },
                              { icon: "admin_panel_settings", title: "This Panel is Private", desc: "Do not share the admin panel link or login credentials with anyone who doesn't need to manage the store. The URL /admin should remain confidential." },
                            ].map((rule) => (
                              <div key={rule.title} className="flex gap-3 items-start border border-slate-grey/20 p-4 bg-pure-white/5">
                                <span className="material-symbols-outlined text-amber-400 text-lg flex-shrink-0 mt-0.5">{rule.icon}</span>
                                <div>
                                  <p className="text-[10px] font-label-caps text-amber-400 uppercase tracking-widest mb-1">{rule.title}</p>
                                  <p className="text-xs text-slate-grey/80 font-body-md leading-relaxed">{rule.desc}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ── ALL SERVICES QUICK REFERENCE ── */}
                        <div className="border border-slate-grey/20 p-6 space-y-4">
                          <h4 className="font-headline-md text-sm text-deep-navy uppercase border-b border-slate-grey/15 pb-2">All Services at a Glance</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs font-body-md">
                              <thead>
                                <tr className="border-b border-slate-grey/15">
                                  <th className="text-left py-2 pr-4 font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Service</th>
                                  <th className="text-left py-2 pr-4 font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">What It Does</th>
                                  <th className="text-left py-2 pr-4 font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Cost</th>
                                  <th className="text-left py-2 font-label-caps text-[9px] text-slate-grey uppercase tracking-widest">Where to Sign Up</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-grey/10">
                                {[
                                  { service: "Razorpay", what: "Accepts online payments (UPI, cards, wallets)", cost: "2% per transaction", link: "razorpay.com", href: "https://razorpay.com" },
                                  { service: "Gmail SMTP", what: "Sends OTP & order emails to customers", cost: "Free", link: "myaccount.google.com", href: "https://myaccount.google.com/apppasswords" },
                                  { service: "Hostinger Mail", what: "Professional branded email sending", cost: "~₹50–150/month", link: "hpanel.hostinger.com", href: "https://hpanel.hostinger.com/emails" },
                                  { service: "Cloudinary", what: "Stores & serves product images", cost: "Free (25 GB)", link: "cloudinary.com", href: "https://cloudinary.com" },
                                  { service: "Truecaller", what: "1-click phone number verification", cost: "Free (sandbox included)", link: "developer.truecaller.com", href: "https://developer.truecaller.com" },
                                ].map((row) => (
                                  <tr key={row.service} className="hover:bg-soft-linen/20 transition-colors">
                                    <td className="py-2.5 pr-4 font-label-caps text-deep-navy text-[10px]">{row.service}</td>
                                    <td className="py-2.5 pr-4 text-slate-grey">{row.what}</td>
                                    <td className="py-2.5 pr-4 text-slate-grey">{row.cost}</td>
                                    <td className="py-2.5">
                                      <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-deep-navy underline hover:text-ink-black">{row.link}</a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                      </div>
                    </section>
                  </div>
                )}

                {/* 6. VRIX+ CLUB TAB */}
                {activeTab === "vrix-plus" && (
                  <div className="space-y-6 animate-fade-in">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        VRIX+ Program Settings
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Program Name
                          </label>
                          <input
                            type="text"
                            value={vrixPlusProgramName}
                            onChange={(e) => setVrixPlusProgramName(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Member Name
                          </label>
                          <input
                             type="text"
                             value={vrixPlusMemberName}
                             onChange={(e) => setVrixPlusMemberName(e.target.value)}
                             className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                             required
                           />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Slogan Tagline
                          </label>
                          <input
                            type="text"
                            value={vrixPlusTagline}
                            onChange={(e) => setVrixPlusTagline(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Welcome Headline
                          </label>
                          <input
                            type="text"
                            value={vrixPlusHeadline}
                            onChange={(e) => setVrixPlusHeadline(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Welcome Subheading Copy
                        </label>
                        <textarea
                          value={vrixPlusSubheading}
                          onChange={(e) => setVrixPlusSubheading(e.target.value)}
                          className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          rows={3}
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Welcome Gift Claim Slogan
                        </label>
                        <input
                          type="text"
                          value={vrixPlusWelcomeGift}
                          onChange={(e) => setVrixPlusWelcomeGift(e.target.value)}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                          required
                        />
                      </div>
                    </section>

                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Member Benefits List (3 Benefits Cards)
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Benefit 1 */}
                        <div className="border border-slate-grey/20 p-4 space-y-4 bg-soft-linen/20">
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase font-bold">Benefit 1 Title</label>
                            <input
                              type="text"
                              value={vrixPlusBenefit1Title}
                              onChange={(e) => setVrixPlusBenefit1Title(e.target.value)}
                              className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase font-bold">Benefit 1 Description</label>
                            <textarea
                              value={vrixPlusBenefit1Desc}
                              onChange={(e) => setVrixPlusBenefit1Desc(e.target.value)}
                              className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                              rows={3}
                              required
                            />
                          </div>
                        </div>

                        {/* Benefit 2 */}
                        <div className="border border-slate-grey/20 p-4 space-y-4 bg-soft-linen/20">
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase font-bold">Benefit 2 Title</label>
                            <input
                              type="text"
                              value={vrixPlusBenefit2Title}
                              onChange={(e) => setVrixPlusBenefit2Title(e.target.value)}
                              className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase font-bold">Benefit 2 Description</label>
                            <textarea
                              value={vrixPlusBenefit2Desc}
                              onChange={(e) => setVrixPlusBenefit2Desc(e.target.value)}
                              className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                              rows={3}
                              required
                            />
                          </div>
                        </div>

                        {/* Benefit 3 */}
                        <div className="border border-slate-grey/20 p-4 space-y-4 bg-soft-linen/20">
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase font-bold">Benefit 3 Title</label>
                            <input
                              type="text"
                              value={vrixPlusBenefit3Title}
                              onChange={(e) => setVrixPlusBenefit3Title(e.target.value)}
                              className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label className="font-label-caps text-[9px] text-slate-grey uppercase font-bold">Benefit 3 Description</label>
                            <textarea
                              value={vrixPlusBenefit3Desc}
                              onChange={(e) => setVrixPlusBenefit3Desc(e.target.value)}
                              className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-xs text-ink-black"
                              rows={3}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* 6.5 BESPOKE ATELIER TAB */}
                {activeTab === "bespoke-atelier" && (
                  <div className="space-y-6 animate-fade-in">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Bespoke Configurator Page Branding &amp; Pricing
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Collection Slogan Tag
                          </label>
                          <input
                            type="text"
                            value={bespokeSlogan}
                            onChange={(e) => setBespokeSlogan(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Page Title
                          </label>
                          <input
                            type="text"
                            value={bespokeTitle}
                            onChange={(e) => setBespokeTitle(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Subtitle Narrative Copy
                        </label>
                        <textarea
                          value={bespokeSubtitle}
                          onChange={(e) => setBespokeSubtitle(e.target.value)}
                          className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                          rows={2}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Configurator Ring Preview Image URL
                          </label>
                          <input
                            type="url"
                            value={bespokeImage}
                            onChange={(e) => setBespokeImage(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Base Estimate Price (₹)
                          </label>
                          <input
                            type="number"
                            value={bespokeBasePrice}
                            onChange={(e) => setBespokeBasePrice(Number(e.target.value))}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                      </div>
                    </section>

                    {/* Metal Options Manager */}
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                        <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                          Available Metals Configuration
                        </h3>
                        <button
                          type="button"
                          onClick={() => setBespokeMetals([...bespokeMetals, { name: "NEW METAL", color: "#CCCCCC" }])}
                          className="px-3 py-1 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase cursor-pointer"
                        >
                          + Add Metal
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {bespokeMetals.map((m, idx) => (
                          <div key={idx} className="border border-slate-grey/20 p-4 bg-soft-linen/20 space-y-3 relative">
                            <button
                              type="button"
                              onClick={() => setBespokeMetals(bespokeMetals.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 text-error text-[10px] font-label-caps cursor-pointer"
                            >
                              Remove
                            </button>
                            <div className="flex flex-col gap-1">
                              <label className="font-label-caps text-[9px] text-slate-grey uppercase">Metal Name</label>
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => {
                                  const next = [...bespokeMetals];
                                  next[idx].name = e.target.value;
                                  setBespokeMetals(next);
                                }}
                                className="border-b border-slate-grey/30 py-1 text-xs outline-none font-body-md"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col gap-1 flex-1">
                                <label className="font-label-caps text-[9px] text-slate-grey uppercase">Color Hex</label>
                                <input
                                  type="text"
                                  value={m.color}
                                  onChange={(e) => {
                                    const next = [...bespokeMetals];
                                    next[idx].color = e.target.value;
                                    setBespokeMetals(next);
                                  }}
                                  className="border-b border-slate-grey/30 py-1 text-xs outline-none font-mono"
                                />
                              </div>
                              <input
                                type="color"
                                value={m.color.startsWith("#") ? m.color : "#CCCCCC"}
                                onChange={(e) => {
                                  const next = [...bespokeMetals];
                                  next[idx].color = e.target.value;
                                  setBespokeMetals(next);
                                }}
                                className="w-8 h-8 rounded-full border cursor-pointer mt-3"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Stone Shapes & Carat Options */}
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Stone Shapes &amp; Carat Controls
                      </h3>

                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                          Diamond Shapes (Comma-separated)
                        </label>
                        <input
                          type="text"
                          value={bespokeShapes.join(", ")}
                          onChange={(e) => setBespokeShapes(e.target.value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean))}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                          placeholder="ROUND, OVAL, EMERALD, PEAR, CUSHION"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase">Carat Min (ct)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={bespokeCaratMin}
                            onChange={(e) => setBespokeCaratMin(Number(e.target.value))}
                            className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase">Carat Max (ct)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={bespokeCaratMax}
                            onChange={(e) => setBespokeCaratMax(Number(e.target.value))}
                            className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase">Carat Default (ct)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={bespokeCaratDefault}
                            onChange={(e) => setBespokeCaratDefault(Number(e.target.value))}
                            className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase">Engraving Max Chars</label>
                          <input
                            type="number"
                            value={bespokeEngravingMax}
                            onChange={(e) => setBespokeEngravingMax(Number(e.target.value))}
                            className="border-b border-slate-grey/30 py-1 text-sm outline-none font-body-md"
                          />
                        </div>
                      </div>
                    </section>
                  </div>
                )}

                {/* 7. ANNOUNCEMENT BAR TAB */}
                {activeTab === "announcement-bar" && (
                  <div className="space-y-6 animate-fade-in">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Announcement Bar General Settings
                      </h3>
                      
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="announcement-enabled"
                          checked={announcementEnabled}
                          onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                          className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                        />
                        <label htmlFor="announcement-enabled" className="font-body-md text-sm text-ink-black cursor-pointer font-semibold">
                          Enable Announcement Bar (Toggle ON/OFF)
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Slide Transition Interval (in milliseconds)
                          </label>
                          <input
                            type="number"
                            min={500}
                            step={100}
                            value={announcementInterval}
                            onChange={(e) => setAnnouncementInterval(Number(e.target.value))}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Font Size (e.g. 10px, 11px, 12px)
                          </label>
                          <input
                            type="text"
                            value={announcementFontSize}
                            onChange={(e) => setAnnouncementFontSize(e.target.value)}
                            className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Background Color (HEX)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={announcementBgColor}
                              onChange={(e) => setAnnouncementBgColor(e.target.value)}
                              className="w-8 h-8 rounded-full border border-slate-grey/30 cursor-pointer overflow-hidden p-0"
                            />
                            <input
                              type="text"
                              value={announcementBgColor}
                              onChange={(e) => setAnnouncementBgColor(e.target.value)}
                              className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black flex-grow"
                              required
                            />
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                            Text Color (HEX)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={announcementTextColor}
                              onChange={(e) => setAnnouncementTextColor(e.target.value)}
                              className="w-8 h-8 rounded-full border border-slate-grey/30 cursor-pointer overflow-hidden p-0"
                            />
                            <input
                              type="text"
                              value={announcementTextColor}
                              onChange={(e) => setAnnouncementTextColor(e.target.value)}
                              className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black flex-grow"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                      <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                        <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                          Announcement Lines (Sale / Promo Slider)
                        </h3>
                        <button
                          type="button"
                          onClick={() => setAnnouncementLines([...announcementLines, ""])}
                          className="font-label-caps text-[10px] text-deep-navy hover:underline cursor-pointer"
                        >
                          + ADD LINE
                        </button>
                      </div>

                      <div className="space-y-4">
                        {announcementLines.length === 0 ? (
                          <p className="text-slate-grey font-body-md text-sm py-4">No announcement lines added yet. Add a line to display messages.</p>
                        ) : (
                          announcementLines.map((line, index) => (
                            <div key={index} className="flex items-center gap-4 bg-soft-linen/20 p-4 border border-slate-grey/20">
                              <span className="font-label-caps text-xs text-slate-grey">Line {index + 1}</span>
                              <input
                                type="text"
                                value={line}
                                onChange={(e) => {
                                  const updated = [...announcementLines];
                                  updated[index] = e.target.value;
                                  setAnnouncementLines(updated);
                                }}
                                placeholder="e.g. Complimentary shipping on all orders"
                                className="border-b border-slate-grey/30 py-1.5 focus:border-deep-navy outline-none font-body-md text-sm text-ink-black flex-grow"
                                required
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = announcementLines.filter((_, i) => i !== index);
                                  setAnnouncementLines(updated);
                                }}
                                className="text-error font-label-caps text-[10px] hover:underline cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* CUSTOM PAGES TAB */}
                {activeTab === "custom-pages" && (
                  <div className="space-y-6">
                    <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-8">
                      <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                        Custom Placeholder Pages (Footer Links)
                      </h3>
                      {Object.keys(customPages).map((key) => (
                        <div key={key} className="border border-slate-grey/20 p-6 bg-soft-linen/10 space-y-4">
                          <h4 className="font-label-caps text-xs text-deep-navy uppercase tracking-widest">{customPages[key].title || key} Page (/{(key)})</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                                Hero Title
                              </label>
                              <input
                                type="text"
                                value={customPages[key].heroTitle}
                                onChange={(e) => setCustomPages({ ...customPages, [key]: { ...customPages[key], heroTitle: e.target.value } })}
                                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                                Banner Image URL
                              </label>
                              <input
                                type="url"
                                value={customPages[key].bannerImage}
                                onChange={(e) => setCustomPages({ ...customPages, [key]: { ...customPages[key], bannerImage: e.target.value } })}
                                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                              Page Content
                            </label>
                            <textarea
                              value={customPages[key].content}
                              onChange={(e) => setCustomPages({ ...customPages, [key]: { ...customPages[key], content: e.target.value } })}
                              className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                              rows={3}
                            />
                          </div>
                        </div>
                      ))}
                    </section>
                  </div>
                )}

                    {/* 7. GIFT WRAPPING TAB */}
                    {activeTab === "gift-wrapping" && (
                      <div className="space-y-6">
                        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                            <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                              Signature Gift Packaging Settings
                            </h3>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="giftwrap-enabled"
                                checked={giftWrapEnabled}
                                onChange={(e) => setGiftWrapEnabled(e.target.checked)}
                                className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                              />
                              <label htmlFor="giftwrap-enabled" className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest cursor-pointer">
                                Enable Option at Checkout
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-2">
                              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                                Title / Label
                              </label>
                              <input
                                type="text"
                                value={giftWrapTitle}
                                onChange={(e) => setGiftWrapTitle(e.target.value)}
                                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-2">
                              <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                                Gift Wrapping Price (₹ / $)
                              </label>
                              <input
                                type="number"
                                value={giftWrapPrice}
                                onChange={(e) => setGiftWrapPrice(Number(e.target.value))}
                                className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                              Gift Wrap Image URL
                            </label>
                            <input
                              type="url"
                              value={giftWrapImage}
                              onChange={(e) => setGiftWrapImage(e.target.value)}
                              className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest">
                              Packaging Description
                            </label>
                            <textarea
                              value={giftWrapDesc}
                              onChange={(e) => setGiftWrapDesc(e.target.value)}
                              className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                              rows={3}
                              required
                            />
                          </div>
                        </section>
                      </div>
                    )}

                    {/* 8. METAL TYPES / SWATCHES TAB */}
                    {activeTab === "metal-types" && (
                      <div className="space-y-6">
                        <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6">
                          <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                            <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                              Metal Types & Swatch Images
                            </h3>
                            <button
                              type="button"
                              onClick={() => setMetalTypesList([
                                ...metalTypesList,
                                { id: `metal-${Date.now()}`, name: "New Metal Finish", swatch: "https://images.unsplash.com/photo-1611591475140-be3a7c5b61f8?q=80&w=100&auto=format&fit=crop", description: "Metal material details" }
                              ])}
                              className="border border-deep-navy text-deep-navy px-3 py-1 font-label-caps text-[10px] uppercase tracking-wider hover:bg-deep-navy hover:text-white transition-colors cursor-pointer"
                            >
                              + Add Metal Finish
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {metalTypesList.map((metal, idx) => (
                              <div key={idx} className="border border-slate-grey/20 p-4 space-y-3 bg-soft-linen/10 relative">
                                <button
                                  type="button"
                                  onClick={() => setMetalTypesList(metalTypesList.filter((_, i) => i !== idx))}
                                  className="absolute top-3 right-3 text-error font-label-caps text-[9px] tracking-wider hover:underline cursor-pointer"
                                >
                                  Delete Swatch
                                </button>

                                <div className="flex flex-col gap-1">
                                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Metal Name</label>
                                  <input
                                    type="text"
                                    value={metal.name}
                                    onChange={(e) => {
                                      const next = [...metalTypesList];
                                      next[idx].name = e.target.value;
                                      setMetalTypesList(next);
                                    }}
                                    className="border-b border-slate-grey/30 py-1 font-body-md text-sm text-ink-black focus:border-black outline-none"
                                  />
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Swatch Image URL</label>
                                  <input
                                    type="url"
                                    value={metal.swatch}
                                    onChange={(e) => {
                                      const next = [...metalTypesList];
                                      next[idx].swatch = e.target.value;
                                      setMetalTypesList(next);
                                    }}
                                    className="border-b border-slate-grey/30 py-1 font-body-md text-xs text-ink-black focus:border-black outline-none"
                                  />
                                </div>

                                <div className="flex flex-col gap-1">
                                  <label className="font-label-caps text-[9px] text-slate-grey uppercase">Description</label>
                                  <input
                                    type="text"
                                    value={metal.description}
                                    onChange={(e) => {
                                      const next = [...metalTypesList];
                                      next[idx].description = e.target.value;
                                      setMetalTypesList(next);
                                    }}
                                    className="border-b border-slate-grey/30 py-1 font-body-md text-xs text-ink-black focus:border-black outline-none"
                                  />
                                </div>
                              </div>
                            ))}
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
