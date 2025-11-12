#!/usr/bin/env node
/**
 * Script to seed the database with sample posts and data
 * Make sure the backend is running before executing this script
 * Run: npm run seed-data
 */

import https from 'https';
import http from 'http';

const API_BASE = 'http://localhost:5001/api';
const ADMIN_USERNAME = 'iwan';
const ADMIN_PASSWORD = 'Lile12345!';

// Sample posts data with images
const samplePosts = [
  {
    title: "Welcome to Orchid Community!",
    content: "We're excited to have you here! This is a place where you can share your thoughts, connect with others, and build meaningful relationships. Feel free to explore and make your first post!",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=450&fit=crop"
  },
  {
    title: "Community Guidelines",
    content: "Please remember to be respectful and kind to everyone in our community. We're all here to connect and share positive experiences. Let's make Orchid a welcoming place for all!",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=450&fit=crop"
  },
  {
    title: "Looking for a study group",
    content: "Hi everyone! I'm looking for people interested in forming a study group for web development. We could meet weekly and work on projects together. Anyone interested?",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop"
  },
  {
    title: "Beautiful sunset today 🌅",
    content: "Just wanted to share this amazing sunset I saw today. Sometimes we need to stop and appreciate the little things in life. Hope everyone is having a great day!",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop"
  },
  {
    title: "Marketplace: Selling my old bike",
    content: "Selling my mountain bike - great condition, only used a few times. Perfect for someone who wants to start cycling. Price: $200. Contact me if interested!",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop"
  },
  {
    title: "Weekend hiking trip",
    content: "Planning a hiking trip this weekend to the nearby mountains. Looking for 2-3 more people to join. We'll leave Saturday morning and return Sunday evening. All experience levels welcome!",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=800&h=450&fit=crop"
  },
  {
    title: "Tech meetup next Friday",
    content: "Hey tech enthusiasts! We're organizing a meetup next Friday at 6 PM at the community center. We'll discuss the latest trends in web development and have some networking time. See you there!",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=450&fit=crop"
  },
  {
    title: "Recipe sharing thread 🍳",
    content: "Let's share our favorite recipes! I'll start: My go-to comfort food is homemade pasta with a simple tomato sauce. What's yours?",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=450&fit=crop"
  },
  {
    title: "Book recommendations?",
    content: "I'm looking for some good book recommendations. I enjoy fiction, especially sci-fi and fantasy. What are you currently reading or what's a book you'd highly recommend?",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=450&fit=crop"
  },
  {
    title: "Community garden project",
    content: "We're starting a community garden project! If you're interested in gardening or want to learn, come join us every Saturday morning. We'll provide tools and seeds. Let's grow together! 🌱",
    authorId: ADMIN_USERNAME,
    likes: 0,
    isPublished: true,
    ImageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=450&fit=crop"
  }
];

// Sample comments data (will be added after posts are created)
const sampleComments = [
  {
    content: "Great idea! I'd love to join.",
    authorId: ADMIN_USERNAME
  },
  {
    content: "This sounds amazing! Count me in.",
    authorId: ADMIN_USERNAME
  },
  {
    content: "Thanks for sharing!",
    authorId: ADMIN_USERNAME
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

async function createPost(post) {
  try {
    const response = await makeRequest(`${API_BASE}/Post`, {
      method: 'POST',
      body: post
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function createComment(postId, comment) {
  try {
    const response = await makeRequest(`${API_BASE}/Comment`, {
      method: 'POST',
      body: {
        title: 'Comment',
        content: comment.content,
        postId: postId,
        authorId: comment.authorId
      }
    });

    return response.data;
  } catch (error) {
    throw error;
  }
}

async function seedData() {
  console.log('🌱 Starting to seed data...\n');
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

  // Create posts
  console.log('\n2. Creating posts...');
  const createdPosts = [];
  for (let i = 0; i < samplePosts.length; i++) {
    const post = samplePosts[i];
    try {
      console.log(`   Creating post ${i + 1}/${samplePosts.length}: "${post.title}"`);
      const createdPost = await createPost(post);
      createdPosts.push(createdPost);
      console.log(`   ✅ Created post with ID: ${createdPost.id}`);
      
      // Add a small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`   ❌ Failed to create post "${post.title}":`, error.message);
    }
  }

  // Create comments on some posts
  console.log('\n3. Creating comments...');
  const postsToComment = createdPosts.slice(0, 3); // Comment on first 3 posts
  for (const post of postsToComment) {
    for (const comment of sampleComments) {
      try {
        await createComment(post.id, comment);
        console.log(`   ✅ Added comment to post "${post.title}"`);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`   ❌ Failed to add comment:`, error.message);
      }
    }
  }

  console.log('\n✨ Seeding completed!');
  console.log(`   Created ${createdPosts.length} posts`);
  console.log(`   Added comments to ${postsToComment.length} posts`);
  console.log('\n💡 You can now view the posts in your frontend at http://localhost:5173');
}

// Run the seeding
seedData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
