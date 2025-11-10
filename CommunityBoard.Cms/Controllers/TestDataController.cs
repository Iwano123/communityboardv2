using Microsoft.AspNetCore.Mvc;
using CommunityBoard.Cms.Services;
using System.Collections.Generic;
using System.Text.Json;

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
                    is_featured = false,
                    views = 201,
                    created_at = now.AddHours(-15).ToString("yyyy-MM-dd HH:mm:ss")
                }
            };

            int postsCreated = 0;
            foreach (var post in posts)
            {
                // Check if post already exists (by title and author)
                var existing = await _databaseService.QueryAsync(
                    "SELECT id FROM posts WHERE title = $title AND author_id = $author_id",
                    new Dictionary<string, object?>
                    {
                        ["title"] = post.title,
                        ["author_id"] = post.author_id
                    }
                );

                if (existing.Count == 0 || existing[0].ContainsKey("error"))
                {
                    var postParams = new Dictionary<string, object?>
                    {
                        ["title"] = post.title,
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

                    await _databaseService.QueryAsync(
                        "INSERT INTO posts(title, content, category_id, author_id, price, location, is_featured, views, created_at) VALUES($title, $content, $category_id, $author_id, $price, $location, $is_featured, $views, $created_at)",
                        postParams
                    );
                    postsCreated++;
                }
            }

            return Ok(new
            {
                message = "Test data seeded successfully",
                categoriesCreated = categories.Length,
                usersCreated = testUsers.Length,
                postsCreated = postsCreated
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

