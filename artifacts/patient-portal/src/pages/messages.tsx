import { useGetConversations, useGetMessages, getGetMessagesQueryKey, useSendMessage, useGetMyProfile, useGetMyPatients } from "@workspace/api-client-react";
import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, MessageSquarePlus, X } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";

export default function MessagesPage() {
  const { data: profile } = useGetMyProfile();
  const { data: conversations, isLoading } = useGetConversations();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  if (isLoading) return <div className="p-8 text-center">Loading messages...</div>;

  const selectedConv = conversations?.find(c => c.contactId === selectedContactId);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col md:flex-row">
      {/* Left Sidebar - Conversation List */}
      <div className={`w-full md:w-1/3 lg:w-1/4 border-r border-border bg-card flex flex-col h-[100dvh] ${selectedContactId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
          {profile?.role === "doctor" && <NewConversationDialog onSelect={setSelectedContactId} />}
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {conversations?.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No conversations yet.</p>
          ) : (
            <div className="divide-y divide-border/50">
              {conversations?.map((conv) => (
                <button
                  key={conv.contactId}
                  onClick={() => setSelectedContactId(conv.contactId)}
                  className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors ${selectedContactId === conv.contactId ? 'bg-secondary' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold">{conv.contactName}</span>
                    {conv.lastMessageAt && (
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(conv.lastMessageAt), 'MMM d, h:mm a')}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground truncate pr-4">
                      {conv.lastMessage || "No messages yet."}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-primary text-primary-foreground text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Area - Message Thread */}
      <div className={`flex-1 h-[100dvh] flex-col bg-background/50 ${selectedContactId ? 'flex' : 'hidden md:flex'}`}>
        {selectedContactId && selectedConv ? (
          <MessageThread contactId={selectedContactId} contactName={selectedConv.contactName} onBack={() => setSelectedContactId(null)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

function NewConversationDialog({ onSelect }: { onSelect: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const { data: patients } = useGetMyPatients();

  const handleStart = () => {
    if (selectedPatientId) {
      onSelect(selectedPatientId);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 text-primary">
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger>
              <SelectValue placeholder="Select patient" />
            </SelectTrigger>
            <SelectContent>
              {patients?.map(p => (
                <SelectItem key={p.clerkId} value={p.clerkId}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="w-full" onClick={handleStart} disabled={!selectedPatientId}>
            Start Conversation
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MessageThread({ contactId, contactName, onBack }: { contactId: string, contactName: string, onBack: () => void }) {
  const { data: messages, isLoading } = useGetMessages(contactId, {
    query: { enabled: !!contactId, queryKey: getGetMessagesQueryKey(contactId) }
  });
  const { data: profile } = useGetMyProfile();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: getGetMessagesQueryKey(contactId) });
        // Also invalidate conversations to update last message
        queryClient.invalidateQueries({ queryKey: ['/api/messages/conversations'] });
      }
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMessage.mutate({ contactId, data: { content } });
  };

  return (
    <>
      <div className="p-4 border-b border-border bg-card flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden rounded-full h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-semibold">{contactName}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onBack} className="hidden md:flex rounded-full h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading...</div>
        ) : messages?.length === 0 ? (
          <div className="text-center text-muted-foreground mt-10">
            This is the start of your conversation.
          </div>
        ) : (
          messages?.map((msg) => {
            const isMe = msg.senderId === profile?.clerkId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-card border border-border/50 text-foreground rounded-bl-sm'
                }`}>
                  <p>{msg.content}</p>
                </div>
                <span className="text-[10px] text-muted-foreground mt-1 px-1">
                  {format(new Date(msg.sentAt), 'h:mm a')}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 bg-card border-t border-border">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={content} 
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full bg-secondary/50 border-transparent focus-visible:ring-primary focus-visible:border-transparent"
            disabled={sendMessage.isPending}
          />
          <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!content.trim() || sendMessage.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
