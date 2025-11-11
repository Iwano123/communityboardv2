#!/usr/bin/env node
/**
 * Debug script to check user roles and permissions
 * Run: node scripts/check-user-roles.js
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

async function checkUserRoles() {
  console.log('🔍 Checking user roles and permissions...\n');

  try {
    // Login
    console.log('1. Logging in...');
    const loginResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        usernameOrEmail: ADMIN_USERNAME,
        password: ADMIN_PASSWORD
      }
    });

    console.log('✅ Logged in successfully');
    console.log('   Username:', loginResponse.data.username);
    console.log('   Roles:', loginResponse.data.roles);
    console.log('');

    // Check current user
    console.log('2. Checking current user...');
    const userResponse = await makeRequest(`${API_BASE}/auth/login`, {
      method: 'GET'
    });
    console.log('   Response:', JSON.stringify(userResponse.data, null, 2));
    console.log('');

    // Try to get RestPermissions
    console.log('3. Checking RestPermissions...');
    try {
      const permissionsResponse = await makeRequest(`${API_BASE}/RestPermissions`);
      console.log(`   Found ${permissionsResponse.data.length} RestPermissions entries:`);
      permissionsResponse.data.forEach((perm, index) => {
        console.log(`   ${index + 1}. Title: ${perm.title || 'N/A'}`);
        console.log(`      Roles: ${perm.roles || 'N/A'}`);
        console.log(`      Content Types: ${perm.contentTypes || 'N/A'}`);
        console.log(`      REST Methods: ${perm.restMethods || 'N/A'}`);
        console.log('');
      });
    } catch (error) {
      console.log('   ❌ Could not fetch RestPermissions:', error.message);
      console.log('   This might mean there are no permissions set up yet.');
      console.log('');
    }

    // Try to create a test post
    console.log('4. Testing POST permission...');
    try {
      const testPost = {
        title: "Test Post",
        content: "This is a test",
        authorId: ADMIN_USERNAME,
        likes: 0,
        isPublished: true
      };
      const postResponse = await makeRequest(`${API_BASE}/Post`, {
        method: 'POST',
        body: testPost
      });
      console.log('   ✅ Successfully created test post!');
      console.log('   Post ID:', postResponse.data.id);
      
      // Clean up - delete the test post
      console.log('   Cleaning up test post...');
      try {
        await makeRequest(`${API_BASE}/Post/${postResponse.data.id}`, {
          method: 'DELETE'
        });
        console.log('   ✅ Test post deleted');
      } catch (deleteError) {
        console.log('   ⚠️  Could not delete test post:', deleteError.message);
      }
    } catch (error) {
      console.log('   ❌ Failed to create test post:', error.message);
      console.log('');
      console.log('   💡 This means you need to create RestPermissions for Administrator role.');
      console.log('   See FIX_PERMISSIONS.md for instructions.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserRoles().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

