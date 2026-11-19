import { Router } from "express";
import { prisma } from "../lib/prisma";
import {
  getMondayBoardInfo,
  syncEventToMonday,
  handleMondayStatusWebhook,
} from "../lib/monday";

export const mondayRouter = Router();

/**
 * Health check & board status for the monday.com integration.
 */
mondayRouter.get("/status", async (_req, res) => {
  const token = process.env.MONDAY_API_TOKEN;
  const boardId = process.env.MONDAY_BOARD_ID;

  if (!token || !boardId) {
    return res.json({
      configured: false,
      message: "MONDAY_API_TOKEN or MONDAY_BOARD_ID is missing from environment.",
    });
  }

  const board = await getMondayBoardInfo();
  if (!board) {
    return res.status(502).json({
      configured: true,
      connected: false,
      error: "Failed to connect to monday.com board. Please verify your API token and Board ID.",
    });
  }

  return res.json({
    configured: true,
    connected: true,
    board: {
      id: board.id,
      name: board.name,
      url: board.url,
      columnsCount: board.columns?.length ?? 0,
      groups: board.groups?.map((g: any) => ({ id: g.id, title: g.title })) ?? [],
    },
  });
});

/**
 * Bulk sync all events from Konvene to the monday.com board.
 */
mondayRouter.post("/sync-all", async (_req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: { club: true },
      orderBy: { createdAt: "desc" },
    });

    const results = [];
    for (const event of events) {
      const syncResult = await syncEventToMonday({
        id: event.id,
        title: event.title,
        clubName: event.club?.name,
        venue: event.venue,
        startAt: event.startAt,
        capacity: event.capacity,
        status: event.status,
      });
      results.push({ id: event.id, title: event.title, synced: !!syncResult });
    }

    return res.json({
      syncedCount: results.length,
      results,
    });
  } catch (err: any) {
    console.error("[monday.com] Error in bulk sync:", err);
    return res.status(500).json({ error: err.message || "Failed to sync events to monday.com" });
  }
});

/**
 * Webhook endpoint for monday.com.
 * Supports both challenge verification and live status change events.
 */
mondayRouter.post("/webhook", async (req, res) => {
  // 1. monday.com challenge handshake
  if (req.body && req.body.challenge) {
    return res.status(200).json({ challenge: req.body.challenge });
  }

  // 2. Process webhook event
  const event = req.body?.event;
  if (!event) {
    return res.status(200).json({ ok: true });
  }

  // Status column change event
  if (event.type === "update_column_value" || event.columnId === "project_status") {
    const pulseId = String(event.pulseId || event.itemId);
    const newLabel = event.value?.label?.text;

    if (pulseId && newLabel) {
      try {
        await handleMondayStatusWebhook(pulseId, newLabel);
      } catch (err) {
        console.error("[monday.com] Webhook handling error:", err);
      }
    }
  }

  return res.status(200).json({ received: true });
});
