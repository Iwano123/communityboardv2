#!/usr/bin/env node
/**
 * Script to seed the database with sample events using Orchard Core API
 * Make sure the backend is running before executing this script
 * Run: npm run seed-events
 */

import https from 'https';
import http from 'http';

const API_BASE = 'http://localhost:5001/api';
const ADMIN_USERNAME = 'iwan';
const ADMIN_PASSWORD = 'Lile12345!';

// Sample events data matching Orchard Core Event content type structure
// Fields: Description, ImageUrl, EventDate, Location, OrganizerId, IsPublished
const sampleEvents = [
  {
    title: "Tech Workshop: Building AI Applications",
    description: "Join us for an intensive workshop on building AI-powered applications. Learn about modern frameworks, best practices, and hands-on coding sessions. Perfect for developers looking to expand their skills in machine learning and AI integration.",
    location: "Tech Hub, Stockholm, Sweden",
    eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    imageUrl: "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Innovation Summit: Startup Showcase",
    description: "Discover groundbreaking startups and innovative technologies. Featuring pitch sessions, networking opportunities, and keynote speakers from industry leaders. Connect with entrepreneurs and investors.",
    location: "Convention Center, Gothenburg, Sweden",
    eventDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(), // ~2 months from now
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Community Garden Meetup",
    description: "Join fellow gardening enthusiasts for a hands-on session in our community garden. We'll be planting seasonal vegetables, sharing tips, and enjoying fresh produce. All skill levels welcome!",
    location: "Community Garden, Malmö, Sweden",
    eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Yoga & Mindfulness Retreat",
    description: "A peaceful day of yoga, meditation, and mindfulness practices. Reconnect with yourself and find inner peace. Suitable for all levels, from beginners to advanced practitioners.",
    location: "Wellness Center, Uppsala, Sweden",
    eventDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Photography Walk: Urban Landscapes",
    description: "Explore the city through your lens! We'll walk through different neighborhoods, capturing urban landscapes and street scenes. Bring your camera and learn composition techniques from experienced photographers.",
    location: "City Center, Lund, Sweden",
    eventDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
    imageUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Book Club: Science Fiction Discussion",
    description: "Join us for a lively discussion of this month's science fiction selection. Share your thoughts, explore themes, and connect with fellow book lovers. New members always welcome!",
    location: "Public Library, Linköping, Sweden",
    eventDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 3 weeks from now
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Cooking Class: Swedish Cuisine",
    description: "Learn to cook traditional Swedish dishes with a modern twist. From meatballs to cinnamon buns, discover the secrets of Swedish cooking. Includes ingredients and recipe cards.",
    location: "Culinary School, Örebro, Sweden",
    eventDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    imageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Cycling Tour: Countryside Routes",
    description: "Join us for a scenic cycling tour through beautiful countryside routes. We'll cover approximately 30km at a relaxed pace, with stops for photos and refreshments. Bring your bike!",
    location: "Bike Rental Shop, Västerås, Sweden",
    eventDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days from now
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Music Jam Session",
    description: "Musicians of all levels welcome! Bring your instrument and join us for an informal jam session. We'll play various genres and have fun making music together. Acoustic instruments preferred.",
    location: "Community Center, Umeå, Sweden",
    eventDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString(), // 18 days from now
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Web Development Bootcamp",
    description: "Intensive 2-day bootcamp covering modern web development. Learn React, Node.js, and best practices. Includes hands-on projects and portfolio building. Perfect for beginners and intermediate developers.",
    location: "Tech Academy, Luleå, Sweden",
    eventDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month from now
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Hiking Adventure: Mountain Trails",
    description: "Explore stunning mountain trails with experienced guides. We'll hike for 4-5 hours through beautiful landscapes. Bring water, snacks, and appropriate footwear. Moderate difficulty level.",
    location: "Mountain Base Camp, Kiruna, Sweden",
    eventDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
    imageUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Art Exhibition Opening",
    description: "Join us for the opening of a new contemporary art exhibition featuring local and international artists. Wine and refreshments will be served. Free admission.",
    location: "Art Gallery, Gävle, Sweden",
    eventDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
    imageUrl: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Past Event: IBM DataPower Online Training",
    description: "Corporate training session on IBM DataPower. This event has already taken place.",
    location: "Online",
    eventDate: new Date(2017, 6, 12, 21, 0, 0).toISOString(), // Past date: July 12, 2017
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Coffee & Code Morning Session",
    description: "Start your day with coffee and coding! Join fellow developers for an informal morning coding session. Work on your projects, share ideas, and network. Coffee provided!",
    location: "Café Code, Jönköping, Sweden",
    eventDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days from now
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  },
  {
    title: "Sustainable Living Workshop",
    description: "Learn practical tips for living more sustainably. Topics include zero-waste practices, energy conservation, and eco-friendly alternatives. Includes take-home resources.",
    location: "Eco Center, Borås, Sweden",
    eventDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
    imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=450&fit=crop",
    organizerId: ADMIN_USERNAME,
    isPublished: true
  }
];

