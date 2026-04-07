import { Router } from "express";
import prisma from "../db.js";
import { requireAuth } from "../auth.js";
import { calculateMinIncrement, maskUsername } from "../../shared/types.js";
import { getIO } from "../socket.js";

const router = Router();

const ANTI_SNIPE_THRESHOLD = 2 * 60 * 1000;
const ANTI_SNIPE_EXTENSION = 2 * 60 * 1000;

router.post("/:auctionId", requireAuth, async (req, res) => {
  try {
    const auctionId = parseInt(req.params.auctionId);
    if (isNaN(auctionId)) return res.status(400).json({ error: "Invalid auction ID" });

    const { amount } = req.body;
    const userId = req.session.userId!;

    if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: "Invalid bid amount" });
    }

    const bidAmount = parseFloat(amount);
    if (bidAmount <= 0 || bidAmount > 999999999) {
      return res.status(400).json({ error: "Bid amount out of range" });
    }

    const result = await prisma.$transaction(async (tx) => {
      const auction = await tx.auction.findUnique({
        where: { id: auctionId },
      });

      if (!auction) throw new Error("Auction not found");
      if (auction.status !== "active") throw new Error("Auction is not active");
      if (new Date() >= auction.endTime) throw new Error("Auction has ended");
      if (auction.sellerId === userId) throw new Error("Cannot bid on your own auction");

      const minBid = auction.bidCount === 0
        ? auction.startingPrice
        : auction.currentPrice + calculateMinIncrement(auction.currentPrice);

      if (bidAmount < minBid) {
        throw new Error(`Minimum bid is $${minBid.toFixed(2)}`);
      }

      const bid = await tx.bid.create({
        data: {
          amount: bidAmount,
          auctionId,
          bidderId: userId,
        },
        include: {
          bidder: { select: { username: true, displayName: true } },
        },
      });

      let newEndTime = auction.endTime;
      const timeLeft = auction.endTime.getTime() - Date.now();

      if (timeLeft < ANTI_SNIPE_THRESHOLD) {
        newEndTime = new Date(auction.endTime.getTime() + ANTI_SNIPE_EXTENSION);
      }

      const updatedAuction = await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentPrice: bidAmount,
          currentWinnerId: userId,
          bidCount: { increment: 1 },
          minIncrement: calculateMinIncrement(bidAmount),
          endTime: newEndTime,
        },
      });

      return { bid, updatedAuction, newEndTime, antiSnipeTriggered: timeLeft < ANTI_SNIPE_THRESHOLD };
    });

    if (result.antiSnipeTriggered) {
      const { rescheduleAuctionEnd } = await import("../scheduler.js");
      rescheduleAuctionEnd(auctionId, result.newEndTime);
    }

    if (result.updatedAuction.buyNowPrice && bidAmount >= result.updatedAuction.buyNowPrice) {
      const { endAuction } = await import("../scheduler.js");
      await endAuction(auctionId);
    }

    const io = getIO();
    io.to(`auction:${auctionId}`).emit("new_bid", {
      bid: {
        id: result.bid.id,
        amount: result.bid.amount,
        bidder: maskUsername(result.bid.bidder.username),
        createdAt: result.bid.createdAt,
        isAutoBid: false,
      },
      currentPrice: bidAmount,
      bidCount: result.updatedAuction.bidCount,
      endTime: result.newEndTime.toISOString(),
      currentWinnerId: userId,
    });

    processAutoBids(auctionId, bidAmount, userId);

    res.json({ bid: result.bid, currentPrice: bidAmount });
  } catch (error: any) {
    console.error("Place bid error:", error);
    const msg = error.message || "Failed to place bid";
    const status = msg.includes("not found") ? 404 : msg.includes("Minimum bid") || msg.includes("not active") || msg.includes("ended") || msg.includes("own auction") || msg.includes("out of range") ? 400 : 500;
    res.status(status).json({ error: msg });
  }
});

