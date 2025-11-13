import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { toast } from "sonner";

export function LocationSettings() {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load saved location from localStorage
    const savedLat = localStorage.getItem("userLatitude");
    const savedLon = localStorage.getItem("userLongitude");
    if (savedLat) setLatitude(savedLat);
    if (savedLon) setLongitude(savedLon);
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toString();
        const lon = position.coords.longitude.toString();
        setLatitude(lat);
        setLongitude(lon);
        localStorage.setItem("userLatitude", lat);
        localStorage.setItem("userLongitude", lon);
        toast.success("Location saved!");
        setIsLoading(false);
      },
      (error) => {
        toast.error("Failed to get location: " + error.message);
        setIsLoading(false);
      }
    );
  };

  const saveLocation = () => {
    if (!latitude || !longitude) {
      toast.error("Please enter both latitude and longitude");
      return;
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      toast.error("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast.error("Invalid coordinate range");
      return;
    }

    localStorage.setItem("userLatitude", latitude);
    localStorage.setItem("userLongitude", longitude);
    toast.success("Location saved!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set Your Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            placeholder="e.g., 40.7128"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            placeholder="e.g., -74.0060"
            className="mt-1"
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={getCurrentLocation} disabled={isLoading} className="flex-1">
            <MapPin className="h-4 w-4 mr-2" />
            {isLoading ? "Getting location..." : "Use Current Location"}
          </Button>
          <Button onClick={saveLocation} variant="outline" className="flex-1">
            Save Location
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your location is used to sort events by distance. It's stored locally in your browser.
        </p>
      </CardContent>
    </Card>
  );
}

