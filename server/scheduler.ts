import prisma from "./db.js";
import { getIO } from "./socket.js";

const scheduledJobs = new Map<number, NodeJS.Timeout>();

export function scheduleAuctionEnd(auctionId: number, endTime: Date) {
  const existing = scheduledJobs.get(auctionId);
  if (existing) clearTimeout(existing);

  const delay = endTime.getTime() - Date.now();
  if (delay <= 0) {
    endAuction(auctionId);
    return;
  }

  const timeout = setTimeout(() => {
    endAuction(auctionId);
  }, delay);

  scheduledJobs.set(auctionId, timeout);
  console.log(`Scheduled auction ${auctionId} to end in ${Math.round(delay / 1000)}s`);
}

export function rescheduleAuctionEnd(auctionId: number, newEndTime: Date) {
  console.log(`Anti-snipe: extending auction ${auctionId} to ${newEndTime.toISOString()}`);
  scheduleAuctionEnd(auctionId, newEndTime);
}

export async function endAuction(auctionId: number) {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: { orderBy: { amount: "desc" }, take: 2 },
      },
    });

    if (!auction || auction.status !== "active") return;

    const hasWinner = auction.currentWinnerId !== null;
    const reserveMet = !auction.reservePrice || auction.currentPrice >= auction.reservePrice;

    if (hasWinner && reserveMet) {
      const finalPrice = auction.currentPrice;
      const platformFee = finalPrice * 0.05;
      const sellerPayout = finalPrice - platformFee;

      await prisma.$transaction([
        prisma.auction.update({
          where: { id: auctionId },
          data: { status: "sold" },
        }),
        prisma.auctionResult.create({
          data: {
            auctionId,
            winnerId: auction.currentWinnerId!,
            finalPrice,
            platformFee,
            sellerPayout,
            status: "pending_payment",
          },
        }),
      ]);

      const io = getIO();
      io.to(`auction:${auctionId}`).emit("auction_ended", {
        auctionId,
        status: "sold",
        finalPrice,
        winnerId: auction.currentWinnerId,
      });
    } else {
      await prisma.auction.update({
        where: { id: auctionId },
        data: { status: "unsold" },
      });

      const io = getIO();
      io.to(`auction:${auctionId}`).emit("auction_ended", {
        auctionId,
        status: "unsold",
        reason: !hasWinner ? "No bids placed" : "Reserve price not met",
      });
    }

    scheduledJobs.delete(auctionId);
    console.log(`Auction ${auctionId} ended: ${hasWinner && reserveMet ? "sold" : "unsold"}`);
  } catch (error) {
    console.error(`End auction ${auctionId} error:`, error);
  }
}

export async function initScheduler() {
  const activeAuctions = await prisma.auction.findMany({
    where: { status: "active" },
  });

  for (const auction of activeAuctions) {
    scheduleAuctionEnd(auction.id, auction.endTime);
  }

  console.log(`Scheduler initialized: ${activeAuctions.length} active auctions`);

  setInterval(() => {
    broadcastCountdowns();
  }, 10000);
}

async function broadcastCountdowns() {
  try {
    const io = getIO();
    const activeAuctions = await prisma.auction.findMany({
      where: { status: "active" },
      select: { id: true, endTime: true },
    });

    for (const auction of activeAuctions) {
      const timeLeft = Math.max(0, auction.endTime.getTime() - Date.now());
      io.to(`auction:${auction.id}`).emit("countdown_sync", {
        auctionId: auction.id,
        timeLeft,
        endTime: auction.endTime.toISOString(),
      });
    }
  } catch (error) {
    console.error("Broadcast countdowns error:", error);
  }
}