router.post("/:auctionId/auto-bid", requireAuth, async (req, res) => {
  try {
    const auctionId = parseInt(req.params.auctionId);
    if (isNaN(auctionId)) return res.status(400).json({ error: "Invalid auction ID" });

    const { maxBid } = req.body;
    const userId = req.session.userId!;

    if (maxBid === undefined || maxBid === null || isNaN(parseFloat(maxBid))) {
      return res.status(400).json({ error: "Invalid max bid amount" });
    }

    const maxBidAmount = parseFloat(maxBid);
    if (maxBidAmount <= 0 || maxBidAmount > 999999999) {
      return res.status(400).json({ error: "Max bid amount out of range" });
    }

    const auction = await prisma.auction.findUnique({ where: { id: auctionId } });
    if (!auction) return res.status(404).json({ error: "Auction not found" });
    if (auction.status !== "active") return res.status(400).json({ error: "Auction is not active" });
    if (auction.sellerId === userId) return res.status(400).json({ error: "Cannot bid on your own auction" });

    if (maxBidAmount <= auction.currentPrice) {
      return res.status(400).json({ error: "Max bid must be higher than current price" });
    }

    const autoBid = await prisma.autoBid.upsert({
      where: { auctionId_userId: { auctionId, userId } },
      create: { auctionId, userId, maxBid: maxBidAmount },
      update: { maxBid: maxBidAmount, isActive: true },
    });

    const minBid = auction.bidCount === 0
      ? auction.startingPrice
      : auction.currentPrice + calculateMinIncrement(auction.currentPrice);

    if (auction.currentWinnerId !== userId && maxBidAmount >= minBid) {
      const bidAmount = minBid;

      const result = await prisma.$transaction(async (tx) => {
        const bid = await tx.bid.create({
          data: {
            amount: bidAmount,
            auctionId,
            bidderId: userId,
            isAutoBid: true,
          },
          include: {
            bidder: { select: { username: true, displayName: true } },
          },
        });

        const updatedAuction = await tx.auction.update({
          where: { id: auctionId },
          data: {
            currentPrice: bidAmount,
            currentWinnerId: userId,
            bidCount: { increment: 1 },
            minIncrement: calculateMinIncrement(bidAmount),
          },
        });

        return { bid, updatedAuction };
      });

      const io = getIO();
      io.to(`auction:${auctionId}`).emit("new_bid", {
        bid: {
          id: result.bid.id,
          amount: result.bid.amount,
          bidder: maskUsername(result.bid.bidder.username),
          createdAt: result.bid.createdAt,
          isAutoBid: true,
        },
        currentPrice: bidAmount,
        bidCount: result.updatedAuction.bidCount,
        endTime: auction.endTime.toISOString(),
        currentWinnerId: userId,
      });
    }

    res.json(autoBid);
  } catch (error) {
    console.error("Auto bid error:", error);
    res.status(500).json({ error: "Failed to set auto bid" });
  }
});

async function processAutoBids(auctionId: number, currentPrice: number, excludeUserId: number) {
  try {
    const autoBids = await prisma.autoBid.findMany({
      where: {
        auctionId,
        isActive: true,
        userId: { not: excludeUserId },
        maxBid: { gt: currentPrice },
      },
      orderBy: { maxBid: "desc" },
      include: { user: { select: { username: true } } },
    });

    if (autoBids.length === 0) return;

    const topAutoBid = autoBids[0];
    const minBid = currentPrice + calculateMinIncrement(currentPrice);

    if (topAutoBid.maxBid >= minBid) {
      const bidAmount = Math.min(topAutoBid.maxBid, minBid);

      const result = await prisma.$transaction(async (tx) => {
        const bid = await tx.bid.create({
          data: {
            amount: bidAmount,
            auctionId,
            bidderId: topAutoBid.userId,
            isAutoBid: true,
          },
          include: {
            bidder: { select: { username: true, displayName: true } },
          },
        });

        const auction = await tx.auction.update({
          where: { id: auctionId },
          data: {
            currentPrice: bidAmount,
            currentWinnerId: topAutoBid.userId,
            bidCount: { increment: 1 },
            minIncrement: calculateMinIncrement(bidAmount),
          },
        });

        return { bid, auction };
      });

      const io = getIO();
      io.to(`auction:${auctionId}`).emit("new_bid", {
        bid: {
          id: result.bid.id,
          amount: result.bid.amount,
          bidder: maskUsername(result.bid.bidder.username),
          createdAt: result.bid.createdAt,
          isAutoBid: true,
        },
        currentPrice: bidAmount,
        bidCount: result.auction.bidCount,
        endTime: result.auction.endTime.toISOString(),
        currentWinnerId: topAutoBid.userId,
      });

      if (topAutoBid.maxBid <= bidAmount) {
        await prisma.autoBid.update({
          where: { id: topAutoBid.id },
          data: { isActive: false },
        });
      }
    }
  } catch (error) {
    console.error("Process auto bids error:", error);
  }
}

export default router;
