"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Wrench, Zap, Droplets, Wind, Shield, Star,
  MapPin, Clock, ChevronRight, Search, Sparkles,
  CheckCircle, ArrowRight, Menu, X, ShieldCheck, Award
} from "lucide-react";
import api from "@/lib/api";

const CATEGORIES = [
  { icon: Droplets,  label: "Plumbing",    color: "bg-blue-100 text-blue-600",   emoji: "🔧" },
  { icon: Zap,       label: "Electrical",  color: "bg-yellow-100 text-yellow-600", emoji: "⚡" },
  { icon: Wrench,    label: "Carpentry",   color: "bg-amber-100 text-amber-600",  emoji: "🪚" },
  { icon: Wind,      label: "AC Repair",   color: "bg-cyan-100 text-cyan-600",    emoji: "❄️" },
  { icon: Shield,    label: "Security",    color: "bg-purple-100 text-purple-600",emoji: "🔒" },
  { icon: Sparkles,  label: "Cleaning",    color: "bg-green-100 text-green-600",  emoji: "✨" },
];

const FEATURES = [
  { icon: Shield,    title: "Verified Professionals",  desc: "Every vendor is ID-verified and background-checked before activation." },
  { icon: MapPin,    title: "Live Vendor Tracking",    desc: "Track your service professional in real-time on the map." },
  { icon: Sparkles,  title: "AI-Powered Matching",     desc: "Upload a photo of your problem and our AI finds the right expert instantly." },
  { icon: Clock,     title: "Urgent Booking",          desc: "Need help right now? Urgent-mode gets you a professional within the hour." },
];

const STATS = [
  { value: "50,000+", label: "Happy Customers" },
  { value: "8,000+",  label: "Verified Vendors" },
  { value: "4.9★",    label: "Average Rating" },
  { value: "98%",     label: "On-time Arrival" },
];

interface FeaturedVendor {
  id: string;
  businessName: string;
  ownerName: string;
  rating: number;
  totalReviews: number;
  categories: string[];
  location: string;
  badges: string[];
  isVerified: boolean;
  avatarBg: string;
  avatarText: string;
  tagline: string;
}

