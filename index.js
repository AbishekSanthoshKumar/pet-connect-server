import express from "express";
import cors from "cors";
import pkg from "@prisma/client";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

/* ================= AUTH ================= */

app.post("/auth/register", async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  res.json(user);
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { email, password },
  });

  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  res.json(user);
});

/* ================= PETS ================= */

app.get("/pets/:userId", async (req, res) => {
  const pets = await prisma.pet.findMany({
    where: { ownerId: Number(req.params.userId) },
  });
  res.json(pets);
});

app.post("/pets", async (req, res) => {
  const pet = await prisma.pet.create({ data: req.body });
  res.json(pet);
});

app.delete("/pets/:id", async (req, res) => {
  try {
    const petId = Number(req.params.id);

    // Optional: delete related bookings first
    await prisma.booking.deleteMany({
      where: { petId },
    });

    await prisma.pet.delete({
      where: { id: petId },
    });

    res.json({ message: "Pet deleted successfully" });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      error: "Failed to delete pet",
    });
  }
});

/* ================= BOOKINGS ================= */

app.post("/bookings", async (req, res) => {
  const booking = await prisma.booking.create({ data: req.body });
  res.json(booking);
});

app.get("/bookings/:userId", async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: Number(req.params.userId) },
    include: {
      provider: true,
      pet: true,
    },
  });

  res.json(bookings);
});

app.put("/bookings/:id/status", async (req, res) => {
  const booking = await prisma.booking.update({
    where: { id: Number(req.params.id) },
    data: { status: req.body.status },
  });
  res.json(booking);
});

/* ================= EMERGENCY ================= */

app.post("/emergency", async (req, res) => {
  const emergency = await prisma.emergencyBooking.create({
    data: req.body,
  });
  res.json(emergency);
});

app.get("/emergency", async (req, res) => {
  const data = await prisma.emergencyBooking.findMany();
  res.json(data);
});

/* ================= PAYMENTS ================= */

app.post("/payments", async (req, res) => {
  const payment = await prisma.payment.create({ data: req.body });
  res.json(payment);
});

/* ================= DASHBOARD ================= */

app.get("/dashboard/admin", async (req, res) => {
  const totalBookings = await prisma.booking.count();

  const pending = await prisma.booking.count({
    where: { status: "pending" },
  });

  const revenue = await prisma.payment.aggregate({
    _sum: { amount: true },
  });

  const users = await prisma.user.count();

  res.json({
    totalBookings,
    pending,
    revenue: revenue._sum.amount || 0,
    users,
  });
});

/* ================= REPORT ================= */

app.post("/reports", async (req, res) => {
  const report = await prisma.report.create({ data: req.body });
  res.json(report);
});

/* ================= AVAILABILITY ================= */

app.post("/availability", async (req, res) => {
  const data = await prisma.availability.create({ data: req.body });
  res.json(data);
});

app.get("/availability/:providerId", async (req, res) => {
  const data = await prisma.availability.findMany({
    where: { providerId: Number(req.params.providerId) },
  });
  res.json(data);
});

app.get("/api/providers", async (req, res) => {
  const { type } = req.query;

  const providers = await prisma.provider.findMany({
    where: { type },
  });

  res.json(providers);
});

/* ================= SERVER ================= */

app.listen(3000, () => {
  console.log("🚀 Server running on http://localhost:3000");
});