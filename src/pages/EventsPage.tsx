import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar, MapPin, Plus, Navigation, Info, Sparkles } from "lucide-react";
import { useEvents } from "@/hooks/useEvents";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { isPast, isFuture } from "date-fns";
import { LocationSettings } from "@/components/LocationSettings";
import { EventCard } from "@/components/events/EventCard";
import { eventSchema } from "@/lib/validations";
import { toast } from "sonner";

EventsPage.route = {
  path: "/events",
  menuLabel: "Events",
  parent: "/",
};

export default function EventsPage() {
  const { user } = useAuth();
  const [sortByDistance, setSortByDistance] = useState(false);
  const [searchLocation, setSearchLocation] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const debouncedLocation = useDebounce(searchLocation, 500);
  const debouncedCategory = useDebounce(searchCategory, 500);

  const { events = [], isLoading = false, createEvent, deleteEvent } = useEvents(
    sortByDistance,
    debouncedLocation,
    debouncedCategory
  ) || { events: [], isLoading: false, createEvent: { mutateAsync: async () => {}, isPending: false }, deleteEvent: { mutate: async () => {} } };

  const [open, setOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    event_date: "",
    category: "",
    image_url: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = eventSchema.safeParse(formData);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const validData = validation.data;
    await createEvent.mutateAsync({
      title: validData.title,
      description: validData.description,
      location: validData.location || "",
      event_date: validData.event_date,
      category: validData.category || "",
      image_url: validData.image_url || "",
    });
    setFormData({
      title: "",
      description: "",
      location: "",
      event_date: "",
      category: "",
      image_url: "",
    });
    setOpen(false);
  };


  const getEventStatus = (eventDate: string) => {
    const date = new Date(eventDate);
    if (isPast(date)) return { label: "Past", color: "bg-muted text-muted-foreground" };
    if (isFuture(date)) return { label: "Upcoming", color: "bg-primary/10 text-primary" };
    return { label: "Today", color: "bg-green-500/10 text-green-700 dark:text-green-400" };
  };

  // Filter events based on all criteria
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.event_date);
    const now = new Date();

    // Date filter
    if (dateFilter === "today") {
      if (eventDate.toDateString() !== now.toDateString()) return false;
    } else if (dateFilter === "week") {
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      if (eventDate < now || eventDate > weekFromNow) return false;
    } else if (dateFilter === "month") {
      const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      if (eventDate < now || eventDate > monthFromNow) return false;
    }

    // Type filter (online/offline) - removed latitude/longitude check
    // Online events typically have "Online" or similar in location
    if (typeFilter === "online" && event.location && !event.location.toLowerCase().includes("online")) return false;
    if (typeFilter === "offline" && event.location && event.location.toLowerCase().includes("online")) return false;

    return true;
  });

  const categories = Array.from(new Set(events.map(e => e.category).filter(Boolean).filter(cat => typeof cat === 'string')));

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 4rem)', padding: '2rem' }}>
        <div style={{ 
          animation: 'spin 1s linear infinite',
          borderRadius: '50%',
          height: '48px',
          width: '48px',
          border: '2px solid hsl(var(--primary))',
          borderTopColor: 'hsl(var(--primary))',
          borderRightColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: 'transparent'
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', padding: '2rem 0' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Sparkles style={{ height: '24px', width: '24px', color: 'hsl(var(--primary))' }} />
              <h1 style={{ fontSize: '2.25rem', fontWeight: 'bold', background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Events
              </h1>
            </div>
            <p style={{ color: 'hsl(var(--muted-foreground))' }}>
              Discover exciting workshops, conferences, and meetups near you — or create your own and connect with others!
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <Dialog open={locationOpen} onOpenChange={setLocationOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MapPin style={{ height: '16px', width: '16px', marginRight: '0.5rem' }} />
                  My Location
                </Button>
              </DialogTrigger>
              <DialogContent style={{ maxWidth: '28rem' }}>
                <DialogHeader>
                  <DialogTitle>Set Your Location</DialogTitle>
                </DialogHeader>
                <LocationSettings />
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus style={{ height: '16px', width: '16px', marginRight: '0.5rem' }} />
                  Create Your Own Event
                </Button>
              </DialogTrigger>
              <DialogContent style={{ maxWidth: '28rem', maxHeight: '90vh', overflowY: 'auto' }}>
                <DialogHeader>
                  <DialogTitle>Create New Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <Label htmlFor="title">Event Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Tech Meetup 2025"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Tell people what your event is about..."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      required
                      placeholder="123 Main St, New York, NY"
                    />
                  </div>
                  <div>
                    <Label htmlFor="event_date">Date & Time</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="Workshop, Meetup, Conference..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="image_url">Image URL (optional)</Label>
                    <Input
                      id="image_url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <Button type="submit" disabled={createEvent.isPending} style={{ width: '100%' }}>
                    {createEvent.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Enhanced Filters */}
        <Card style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem' }}>Search & Filter Events</h3>
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div>
              <Label htmlFor="search-location">Location</Label>
              <Input
                id="search-location"
                placeholder="City, country, or address..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                style={{ marginTop: '0.25rem' }}
              />
            </div>
            <div>
              <Label htmlFor="search-category">Category</Label>
              <Input
                id="search-category"
                placeholder="Workshop, Meetup, Conference..."
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                style={{ marginTop: '0.25rem' }}
                list="categories"
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="date-filter">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger id="date-filter" style={{ marginTop: '0.25rem' }}>
                  <SelectValue placeholder="All dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All dates</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="price-filter">Price</Label>
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger id="price-filter" style={{ marginTop: '0.25rem' }}>
                  <SelectValue placeholder="All prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All prices</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter">Event Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter" style={{ marginTop: '0.25rem' }}>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">In-person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {(debouncedLocation || debouncedCategory || dateFilter !== "all" || typeFilter !== "all") && (
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.875rem', color: 'hsl(var(--muted-foreground))' }}>
                Showing {filteredEvents.length} of {events.length} events
              </p>
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchLocation("");
                  setSearchCategory("");
                  setDateFilter("all");
                  setPriceFilter("all");
                  setTypeFilter("all");
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </Card>

        {/* Sort by Distance Toggle */}
        <TooltipProvider>
          <Card style={{ padding: '1rem', marginBottom: '1.5rem', border: '2px solid hsl(var(--primary) / 0.2)', background: 'hsl(var(--primary) / 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Navigation style={{ height: '20px', width: '20px', color: 'hsl(var(--primary))' }} />
              <Label htmlFor="sort-distance" style={{ flex: 1, cursor: 'pointer', fontWeight: '500' }}>
                Sort by distance from my location
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" style={{ height: '32px', width: '32px' }}>
                    <Info style={{ height: '16px', width: '16px', color: 'hsl(var(--muted-foreground))' }} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left" style={{ maxWidth: '18rem' }}>
                  <p>Enable location access to see events sorted by distance. Click "My Location" to set your coordinates.</p>
                </TooltipContent>
              </Tooltip>
              <Switch
                id="sort-distance"
                checked={sortByDistance}
                onCheckedChange={setSortByDistance}
              />
            </div>
          </Card>
        </TooltipProvider>

        {/* Events Grid */}
        {filteredEvents.length === 0 && !isLoading && !debouncedLocation && !debouncedCategory ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <Calendar style={{ height: '48px', width: '48px', color: 'hsl(var(--muted-foreground))', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>No events yet</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>Be the first to create an event!</p>
            <Button onClick={() => setOpen(true)}>Create Your Own Event</Button>
          </Card>
        ) : filteredEvents.length === 0 && !isLoading ? (
          <Card style={{ padding: '3rem', textAlign: 'center' }}>
            <MapPin style={{ height: '48px', width: '48px', color: 'hsl(var(--muted-foreground))', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>No events found</h3>
            <p style={{ color: 'hsl(var(--muted-foreground))', marginBottom: '1rem' }}>
              No events match your search criteria. Try different keywords or clear filters.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchLocation("");
                setSearchCategory("");
                setDateFilter("all");
                setTypeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
            {filteredEvents.map((event, index) => (
              <div key={String(event.id) || `event-${index}`}>
                <EventCard
                  event={event}
                  userId={user?.id}
                  onDelete={(id) => deleteEvent.mutate(id)}
                  getEventStatus={getEventStatus}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
