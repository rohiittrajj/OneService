/**
 * OneService – Master Database Seeder
 * Populates realistic data for live college demonstrations, evaluation, and production readiness.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User.model");
const Vendor = require("./models/Vendor.model");
const Service = require("./models/Service.model");
const Booking = require("./models/Booking.model");
const Payment = require("./models/Payment.model");
const { Review, Notification } = require("./models/index");

async function seedDatabase() {
  try {
    console.log("🌱 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB.");

    console.log("🧹 Clearing old services, bookings, payments, and reviews...");
    await Promise.all([
      Service.deleteMany({}),
      Booking.deleteMany({}),
      Payment.deleteMany({}),
      Review.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // ── 1. Create or Update Core Demo Users ──────────────────────────────────
    console.log("👤 Creating / updating demo users...");
    // Plaintext passwords: User.model.js pre('save') hook handles hashing automatically
    const defaultPassword = "Password@123";
    const adminPassword = "Admin@123";

    const usersToUpsert = [
      {
        email: "admin@oneservice.com",
        name: "Admin OneService",
        phone: "+91 9999900001",
        password: adminPassword,
        role: "admin",
        isVerified: true,
        isActive: true,
        location: { type: "Point", coordinates: [77.209, 28.6139], address: "Headquarters, New Delhi" },
      },
      {
        email: "customer@oneservice.com",
        name: "Aman Sharma",
        phone: "+91 9876543210",
        password: defaultPassword,
        role: "user",
        isVerified: true,
        isActive: true,
        location: { type: "Point", coordinates: [77.391, 28.5355], address: "Sector 62, Noida, UP" },
      },
      {
        email: "vendor@oneservice.com",
        name: "Vikram Singh",
        phone: "+91 9876543211",
        password: defaultPassword,
        role: "vendor",
        isVerified: true,
        isActive: true,
        location: { type: "Point", coordinates: [77.503, 28.4744], address: "Knowledge Park III, Greater Noida" },
      },
    ];

    const seededUsers = {};

    for (const u of usersToUpsert) {
      let userDoc = await User.findOne({ email: u.email });
      if (!userDoc) {
        userDoc = await User.create(u);
      } else {
        userDoc.name = u.name;
        userDoc.role = u.role;
        userDoc.isVerified = true;
        userDoc.isActive = true;
        userDoc.password = u.password;
        await userDoc.save();
      }
      seededUsers[u.email] = userDoc;
    }

    // Ensure Rohit Raj's account is verified and ready
    let rohitUser = await User.findOne({ email: "rkroohiit@gmail.com" });
    if (rohitUser) {
      rohitUser.role = "vendor";
      rohitUser.isVerified = true;
      rohitUser.isActive = true;
      rohitUser.password = defaultPassword;
      await rohitUser.save();
      seededUsers["rkroohiit@gmail.com"] = rohitUser;
      console.log("✅ Verified Rohit Raj account (rkroohiit@gmail.com) as vendor.");
    } else {
      rohitUser = await User.create({
        email: "rkroohiit@gmail.com",
        name: "Rohit Raj",
        phone: "+91 8340399500",
        password: defaultPassword,
        role: "vendor",
        isVerified: true,
        isActive: true,
      });
      seededUsers["rkroohiit@gmail.com"] = rohitUser;
    }

    // Additional helper vendors
    const extraVendorUsers = [
      { name: "Pooja Verma", email: "pooja.clean@oneservice.com", phone: "+91 9811223344" },
      { name: "Ramesh Kumar", email: "ramesh.electric@oneservice.com", phone: "+91 9822334455" },
      { name: "Sunil Sharma", email: "sunil.ac@oneservice.com", phone: "+91 9833445566" },
    ];

    for (const ev of extraVendorUsers) {
      let doc = await User.findOne({ email: ev.email });
      if (!doc) {
        doc = await User.create({
          ...ev,
          password: defaultPassword,
          role: "vendor",
          isVerified: true,
          isActive: true,
        });
      } else {
        doc.password = defaultPassword;
        doc.isVerified = true;
        doc.isActive = true;
        await doc.save();
      }
      seededUsers[ev.email] = doc;
    }

    // ── 2. Populate Vendors ──────────────────────────────────────────────────
    console.log("🏢 Populating vendor profiles...");
    await Vendor.deleteMany({});

    const vendorDefs = [
      {
        user: seededUsers["rkroohiit@gmail.com"]._id,
        businessName: "Rohit Elite Home Services",
        description: "Certified master technician with 8+ years experience in plumbing, electrical diagnostics, and high-efficiency AC installations across Delhi NCR.",
        categories: ["Plumbing", "Electrical", "AC Repair"],
        govIdUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        status: "approved",
        isVerified: true,
        city: "Delhi NCR",
        location: { type: "Point", coordinates: [77.209, 28.6139], address: "Connaught Place, New Delhi", city: "New Delhi" },
        availability: { isOnline: true },
        rating: 4.9,
        totalReviews: 54,
        totalBookings: 72,
        completedBookings: 68,
        earnings: { total: 48500, pending: 3200, withdrawn: 45000 },
      },
      {
        user: seededUsers["vendor@oneservice.com"]._id,
        businessName: "Apex Woodcraft & Plumbing Solutions",
        description: "Specialized in customized furniture repair, bathroom plumbing overhauls, and drainage solutions. Quick 30-min response time.",
        categories: ["Plumbing", "Carpentry"],
        govIdUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        status: "approved",
        isVerified: true,
        city: "Greater Noida",
        location: { type: "Point", coordinates: [77.503, 28.4744], address: "Knowledge Park III, Greater Noida", city: "Greater Noida" },
        availability: { isOnline: true },
        rating: 4.8,
        totalReviews: 38,
        totalBookings: 49,
        completedBookings: 46,
        earnings: { total: 31200, pending: 1500, withdrawn: 29000 },
      },
      {
        user: seededUsers["ramesh.electric@oneservice.com"]._id,
        businessName: "Ramesh QuickPower Electricals",
        description: "Govt-licensed electrical contractor handling short circuits, switchboard installations, heavy appliances, and emergency power restoration.",
        categories: ["Electrical", "Security"],
        govIdUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        status: "approved",
        isVerified: true,
        city: "Noida",
        location: { type: "Point", coordinates: [77.391, 28.5355], address: "Sector 18, Noida", city: "Noida" },
        availability: { isOnline: true },
        rating: 4.9,
        totalReviews: 62,
        totalBookings: 84,
        completedBookings: 80,
        earnings: { total: 54000, pending: 4100, withdrawn: 49000 },
      },
      {
        user: seededUsers["sunil.ac@oneservice.com"]._id,
        businessName: "CoolTech Climate & Appliance Care",
        description: "Specialists in inverter AC power jet servicing, coil leak diagnostics, and refrigerator/washing machine repairs.",
        categories: ["AC Repair", "Appliance Repair"],
        govIdUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        status: "approved",
        isVerified: true,
        city: "Ghaziabad",
        location: { type: "Point", coordinates: [77.4538, 28.6692], address: "Indirapuram, Ghaziabad", city: "Ghaziabad" },
        availability: { isOnline: true },
        rating: 4.7,
        totalReviews: 29,
        totalBookings: 35,
        completedBookings: 33,
        earnings: { total: 28900, pending: 1200, withdrawn: 27000 },
      },
      {
        user: seededUsers["pooja.clean@oneservice.com"]._id,
        businessName: "SparkleClean Deep Hygiene Services",
        description: "Eco-friendly deep cleaning for kitchens, bathrooms, sofas, and full apartment sanitization with hospital-grade disinfectant.",
        categories: ["Cleaning", "Painting"],
        govIdUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400",
        status: "approved",
        isVerified: true,
        city: "Delhi NCR",
        location: { type: "Point", coordinates: [77.2167, 28.6667], address: "Karol Bagh, New Delhi", city: "New Delhi" },
        availability: { isOnline: true },
        rating: 4.9,
        totalReviews: 43,
        totalBookings: 56,
        completedBookings: 53,
        earnings: { total: 42000, pending: 2500, withdrawn: 39000 },
      },
    ];

    const createdVendors = await Vendor.insertMany(vendorDefs);
    console.log(`✅ Created ${createdVendors.length} verified vendors.`);

    const rohitVendor = createdVendors.find((v) => v.businessName.includes("Rohit"));
    const apexVendor = createdVendors.find((v) => v.businessName.includes("Apex"));
    const rameshVendor = createdVendors.find((v) => v.businessName.includes("Ramesh"));
    const coolVendor = createdVendors.find((v) => v.businessName.includes("CoolTech"));
    const cleanVendor = createdVendors.find((v) => v.businessName.includes("SparkleClean"));

    // ── 3. Populate Services ─────────────────────────────────────────────────
    console.log("🛠️ Populating service catalog...");
    const serviceDefs = [
      // Plumbing (Rohit & Apex)
      {
        vendor: rohitVendor._id,
        title: "Emergency Pipe Leakage & Joint Repair",
        description: "Instant diagnosis and repair of ruptured water pipes, dripping PVC/metal joints, and moisture sealing.",
        category: "Plumbing",
        images: ["https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=600"],
        price: { base: 499, unit: "fixed", currency: "INR" },
        duration: 45,
        rating: 4.9,
        totalReviews: 24,
        totalBookings: 31,
        tags: ["Leakage", "Pipes", "Plumbing", "Emergency"],
      },
      {
        vendor: rohitVendor._id,
        title: "Modern Bathroom Tap & Sanitary Fitting",
        description: "Installation or repair of designer basin mixers, shower heads, angle valves, and flush cisterns.",
        category: "Plumbing",
        images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600"],
        price: { base: 349, unit: "fixed", currency: "INR" },
        duration: 30,
        rating: 4.8,
        totalReviews: 18,
        totalBookings: 22,
        tags: ["Taps", "Fittings", "Sanitary", "Bathroom"],
      },
      {
        vendor: apexVendor._id,
        title: "Kitchen Sink Clog Clearing & Odor Jet Cleaning",
        description: "High-pressure chemical-safe drain cleanout removes grease and blockages with 30-day anti-clog warranty.",
        category: "Plumbing",
        images: ["https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600"],
        price: { base: 449, unit: "fixed", currency: "INR" },
        duration: 40,
        rating: 4.7,
        totalReviews: 14,
        totalBookings: 19,
        tags: ["Kitchen", "Drain", "Unclog", "Cleaning"],
      },

      // Electrical (Rohit & Ramesh)
      {
        vendor: rohitVendor._id,
        title: "Ceiling Fan Installation & Regulator Repair",
        description: "Complete mounting, noise-elimination, capacitor upgrade, and high-speed balancing for all fan brands.",
        category: "Electrical",
        images: ["https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600"],
        price: { base: 299, unit: "fixed", currency: "INR" },
        duration: 30,
        rating: 4.9,
        totalReviews: 28,
        totalBookings: 35,
        tags: ["Fan", "Electrical", "Capacitor", "Fix"],
      },
      {
        vendor: rameshVendor._id,
        title: "Whole Home Electrical Safety & MCB Audit",
        description: "Comprehensive inspection of earthing, circuit breakers, heavy load wiring, and shock prevention.",
        category: "Electrical",
        images: ["https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600"],
        price: { base: 799, unit: "fixed", currency: "INR" },
        duration: 60,
        rating: 4.9,
        totalReviews: 32,
        totalBookings: 41,
        tags: ["MCB", "Safety", "Wiring", "Inspection"],
      },
      {
        vendor: rameshVendor._id,
        title: "Inverter & Battery Wiring Setup",
        description: "Safe inverter setup, terminal greasing, water top-up check, and seamless backup phase integration.",
        category: "Electrical",
        images: ["https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600"],
        price: { base: 599, unit: "fixed", currency: "INR" },
        duration: 45,
        rating: 4.8,
        totalReviews: 19,
        totalBookings: 24,
        tags: ["Inverter", "Battery", "Backup", "Power"],
      },

      // AC Repair (Rohit & CoolTech)
      {
        vendor: coolVendor._id,
        title: "Deep Jet-Pump AC Foam Servicing",
        description: "Full indoor & outdoor unit foam wash, blower degreasing, filter sanitization, and cooling pressure check.",
        category: "AC Repair",
        images: ["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=600"],
        price: { base: 599, unit: "fixed", currency: "INR" },
        duration: 60,
        rating: 4.9,
        totalReviews: 35,
        totalBookings: 44,
        tags: ["AC", "Jet Clean", "Foam", "Cooling"],
      },
      {
        vendor: coolVendor._id,
        title: "AC Gas Leak Detection & Full Gas Top-up",
        description: "Nitrogen pressure leak test, brazing fix, vacuuming, and genuine R32/R410A refrigerant recharge.",
        category: "AC Repair",
        images: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600"],
        price: { base: 1899, unit: "fixed", currency: "INR" },
        duration: 90,
        rating: 4.7,
        totalReviews: 16,
        totalBookings: 21,
        tags: ["AC Gas", "Refrigerant", "Cooling", "Leak Fix"],
      },

      // Carpentry (Apex)
      {
        vendor: apexVendor._id,
        title: "Door Lock & Hydraulic Closer Installation",
        description: "Installation and precision mortise alignment for main door locks, latches, deadbolts, and door closers.",
        category: "Carpentry",
        images: ["https://images.unsplash.com/photo-1534349762230-e0cadf78f5da?w=600"],
        price: { base: 399, unit: "fixed", currency: "INR" },
        duration: 45,
        rating: 4.8,
        totalReviews: 15,
        totalBookings: 20,
        tags: ["Locks", "Doors", "Carpentry", "Fitting"],
      },
      {
        vendor: apexVendor._id,
        title: "Modular Furniture & Bed Frame Assembly",
        description: "Professional assembly for IKEA, Urban Ladder, and Pepperfry beds, wardrobes, study desks, and TV units.",
        category: "Carpentry",
        images: ["https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=600"],
        price: { base: 799, unit: "fixed", currency: "INR" },
        duration: 75,
        rating: 4.9,
        totalReviews: 22,
        totalBookings: 29,
        tags: ["Furniture", "Assembly", "Woodwork", "IKEA"],
      },

      // Cleaning (SparkleClean)
      {
        vendor: cleanVendor._id,
        title: "Complete 2BHK/3BHK Deep Home Sanitization",
        description: "Deep vacuuming, floor scrubbing with single-disc machine, bathroom descaling, and balcony wash.",
        category: "Cleaning",
        images: ["https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=600"],
        price: { base: 1999, unit: "fixed", currency: "INR" },
        duration: 180,
        rating: 4.9,
        totalReviews: 27,
        totalBookings: 33,
        tags: ["Deep Clean", "Full House", "Sanitization", "Hygiene"],
      },
      {
        vendor: cleanVendor._id,
        title: "Sofa & Mattress Deep Shampoo Cleaning",
        description: "Steam extraction extraction removes stains, dust mites, and odors from fabric and leather couches.",
        category: "Cleaning",
        images: ["https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=600"],
        price: { base: 899, unit: "fixed", currency: "INR" },
        duration: 60,
        rating: 4.8,
        totalReviews: 19,
        totalBookings: 25,
        tags: ["Sofa", "Shampoo", "Upholstery", "Vacuum"],
      },

      // Painting (SparkleClean)
      {
        vendor: cleanVendor._id,
        title: "Waterproofing & Wall Dampness Treatment",
        description: "Anti-efflorescence sealing, damp proof primer, and 3-coat elastomeric waterproofing with warranty.",
        category: "Painting",
        images: ["https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=600"],
        price: { base: 1499, unit: "fixed", currency: "INR" },
        duration: 120,
        rating: 4.9,
        totalReviews: 16,
        totalBookings: 20,
        tags: ["Waterproofing", "Painting", "Wall Dampness", "Primer"],
      },

      // Security (Ramesh)
      {
        vendor: rameshVendor._id,
        title: "Smart CCTV Camera & Mobile App Setup",
        description: "Wiring, high-definition camera mounting, DVR configuration, night vision check, and remote phone view.",
        category: "Security",
        images: ["https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600"],
        price: { base: 1299, unit: "fixed", currency: "INR" },
        duration: 90,
        rating: 4.8,
        totalReviews: 14,
        totalBookings: 18,
        tags: ["CCTV", "Security", "Smart Home", "Camera"],
      },
    ];

    const createdServices = await Service.insertMany(serviceDefs);
    console.log(`✅ Created ${createdServices.length} rich services across all categories.`);

    // ── 4. Create Sample Bookings for Showcase ────────────────────────────────
    console.log("📅 Generating demo bookings for college presentation...");
    const customerUser = seededUsers["customer@oneservice.com"];
    const pipeService = createdServices[0];
    const fanService = createdServices[3];
    const acService = createdServices[6];

    // Booking 1: Completed Booking with Payment & Review
    const bookingCompleted = await Booking.create({
      bookingId: "BK-" + Math.floor(100000 + Math.random() * 900000),
      user: customerUser._id,
      vendor: rohitVendor._id,
      service: pipeService._id,
      scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isUrgent: false,
      address: { full: "Flat 402, Lotus Boulevard, Sector 100, Noida" },
      notes: "Kitchen under-sink pipe was dripping continuously.",
      amount: { base: 499, urgentFee: 0, platformFee: 50, total: 549 },
      status: "completed",
      timeline: [
        { status: "pending", note: "Booking placed by customer." },
        { status: "accepted", note: "Accepted by Rohit Elite Home Services." },
        { status: "in_progress", note: "Technician arrived on site." },
        { status: "completed", note: "Pipe repaired and verified leak-free." },
      ],
    });

    await Payment.create({
      booking: bookingCompleted._id,
      user: customerUser._id,
      vendor: rohitVendor._id,
      stripePaymentIntentId: "demo_pi_completed_101",
      stripeChargeId: "demo_ch_completed_101",
      amount: 549,
      currency: "inr",
      platformFee: 50,
      vendorAmount: 499,
      status: "succeeded",
    });

    await Review.create({
      booking: bookingCompleted._id,
      user: customerUser._id,
      vendor: rohitVendor._id,
      service: pipeService._id,
      rating: 5,
      comment: "Outstanding work by Rohit! Arrived right on time, had all necessary replacement gaskets, and finished the fix cleanly in 30 minutes. Highly recommended!",
      sentiment: {
        score: 0.95,
        label: "positive",
        isFake: false,
        flagReason: "",
      },
    });

    // Booking 2: Accepted Booking (Ready to demonstrate live payment!)
    await Booking.create({
      bookingId: "BK-" + Math.floor(100000 + Math.random() * 900000),
      user: customerUser._id,
      vendor: rohitVendor._id,
      service: fanService._id,
      scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      isUrgent: true,
      address: { full: "Villa 12, Jaypee Greens, Greater Noida" },
      notes: "Living room fan stopped rotating suddenly. Suspected capacitor failure.",
      amount: { base: 299, urgentFee: 60, platformFee: 36, total: 395 },
      status: "accepted",
      timeline: [
        { status: "pending", note: "Urgent booking requested." },
        { status: "accepted", note: "Accepted by vendor. Awaiting payment." },
      ],
    });

    // Booking 3: Pending Booking (Ready to demonstrate vendor accept/reject!)
    await Booking.create({
      bookingId: "BK-" + Math.floor(100000 + Math.random() * 900000),
      user: customerUser._id,
      vendor: rohitVendor._id,
      service: acService._id,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isUrgent: false,
      address: { full: "C-24, Sector 15, Noida" },
      notes: "Annual AC foam wash before summer starts.",
      amount: { base: 599, urgentFee: 0, platformFee: 60, total: 659 },
      status: "pending",
      timeline: [
        { status: "pending", note: "Booking placed by customer." },
      ],
    });

    console.log("✅ Seed completed successfully! 🎉");
    console.log("\n=======================================================");
    console.log("⭐ DEMO ACCOUNTS READY FOR COLLEGE SHOWCASE:");
    console.log("-------------------------------------------------------");
    console.log("👤 Admin:    admin@oneservice.com    | Password: Admin@123");
    console.log("🔧 Vendor:   vendor@oneservice.com   | Password: Password@123");
    console.log("🔧 Rohit:    rkroohiit@gmail.com     | Password: Password@123");
    console.log("🛒 Customer: customer@oneservice.com | Password: Password@123");
    console.log("=======================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  }
}

seedDatabase();
