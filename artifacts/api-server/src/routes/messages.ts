import { Router, type IRouter } from "express";
import { eq, or, and, desc } from "drizzle-orm";
import { db, messagesTable, usersTable } from "@workspace/db";
import { requireAuth } from "./auth";
import { SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Get conversations list
router.get("/messages/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  // Get all messages involving this user
  const allMessages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        eq(messagesTable.senderId, userId),
        eq(messagesTable.receiverId, userId)
      )
    )
    .orderBy(desc(messagesTable.sentAt));

  // Build unique contact list
  const contactMap = new Map<string, typeof allMessages[0]>();
  for (const msg of allMessages) {
    const contactId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    if (!contactMap.has(contactId)) {
      contactMap.set(contactId, msg);
    }
  }

  const contactIds = Array.from(contactMap.keys());
  if (contactIds.length === 0) {
    res.json([]);
    return;
  }

  const contacts = await db.select().from(usersTable);
  const contactsMap = new Map(contacts.map(c => [c.clerkId, c]));

  const unreadCounts = new Map<string, number>();
  for (const msg of allMessages) {
    if (msg.receiverId === userId && !msg.isRead) {
      const contactId = msg.senderId;
      unreadCounts.set(contactId, (unreadCounts.get(contactId) || 0) + 1);
    }
  }

  const conversations = contactIds
    .filter(cid => contactsMap.has(cid))
    .map(contactId => {
      const contact = contactsMap.get(contactId)!;
      const lastMsg = contactMap.get(contactId)!;
      return {
        contactId,
        contactName: contact.name,
        contactRole: contact.role || "unknown",
        lastMessage: lastMsg.content,
        lastMessageAt: lastMsg.sentAt.toISOString(),
        unreadCount: unreadCounts.get(contactId) || 0,
      };
    });

  res.json(conversations);
});

// Get messages with a specific contact
router.get("/messages/conversations/:contactId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;

  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, contactId)),
        and(eq(messagesTable.senderId, contactId), eq(messagesTable.receiverId, userId))
      )
    )
    .orderBy(messagesTable.sentAt);

  // Mark messages as read
  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(
      and(
        eq(messagesTable.senderId, contactId),
        eq(messagesTable.receiverId, userId),
        eq(messagesTable.isRead, false)
      )
    );

  res.json(messages.map(m => ({
    id: m.id,
    senderId: m.senderId,
    receiverId: m.receiverId,
    content: m.content,
    sentAt: m.sentAt.toISOString(),
    isRead: m.isRead,
  })));
});

// Send a message
router.post("/messages/conversations/:contactId", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const contactId = Array.isArray(req.params.contactId) ? req.params.contactId[0] : req.params.contactId;

  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [msg] = await db
    .insert(messagesTable)
    .values({
      senderId: userId,
      receiverId: contactId,
      content: parsed.data.content,
    })
    .returning();

  res.status(201).json({
    id: msg.id,
    senderId: msg.senderId,
    receiverId: msg.receiverId,
    content: msg.content,
    sentAt: msg.sentAt.toISOString(),
    isRead: msg.isRead,
  });
});

export default router;