const FALLBACK_VENDORS: FeaturedVendor[] = [
  {
    id: "6ada64cb3125c3ee112989bc",
    businessName: "Rohit Elite Home Services",
    ownerName: "Rohit Raj",
    rating: 4.9,
    totalReviews: 54,
    categories: ["Plumbing", "Electrical", "AC Repair"],
    location: "Connaught Place, New Delhi",
    badges: ["Top Rated", "Verified Pro"],
    isVerified: true,
    avatarBg: "from-blue-600 to-indigo-700",
    avatarText: "RR",
    tagline: "Certified master technician for smart home, electrical & plumbing installations.",
  },
  {
    id: "6ada64cb3125c3ee112989bd",
    businessName: "Apex Woodcraft & Plumbing",
    ownerName: "Vikram Singh",
    rating: 4.8,
    totalReviews: 38,
    categories: ["Plumbing", "Carpentry"],
    location: "Indirapuram, Ghaziabad",
    badges: ["Verified Pro"],
    isVerified: true,
    avatarBg: "from-amber-500 to-orange-600",
    avatarText: "VS",
    tagline: "Specialized in custom woodwork, furniture assembly and rapid leak fixes.",
  },
  {
    id: "6ada64cb3125c3ee112989be",
    businessName: "Ramesh QuickPower Electricals",
    ownerName: "Ramesh Kumar",
    rating: 4.9,
    totalReviews: 62,
    categories: ["Electrical", "Security"],
    location: "Sector 62, Noida",
    badges: ["Fast Responder", "Verified Pro"],
    isVerified: true,
    avatarBg: "from-yellow-500 to-amber-600",
    avatarText: "RK",
    tagline: "15+ years experience in domestic wiring, surge defense & smart CCTV setup.",
  },
  {
    id: "6ada64cb3125c3ee112989c0",
    businessName: "SparkleClean Deep Hygiene",
    ownerName: "Pooja Verma",
    rating: 4.9,
    totalReviews: 43,
    categories: ["Cleaning", "Painting"],
    location: "Cyber City, Gurugram",
    badges: ["Eco-Friendly", "Verified Pro"],
    isVerified: true,
    avatarBg: "from-emerald-500 to-teal-600",
    avatarText: "PV",
    tagline: "Hospital-grade deep cleaning, sanitization & premium wall painting.",
  },
];

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [vendors, setVendors] = useState<FeaturedVendor[]>(FALLBACK_VENDORS);

  useEffect(() => {
    let isMounted = true;
    api
      .get("/vendors/nearby?limit=4")
      .then((res) => {
        if (!isMounted) return;
        const fetched = res.data?.data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const mapped = fetched.map((v: any, index: number) => {
            const fallback = FALLBACK_VENDORS[index % FALLBACK_VENDORS.length];
            return {
              id: v._id || v.id || fallback.id,
              businessName: v.businessName || fallback.businessName,
              ownerName: v.user?.name || fallback.ownerName,
              rating: v.rating || fallback.rating,
              totalReviews: v.totalReviews || fallback.totalReviews,
              categories: (v.categories && v.categories.length > 0) ? v.categories : fallback.categories,
              location: v.location?.address || v.location?.city || fallback.location,
              badges: fallback.badges,
              isVerified: v.isVerified !== undefined ? v.isVerified : true,
              avatarBg: fallback.avatarBg,
              avatarText: (v.user?.name || v.businessName || "OS")
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase(),
              tagline: v.description || fallback.tagline,
            };
          });
          setVendors(mapped);
        }
      })
      .catch(() => {
        // Keeps FALLBACK_VENDORS if backend API is cold-starting
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen font-sans">
      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-x-0 border-t-0 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm tracking-tight">OS</span>
            </div>
            <span className="text-xl font-bold text-slate-800">OneService</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/services" className="btn-ghost text-sm">Services</Link>
            <Link href="/vendors" className="btn-ghost text-sm">Vendors</Link>
            <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
            <Link href="/auth/signup" className="btn-primary text-sm py-2.5">Get Started</Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden btn-ghost p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden mt-4 pb-4 flex flex-col gap-2 border-t border-slate-100 pt-4"
          >
            <Link href="/services" className="btn-ghost w-full text-left">Services</Link>
            <Link href="/vendors" className="btn-ghost w-full text-left">Vendors</Link>
            <Link href="/auth/login" className="btn-ghost w-full text-left">Login</Link>
            <Link href="/auth/signup" className="btn-primary w-full text-center mt-2">Get Started</Link>
          </motion.div>
        )}
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 bg-hero-gradient">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge-blue mb-4 inline-flex">
              <Sparkles size={13} /> AI-Powered Service Marketplace
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-800 leading-tight mt-3 mb-5">
              Trusted Professionals,{" "}
              <span className="text-gradient">One Platform</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Book verified home service experts in minutes. AI-matched, live-tracked, and securely paid — all in one place.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 max-w-2xl mx-auto"
          >
            <div className="glass-card p-2 flex items-center gap-3">
              <div className="flex-1 flex items-center gap-3 px-3">
                <Search size={20} className="text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder='Try "plumber near me" or describe your problem...'
                  className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm py-2"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Link
                href={`/services${searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : ""}`}
                className="btn-primary py-2.5 px-5 text-sm flex-shrink-0"
              >
                Search
              </Link>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              📍 Auto-detects your location · 🤖 AI suggests best vendors
            </p>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {STATS.map((s) => (
              <div key={s.label} className="glass-card p-5 text-center">
                <p className="text-2xl font-bold text-primary-600">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Service Categories ───────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Popular Services</h2>
            <p className="section-subtitle">Find the right expert for any home need</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={`/services?category=${cat.label}`}
                className="service-card p-6 text-center group"
              >
                <div className={`w-12 h-12 rounded-2xl ${cat.color} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <span className="text-2xl">{cat.emoji}</span>
                </div>
                <p className="font-semibold text-slate-700 text-sm">{cat.label}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/services" className="btn-secondary inline-flex items-center gap-2">
              View All Services <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Top-Rated Vendors ─────────────────────── */}
      <section className="py-20 px-6 bg-slate-50/70 border-y border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="badge-blue mb-2.5 inline-flex items-center gap-1.5">
                <Award size={13} /> Verified Professionals
              </span>
              <h2 className="section-title text-left">Top Rated Vendors</h2>
              <p className="section-subtitle text-left mt-1">
                Handpicked, background-verified experts ready to assist you with 5-star service.
              </p>
            </div>
            <Link
              href="/vendors"
              className="mt-4 md:mt-0 text-sm font-semibold text-primary-600 hover:text-primary-700 inline-flex items-center gap-1.5 transition-colors"
            >
              Explore All Vendors <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vendors.map((vendor) => (
              <motion.div
                key={vendor.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="glass-card p-5 flex flex-col justify-between hover:shadow-card-hover transition-all border border-slate-200/80 rounded-2xl bg-white"
              >
                <div>
                  {/* Top: Avatar & Badges */}
                  <div className="flex items-start justify-between mb-3.5">
                    <div className="relative">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${vendor.avatarBg} text-white font-bold text-lg flex items-center justify-center shadow-md`}>
                        {vendor.avatarText}
                      </div>
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" title="Active & Available" />
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold text-amber-800">
                      <Star size={13} className="text-amber-500 fill-amber-500" />
                      <span>{vendor.rating.toFixed(1)}</span>
                      <span className="text-[10px] text-amber-600 font-normal">({vendor.totalReviews})</span>
                    </div>
                  </div>

                  {/* Business Name & Owner */}
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-1">
                        {vendor.businessName}
                      </h3>
                      {vendor.isVerified && (
                        <span title="Verified by OneService">
                          <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium">By {vendor.ownerName}</p>
                  </div>

                  {/* Tagline */}
                  <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                    {vendor.tagline}
                  </p>

                  {/* Categories Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {vendor.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-medium"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  {/* Location Info */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4 pt-3 border-t border-slate-100">
                    <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                    <span className="truncate">{vendor.location}</span>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 rounded-xl shadow-xs"
                  >
                    View Profile & Book <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/vendors"
              className="btn-secondary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold shadow-xs"
            >
              Browse All Verified Service Professionals <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── AI Feature Highlight ─────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-br from-primary-100 to-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="glass-card p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <span className="badge-blue mb-4">🤖 AI Feature</span>
              <h2 className="text-3xl font-bold text-slate-800 mt-2 mb-4">
                Snap a photo,<br />we'll find the fix
              </h2>
              <p className="text-slate-500 leading-relaxed mb-6">
                Not sure what service you need? Upload a photo of your problem — our AI instantly identifies the issue, estimates the cost, and recommends the best nearby vendors.
              </p>
              <ul className="space-y-3 mb-8">
                {["Instant problem identification", "Cost range estimation", "Best vendor suggestions"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-slate-700">
                    <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/auth/signup" className="btn-primary inline-flex items-center gap-2">
                Try AI Analysis Free <ChevronRight size={16} />
              </Link>
            </div>
            <div className="flex-shrink-0 w-64 h-64 rounded-3xl bg-gradient-to-br from-primary-200 to-blue-300 flex items-center justify-center shadow-glass">
              <div className="text-center">
                <span className="text-7xl">📸</span>
                <p className="text-primary-700 font-semibold mt-3 text-sm">Upload Problem Photo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Why Choose OneService?</h2>
            <p className="section-subtitle">Everything you need, built in from the start</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="glass-card p-6 hover:shadow-card-hover transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                  <f.icon size={22} className="text-primary-600" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary-500 to-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-extrabold text-white mb-4">Ready to get started?</h2>
          <p className="text-primary-100 text-lg mb-8">
            Join 50,000+ customers who trust OneService for their home needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="bg-white text-primary-600 font-semibold px-8 py-3 rounded-xl hover:bg-primary-50 transition-colors shadow-md">
              Book a Service
            </Link>
            <Link href="/auth/signup?role=vendor" className="border-2 border-white text-white font-semibold px-8 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Become a Vendor
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">OS</span>
              </div>
              <span className="text-white font-bold">OneService</span>
            </div>
            <p className="text-sm leading-relaxed">India's trusted AI-powered home services marketplace.</p>
          </div>
          {[
            { title: "Services", links: ["Plumbing", "Electrical", "Cleaning", "AC Repair"] },
            { title: "Company",  links: ["About Us", "Careers", "Blog", "Press"] },
            { title: "Support",  links: ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-white font-semibold mb-3 text-sm">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm hover:text-white transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-slate-800 text-center text-xs">
          © {new Date().getFullYear()} OneService. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
