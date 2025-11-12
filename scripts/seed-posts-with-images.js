#!/usr/bin/env node
/**
 * Seed script to create sample posts with images
 * Run: node scripts/seed-posts-with-images.js
 */

import https from 'https';
import http from 'http';

const API_BASE = 'http://localhost:5001/api';
const ADMIN_USERNAME = 'iwan';
const ADMIN_PASSWORD = 'Lile12345!';

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
        ...(cookies && { 'Cookie': cookies })
      }
    };

    const req = client.request(requestOptions, (res) => {
      // Store cookies
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        cookies = setCookie.map(c => c.split(';')[0]).join('; ');
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(jsonData)}`));
          } else {
            resolve({ statusCode: res.statusCode, data: jsonData });
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data}`));
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

const samplePosts = [
  {
    title: "Welcome to Orchid Community! 🌸",
    content: "We're excited to launch this new community platform where you can share ideas, connect with others, and build meaningful relationships. Let's make this a vibrant and supportive space for everyone!",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop"
  },
  {
    title: "Beautiful Sunset Photography 🌅",
    content: "Captured this amazing sunset yesterday at the beach. Nature never ceases to amaze me! What's your favorite time of day for photography?",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop"
  },
  {
    title: "Coffee & Code ☕",
    content: "Nothing beats a morning coding session with a fresh cup of coffee. What's your favorite productivity drink?",
    imageUrl: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=450&fit=crop"
  },
  {
    title: "Mountain Adventures 🏔️",
    content: "Just got back from an incredible hiking trip. The view from the top was absolutely worth the climb! Anyone else love outdoor adventures?",
    imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop"
  },
  {
    title: "Urban Architecture 🏙️",
    content: "The modern architecture in this city is mind-blowing. Every building tells a story. Sharing some of my favorite shots from today's walk.",
    imageUrl: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=450&fit=crop"
  },
  {
    title: "Foodie Adventures 🍕",
    content: "Found this amazing local restaurant! The pizza was incredible. What's your go-to comfort food?",
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&h=450&fit=crop"
  },
  {
    title: "Workspace Setup 💻",
    content: "Finally finished setting up my home office! Clean desk, dual monitors, and plenty of natural light. How does your workspace look?",
    imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&h=450&fit=crop"
  },
  {
    title: "Beach Day 🏖️",
    content: "Taking a break from the hustle and enjoying some beach time. Sometimes you just need to disconnect and relax!",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=450&fit=crop"
  },
  {
    title: "Book Recommendations 📚",
    content: "Just finished an amazing book and had to share! Looking for more recommendations. What are you reading right now?",
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=450&fit=crop"
  },
  {
    title: "Plant Love 🌱",
    content: "My little indoor jungle is growing! Plants really do make a space feel more alive. Fellow plant parents, what's your favorite plant?",
    imageUrl: "https://images.unsplash.com/photo-1463620695885-8a91d87c53d0?w=800&h=450&fit=crop"
  }
];

async function main() {
  console.log('🌱 Seeding posts with images...\n');

  // Login
  console.log('1. Logging in as admin...');
  try {
    await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        usernameOrEmail: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }
    });
    console.log('   ✅ Logged in successfully\n');
  } catch (error) {
    console.log('   ❌ Login failed:', error.message);
    return;
  }

  // Create posts
  console.log('2. Creating posts with images...');
  let successCount = 0;
  let failCount = 0;

  for (const post of samplePosts) {
    try {
      const postData = {
        title: post.title,
        content: post.content,
        authorId: ADMIN_USERNAME,
        likes: Math.floor(Math.random() * 50), // Random likes between 0-50
        isPublished: true,
        imageUrl: post.imageUrl
      };

      const response = await makeRequest(`${API_BASE}/Post`, {
        method: 'POST',
        body: postData
      });

      console.log(`   ✅ Created: "${post.title}"`);
      successCount++;
    } catch (error) {
      console.log(`   ❌ Failed to create "${post.title}":`, error.message);
      failCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully created: ${successCount} posts`);
  if (failCount > 0) {
    console.log(`   ❌ Failed: ${failCount} posts`);
  }
  console.log(`\n🎉 Done! Check http://localhost:5173/for-you to see your posts!`);
}

main().catch(console.error);

