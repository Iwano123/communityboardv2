import { useState, useEffect } from "react";
import { eventApi } from "../utils/api";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

export interface Event {
  id: number | string;
  title: string;
  description: string;
  location?: string;
  event_date: string;
  category?: string;
  image_url?: string;
  author_id?: number | string;
}

export function useEvents(
  sortByDistance: boolean,
  location?: string,
  category?: string
) {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        // Build query params
        const params: { where?: string; orderby?: string } = {};
        const whereConditions: string[] = [];

        if (location) {
          whereConditions.push(`location.Contains("${location}")`);
        }

        if (category) {
          whereConditions.push(`category.Contains("${category}")`);
        }

        if (whereConditions.length > 0) {
          params.where = whereConditions.join(" AND ");
        }

        if (sortByDistance) {
          // Note: This would require backend support for distance sorting
          // For now, just sort by date
          params.orderby = "event_date";
        } else {
          params.orderby = "event_date";
        }

        const data = await eventApi.getAll(params);
        // Map backend data to frontend format
        const mappedEvents = Array.isArray(data) ? data.map((e: any) => ({
          id: String(e.id || e.contentItemId || ''),
          title: e.title || e.displayText || "",
          description: e.description || "",
          location: e.location,
          event_date: e.event_date || e.eventDate || e.event_date,
          category: typeof e.category === 'string' ? e.category : (e.category?.text || e.category?.value || ''),
          image_url: e.image_url || e.imageUrl,
          author_id: e.author_id || e.authorId,
        })) : [];
        setEvents(mappedEvents);
      } catch (error: any) {
        console.error("Error fetching events:", error);
        // Don't show toast on initial load errors, just log
        if (events.length === 0) {
          console.warn("Could not fetch events:", error.message || error);
        } else {
          toast.error(error.message || "Failed to fetch events");
        }
        setEvents([]); // Set empty array on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [sortByDistance, location, category]);

  const createEvent = {
    mutateAsync: async (eventData: {
      title: string;
      description: string;
      location?: string;
      event_date: string;
      category?: string;
      image_url?: string;
    }) => {
      setIsCreating(true);
      try {
        // Map to API format - backend expects eventDate and converts camelCase to PascalCase
        // Fields: Description, ImageUrl, Category, EventDate, Location, OrganizerId, IsPublished
        const organizerId = user?.email || user?.firstName || "anonymous";
        const apiData: any = {
          title: eventData.title,  // Used for Title Part
          description: eventData.description || "",  // Description field
          location: eventData.location || "",  // Location field
          eventDate: eventData.event_date,  // EventDate DateTimeField
          category: eventData.category || "",  // Category field
          imageUrl: eventData.image_url || "",  // ImageUrl field (backend converts to ImageUrl)
          organizerId: organizerId,  // OrganizerId field
          isPublished: true  // IsPublished BooleanField
        };

        console.log('Creating event with data:', apiData);
        const result = await eventApi.create(apiData);
        toast.success("Event created successfully!");
        
        // Refresh events list
        const data = await eventApi.getAll({ orderby: "event_date" });
        const mappedEvents = Array.isArray(data) ? data.map((e: any) => ({
          id: String(e.id || e.contentItemId || ''),
          title: e.title || e.displayText || "",
          description: e.description || "",
          location: e.location,
          event_date: e.event_date || e.eventDate || e.event_date,
          category: typeof e.category === 'string' ? e.category : (e.category?.text || e.category?.value || ''),
          image_url: e.image_url || e.imageUrl,
          author_id: e.author_id || e.authorId,
        })) : [];
        setEvents(mappedEvents);
        
        return result;
      } catch (error: any) {
        // Log detailed error information
        console.error('Error creating event:', error);
        if (error.data?.invalidFields) {
          console.error('Invalid fields:', error.data.invalidFields);
          console.error('Valid fields:', error.data.validFields);
          toast.error(`Invalid fields: ${error.data.invalidFields.join(', ')}. Valid fields: ${error.data.validFields.join(', ')}`);
        } else {
          toast.error(error.message || "Failed to create event");
        }
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    isPending: isCreating,
  };

  const deleteEvent = {
    mutate: async (id: number | string) => {
      setIsDeleting(true);
      try {
        await eventApi.delete(id.toString());
        toast.success("Event deleted successfully!");
        setEvents(events.filter((e) => e.id !== id));
      } catch (error: any) {
        toast.error(error.message || "Failed to delete event");
      } finally {
        setIsDeleting(false);
      }
    },
  };

  return {
    events,
    isLoading,
    createEvent,
    deleteEvent,
  };
}

