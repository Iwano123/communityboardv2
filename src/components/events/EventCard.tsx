import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Trash2, Navigation } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/hooks/useEvents";
import { formatDistance } from "@/utils/distance";

interface EventCardProps {
  event: Event;
  userId?: number | string;
  onDelete?: (id: number | string) => void;
  getEventStatus: (eventDate: string) => { label: string; color: string };
}

export function EventCard({ event, userId, onDelete, getEventStatus }: EventCardProps) {
  const status = getEventStatus(event.event_date);
  const canDelete = Boolean(userId && event.author_id && String(userId) === String(event.author_id));
  
  // Ensure status is valid
  if (!status || typeof status.color !== 'string' || typeof status.label !== 'string') {
    console.error('Invalid status returned from getEventStatus:', status);
    return null;
  }

  const handleDelete = () => {
    if (onDelete && window.confirm("Are you sure you want to delete this event?")) {
      onDelete(event.id);
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {event.image_url && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <div className="absolute top-2 right-2">
            <Badge className={status.color}>{status.label}</Badge>
          </div>
        </div>
      )}
      {!event.image_url && (
        <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
          <Calendar className="h-16 w-16 text-primary/40" />
          <div className="absolute top-2 right-2">
            <Badge className={status.color}>{status.label}</Badge>
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold flex-1">{event.title}</h3>
          {canDelete && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {event.category && typeof event.category === 'string' && (
            <Badge variant="secondary">{event.category}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {event.description || "No description available"}
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {format(new Date(event.event_date), "dd MMM yyyy 'at' h:mm a")}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{event.location}</span>
            </div>
          )}
          {event.distance !== undefined && (
            <div className="flex items-center gap-2 text-sm text-primary font-medium">
              <Navigation className="h-4 w-4" />
              <span>{formatDistance(event.distance)} away</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

