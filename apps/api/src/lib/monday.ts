import { prisma } from "./prisma";

const MONDAY_API_URL = "https://api.monday.com/v2";

export interface MondayGraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{ message: string; locations?: any }>;
}

/**
 * Execute a GraphQL query/mutation against the monday.com API v2.
 */
export async function executeMondayGraphQL<T = any>(
  query: string,
  variables: Record<string, any> = {}
): Promise<T | null> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    console.warn("[monday.com] No MONDAY_API_TOKEN set in environment. Skipping API call.");
    return null;
  }

  try {
    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`[monday.com] HTTP ${res.status}: ${text}`);
      return null;
    }

    const json = (await res.json()) as MondayGraphQLResponse<T>;
    if (json.errors && json.errors.length > 0) {
      console.error("[monday.com] GraphQL errors:", JSON.stringify(json.errors, null, 2));
      return null;
    }

    return json.data ?? null;
  } catch (err) {
    console.error("[monday.com] Failed to execute GraphQL request:", err);
    return null;
  }
}

/**
 * Get board details and column mappings for the configured board.
 */
export async function getMondayBoardInfo() {
  const boardId = process.env.MONDAY_BOARD_ID;
  if (!boardId) return null;

  const query = `
    query ($boardId: ID!) {
      boards (ids: [$boardId]) {
        id
        name
        columns {
          id
          title
          type
        }
        groups {
          id
          title
        }
      }
    }
  `;

  const data = await executeMondayGraphQL<{ boards: any[] }>(query, { boardId });
  return data?.boards?.[0] ?? null;
}

/**
 * Map Konvene event statuses to monday.com board status labels.
 */
export function mapKonveneStatusToMonday(status: string): string {
  switch (status.toUpperCase()) {
    case "PUBLISHED":
    case "COMPLETED":
      return "Done";
    case "REJECTED":
    case "CANCELLED":
      return "Stuck";
    case "PENDING_APPROVAL":
    case "DRAFT":
    default:
      return "Working on it";
  }
}

/**
 * Map monday.com status labels to Konvene event statuses.
 */
export function mapMondayStatusToKonvene(label: string): string {
  switch (label.toLowerCase()) {
    case "done":
      return "PUBLISHED";
    case "stuck":
      return "REJECTED";
    case "working on it":
      return "PENDING_APPROVAL";
    case "not started":
      return "DRAFT";
    default:
      return "PENDING_APPROVAL";
  }
}

/**
 * Find an item on the board by the embedded Konvene event ID.
 */
export async function findMondayItemByEventId(eventId: string): Promise<{ id: string; name: string } | null> {
  const boardId = process.env.MONDAY_BOARD_ID;
  if (!boardId) return null;

  const query = `
    query ($boardId: ID!) {
      boards (ids: [$boardId]) {
        items_page (limit: 100) {
          items {
            id
            name
            column_values (ids: ["text"]) {
              id
              text
            }
          }
        }
      }
    }
  `;

  const data = await executeMondayGraphQL<{ boards: Array<{ items_page: { items: any[] } }> }>(query, { boardId });
  const items = data?.boards?.[0]?.items_page?.items ?? [];

  for (const item of items) {
    const textVal = item.column_values?.[0]?.text ?? "";
    if (textVal.includes(`[konvene:${eventId}]`)) {
      return { id: item.id, name: item.name };
    }
  }

  return null;
}

/**
 * Sync or create an Event item on the monday.com board.
 */
export async function syncEventToMonday(event: {
  id: string;
  title: string;
  clubName?: string;
  venue?: string;
  startAt: Date;
  capacity?: number;
  status: string;
}) {
  const boardId = process.env.MONDAY_BOARD_ID;
  if (!boardId) return null;

  const itemName = event.clubName ? `[${event.clubName}] ${event.title}` : event.title;
  const statusLabel = mapKonveneStatusToMonday(event.status);
  const dateStr = (event.startAt instanceof Date ? event.startAt : new Date(event.startAt))
    .toISOString()
    .split("T")[0];

  const notesText = `[konvene:${event.id}] Venue: ${event.venue || "TBD"} | Capacity: ${event.capacity || 0} | Status: ${event.status}`;

  // Check if item already exists on the board
  const existing = await findMondayItemByEventId(event.id);

  if (existing) {
    // Update status and details
    const mutation = `
      mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
        change_multiple_column_values (board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
          id
        }
      }
    `;

    const columnValues = JSON.stringify({
      project_status: { label: statusLabel },
      date: { date: dateStr },
      text: notesText,
    });

    return executeMondayGraphQL(mutation, {
      boardId,
      itemId: existing.id,
      columnValues,
    });
  }

  // Create new item on monday.com
  const mutation = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
      create_item (board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
        id
        name
      }
    }
  `;

  const columnValues = JSON.stringify({
    project_status: { label: statusLabel },
    date: { date: dateStr },
    text: notesText,
  });

  return executeMondayGraphQL(mutation, {
    boardId,
    itemName,
    columnValues,
  });
}

/**
 * Update the status of an event on monday.com when it changes in Konvene.
 */
export async function updateEventStatusOnMonday(eventId: string, newStatus: string) {
  const boardId = process.env.MONDAY_BOARD_ID;
  if (!boardId) return null;

  const item = await findMondayItemByEventId(eventId);
  if (!item) {
    // If not found, attempt a full sync of the event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { club: true },
    });
    if (event) {
      return syncEventToMonday({
        id: event.id,
        title: event.title,
        clubName: event.club?.name,
        venue: event.venue,
        startAt: event.startAt,
        capacity: event.capacity,
        status: newStatus,
      });
    }
    return null;
  }

  const statusLabel = mapKonveneStatusToMonday(newStatus);
  const mutation = `
    mutation ($boardId: ID!, $itemId: ID!, $columnValues: JSON!) {
      change_multiple_column_values (board_id: $boardId, item_id: $itemId, column_values: $columnValues) {
        id
      }
    }
  `;

  const columnValues = JSON.stringify({
    project_status: { label: statusLabel },
  });

  return executeMondayGraphQL(mutation, {
    boardId,
    itemId: item.id,
    columnValues,
  });
}

/**
 * Handle incoming webhook update from monday.com:
 * If an item's status column changed on monday.com, update the corresponding event in Konvene.
 */
export async function handleMondayStatusWebhook(itemId: string, newStatusLabel: string) {
  // Query monday.com for item notes to find [konvene:<eventId>]
  const query = `
    query ($itemId: [ID!]) {
      items (ids: $itemId) {
        id
        name
        column_values (ids: ["text"]) {
          id
          text
        }
      }
    }
  `;

  const data = await executeMondayGraphQL<{ items: any[] }>(query, { itemId: [itemId] });
  const item = data?.items?.[0];
  if (!item) return null;

  const textVal = item.column_values?.[0]?.text ?? "";
  const match = textVal.match(/\[konvene:([^\]]+)\]/);
  if (!match) return null;

  const eventId = match[1];
  const newKonveneStatus = mapMondayStatusToKonvene(newStatusLabel);

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { status: newKonveneStatus },
  });

  console.log(`[monday.com] Webhook updated Konvene event ${eventId} status to ${newKonveneStatus}`);
  return updated;
}