// Cookie jar for maintaining session
let cookies = '';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(cookies ? { 'Cookie': cookies } : {})
      }
    };

    const req = client.request(requestOptions, (res) => {
      // Extract cookies from response
      const setCookieHeaders = res.headers['set-cookie'];
      if (setCookieHeaders) {
        cookies = setCookieHeaders.map(cookie => cookie.split(';')[0]).join('; ');
      }

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const jsonData = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, data: jsonData, headers: res.headers });
          } catch (e) {
            resolve({ status: res.statusCode, data: data, headers: res.headers });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

async function login() {
  try {
    const response = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        usernameOrEmail: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }
    });

    console.log('✅ Logged in successfully:', response.data.username);
    return true;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return false;
  }
}

async function createEvent(event, includeAllFields = false) {
  try {
    // Orchard Core API structure - fields match the content type definition
    // Backend converts camelCase to PascalCase automatically
    const eventData = {
      title: event.title, // Used for DisplayText (Title Part)
      description: event.description, // Description field
      eventDate: event.eventDate, // EventDate DateTimeField
      location: event.location, // Location field
      organizerId: event.organizerId || ADMIN_USERNAME, // OrganizerId field
      isPublished: event.isPublished !== undefined ? event.isPublished : true // IsPublished BooleanField
    };
    
    // Try to add ImageUrl and Category - backend reads valid fields from existing items
    // If no items have ImageUrl/Category yet, backend won't recognize them
    // Solution: Create one event with all fields first, or update existing events
    if (includeAllFields) {
      if (event.imageUrl) {
        eventData.imageUrl = event.imageUrl;
      }
      if (event.category) {
        eventData.category = event.category;
      }
    }

    // Use Orchard Core's generic content type endpoint
    const response = await makeRequest(`${API_BASE}/Event`, {
      method: 'POST',
      body: eventData
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function seedEvents() {
  console.log('🌱 Starting to seed events using Orchard Core API...\n');
  console.log('⚠️  Make sure the backend is running on http://localhost:5001\n');

  // Login first
  console.log('1. Logging in...');
  const loggedIn = await login();
  if (!loggedIn) {
    console.error('❌ Cannot proceed without login');
    console.error('   Make sure:');
    console.error('   1. Backend is running (npm run backend)');
    console.error(`   2. User "${ADMIN_USERNAME}" exists with password "${ADMIN_PASSWORD}"`);
    process.exit(1);
  }

  // Create events
  console.log('\n2. Creating events...');
  const createdEvents = [];
  
  // Create events first without Category (since backend doesn't recognize it yet)
  console.log('   Creating events (backend will learn fields as we go)...');
  for (let i = 0; i < sampleEvents.length; i++) {
    const event = sampleEvents[i];
    try {
      console.log(`   Creating event ${i + 1}/${sampleEvents.length}: "${event.title}"`);
      // Start without Category, but include ImageUrl (backend already knows it)
      const createdEvent = await createEvent(event, true); // includeAllFields = true (includes ImageUrl)
      createdEvents.push(createdEvent);
      const eventId = createdEvent.id || createdEvent.contentItemId || createdEvent.contentItem?.contentItemId || 'N/A';
      console.log(`   ✅ Created event with ID: ${eventId}`);
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      // If ImageUrl fails, try without it
      if (error.message.includes('imageUrl') || error.message.includes('ImageUrl')) {
        console.log(`   ⚠️  Retrying without ImageUrl...`);
        try {
          const createdEvent = await createEvent(event, false);
          createdEvents.push(createdEvent);
          const eventId = createdEvent.id || createdEvent.contentItemId || createdEvent.contentItem?.contentItemId || 'N/A';
          console.log(`   ✅ Created event with ID: ${eventId} (without ImageUrl)`);
        } catch (retryError) {
          console.error(`   ❌ Failed to create event "${event.title}":`, retryError.message);
        }
      } else {
        console.error(`   ❌ Failed to create event "${event.title}":`, error.message);
      }
    }
  }
  
  // Now try to update one of the created events with Category to "teach" backend
  console.log('\n   Attempting to add Category to an existing event to register the field...');
  if (createdEvents.length > 0) {
    try {
      const eventToUpdate = createdEvents[0];
      const eventId = eventToUpdate.id || eventToUpdate.contentItemId || eventToUpdate.contentItem?.contentItemId;
      if (eventId) {
        const updateData = {
          category: "Workshop" // Add Category field
        };
        const updateResponse = await makeRequest(`${API_BASE}/Event/${eventId}`, {
          method: 'PUT',
          body: updateData
        });
        console.log(`   ✅ Updated event with Category - backend should now recognize the field`);
      }
    } catch (error) {
      console.log(`   ⚠️  Could not add Category to existing event: ${error.message}`);
      console.log(`   You may need to add Category manually via Orchard Core admin`);
    }
  }

  console.log('\n✨ Seeding completed!');
  console.log(`   Created ${createdEvents.length} events`);
  console.log('\n💡 You can now view the events in your frontend at http://localhost:5173/events');
  console.log('   Events are stored as Orchard Core content items with the following fields:');
  console.log('   - Description (TextField)');
  console.log('   - ImageUrl (TextField)');
  console.log('   - Category (TextField)');
  console.log('   - EventDate (DateTimeField)');
  console.log('   - Location (TextField)');
  console.log('   - OrganizerId (TextField)');
  console.log('   - IsPublished (BooleanField)');
}

// Run the seeding
seedEvents().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
