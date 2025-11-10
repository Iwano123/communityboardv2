using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;
using System.Reflection;

namespace CommunityBoard.Cms.Controllers;

[ApiController]
[Route("api/test-data")]
public class TestDataController : ControllerBase
{
    private readonly DatabaseService _databaseService;
    private readonly ILogger<TestDataController> _logger;

    public TestDataController(DatabaseService databaseService, ILogger<TestDataController> logger)
    {
        _databaseService = databaseService;
        _logger = logger;
    }

    [HttpPost("seed")]
    public async Task<IActionResult> SeedTestData()
    {
        try
        {
            // First, ensure tables exist
            await EnsureTablesExist();

            // Create test categories
            var categories = new[]
            {
                new { name = "For Sale", color = "#10b981" },
                new { name = "Services", color = "#3b82f6" },
                new { name = "Events", color = "#8b5cf6" },
                new { name = "Housing", color = "#f59e0b" },
                new { name = "Jobs", color = "#ef4444" },
                new { name = "Community", color = "#1d9bf0" }
            };

            var categoryIds = new Dictionary<string, int>();

            foreach (var cat in categories)
            {
                // Check if category exists
                var existing = await _databaseService.QueryAsync(
                    "SELECT id FROM categories WHERE name = $name",
                    new Dictionary<string, object?> { ["name"] = cat.name }
                );

                int categoryId;
                if (existing.Count > 0 && !existing[0].ContainsKey("error"))
                {
                    categoryId = Convert.ToInt32(existing[0]["id"]);
                }
                else
                {
                    var result = await _databaseService.QueryAsync(
                        "INSERT INTO categories(name, color) VALUES($name, $color)",
                        new Dictionary<string, object?> { ["name"] = cat.name, ["color"] = cat.color }
                    );
                    var newCat = await _databaseService.QueryOneAsync(
                        "SELECT id FROM categories WHERE name = $name",
                        new Dictionary<string, object?> { ["name"] = cat.name }
                    );
                    categoryId = Convert.ToInt32(newCat["id"]);
                }
                categoryIds[cat.name] = categoryId;
            }

            // Create test users if they don't exist
            var testUsers = new[]
            {
                new { firstName = "Sarah", lastName = "Johnson", email = "sarah.johnson@example.com", password = "password123" },
                new { firstName = "Mike", lastName = "Chen", email = "mike.chen@example.com", password = "password123" },
                new { firstName = "Emma", lastName = "Wilson", email = "emma.wilson@example.com", password = "password123" },
                new { firstName = "David", lastName = "Martinez", email = "david.martinez@example.com", password = "password123" },
                new { firstName = "Lisa", lastName = "Anderson", email = "lisa.anderson@example.com", password = "password123" }
            };

            var userIds = new List<int>();

            foreach (var user in testUsers)
            {
                var existing = await _databaseService.QueryAsync(
                    "SELECT id FROM users WHERE email = $email",
                    new Dictionary<string, object?> { ["email"] = user.email }
                );

                int userId;
                if (existing.Count > 0 && !existing[0].ContainsKey("error"))
                {
                    userId = Convert.ToInt32(existing[0]["id"]);
                }
                else
                {
                    var hashedPassword = BCrypt.Net.BCrypt.EnhancedHashPassword(user.password, 13);
                    await _databaseService.QueryAsync(
                        "INSERT INTO users(firstName, lastName, email, password) VALUES($firstName, $lastName, $email, $password)",
                        new Dictionary<string, object?>
                        {
                            ["firstName"] = user.firstName,
                            ["lastName"] = user.lastName,
                            ["email"] = user.email,
                            ["password"] = hashedPassword
                        }
                    );
                    var newUser = await _databaseService.QueryOneAsync(
                        "SELECT id FROM users WHERE email = $email",
                        new Dictionary<string, object?> { ["email"] = user.email }
                    );
                    userId = Convert.ToInt32(newUser["id"]);
                }
                userIds.Add(userId);
            }

            // Create test posts
            var now = DateTime.UtcNow;
            var posts = new[]
            {
                // Sales posts
                new {
                    title = "Vintage Bicycle for Sale",
                    content = "Beautiful vintage bicycle in excellent condition. Perfect for commuting or weekend rides. Comes with a lock and basket. Price is negotiable!",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[0],
                    price = (double?)150.00,
                    location = "Downtown",
                    image_url = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 45,
                    created_at = now.AddHours(-2).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Gaming Laptop - Great Deal!",
                    content = "Selling my gaming laptop. RTX 3060, 16GB RAM, 512GB SSD. Barely used, still under warranty. Perfect for gaming or work.",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[1],
                    price = (double?)899.99,
                    location = "North Side",
                    image_url = "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 128,
                    created_at = now.AddHours(-5).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Furniture Set - Moving Sale",
                    content = "Complete living room set: sofa, coffee table, and two armchairs. All in great condition. Must sell quickly due to move.",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[2],
                    price = (double?)450.00,
                    location = "East Side",
                    image_url = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 67,
                    created_at = now.AddHours(-8).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Camera Equipment Bundle",
                    content = "Professional camera setup: Canon EOS R, 3 lenses, tripod, and camera bag. Everything you need to start photography!",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[3],
                    price = (double?)1200.00,
                    location = "West Side",
                    image_url = "https://picsum.photos/800/600?random=1",
                    is_featured = false,
                    views = 89,
                    created_at = now.AddHours(-12).ToString("yyyy-MM-dd HH:mm:ss")
                },
                // Regular posts
                new {
                    title = "Community Garden Meeting This Weekend",
                    content = "Join us this Saturday at 2 PM for our monthly community garden meeting. We'll be discussing the spring planting schedule and organizing volunteer shifts. All are welcome!",
                    category_id = categoryIds["Community"],
                    author_id = userIds[0],
                    price = (double?)null,
                    location = "Community Center",
                    image_url = "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 234,
                    created_at = now.AddHours(-1).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Looking for Tennis Partners",
                    content = "Anyone interested in playing tennis on weekends? I'm looking for partners of all skill levels. We have access to courts at the local park. Let me know if you're interested!",
                    category_id = categoryIds["Community"],
                    author_id = userIds[1],
                    price = (double?)null,
                    location = "City Park",
                    image_url = "https://images.unsplash.com/photo-1534158914592-062992fbe900?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 56,
                    created_at = now.AddHours(-3).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Web Developer Needed - Full Time",
                    content = "We're looking for an experienced web developer to join our team. React, TypeScript, and Node.js experience required. Remote work available. Competitive salary and benefits.",
                    category_id = categoryIds["Jobs"],
                    author_id = userIds[4],
                    price = (double?)null,
                    location = "Remote / Office",
                    image_url = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 312,
                    created_at = now.AddHours(-4).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Photography Services Available",
                    content = "Professional photographer offering services for events, portraits, and product photography. 10+ years of experience. Check out my portfolio and contact me for quotes!",
                    category_id = categoryIds["Services"],
                    author_id = userIds[3],
                    price = (double?)null,
                    location = "Citywide",
                    image_url = "https://picsum.photos/800/600?random=2",
                    is_featured = false,
                    views = 78,
                    created_at = now.AddHours(-6).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Summer Music Festival - Tickets Available",
                    content = "Don't miss the annual summer music festival! Three days of amazing artists, food vendors, and activities. Early bird tickets on sale now. Family-friendly event!",
                    category_id = categoryIds["Events"],
                    author_id = userIds[2],
                    price = (double?)null,
                    location = "Riverside Park",
                    image_url = "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 445,
                    created_at = now.AddHours(-7).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "2BR Apartment for Rent",
                    content = "Beautiful 2-bedroom apartment available for rent. Recently renovated, includes parking and utilities. Pet-friendly. Available immediately. Contact for viewing!",
                    category_id = categoryIds["Housing"],
                    author_id = userIds[4],
                    price = (double?)1200.00,
                    location = "Central District",
                    image_url = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 189,
                    created_at = now.AddHours(-9).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Yoga Classes Starting Next Month",
                    content = "New yoga classes starting in the community center. All levels welcome. Classes will be held Monday, Wednesday, and Friday evenings. Sign up now!",
                    category_id = categoryIds["Events"],
                    author_id = userIds[0],
                    price = (double?)null,
                    location = "Community Center",
                    image_url = "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 92,
                    created_at = now.AddHours(-10).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Bike Repair Service",
                    content = "Experienced bike mechanic offering repair and maintenance services. Quick turnaround, fair prices. Mobile service available. Call or message for appointment!",
                    category_id = categoryIds["Services"],
                    author_id = userIds[1],
                    price = (double?)null,
                    location = "Mobile Service",
                    image_url = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 34,
                    created_at = now.AddHours(-11).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Book Club Meeting - New Members Welcome",
                    content = "Our book club is reading 'The Great Gatsby' this month. Meeting next Thursday at 7 PM at the local cafe. New members always welcome!",
                    category_id = categoryIds["Community"],
                    author_id = userIds[3],
                    price = (double?)null,
                    location = "Downtown Cafe",
                    image_url = "https://picsum.photos/800/600?random=6",
                    is_featured = false,
                    views = 67,
                    created_at = now.AddHours(-13).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Graphic Designer Position",
                    content = "Creative agency looking for a talented graphic designer. Must be proficient in Adobe Creative Suite. Portfolio required. Great team and work environment!",
                    category_id = categoryIds["Jobs"],
                    author_id = userIds[4],
                    price = (double?)null,
                    location = "Design Studio",
                    image_url = "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 156,
                    created_at = now.AddHours(-14).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Vintage Vinyl Records Collection",
                    content = "Large collection of vintage vinyl records for sale. Rock, jazz, and classical. All in excellent condition. Willing to sell individually or as a collection.",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[2],
                    price = (double?)300.00,
                    location = "South Side",
                    image_url = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 201,
                    created_at = now.AddHours(-15).ToString("yyyy-MM-dd HH:mm:ss")
                },
                // More social media style posts with images
                new {
                    title = "",
                    content = "Just finished my morning run at the park! The weather is perfect today 🌞 Who else is enjoying this beautiful day?",
                    category_id = categoryIds["Community"],
                    author_id = userIds[0],
                    price = (double?)null,
                    location = "City Park",
                    image_url = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 156,
                    created_at = now.AddMinutes(-30).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Check out this amazing sunset I captured yesterday! Nature never fails to amaze me 🌅",
                    category_id = categoryIds["Community"],
                    author_id = userIds[1],
                    price = (double?)null,
                    location = "Beach",
                    image_url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 423,
                    created_at = now.AddHours(-6).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Made the most delicious homemade pasta tonight! Recipe in the comments if anyone wants it 🍝",
                    category_id = categoryIds["Community"],
                    author_id = userIds[2],
                    price = (double?)null,
                    location = "Home",
                    image_url = "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 89,
                    created_at = now.AddHours(-4).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Coffee and coding session at the local cafe ☕️ Working on a new project, feeling inspired!",
                    category_id = categoryIds["Community"],
                    author_id = userIds[3],
                    price = (double?)null,
                    location = "Downtown Cafe",
                    image_url = "https://picsum.photos/800/600?random=3",
                    is_featured = false,
                    views = 112,
                    created_at = now.AddHours(-3).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "iPhone 13 Pro - Like New",
                    content = "Selling my iPhone 13 Pro. 256GB, excellent condition, comes with original box and charger. Upgraded to the latest model so this one needs a new home!",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[4],
                    price = (double?)650.00,
                    location = "Central District",
                    image_url = "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 267,
                    created_at = now.AddHours(-11).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Weekend hike was incredible! The view from the top was worth every step 🏔️",
                    category_id = categoryIds["Community"],
                    author_id = userIds[1],
                    price = (double?)null,
                    location = "Mountain Trail",
                    image_url = "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1464822759844-d150ad6bf2c0?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 198,
                    created_at = now.AddDays(-1).AddHours(-5).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Designer Handbag Collection",
                    content = "Selling part of my designer handbag collection. All authentic, some with original receipts. Great condition, must see!",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[0],
                    price = (double?)850.00,
                    location = "Uptown",
                    image_url = "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 312,
                    created_at = now.AddHours(-13).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Just adopted this cutie from the local shelter! Meet Luna 🐕 She's already making our home so much brighter!",
                    category_id = categoryIds["Community"],
                    author_id = userIds[2],
                    price = (double?)null,
                    location = "Home",
                    image_url = "https://images.unsplash.com/photo-1534361960057-19889c4a8b3e?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 534,
                    created_at = now.AddDays(-2).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Vintage Motorcycle - Classic Beauty",
                    content = "1970s classic motorcycle in great running condition. Recently serviced, new tires. A real head-turner! Serious inquiries only.",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[3],
                    price = (double?)3500.00,
                    location = "Garage",
                    image_url = "https://picsum.photos/800/600?random=4",
                    is_featured = true,
                    views = 678,
                    created_at = now.AddHours(-16).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Art gallery opening was amazing! So many talented local artists. Support your local art scene! 🎨",
                    category_id = categoryIds["Events"],
                    author_id = userIds[4],
                    price = (double?)null,
                    location = "Art Gallery",
                    image_url = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 145,
                    created_at = now.AddHours(-8).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Morning meditation session in the garden. Starting the day with peace and gratitude 🙏",
                    category_id = categoryIds["Community"],
                    author_id = userIds[0],
                    price = (double?)null,
                    location = "Home Garden",
                    image_url = "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 87,
                    created_at = now.AddDays(-1).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Guitar and Amplifier Set",
                    content = "Electric guitar with amplifier for sale. Perfect for beginners or intermediate players. Includes case and cables.",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[1],
                    price = (double?)275.00,
                    location = "Music Store",
                    image_url = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 203,
                    created_at = now.AddHours(-14).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Farmers market haul! Fresh produce, local honey, and the best bread in town. Supporting local businesses! 🥖🍯",
                    category_id = categoryIds["Community"],
                    author_id = userIds[3],
                    price = (double?)null,
                    location = "Farmers Market",
                    image_url = "https://picsum.photos/800/600?random=5",
                    is_featured = false,
                    views = 124,
                    created_at = now.AddDays(-1).AddHours(-3).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Beach volleyball tournament this weekend! Come cheer us on or join a team. All skill levels welcome! 🏐",
                    category_id = categoryIds["Events"],
                    author_id = userIds[2],
                    price = (double?)null,
                    location = "Beach Courts",
                    image_url = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 289,
                    created_at = now.AddHours(-9).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "Vintage Typewriter Collection",
                    content = "Beautiful collection of vintage typewriters. All in working condition. Perfect for collectors or writers who love the classic feel!",
                    category_id = categoryIds["For Sale"],
                    author_id = userIds[4],
                    price = (double?)450.00,
                    location = "Antique Shop",
                    image_url = "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 167,
                    created_at = now.AddHours(-17).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "New recipe experiment: homemade sourdough bread! First attempt and it turned out pretty good! 🍞",
                    category_id = categoryIds["Community"],
                    author_id = userIds[1],
                    price = (double?)null,
                    location = "Home Kitchen",
                    image_url = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&h=600&fit=crop",
                    is_featured = false,
                    views = 203,
                    created_at = now.AddDays(-2).AddHours(-2).ToString("yyyy-MM-dd HH:mm:ss")
                },
                new {
                    title = "",
                    content = "Street art festival downtown! Amazing murals being painted live. Come check it out! 🎨",
                    category_id = categoryIds["Events"],
                    author_id = userIds[0],
                    price = (double?)null,
                    location = "Downtown",
                    image_url = "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop,https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=800&h=600&fit=crop",
                    is_featured = true,
                    views = 456,
                    created_at = now.AddHours(-5).ToString("yyyy-MM-dd HH:mm:ss")
                }
            };

            int postsCreated = 0;
            int postsUpdated = 0;
            foreach (var post in posts)
            {
                // Use reflection to get image_url if it exists
                var imageUrlProperty = post.GetType().GetProperty("image_url");
                string? imageUrl = null;
                if (imageUrlProperty != null)
                {
                    imageUrl = imageUrlProperty.GetValue(post) as string;
                }

                // Check if post already exists (by title and author, or by content if title is empty)
                var existing = await _databaseService.QueryAsync(
                    string.IsNullOrEmpty(post.title) 
                        ? "SELECT id, image_url FROM posts WHERE content = $content AND author_id = $author_id LIMIT 1"
                        : "SELECT id, image_url FROM posts WHERE title = $title AND author_id = $author_id LIMIT 1",
                    new Dictionary<string, object?>
                    {
                        ["title"] = post.title ?? "",
                        ["content"] = post.content,
                        ["author_id"] = post.author_id
                    }
                );

                if (existing.Count == 0 || existing[0].ContainsKey("error"))
                {
                    // Create new post
                    var postParams = new Dictionary<string, object?>
                    {
                        ["title"] = post.title ?? "",
                        ["content"] = post.content,
                        ["category_id"] = post.category_id,
                        ["author_id"] = post.author_id,
                        ["location"] = post.location,
                        ["is_featured"] = post.is_featured ? 1 : 0,
                        ["views"] = post.views,
                        ["created_at"] = post.created_at
                    };

                    if (post.price.HasValue)
                    {
                        postParams["price"] = post.price.Value;
                    }

                    if (!string.IsNullOrEmpty(imageUrl))
                    {
                        postParams["image_url"] = imageUrl;
                    }

                    // Build dynamic SQL based on what fields we have
                    var columns = string.Join(",", postParams.Keys);
                    var values = string.Join(",", postParams.Keys.Select(k => $"${k}"));
                    var sql = $"INSERT INTO posts({columns}) VALUES({values})";

                    await _databaseService.QueryAsync(sql, postParams);
                    postsCreated++;
                }
                else if (!string.IsNullOrEmpty(imageUrl))
                {
                    // Update existing post with image if it doesn't have one
                    var existingPost = existing[0];
                    var existingImageUrl = existingPost.ContainsKey("image_url") ? existingPost["image_url"]?.ToString() : null;
                    
                    if (string.IsNullOrEmpty(existingImageUrl))
                    {
                        var postId = existingPost["id"];
                        await _databaseService.QueryAsync(
                            "UPDATE posts SET image_url = $image_url WHERE id = $id",
                            new Dictionary<string, object?>
                            {
                                ["id"] = postId,
                                ["image_url"] = imageUrl
                            }
                        );
                        postsUpdated++;
                    }
                }
            }

            return Ok(new
            {
                message = "Test data seeded successfully",
                categoriesCreated = categories.Length,
                usersCreated = testUsers.Length,
                postsCreated = postsCreated,
                postsUpdated = postsUpdated
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding test data");
            return StatusCode(500, new { error = ex.Message });
        }
    }

    private async Task EnsureTablesExist()
    {
        // Create categories table if it doesn't exist
        await _databaseService.QueryAsync(@"
            CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                color TEXT NOT NULL DEFAULT '#1d9bf0'
            )
        ");

        // Create posts table if it doesn't exist
        await _databaseService.QueryAsync(@"
            CREATE TABLE IF NOT EXISTS posts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category_id INTEGER NOT NULL,
                author_id INTEGER NOT NULL,
                price REAL,
                location TEXT,
                image_url TEXT,
                is_featured INTEGER DEFAULT 0,
                views INTEGER DEFAULT 0,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (category_id) REFERENCES categories(id),
                FOREIGN KEY (author_id) REFERENCES users(id)
            )
        ");
    }
}

