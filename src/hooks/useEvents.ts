import { useState, useEffect } from "react";
import { eventApi } from "../utils/api";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { calculateDistance } from "../utils/distance";

export interface Event {
  id: number | string;
  title: string;
  description: string;
  location?: string;
  event_date: string;
  category?: string;
  image_url?: string;
  author_id?: number | string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Distance in kilometers from user's location
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

        // Always fetch by date first, we'll sort by distance on frontend if needed
        params.orderby = "event_date";

        const data = await eventApi.getAll(params);
        
        // Get user's location from localStorage
        const userLat = localStorage.getItem("userLatitude");
        const userLon = localStorage.getItem("userLongitude");
        const userLatNum = userLat ? parseFloat(userLat) : null;
        const userLonNum = userLon ? parseFloat(userLon) : null;
        
        // Map backend data to frontend format
        let mappedEvents = Array.isArray(data) ? data.map((e: any) => {
          const eventLat = e.latitude !== undefined && e.latitude !== null ? parseFloat(e.latitude) : null;
          const eventLon = e.longitude !== undefined && e.longitude !== null ? parseFloat(e.longitude) : null;
          
          let distance: number | undefined = undefined;
          if (userLatNum !== null && userLonNum !== null && eventLat !== null && eventLon !== null) {
            distance = calculateDistance(userLatNum, userLonNum, eventLat, eventLon);
          }
          
          return {
            id: String(e.id || e.contentItemId || ''),
            title: e.title || e.displayText || "",
            description: e.description || "",
            location: e.location,
            event_date: e.event_date || e.eventDate || e.event_date,
            category: typeof e.category === 'string' ? e.category : (e.category?.text || e.category?.value || ''),
            image_url: e.image_url || e.imageUrl,
            author_id: e.author_id || e.authorId,
            latitude: eventLat,
            longitude: eventLon,
            distance: distance,
          };
        }) : [];
        
        // Sort by distance if enabled and user location is available
        if (sortByDistance && userLatNum !== null && userLonNum !== null) {
          mappedEvents = mappedEvents.sort((a, b) => {
            // Events with distance come first
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            // Events with distance come before events without
            if (a.distance !== undefined && b.distance === undefined) {
              return -1;
            }
            if (a.distance === undefined && b.distance !== undefined) {
              return 1;
            }
            // If neither has distance, sort by date
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          });
        }
        
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
  
  // Re-sort events when sortByDistance changes or user location changes
  useEffect(() => {
    const reSortEvents = () => {
      const userLat = localStorage.getItem("userLatitude");
      const userLon = localStorage.getItem("userLongitude");
      const userLatNum = userLat ? parseFloat(userLat) : null;
      const userLonNum = userLon ? parseFloat(userLon) : null;
      
      if (sortByDistance && userLatNum !== null && userLonNum !== null) {
        setEvents(prevEvents => {
          // Recalculate distances and sort
          const eventsWithDistance = prevEvents.map(event => {
            if (event.latitude !== undefined && event.longitude !== undefined) {
              const distance = calculateDistance(
                userLatNum,
                userLonNum,
                event.latitude,
                event.longitude
              );
              return { ...event, distance };
            }
            return event;
          });
          
          return eventsWithDistance.sort((a, b) => {
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            if (a.distance !== undefined && b.distance === undefined) {
              return -1;
            }
            if (a.distance === undefined && b.distance !== undefined) {
              return 1;
            }
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          });
        });
      }
    };
    
    reSortEvents();
    
    // Listen for storage changes (when user updates location in another tab/window)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "userLatitude" || e.key === "userLongitude") {
        reSortEvents();
      }
    };
    
    window.addEventListener("storage", handleStorageChange);
    
    // Also listen for custom event that we can dispatch from same window
    const handleCustomStorageChange = () => {
      reSortEvents();
    };
    
    window.addEventListener("locationUpdated", handleCustomStorageChange);
    
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("locationUpdated", handleCustomStorageChange);
    };
  }, [sortByDistance]);

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
        
        // Get user's location from localStorage
        const userLat = localStorage.getItem("userLatitude");
        const userLon = localStorage.getItem("userLongitude");
        const userLatNum = userLat ? parseFloat(userLat) : null;
        const userLonNum = userLon ? parseFloat(userLon) : null;
        
        let mappedEvents = Array.isArray(data) ? data.map((e: any) => {
          const eventLat = e.latitude !== undefined && e.latitude !== null ? parseFloat(e.latitude) : null;
          const eventLon = e.longitude !== undefined && e.longitude !== null ? parseFloat(e.longitude) : null;
          
          let distance: number | undefined = undefined;
          if (userLatNum !== null && userLonNum !== null && eventLat !== null && eventLon !== null) {
            distance = calculateDistance(userLatNum, userLonNum, eventLat, eventLon);
          }
          
          return {
            id: String(e.id || e.contentItemId || ''),
            title: e.title || e.displayText || "",
            description: e.description || "",
            location: e.location,
            event_date: e.event_date || e.eventDate || e.event_date,
            category: typeof e.category === 'string' ? e.category : (e.category?.text || e.category?.value || ''),
            image_url: e.image_url || e.imageUrl,
            author_id: e.author_id || e.authorId,
            latitude: eventLat,
            longitude: eventLon,
            distance: distance,
          };
        }) : [];
        
        // Sort by distance if enabled
        if (sortByDistance && userLatNum !== null && userLonNum !== null) {
          mappedEvents = mappedEvents.sort((a, b) => {
            if (a.distance !== undefined && b.distance !== undefined) {
              return a.distance - b.distance;
            }
            if (a.distance !== undefined && b.distance === undefined) {
              return -1;
            }
            if (a.distance === undefined && b.distance !== undefined) {
              return 1;
            }
            return new Date(a.event_date).getTime() - new Date(b.event_date).getTime();
          });
        }
        
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

