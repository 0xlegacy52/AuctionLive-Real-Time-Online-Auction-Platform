import { Router } from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";
import { calculateMinIncrement } from "../../shared/types.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const {
      category,
      condition,
      search,
      sort = "endTime",
      order = "asc",
      status = "active",
      page = "1",
      limit = "12",
    } = req.query;

    const allowedSorts = ["endTime", "createdAt", "currentPrice", "bidCount"];
    const sortField = allowedSorts.includes(sort as string) ? (sort as string) : "endTime";
    const sortOrder = order === "desc" ? "desc" : "asc";

    const where: any = { status: status as string };
    if (category && typeof category === "string") where.category = category;
    if (condition && typeof condition === "string") where.condition = condition;
    if (search && typeof search === "string") {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string) || 12));

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        include: {
          seller: {
            select: { id: true, username: true, displayName: true, rating: true },
          },
        },
        orderBy: { [sortField]: sortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.auction.count({ where }),
    ]);

    res.json({
      auctions,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error("List auctions error:", error);
    res.status(500).json({ error: "Failed to list auctions" });
  }
});

router.get("/ending-soon", async (req, res) => {
  try {
    const oneHourFromNow = new Date(Date.now() + 3600000);
    const auctions = await prisma.auction.findMany({
      where: {
        status: "active",
        endTime: { lte: oneHourFromNow, gt: new Date() },
      },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, rating: true },
        },
      },
      orderBy: { endTime: "asc" },
      take: 12,
    });
    res.json(auctions);
  } catch (error) {
    console.error("Ending soon error:", error);
    res.status(500).json({ error: "Failed to get ending soon auctions" });
  }
});

router.get("/user/my-auctions", requireAuth, async (req, res) => {
  try {
    const auctions = await prisma.auction.findMany({
      where: { sellerId: req.session.userId! },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, rating: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(auctions);
  } catch (error) {
    res.status(500).json({ error: "Failed to get your auctions" });
  }
});

router.get("/user/my-bids", requireAuth, async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      where: { bidderId: req.session.userId! },
      include: {
        auction: {
          include: {
            seller: {
              select: { id: true, username: true, displayName: true, rating: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const auctionMap = new Map<number, any>();
    for (const bid of bids) {
      if (!auctionMap.has(bid.auctionId)) {
        auctionMap.set(bid.auctionId, {
          ...bid.auction,
          myHighestBid: bid.amount,
          isWinning: bid.auction.currentWinnerId === req.session.userId,
        });
      }
    }

    res.json(Array.from(auctionMap.values()));
  } catch (error) {
    res.status(500).json({ error: "Failed to get your bids" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid auction ID" });

    const auction = await prisma.auction.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, rating: true, ratingCount: true },
        },
        bids: {
          include: {
            bidder: { select: { username: true, displayName: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        result: true,
      },
    });

    if (!auction) return res.status(404).json({ error: "Auction not found" });

    await prisma.auction.update({
      where: { id: auction.id },
      data: { viewCount: { increment: 1 } },
    });

    res.json(auction);
  } catch (error) {
    console.error("Get auction error:", error);
    res.status(500).json({ error: "Failed to get auction" });
  }
});

router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      condition,
      startingPrice,
      reservePrice,
      buyNowPrice,
      duration,
      shippingCost,
      shippingMethod,
      imageUrls,
    } = req.body;

    if (!title || !description || !category || !condition || startingPrice === undefined || !duration) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (typeof title !== "string" || title.length > 200) {
      return res.status(400).json({ error: "Title must be a string under 200 characters" });
    }
    if (typeof description !== "string" || description.length > 5000) {
      return res.status(400).json({ error: "Description must be under 5000 characters" });
    }

    const parsedStarting = parseFloat(startingPrice);
    if (isNaN(parsedStarting) || parsedStarting <= 0 || parsedStarting > 999999) {
      return res.status(400).json({ error: "Starting price must be between $0.01 and $999,999" });
    }

    const parsedReserve = reservePrice ? parseFloat(reservePrice) : null;
    if (parsedReserve !== null && (isNaN(parsedReserve) || parsedReserve <= 0)) {
      return res.status(400).json({ error: "Invalid reserve price" });
    }

    const parsedBuyNow = buyNowPrice ? parseFloat(buyNowPrice) : null;
    if (parsedBuyNow !== null && (isNaN(parsedBuyNow) || parsedBuyNow <= parsedStarting)) {
      return res.status(400).json({ error: "Buy now price must be greater than starting price" });
    }

    const durationMs: Record<string, number> = {
      "1h": 3600000,
      "3h": 10800000,
      "12h": 43200000,
      "24h": 86400000,
      "3d": 259200000,
      "7d": 604800000,
    };

    const ms = durationMs[duration];
    if (!ms) return res.status(400).json({ error: "Invalid duration" });

    const validImageUrls = Array.isArray(imageUrls)
      ? imageUrls.filter((u: any) => typeof u === "string" && u.startsWith("http")).slice(0, 8)
      : [];

    const now = new Date();
    const endTime = new Date(now.getTime() + ms);

    const auction = await prisma.auction.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category,
        condition,
        startingPrice: parsedStarting,
        reservePrice: parsedReserve,
        buyNowPrice: parsedBuyNow,
        currentPrice: parsedStarting,
        minIncrement: calculateMinIncrement(parsedStarting),
        shippingCost: shippingCost ? Math.max(0, parseFloat(shippingCost) || 0) : 0,
        shippingMethod: shippingMethod || null,
        imageUrls: validImageUrls,
        startTime: now,
        endTime,
        originalEndTime: endTime,
        sellerId: req.session.userId!,
      },
      include: {
        seller: {
          select: { id: true, username: true, displayName: true, rating: true },
        },
      },
    });

    const { scheduleAuctionEnd } = await import("../scheduler.js");
    scheduleAuctionEnd(auction.id, endTime);

    res.json(auction);
  } catch (error) {
    console.error("Create auction error:", error);
    res.status(500).json({ error: "Failed to create auction" });
  }
});

router.get("/:id/watchlist", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid auction ID" });

    const item = await prisma.watchlistItem.findUnique({
      where: {
        auctionId_userId: {
          auctionId: id,
          userId: req.session.userId!,
        },
      },
    });
    res.json({ watching: !!item });
  } catch (error) {
    res.status(500).json({ error: "Failed to check watchlist" });
  }
});

router.post("/:id/watchlist", requireAuth, async (req, res) => {
  try {
    const auctionId = parseInt(req.params.id);
    if (isNaN(auctionId)) return res.status(400).json({ error: "Invalid auction ID" });

    const userId = req.session.userId!;

    const existing = await prisma.watchlistItem.findUnique({
      where: { auctionId_userId: { auctionId, userId } },
    });

    if (existing) {
      await prisma.watchlistItem.delete({ where: { id: existing.id } });
      res.json({ watching: false });
    } else {
      await prisma.watchlistItem.create({ data: { auctionId, userId } });
      res.json({ watching: true });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update watchlist" });
  }
});

export default router;
