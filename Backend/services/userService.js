import { prisma, isDbConnected } from "../config/prismaClient.js";
import { supabase } from "../config/supabaseClient.js";

const userMemoryMap = new Map();

const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`User Microservice query timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export const userService = {
  findMany: async () => {
    if (isDbConnected && prisma) {
      try {
        const users = await withTimeout(prisma.user.findMany({ orderBy: { createdAt: "desc" } }), 800);
        if (Array.isArray(users) && users.length > 0) return users;
      } catch (err) {}
    }
    if (supabase) {
      try {
        const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false });
        if (!error && Array.isArray(data)) return data;
      } catch (e) {}
    }
    return Array.from(userMemoryMap.values());
  },

  findByEmail: async (email) => {
    if (!email) return null;
    const targetEmail = String(email).trim().toLowerCase();

    if (isDbConnected && prisma) {
      try {
        const u = await withTimeout(prisma.user.findFirst({ where: { email: { equals: targetEmail, mode: "insensitive" } } }), 600);
        if (u) return u;
      } catch (err) {}
    }

    if (supabase) {
      try {
        const { data, error } = await supabase.from("users").select("*").ilike("email", targetEmail).maybeSingle();
        if (!error && data) return data;
      } catch (e) {}
    }

    for (const u of userMemoryMap.values()) {
      if (u.email && String(u.email).toLowerCase() === targetEmail) return u;
    }
    return null;
  },

  upsert: async (userData) => {
    if (!userData || !userData.email) throw new Error("Email required for user record.");
    const email = String(userData.email).trim().toLowerCase();
    const nowIso = new Date().toISOString();

    const record = {
      id: userData.id || `usr_${Date.now()}`,
      email,
      name: userData.name || "",
      role: userData.role || "customer",
      phone: userData.phone || null,
      avatar: userData.avatar || null,
      addresses: userData.addresses || [],
      orders: userData.orders || [],
      wishlist: userData.wishlist || [],
      isVrixPlusMember: !!userData.isVrixPlusMember,
      vrixPlusJoinedDate: userData.vrixPlusJoinedDate || null,
      dateOfBirth: userData.dateOfBirth || null,
      createdAt: userData.createdAt || nowIso,
      updatedAt: nowIso,
    };

    userMemoryMap.set(email, record);

    if (isDbConnected && prisma) {
      try {
        const dbRes = await prisma.user.upsert({
          where: { email },
          update: {
            name: record.name,
            role: record.role,
            phone: record.phone,
            avatar: record.avatar,
            addresses: record.addresses,
            orders: record.orders,
            wishlist: record.wishlist,
            isVrixPlusMember: record.isVrixPlusMember,
            vrixPlusJoinedDate: record.vrixPlusJoinedDate,
            dateOfBirth: record.dateOfBirth,
          },
          create: {
            id: record.id,
            email: record.email,
            name: record.name,
            role: record.role,
            phone: record.phone,
            avatar: record.avatar,
            addresses: record.addresses,
            orders: record.orders,
            wishlist: record.wishlist,
            isVrixPlusMember: record.isVrixPlusMember,
            vrixPlusJoinedDate: record.vrixPlusJoinedDate,
            dateOfBirth: record.dateOfBirth,
          },
        });

        if (supabase) {
          try {
            await supabase.from("users").upsert({
              id: dbRes.id,
              email: dbRes.email,
              name: dbRes.name,
              role: dbRes.role,
              phone: dbRes.phone,
              avatar: dbRes.avatar,
              addresses: dbRes.addresses,
              orders: dbRes.orders,
              wishlist: dbRes.wishlist,
              is_vrix_plus_member: dbRes.isVrixPlusMember,
              vrix_plus_joined_date: dbRes.vrixPlusJoinedDate,
              date_of_birth: dbRes.dateOfBirth,
            });
          } catch (e) {}
        }
        return dbRes;
      } catch (err) {}
    }

    if (supabase) {
      try {
        const { data: sRes, error } = await supabase.from("users").upsert({
          id: record.id,
          email: record.email,
          name: record.name,
          role: record.role,
          phone: record.phone,
          avatar: record.avatar,
          addresses: record.addresses,
          orders: record.orders,
          wishlist: record.wishlist,
          is_vrix_plus_member: record.isVrixPlusMember,
          vrix_plus_joined_date: record.vrixPlusJoinedDate,
          date_of_birth: record.dateOfBirth,
        }).select().single();

        if (!error && sRes) return sRes;
      } catch (e) {}
    }

    return record;
  }
};
