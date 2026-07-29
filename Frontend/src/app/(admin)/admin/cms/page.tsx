"use client";

import React, { useState, useEffect } from "react";
import { fetchDb, updateCMS, createJournalPost, updateJournalPost, deleteJournalPost, fetchProducts, fetchCollections } from "@/utils/api";

type TabType = "hero-philosophy" | "story" | "nav-brand" | "legal" | "journal" | "api-integrations" | "vrix-plus" | "announcement-bar" | "gift-wrapping" | "metal-types" | "bespoke-atelier" | "custom-pages" | "invoice-customizer";

export default function AdminCMSPage() {
  const [activeTab, setActiveTab] = useState<TabType>("hero-philosophy");
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- Dynamic Selection Assets ---
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allCollections, setAllCollections] = useState<any[]>([]);

  // --- Dynamic Homepage Layout Sections State ---
  const [featuredCollections, setFeaturedCollections] = useState<string[]>([]);
  const [newArrivals, setNewArrivals] = useState<string[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<string[]>([]);

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
  const [vrixPlusSubheading, setVrixPlusSubheading] = useState("Become a VRIX+ Member and enjoy exclusive access.");
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
  const [bespokeImage, setBespokeImage] = useState("");
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
  const [currentLineIndex, setCurrentLineIndex] = useState(0);

  // --- Invoice PDF Customizer States ---
  const [invoiceThemeColor, setInvoiceThemeColor] = useState("#0f1728");
  const [invoiceFontFamily, setInvoiceFontFamily] = useState("sans-serif");
  const [invoiceLogoWidth, setInvoiceLogoWidth] = useState("32");
  const [invoiceCompanyName, setInvoiceCompanyName] = useState("VRIX Jewels");
  const [invoiceCompanyGst, setInvoiceCompanyGst] = useState("");
  const [invoiceAddressLine1, setInvoiceAddressLine1] = useState("VRIX Architectural Fine Jewelry");
  const [invoiceAddressLine2, setInvoiceAddressLine2] = useState("Mumbai, India");
  const [invoiceFooterNotes, setInvoiceFooterNotes] = useState("This is a computer generated document. Signed under official luxury brand licensing.");

  // --- Custom Pages States ---
  const [customPages, setCustomPages] = useState<Record<string, any>>({
    craftsmanship: { title: "Craftsmanship", heroTitle: "Craftsmanship", bannerImage: "", content: "" },
    materials: { title: "Materials", heroTitle: "Materials", bannerImage: "", content: "" },
    sustainability: { title: "Sustainability", heroTitle: "Sustainability", bannerImage: "", content: "" },
    careers: { title: "Careers", heroTitle: "Careers", bannerImage: "", content: "" },
    "style-guide": { title: "Style Guide", heroTitle: "Style Guide", bannerImage: "", content: "" },
    "behind-the-design": { title: "Behind The Design", heroTitle: "Behind The Design", bannerImage: "", content: "" }
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const loadCMSData = () => {
    setLoading(true);
    Promise.all([fetchDb(), fetchProducts(), fetchCollections()])
      .then(([res, prodRes, collRes]) => {
        setAllProducts(prodRes || []);
        setAllCollections(collRes || []);

        // Homepage Features & Hero
        if (res.homepage) {
          setHeroTitle(res.homepage.heroTitle || "");
          setHeroSubtitle(res.homepage.heroSubtitle || "");
          setHeroImage(res.homepage.heroImage || "");
          setHomepageTagline(res.homepage.tagline || "");
          setPhilosophyTitle(res.homepage.philosophyTitle || "");
          setPhilosophyCards(res.homepage.philosophy || []);
          setFeaturedCollections(res.homepage.featuredCollections || []);
          setNewArrivals(res.homepage.newArrivals || []);
          setFeaturedProducts(res.homepage.featuredProducts || []);
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
          setBespokeEnabled(res.features.bespokeEnabled !== false);
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
          setCloudinaryEnabled(!!res.api_settings.cloudinaryEnabled);
          setCloudinaryCloudName(res.api_settings.cloudinaryCloudName || "");
          setCloudinaryApiKey(res.api_settings.cloudinaryApiKey || "");
          setCloudinaryApiSecret(res.api_settings.cloudinaryApiSecret || "");

          setRazorpayEnabled(!!res.api_settings.razorpayEnabled);
          setRazorpayKeyId(res.api_settings.razorpayKeyId || "");
          setRazorpayKeySecret(res.api_settings.razorpayKeySecret || "");

          setNodemailerEnabled(!!res.api_settings.nodemailerEnabled);
          setNodemailerHost(res.api_settings.nodemailerHost || "");
          setNodemailerPort(res.api_settings.nodemailerPort || "");
          setNodemailerUser(res.api_settings.nodemailerUser || "");
          setNodemailerPass(res.api_settings.nodemailerPass || "");

          setTruecallerEnabled(!!res.api_settings.truecallerEnabled);
          setTruecallerSandboxMode(res.api_settings.truecallerSandboxMode !== false);
          setTruecallerPartnerKey(res.api_settings.truecallerPartnerKey || "");
          setTruecallerAppId(res.api_settings.truecallerAppId || "");

          setGoogleEnabled(!!res.api_settings.googleEnabled);
          setGoogleClientId(res.api_settings.googleClientId || "");
          setGoogleClientSecret(res.api_settings.googleClientSecret || "");
        }
        // VRIX+ Settings
        if (res.vrix_plus) {
          setVrixPlusProgramName(res.vrix_plus.programName || "VRIX+");
          setVrixPlusMemberName(res.vrix_plus.memberName || "VRIX+ Member");
          setVrixPlusTagline(res.vrix_plus.tagline || "The world of VRIX, unlocked.");
          setVrixPlusHeadline(res.vrix_plus.headline || "Join VRIX+");
          setVrixPlusSubheading(res.vrix_plus.subheading || "Become a VRIX+ Member and enjoy exclusive access.");
          setVrixPlusWelcomeGift(res.vrix_plus.welcomeGift || "Your first VRIX+ privilege awaits.");
          setVrixPlusBannerImage(res.vrix_plus.bannerImage || "");
          if (Array.isArray(res.vrix_plus.benefits)) {
            if (res.vrix_plus.benefits[0]) {
              setVrixPlusBenefit1Title(res.vrix_plus.benefits[0].title || "Early Access");
              setVrixPlusBenefit1Desc(res.vrix_plus.benefits[0].description || "");
            }
            if (res.vrix_plus.benefits[1]) {
              setVrixPlusBenefit2Title(res.vrix_plus.benefits[1].title || "Member-Exclusive Releases");
              setVrixPlusBenefit2Desc(res.vrix_plus.benefits[1].description || "");
            }
            if (res.vrix_plus.benefits[2]) {
              setVrixPlusBenefit3Title(res.vrix_plus.benefits[2].title || "Birthday Privilege");
              setVrixPlusBenefit3Desc(res.vrix_plus.benefits[2].description || "");
            }
          }
        }
        // Bespoke SOLITAIRE Configurator
        if (res.bespoke_config) {
          setBespokeSlogan(res.bespoke_config.slogan || "THE SIGNATURE COLLECTION");
          setBespokeTitle(res.bespoke_config.title || "Bespoke Solitaire");
          setBespokeSubtitle(res.bespoke_config.subtitle || "");
          setBespokeImage(res.bespoke_config.previewImage || "");
          setBespokeBasePrice(res.bespoke_config.basePrice || 3450);
          if (Array.isArray(res.bespoke_config.metals)) setBespokeMetals(res.bespoke_config.metals);
          if (Array.isArray(res.bespoke_config.shapes)) setBespokeShapes(res.bespoke_config.shapes);
          setBespokeCaratMin(res.bespoke_config.caratMin || 0.5);
          setBespokeCaratMax(res.bespoke_config.caratMax || 3.0);
          setBespokeCaratDefault(res.bespoke_config.caratDefault || 1.5);
          setBespokeEngravingMax(res.bespoke_config.engravingMax || 15);
        }
        // Gift Wrapping
        if (res.gift_wrapping) {
          setGiftWrapEnabled(res.gift_wrapping.isEnabled !== false);
          setGiftWrapTitle(res.gift_wrapping.title || "");
          setGiftWrapPrice(res.gift_wrapping.price || 250);
          setGiftWrapImage(res.gift_wrapping.image || "");
          setGiftWrapDesc(res.gift_wrapping.description || "");
        }
        // Metal swatches
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
        // Invoice Customizer
        if (res.invoice_settings) {
          setInvoiceThemeColor(res.invoice_settings.themeColor || "#0f1728");
          setInvoiceFontFamily(res.invoice_settings.fontFamily || "sans-serif");
          setInvoiceLogoWidth(res.invoice_settings.logoWidth || "32");
          setInvoiceCompanyName(res.invoice_settings.companyName || "VRIX Jewels");
          setInvoiceCompanyGst(res.invoice_settings.companyGst || "");
          setInvoiceAddressLine1(res.invoice_settings.addressLine1 || "VRIX Architectural Fine Jewelry");
          setInvoiceAddressLine2(res.invoice_settings.addressLine2 || "Mumbai, India");
          setInvoiceFooterNotes(res.invoice_settings.footerNotes || "");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        showToast("Error loading CMS configurations.");
      });
  };

  useEffect(() => {
    loadCMSData();
  }, []);

  // Announcement bar simulation timer
  useEffect(() => {
    if (!announcementEnabled || announcementLines.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentLineIndex((prev) => (prev + 1) % announcementLines.length);
    }, announcementInterval);
    return () => clearInterval(interval);
  }, [announcementEnabled, announcementLines, announcementInterval]);

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
          featuredCollections,
          newArrivals,
          featuredProducts,
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
        custom_pages: customPages,
        invoice_settings: {
          themeColor: invoiceThemeColor,
          fontFamily: invoiceFontFamily,
          logoWidth: invoiceLogoWidth,
          companyName: invoiceCompanyName,
          companyGst: invoiceCompanyGst,
          addressLine1: invoiceAddressLine1,
          addressLine2: invoiceAddressLine2,
          footerNotes: invoiceFooterNotes
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
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=500",
      readTime: "5 min read"
    });
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      if (selectedArticleId) {
        await updateJournalPost(selectedArticleId, editingArticle);
        showToast("Journal article updated successfully.");
      } else {
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

  // --- Visual Image Preview Helper Component ---
  const VisualImagePreview = ({ src, alt = "Preview" }: { src: string; alt?: string }) => {
    return (
      <div className="mt-2 w-28 h-20 relative bg-soft-linen/50 border border-slate-grey/20 rounded overflow-hidden flex items-center justify-center text-[10px] text-slate-grey italic">
        {src ? (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          "No Image"
        )}
      </div>
    );
  };

  const CMS_TABS: { id: TabType; label: string; icon: string; category: "Storefront" | "Experience" | "System"; description: string }[] = [
    { id: "hero-philosophy", label: "Hero & Showcase", icon: "view_carousel", category: "Storefront", description: "Banners & layout featured products" },
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
    { id: "invoice-customizer", label: "Invoice Theme", icon: "receipt", category: "System", description: "Customize invoice PDF styling" },
  ];

  return (
    <div className="w-full min-h-screen bg-soft-linen/30 p-6 md:p-12 relative font-body-md text-ink-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-deep-navy text-pure-white px-6 py-4 border border-slate-grey/30 shadow-2xl flex items-center gap-3 animate-fade-in rounded">
          <span className="material-symbols-outlined text-sm">info</span>
          <p className="font-body-md text-sm tracking-wide">{toastMessage}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Luxury CMS Header */}
        <div className="bg-pure-white border border-slate-grey/20 p-6 md:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-deep-navy via-amber-600/40 to-deep-navy" />
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-grey/15 pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-display-lg text-headline-md text-deep-navy uppercase tracking-wide">
                  Storefront CMS Editor
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-label-caps tracking-widest text-emerald-800 bg-emerald-50 border border-emerald-200/60 uppercase rounded font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Engine
                </span>
              </div>
              <p className="text-slate-grey font-body-md text-sm">
                Manage your store copy, visual layouts, configurators, and homepage featured products with zero coding knowledge.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-center">
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
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Reload Data
              </button>
            </div>
          </div>

          {/* Module Navigation Tabs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 pt-1">
            {CMS_TABS.map((tab) => {
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
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className={`material-symbols-outlined text-lg ${isActive ? "text-amber-300" : "text-slate-600"}`}>
                      {tab.icon}
                    </span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </div>
                  <span className={`font-label-caps text-[10px] tracking-wider line-clamp-1 ${isActive ? "text-pure-white font-medium" : "text-deep-navy"}`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Builder Work Area Form */}
        {activeTab !== "journal" ? (
          <form onSubmit={handleSaveCMS} className="space-y-8">
            
            {/* 1. HERO & PHILOSOPHY / HOMEPAGE LAYOUT TAB */}
            {activeTab === "hero-philosophy" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Hero Settings */}
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                    Homepage Hero Banner Settings
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Subtitle</label>
                      <input
                        type="text"
                        value={heroSubtitle}
                        onChange={(e) => setHeroSubtitle(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Title</label>
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
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero Image URL</label>
                    <input
                      type="url"
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                      required
                    />
                    <VisualImagePreview src={heroImage} alt="Hero image preview" />
                  </div>
                </section>

                {/* Brand Philosophy */}
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                    Collections Slogan & Brand Philosophy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Collections Section Slogan</label>
                      <input
                        type="text"
                        value={homepageTagline}
                        onChange={(e) => setHomepageTagline(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Philosophy Section Title</label>
                      <textarea
                        value={philosophyTitle}
                        onChange={(e) => setPhilosophyTitle(e.target.value)}
                        className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                        rows={2}
                        required
                      />
                    </div>
                  </div>
                </section>


              </div>
            )}

            {/* 2. BRAND STORY TAB */}
            {activeTab === "story" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                    Brand Story Cover & Content
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Story Hero Slogan</label>
                      <input
                        type="text"
                        value={storyHeroTitle}
                        onChange={(e) => setStoryHeroTitle(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Story Header Title</label>
                      <input
                        type="text"
                        value={storyTitle}
                        onChange={(e) => setStoryTitle(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 pt-2">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Story Banner Image URL</label>
                    <input
                      type="url"
                      value={storyBanner}
                      onChange={(e) => setStoryBanner(e.target.value)}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                      required
                    />
                    <VisualImagePreview src={storyBanner} alt="Story banner preview" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Story Narrative Copy</label>
                    <textarea
                      value={storyContent}
                      onChange={(e) => setStoryContent(e.target.value)}
                      className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                      rows={4}
                      required
                    />
                  </div>
                </section>
              </div>
            )}

            {/* 3. NAVBAR & BRAND TAB */}
            {activeTab === "nav-brand" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                    Bespoke waitlist toggle
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
                </section>

                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                    Brand Identity details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Brand Name</label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Contact Phone</label>
                      <input
                        type="text"
                        value={brandPhone}
                        onChange={(e) => setBrandPhone(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Contact Email</label>
                      <input
                        type="email"
                        value={brandEmail}
                        onChange={(e) => setBrandEmail(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Store Logo URL</label>
                      <input
                        type="text"
                        value={brandLogo}
                        onChange={(e) => setBrandLogo(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                        required
                      />
                      <VisualImagePreview src={brandLogo} alt="Logo preview" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Headquarters Address</label>
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

            {/* 4. ANNOUNCEMENT BAR TAB */}
            {activeTab === "announcement-bar" && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Live simulation banner */}
                <section className="border border-slate-grey/20 p-6 bg-pure-white rounded shadow-sm space-y-4">
                  <h4 className="font-label-caps text-xs text-deep-navy font-bold tracking-wider uppercase flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Announcement Bar Live Simulation Ticker
                  </h4>
                  {announcementEnabled && announcementLines.length > 0 ? (
                    <div
                      className="w-full text-center py-2 px-4 transition-all duration-500 rounded font-semibold tracking-wider"
                      style={{
                        backgroundColor: announcementBgColor,
                        color: announcementTextColor,
                        fontSize: announcementFontSize,
                      }}
                    >
                      {announcementLines[currentLineIndex] || "No text lines set"}
                    </div>
                  ) : (
                    <div className="w-full text-center py-2 bg-slate-100 text-slate-400 text-xs italic border border-dashed border-slate-300 rounded">
                      Announcement Ticker is currently disabled or empty
                    </div>
                  )}
                </section>

                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                    <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                      Ticker Config & Colors
                    </h3>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="announcement-enabled"
                        checked={announcementEnabled}
                        onChange={(e) => setAnnouncementEnabled(e.target.checked)}
                        className="w-4 h-4 text-deep-navy border-slate-grey/30 focus:ring-deep-navy cursor-pointer"
                      />
                      <label htmlFor="announcement-enabled" className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest cursor-pointer">
                        Enable Ticker
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Rotation Speed (ms)</label>
                      <input
                        type="number"
                        value={announcementInterval}
                        onChange={(e) => setAnnouncementInterval(Number(e.target.value))}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none text-xs font-semibold text-deep-navy"
                        placeholder="3000"
                        min={1000}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Background Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={announcementBgColor}
                          onChange={(e) => setAnnouncementBgColor(e.target.value)}
                          className="w-8 h-8 cursor-pointer rounded border border-slate-grey/30"
                        />
                        <input
                          type="text"
                          value={announcementBgColor}
                          onChange={(e) => setAnnouncementBgColor(e.target.value)}
                          className="border-b border-slate-grey/30 py-1 text-xs outline-none font-mono flex-1"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={announcementTextColor}
                          onChange={(e) => setAnnouncementTextColor(e.target.value)}
                          className="w-8 h-8 cursor-pointer rounded border border-slate-grey/30"
                        />
                        <input
                          type="text"
                          value={announcementTextColor}
                          onChange={(e) => setAnnouncementTextColor(e.target.value)}
                          className="border-b border-slate-grey/30 py-1 text-xs outline-none font-mono flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Announcement lines list</label>
                    {announcementLines.map((line, idx) => (
                      <div key={idx} className="flex gap-2 items-center bg-soft-linen/5 p-2 border border-slate-grey/15 rounded">
                        <input
                          type="text"
                          value={line}
                          onChange={(e) => {
                            const next = [...announcementLines];
                            next[idx] = e.target.value;
                            setAnnouncementLines(next);
                          }}
                          className="flex-1 text-xs border-b border-transparent focus:border-deep-navy outline-none py-0.5"
                          placeholder="e.g. Free shipping worldwide"
                        />
                        <button
                          type="button"
                          onClick={() => setAnnouncementLines(announcementLines.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs p-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAnnouncementLines([...announcementLines, ""])}
                      className="mt-1 text-deep-navy text-[10px] font-label-caps hover:underline text-left"
                    >
                      + Add line item
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* 5. CUSTOM PAGES TAB */}
            {activeTab === "custom-pages" && (
              <div className="space-y-6 animate-fade-in">
                {Object.keys(customPages).map((pKey) => (
                  <section key={pKey} className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                    <h3 className="font-headline-md text-base text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                      Page Content: {customPages[pKey].title || pKey}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Hero banner Title</label>
                        <input
                          type="text"
                          value={customPages[pKey].heroTitle || ""}
                          onChange={(e) => {
                            const next = { ...customPages };
                            next[pKey].heroTitle = e.target.value;
                            setCustomPages(next);
                          }}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Banner Image URL</label>
                        <input
                          type="text"
                          value={customPages[pKey].bannerImage || ""}
                          onChange={(e) => {
                            const next = { ...customPages };
                            next[pKey].bannerImage = e.target.value;
                            setCustomPages(next);
                          }}
                          className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                        />
                        <VisualImagePreview src={customPages[pKey].bannerImage || ""} alt="Page banner preview" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Page Body Narrative</label>
                      <textarea
                        value={customPages[pKey].content || ""}
                        onChange={(e) => {
                          const next = { ...customPages };
                          next[pKey].content = e.target.value;
                          setCustomPages(next);
                        }}
                        className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                        rows={4}
                      />
                    </div>
                  </section>
                ))}
              </div>
            )}

            {/* 6. BESPOKE ATELIER CONFIGURATION TAB */}
            {activeTab === "bespoke-atelier" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                    Configurator details & base price
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Slogan Header</label>
                      <input
                        type="text"
                        value={bespokeSlogan}
                        onChange={(e) => setBespokeSlogan(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Page Header Title</label>
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
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Description subtitle</label>
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
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Ring image preview URL</label>
                      <input
                        type="url"
                        value={bespokeImage}
                        onChange={(e) => setBespokeImage(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                        required
                      />
                      <VisualImagePreview src={bespokeImage} alt="Ring preview" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Estimate Base Price (₹)</label>
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

                {/* Metals configuration */}
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                    <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                      Atelier Swatches & metals
                    </h3>
                    <button
                      type="button"
                      onClick={() => setBespokeMetals([...bespokeMetals, { name: "NEW METAL", color: "#CCCCCC" }])}
                      className="px-3 py-1.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase cursor-pointer rounded shadow-xs hover:bg-ink-black"
                    >
                      + Add Swatch
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bespokeMetals.map((metal, idx) => (
                      <div key={idx} className="border border-slate-grey/15 p-4 bg-soft-linen/5 rounded flex gap-4 items-center">
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Metal Name</label>
                          <input
                            type="text"
                            value={metal.name}
                            onChange={(e) => {
                              const next = [...bespokeMetals];
                              next[idx].name = e.target.value;
                              setBespokeMetals(next);
                            }}
                            className="border-b border-slate-grey/20 py-1 text-xs outline-none text-deep-navy font-bold focus:border-deep-navy"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 items-center">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Swatch</label>
                          <input
                            type="color"
                            value={metal.color}
                            onChange={(e) => {
                              const next = [...bespokeMetals];
                              next[idx].color = e.target.value;
                              setBespokeMetals(next);
                            }}
                            className="w-8 h-8 rounded cursor-pointer border border-slate-grey/30"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setBespokeMetals(bespokeMetals.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs p-1 self-end mb-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* 7. VRIX+ MEMBER CLUB TAB */}
            {activeTab === "vrix-plus" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <h3 className="font-headline-md text-lg text-deep-navy uppercase border-b border-slate-grey/15 pb-2">
                    VRIX+ Club Content
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Program Name</label>
                      <input
                        type="text"
                        value={vrixPlusProgramName}
                        onChange={(e) => setVrixPlusProgramName(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Member Role Title</label>
                      <input
                        type="text"
                        value={vrixPlusMemberName}
                        onChange={(e) => setVrixPlusMemberName(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Banner Image URL</label>
                      <input
                        type="text"
                        value={vrixPlusBannerImage}
                        onChange={(e) => setVrixPlusBannerImage(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                        required
                      />
                      <VisualImagePreview src={vrixPlusBannerImage} alt="VRIX+ banner" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Tagline text</label>
                      <input
                        type="text"
                        value={vrixPlusTagline}
                        onChange={(e) => setVrixPlusTagline(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Invite Headline</label>
                    <input
                      type="text"
                      value={vrixPlusHeadline}
                      onChange={(e) => setVrixPlusHeadline(e.target.value)}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Invite Subheading</label>
                    <textarea
                      value={vrixPlusSubheading}
                      onChange={(e) => setVrixPlusSubheading(e.target.value)}
                      className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                      rows={3}
                      required
                    />
                  </div>
                </section>
              </div>
            )}

            {/* 8. GIFT WRAPPING CONFIGURATION TAB */}
            {activeTab === "gift-wrapping" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                    <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                      Signature packaging options
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
                        Enable Gift Wrapping
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Packaging title</label>
                      <input
                        type="text"
                        value={giftWrapTitle}
                        onChange={(e) => setGiftWrapTitle(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Wrapper Price (₹)</label>
                      <input
                        type="number"
                        value={giftWrapPrice}
                        onChange={(e) => setGiftWrapPrice(Number(e.target.value))}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black"
                        required
                      />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Packaging Image URL</label>
                      <input
                        type="text"
                        value={giftWrapImage}
                        onChange={(e) => setGiftWrapImage(e.target.value)}
                        className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                      />
                      <VisualImagePreview src={giftWrapImage} alt="Gift Wrap preview" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Packaging Description</label>
                    <textarea
                      value={giftWrapDesc}
                      onChange={(e) => setGiftWrapDesc(e.target.value)}
                      className="border border-slate-grey/30 p-2 focus:border-deep-navy outline-none font-body-md text-ink-black text-sm"
                      rows={3}
                    />
                  </div>
                </section>
              </div>
            )}

            {/* 9. METAL SWATCHES / TYPES TAB */}
            {activeTab === "metal-types" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                    <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                      Shop catalog metal swatches
                    </h3>
                    <button
                      type="button"
                      onClick={() => setMetalTypesList([...metalTypesList, { id: "new-metal", label: "New Metal", color: "#CCCCCC" }])}
                      className="px-3 py-1.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase cursor-pointer rounded shadow-xs hover:bg-ink-black"
                    >
                      + Add Swatch
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metalTypesList.map((metal, idx) => (
                      <div key={idx} className="border border-slate-grey/15 p-4 bg-soft-linen/5 rounded flex gap-4 items-center">
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Swatch ID (e.g. gold)</label>
                          <input
                            type="text"
                            value={metal.id}
                            onChange={(e) => {
                              const next = [...metalTypesList];
                              next[idx].id = e.target.value;
                              setMetalTypesList(next);
                            }}
                            className="border-b border-slate-grey/20 py-1 text-xs outline-none text-slate-grey font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Swatch Label</label>
                          <input
                            type="text"
                            value={metal.label}
                            onChange={(e) => {
                              const next = [...metalTypesList];
                              next[idx].label = e.target.value;
                              setMetalTypesList(next);
                            }}
                            className="border-b border-slate-grey/20 py-1 text-xs outline-none text-deep-navy font-bold focus:border-deep-navy"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5 items-center">
                          <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Swatch Color</label>
                          <input
                            type="color"
                            value={metal.color}
                            onChange={(e) => {
                              const next = [...metalTypesList];
                              next[idx].color = e.target.value;
                              setMetalTypesList(next);
                            }}
                            className="w-8 h-8 rounded cursor-pointer border border-slate-grey/30"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setMetalTypesList(metalTypesList.filter((_, i) => i !== idx))}
                          className="text-red-500 hover:text-red-700 text-xs p-1 self-end mb-1"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* 10. LEGAL DOCUMENTS POLICY EDITOR TAB */}
            {activeTab === "legal" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <div className="flex justify-between items-center border-b border-slate-grey/15 pb-2">
                    <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                      Legal Policy Document Editor
                    </h3>
                    <select
                      value={selectedLegalKey}
                      onChange={(e) => setSelectedLegalKey(e.target.value)}
                      className="bg-pure-white border border-slate-grey/30 py-1.5 px-3 font-label-caps text-xs text-deep-navy rounded focus:outline-none cursor-pointer"
                    >
                      <option value="privacy">Privacy Policy</option>
                      <option value="shipping">Shipping Policy</option>
                      <option value="returns">Returns Policy</option>
                      <option value="terms">Terms &amp; Conditions</option>
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
                        <h4 className="font-label-caps text-xs text-slate-grey uppercase tracking-widest font-semibold">Document Sections</h4>
                        {legalData[selectedLegalKey].sections && legalData[selectedLegalKey].sections.map((section: any, idx: number) => (
                          <div key={idx} className="border border-slate-grey/15 p-4 space-y-4 bg-soft-linen/5 relative rounded">
                            <button
                              type="button"
                              onClick={() => {
                                const next = { ...legalData };
                                next[selectedLegalKey].sections = next[selectedLegalKey].sections.filter((_: any, sidx: number) => sidx !== idx);
                                setLegalData(next);
                              }}
                              className="absolute top-4 right-4 text-red-500 hover:text-red-700 font-label-caps text-[9px] tracking-wider cursor-pointer"
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
                          className="border border-deep-navy text-deep-navy px-4 py-2 font-button uppercase text-[10px] tracking-wider hover:bg-deep-navy hover:text-pure-white transition-colors cursor-pointer rounded"
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

            {/* 11. API INTEGRATIONS CONFIGURATION TAB (Left exactly as it was) */}
            {activeTab === "api-integrations" && (
              <div className="space-y-6 animate-fade-in">
                {/* Cloudinary */}
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
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
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
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
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
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
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
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
              </div>
            )}

            {/* 12. INVOICE PDF CUSTOMIZER TAB */}
            {activeTab === "invoice-customizer" && (
              <div className="space-y-6 animate-fade-in">
                <section className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded">
                  <div className="border-b border-slate-grey/15 pb-2">
                    <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                      Tax Invoice Customizer &amp; PDF Styling
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Theme Color Accent</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={invoiceThemeColor}
                          onChange={(e) => setInvoiceThemeColor(e.target.value)}
                          className="w-10 h-10 border border-slate-grey/30 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={invoiceThemeColor}
                          onChange={(e) => setInvoiceThemeColor(e.target.value)}
                          className="border border-slate-grey/30 px-3 py-2 text-xs flex-1 uppercase font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Typography font</label>
                      <select
                        value={invoiceFontFamily}
                        onChange={(e) => setInvoiceFontFamily(e.target.value)}
                        className="bg-pure-white border border-slate-grey/30 px-3 py-2 rounded text-xs outline-none cursor-pointer"
                      >
                        <option value="sans-serif">Sans-serif (Modern Clean)</option>
                        <option value="serif">Serif (Traditional Luxury)</option>
                        <option value="monospace">Monospace (Technical Detail)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Logo Font Size (px)</label>
                      <input
                        type="number"
                        value={invoiceLogoWidth}
                        onChange={(e) => setInvoiceLogoWidth(e.target.value)}
                        className="border border-slate-grey/30 px-3 py-2 rounded text-xs outline-none"
                        placeholder="e.g. 28"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Company Name</label>
                      <input
                        type="text"
                        value={invoiceCompanyName}
                        onChange={(e) => setInvoiceCompanyName(e.target.value)}
                        className="border border-slate-grey/30 px-3 py-2 rounded text-xs outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Seller GST Number</label>
                      <input
                        type="text"
                        value={invoiceCompanyGst}
                        onChange={(e) => setInvoiceCompanyGst(e.target.value)}
                        className="border border-slate-grey/30 px-3 py-2 rounded text-xs outline-none uppercase"
                        placeholder="e.g. 22AAAAA0000A1Z5"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Office Address Line 1</label>
                      <input
                        type="text"
                        value={invoiceAddressLine1}
                        onChange={(e) => setInvoiceAddressLine1(e.target.value)}
                        className="border border-slate-grey/30 px-3 py-2 rounded text-xs outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-3">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Office Address Line 2</label>
                      <input
                        type="text"
                        value={invoiceAddressLine2}
                        onChange={(e) => setInvoiceAddressLine2(e.target.value)}
                        className="border border-slate-grey/30 px-3 py-2 rounded text-xs outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-3">
                      <label className="font-label-caps text-[10px] text-slate-grey uppercase tracking-widest font-semibold">Bottom Footer Invoice Note</label>
                      <textarea
                        value={invoiceFooterNotes}
                        onChange={(e) => setInvoiceFooterNotes(e.target.value)}
                        className="border border-slate-grey/30 p-3 rounded text-xs outline-none"
                        rows={3}
                        placeholder="e.g. Thank you for your luxury purchase. Certified authentic architectural jewels."
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* General form submit button */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-grey/15">
              <button
                type="submit"
                disabled={saveLoading}
                className="px-6 py-3 bg-deep-navy text-pure-white hover:bg-ink-black font-label-caps text-xs tracking-widest uppercase cursor-pointer disabled:opacity-50 shadow transition-all duration-200"
              >
                {saveLoading ? "Saving Module..." : `Save ${CMS_TABS.find(t => t.id === activeTab)?.label}`}
              </button>
            </div>
          </form>
        ) : (
          /* JOURNAL TAB (Unique structure with sub-form for articles list) */
          <div className="bg-pure-white border border-slate-grey/25 p-8 shadow-sm space-y-6 rounded animate-fade-in">
            <div className="flex justify-between items-center border-b border-slate-grey/15 pb-3">
              <div>
                <h3 className="font-headline-md text-lg text-deep-navy uppercase">
                  Journal Editorial Articles
                </h3>
                <p className="text-[10px] text-slate-grey">Create, edit, or delete editorial blog stories.</p>
              </div>
              <button
                type="button"
                onClick={handleNewArticle}
                className="px-3 py-1.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase cursor-pointer rounded shadow-xs"
              >
                + Write New Article
              </button>
            </div>

            {selectedArticleId !== null ? (
              <form onSubmit={handleSaveArticle} className="space-y-6 border border-slate-grey/15 p-6 rounded bg-soft-linen/5">
                <h4 className="font-headline-md text-sm text-deep-navy uppercase font-semibold">
                  {selectedArticleId ? "Edit Article" : "New Article Post"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Article Title</label>
                    <input
                      type="text"
                      value={editingArticle.title}
                      onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none text-xs text-deep-navy font-bold"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Read Time (e.g. 5 min read)</label>
                    <input
                      type="text"
                      value={editingArticle.readTime}
                      onChange={(e) => setEditingArticle({ ...editingArticle, readTime: e.target.value })}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none text-xs"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Banner Image URL</label>
                    <input
                      type="text"
                      value={editingArticle.image}
                      onChange={(e) => setEditingArticle({ ...editingArticle, image: e.target.value })}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none text-xs text-slate-grey"
                    />
                    <VisualImagePreview src={editingArticle.image} alt="Article banner preview" />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Article Excerpt Summary</label>
                    <input
                      type="text"
                      value={editingArticle.excerpt}
                      onChange={(e) => setEditingArticle({ ...editingArticle, excerpt: e.target.value })}
                      className="border-b border-slate-grey/30 py-2 focus:border-deep-navy outline-none text-xs"
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="font-label-caps text-[9px] text-slate-grey uppercase font-semibold">Full Narrative Content (Markdown Supported)</label>
                    <textarea
                      value={editingArticle.content}
                      onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                      className="border border-slate-grey/30 p-3 focus:border-deep-navy outline-none text-xs"
                      rows={8}
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4 border-t border-slate-grey/10">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-deep-navy text-pure-white text-[10px] font-label-caps uppercase hover:bg-ink-black cursor-pointer rounded"
                  >
                    Save Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedArticleId(null)}
                    className="px-5 py-2.5 border border-slate-grey/30 text-slate-grey text-[10px] font-label-caps uppercase hover:bg-slate-50 cursor-pointer rounded"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {journalArticles.map((article) => (
                  <div key={article.id} className="border border-slate-grey/15 p-4 rounded flex gap-4 bg-soft-linen/5 justify-between items-start">
                    <div className="flex gap-3">
                      <div className="w-16 h-16 bg-soft-linen rounded overflow-hidden relative flex-shrink-0">
                        {article.image && <img src={article.image} alt={article.title} className="object-cover w-full h-full" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-deep-navy truncate">{article.title}</h4>
                        <p className="text-[10px] text-slate-grey line-clamp-2 mt-1">{article.excerpt}</p>
                        <span className="text-[9px] text-slate-grey font-label-caps uppercase mt-1.5 block">{article.readTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectArticle(article)}
                        className="text-deep-navy hover:underline text-[10px] font-label-caps"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteArticle(article.id)}
                        className="text-red-500 hover:underline text-[10px] font-label-caps"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
