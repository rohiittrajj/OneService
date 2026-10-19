"use client";
import { Suspense, useState } from "react";
import { useQuery } from "react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search, ShieldCheck, Star, MapPin, CheckCircle,
  Clock, ArrowRight, Loader2, Sparkles, Phone
} from "lucide-react";
import api from "@/lib/api";

const CATEGORIES = [
  "All",
  "Plumbing",
  "Electrical",
  "AC Repair",
  "Carpentry",
  "Cleaning",
  "Painting",
  "Security",
  "Appliance Repair",
];

function VendorsContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery(
    ["vendors-list", selectedCategory],
    async () => {
      // Backend /api/vendors/nearby requires lat/lng, so we can fetch through admin or custom nearby
      // Or query vendors directly with category
      try {
        const res = await api.get("/vendors/nearby", {
          params: {
            lat: 28.6139,
            lng: 77.2090,
            radius: 50000,
            ...(selectedCategory !== "All" && { category: selectedCategory }),
          },
        });
        return res.data;
      } catch {
        // Fallback to services vendor aggregation if nearby fails
        const res = await api.get("/services", { params: { limit: 50 } });
        const map = new Map();
        res.data?.data?.forEach((s: any) => {
          if (s.vendor && !map.has(s.vendor._id)) {
            map.set(s.vendor._id, s.vendor);
          }
        });
        return { success: true, data: Array.from(map.values()) };
      }
    }
  );

  const vendors = (data?.data || []).filter((v: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.businessName?.toLowerCase().includes(q) ||
      v.city?.toLowerCase().includes(q) ||
      v.categories?.some((c: string) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Header */}
      <header className="glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-xs">OS</span>
          </div>
          <span className="font-bold text-slate-800">OneService</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/services" className="btn-ghost text-sm">Services</Link>
          <Link href="/auth/login" className="btn-ghost text-sm">Login</Link>
          <Link href="/auth/signup" className="btn-primary text-sm py-2">Get Started</Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="badge-blue mb-3 inline-flex">
            <ShieldCheck size={14} /> Verified Partner Network
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-3">
            Trusted Service Professionals
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Every vendor on OneService is background-checked, ID-verified, and customer-reviewed for guaranteed peace of mind.
          </p>
        </div>

        {/* Search & Categories */}
        <div className="glass-card p-4 mb-8 space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by vendor name, specialty, or city (e.g. Rohit, Delhi, Plumbing)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-primary-500 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Vendors Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-primary-500 mb-3" size={36} />
            <p className="text-slate-500 text-sm">Finding top verified professionals...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-md mx-auto">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="font-bold text-slate-800 mb-1">No vendors found</h3>
            <p className="text-slate-500 text-sm mb-4">Try clearing filters or searching for another category.</p>
            <button onClick={() => { setSearch(""); setSelectedCategory("All"); }} className="btn-secondary text-xs">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor: any) => (
              <motion.div
                key={vendor._id || vendor.vendorId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6 flex flex-col justify-between hover:shadow-card-hover transition-all"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {vendor.businessName?.charAt(0) || "V"}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base leading-snug">
                          {vendor.businessName}
                        </h3>
                        <p className="text-xs text-slate-400">ID: {vendor.vendorId || "VS-VERIFIED"}</p>
                      </div>
                    </div>
                    {vendor.isVerified && (
                      <span className="badge-blue flex items-center gap-1 text-[11px] font-semibold py-0.5 px-2">
                        <CheckCircle size={12} /> Verified
                      </span>
                    )}
                  </div>

                  {/* Rating & reviews */}
                  <div className="flex items-center gap-3 mb-3 text-xs">
                    <span className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                      <Star size={13} fill="currentColor" /> {vendor.rating ? Number(vendor.rating).toFixed(1) : "4.9"}
                    </span>
                    <span className="text-slate-400">
                      {vendor.totalReviews || 35} reviews
                    </span>
                    {vendor.location?.city && (
                      <span className="text-slate-500 flex items-center gap-1 ml-auto">
                        <MapPin size={12} /> {vendor.location.city}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {vendor.description && (
                    <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed mb-4">
                      {vendor.description}
                    </p>
                  )}

                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {vendor.categories?.map((c: string) => (
                      <span key={c} className="badge-gray text-[11px] py-0.5 px-2">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action button */}
                <Link
                  href={`/vendors/${vendor._id}`}
                  className="btn-primary w-full flex items-center justify-center gap-2 text-xs py-2.5"
                >
                  View Profile & Book <ArrowRight size={14} />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VendorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VendorsContent />
    </Suspense>
  );
}
