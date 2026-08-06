"use client";

import React, { useState } from "react";

interface HelpSection {
  title: string;
  icon: string;
  description: string;
  steps: {
    question: string;
    answer: string;
    actionLabel?: string;
    actionLink?: string;
  }[];
}

export default function AdminHelpPage() {
  const [activeTab, setActiveTab] = useState<string>("general");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const helpData: Record<string, HelpSection> = {
    general: {
      title: "General Dashboard",
      icon: "dashboard",
      description: "Learn how to navigate the admin dashboard and read storefront statistics.",
      steps: [
        {
          question: "How do I check daily sales and orders?",
          answer: "On the main Dashboard Overview, you can see live boxes showing total revenue, order counts, pending fulfillment orders, and items out of stock. The 'Recent Orders' table lists latest customer purchases instantly.",
          actionLabel: "Go to Dashboard Overview",
          actionLink: "/admin"
        },
        {
          question: "How do I look up a specific product, order, or customer?",
          answer: "Use the global Search Bar at the top of the admin panel. Simply type a product name, order ID, or customer email. The search results will instantly pop up in a dropdown menu, letting you jump straight to that item.",
        },
        {
          question: "How do I preview my live storefront?",
          answer: "Click the 'View Store' button at the bottom of the left sidebar or the top-right corner. It will open your storefront in a new tab so you can preview changes in real time.",
          actionLabel: "View Storefront",
          actionLink: "/"
        }
      ]
    },
    products: {
      title: "Products & Sizing",
      icon: "inventory_2",
      description: "Manage your luxury jewelry inventory, pricing, sizing, and engraving options.",
      steps: [
        {
          question: "How do I add a new jewelry piece?",
          answer: "Go to the Products page and click the '+ Add Product' button at the top right. A form drawer will slide in where you can fill in title, material type (gold, platinum, etc.), price, size options, description, stock status, and add images.",
          actionLabel: "Manage Products",
          actionLink: "/admin/products"
        },
        {
          question: "How do I temporarily hide a product from customers?",
          answer: "In the Products page list, look for the 'Visible' column switch. Click the toggle switch to turn it off (turns grey). The product is immediately hidden from customer searches and storefront shelves without being permanently deleted.",
          actionLabel: "Toggle Product Visibility",
          actionLink: "/admin/products"
        },
        {
          question: "How do I configure custom Engravings or Gift Notes for a product?",
          answer: "Click on any product to edit it. Scroll down to 'Customizations'. Check the box for 'Enable Custom Engraving' or 'Enable Gift Note'. You can set character limits (e.g. 15 characters max) and specific prompt instructions that the customer will see on the product page.",
          actionLabel: "Configure Customizations",
          actionLink: "/admin/products"
        },
        {
          question: "How do I manage available ring sizes or necklace lengths?",
          answer: "Inside the product editing drawer, look for the 'Available Sizes' section. You can type in or choose standard ring sizes (e.g., 'Size 6', 'Size 7', 'Size 8') or chain options. Only the selected sizes will appear as swatches on the live storefront product detail page.",
        }
      ]
    },
    homepage: {
      title: "Homepage Layout",
      icon: "view_quilt",
      description: "Customize storefront hero banners, highlight products, and arrange collections.",
      steps: [
        {
          question: "How do I change the main homepage hero banner slide?",
          answer: "Go to CMS Settings or the Homepage Layout editor. Under the 'Hero Banner' section, you can customize the main heading title, subheading description, and upload a premium background banner image.",
          actionLabel: "Configure Homepage Banners",
          actionLink: "/admin/homepage"
        },
        {
          question: "How do I feature specific collections or new arrivals?",
          answer: "Go to the Homepage Layout page. Under the 'Featured Collections' or 'New Arrivals' sections, select the collections you want to highlight using the dropdown menus. You can drag and reorder them to display them perfectly on the storefront grid.",
          actionLabel: "Manage Collections Grid",
          actionLink: "/admin/homepage"
        },
        {
          question: "What is the Philosophy section?",
          answer: "The Philosophy section showcases your brand pillars (e.g. 'Handcrafted Legacy', 'Architectural Design', 'Sustainable Luxury'). In the Homepage Layout editor, you can customize the icon, name, and subtitle for these 3-4 cards.",
        }
      ]
    },
    navigation: {
      title: "Navigation & Links",
      icon: "navigation",
      description: "Manage storefront header menus, custom links, and order routing.",
      steps: [
        {
          question: "How do I add a new link to the header menu?",
          answer: "Navigate to the Navigation page. Click the '+ Add Navigation Link' button. Enter a Menu Label (e.g. 'Wedding Rings') and map it to a standard page or collections page. You can drag links up and down to change their order in the header menu.",
          actionLabel: "Manage Navigation Menus",
          actionLink: "/admin/navigation"
        },
        {
          question: "How do I create or edit dynamic categories?",
          answer: "In the Navigation settings page, scroll down to the 'Homepage Categories Organizer'. Here you can map storefront shortcut categories to specific collection queries or products, making it easy for customers to explore.",
        }
      ]
    },
    features: {
      title: "Feature Toggles",
      icon: "toggle_on",
      description: "Enable or disable major storefront features like Bespoke, Gift Wrapping, and Announcement Bars.",
      steps: [
        {
          question: "How do I turn the Bespoke Solitaire ring builder on or off?",
          answer: "Go to the Bespoke Configurator page. Toggle the 'Enable Bespoke Commission Services' switch. If toggled off, the solitaire configurator page (/bespoke) will be disabled, and link options will hide.",
          actionLabel: "Toggle Bespoke Configurator",
          actionLink: "/admin/bespoke"
        },
        {
          question: "How do I manage the Gift Packaging service?",
          answer: "Under CMS Settings, select the 'Gift Wrapping' tab. You can activate/deactivate the service, update the wrapper description, upload a preview image of your premium packaging box, and set a custom gift-wrapping fee (e.g., ₹250).",
          actionLabel: "Configure Gift Wrapping",
          actionLink: "/admin/cms?tab=gift-wrapping"
        },
        {
          question: "How do I update the scrolling announcement bar text?",
          answer: "Go to CMS Settings and select the 'Announcement Bar' tab. You can toggle the bar on or off, add multiple messages that scroll automatically (e.g., 'Free Express Delivery' and 'Join VRIX+ loyalty program'), set colors, and choose a rotation speed.",
          actionLabel: "Edit Announcement Bar",
          actionLink: "/admin/cms?tab=announcement-bar"
        }
      ]
    },
    integrations: {
      title: "API & Integrations",
      icon: "security",
      description: "Understand Razorpay gateway keys, SMTP email setups, and Cloudinary media hosts.",
      steps: [
        {
          question: "How do payments get processed? (Razorpay)",
          answer: "Customer payments are securely routed through Razorpay. Under Security & Logs, the Razorpay integration section allows entering API keys (Key ID and Secret). Toggle on 'Razorpay Payments Enabled' when launching live, or keep in sandbox mode for test checkout simulation.",
          actionLabel: "View Credentials Portal",
          actionLink: "/admin/security"
        },
        {
          question: "Why are transactional emails or OTPs not sending?",
          answer: "Emails and phone OTP notifications rely on the SMTP/Nodemailer and Truecaller integrations. Go to Security & Logs to ensure the Host, Port, Email User/Pass, or SMS Partner Keys are entered correctly and the toggles are set to 'Active'.",
          actionLabel: "Configure Email/SMS Server",
          actionLink: "/admin/security"
        },
        {
          question: "Where are product and banner media stored? (Cloudinary)",
          answer: "All image uploads are hosted on Cloudinary, ensuring fast load times. Under Security & Logs, ensure your Cloudinary Cloud Name, API Key, and Secret are verified. If Cloudinary is disabled, the system will use local uploads.",
        }
      ]
    },
    delivery: {
      title: "Delivery Portal",
      icon: "local_shipping",
      description: "How to manage delivery staff, assign orders, and use the agent OTP verification system.",
      steps: [
        {
          question: "How do I add or manage Delivery Staff?",
          answer: "Navigate to the 'Delivery Staff' page in the admin sidebar. Click the '+ Add Delivery Staff' button, enter the agent's name, email address, and role ('agent' or 'manager'), and click save. The staff list shows all registered agents.",
          actionLabel: "Manage Delivery Staff",
          actionLink: "/admin/delivery"
        },
        {
          question: "How do I assign an order to a delivery agent?",
          answer: "Go to the Orders manager page, click on the order you wish to assign. Under the Order Details, look for the 'Assigned Agent' dropdown. Select the delivery agent from the list and click 'Update Assignment'. The agent will see this order on their portal list.",
          actionLabel: "View Orders to Assign",
          actionLink: "/admin/orders"
        },
        {
          question: "How does the Delivery Agent log in?",
          answer: "Delivery agents do not use passwords. They navigate to the Delivery Portal at '/delivery'. They enter their registered email address, click 'Send OTP', and receive a 6-digit access code in their inbox. They enter this OTP code to access their active deliveries list.",
          actionLabel: "Go to Agent Login",
          actionLink: "/delivery"
        },
        {
          question: "How does an agent verify and complete a delivery?",
          answer: "When handoff occurs: 1. The agent selects the assigned order on their screen and clicks 'Verify Handoff'. 2. The system triggers a delivery OTP to the customer's phone or email. 3. The customer shares the OTP with the agent. 4. The agent types this OTP into the portal. Once verified, the order status changes to 'Delivered' and a success event is saved in the security logs.",
        }
      ]
    }
  };

  const handleActionClick = (link: string) => {
    window.location.assign(link);
  };

  // Filter items based on search query
  const getFilteredSteps = (sectionKey: string) => {
    const steps = helpData[sectionKey].steps;
    if (!searchQuery) return steps;
    return steps.filter(
      (s) =>
        s.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="w-full min-h-full p-8 space-y-8 overflow-y-auto">
      {/* Title */}
      <div>
        <h1 className="font-display-lg text-2xl text-deep-navy uppercase tracking-widest">Help & Operational Guides</h1>
        <p className="text-slate-grey font-body-md text-sm mt-1">
          A non-technical handbook for managing your VRIX luxury storefront, pages, and integrations.
        </p>
      </div>

      {/* Search handbook */}
      <div className="bg-pure-white border border-slate-grey/20 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-headline-sm text-sm text-deep-navy font-bold uppercase tracking-wider">Search Help Handbook</h3>
          <p className="text-xs text-slate-grey">Type keywords like "hide product", "banner", or "razorpay" to find instant answers.</p>
        </div>
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-grey text-lg">search</span>
          <input
            type="text"
            placeholder="Search help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-grey/25 bg-soft-linen/20 font-body-md text-sm text-ink-black focus:outline-none focus:border-deep-navy transition-colors placeholder-slate-grey/50"
          />
        </div>
      </div>

      {/* Help Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar Tabs */}
        <div className="lg:col-span-1 flex flex-col gap-2">
          {Object.entries(helpData).map(([key, section]) => (
            <button
              key={key}
              onClick={() => {
                setActiveTab(key);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-all ${activeTab === key
                  ? "bg-deep-navy text-pure-white border-deep-navy shadow-sm"
                  : "bg-pure-white text-slate-grey border-slate-grey/20 hover:border-slate-grey/40 hover:text-deep-navy"
                }`}
            >
              <span className="material-symbols-outlined text-lg">{section.icon}</span>
              <div className="min-w-0">
                <p className="text-xs font-label-caps uppercase tracking-wider truncate font-semibold">
                  {section.title}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-pure-white border border-slate-grey/20 p-6 space-y-2">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-deep-navy">
                {helpData[activeTab].icon}
              </span>
              <h2 className="font-headline-md text-base text-deep-navy uppercase font-bold tracking-wider">
                {helpData[activeTab].title}
              </h2>
            </div>
            <p className="text-xs text-slate-grey">{helpData[activeTab].description}</p>
          </div>

          <div className="space-y-4">
            {getFilteredSteps(activeTab).length === 0 ? (
              <div className="bg-pure-white border border-slate-grey/20 p-12 text-center text-slate-grey space-y-2">
                <span className="material-symbols-outlined text-4xl text-slate-grey/60">help_center</span>
                <p className="text-xs font-semibold uppercase">No matching guides found</p>
                <p className="text-[11px] text-slate-grey/80 max-w-sm mx-auto">
                  Try typing a different keyword or choose another tab on the left to browse section topics.
                </p>
              </div>
            ) : (
              getFilteredSteps(activeTab).map((step, idx) => (
                <div
                  key={idx}
                  className="bg-pure-white border border-slate-grey/20 p-6 space-y-4 hover:border-slate-grey/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-soft-linen text-deep-navy text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      Q
                    </span>
                    <h4 className="font-headline-sm text-sm text-deep-navy font-bold leading-snug">
                      {step.question}
                    </h4>
                  </div>
                  <div className="flex items-start gap-3 pl-8 text-xs text-slate-grey font-body-md leading-relaxed">
                    <p className="flex-1">{step.answer}</p>
                  </div>
                  {step.actionLink && (
                    <div className="pl-8 pt-2">
                      <button
                        onClick={() => handleActionClick(step.actionLink!)}
                        className="text-[10px] font-label-caps uppercase tracking-widest text-pure-white bg-deep-navy px-4 py-2 hover:bg-ink-black transition-all inline-flex items-center gap-2"
                      >
                        {step.actionLabel || "Go to Page"}
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
