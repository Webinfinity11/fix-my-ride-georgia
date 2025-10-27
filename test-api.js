#!/usr/bin/env node

/**
 * Test script for Fuel Prices API integration
 * Tests all 6 companies and displays results
 */

const API_BASE_URL = "https://fuel-prices-backend.onrender.com";

const companies = ["wissol", "portal", "connect", "socar", "gulf", "rompetrol"];

async function testHealthCheck() {
  console.log("🏥 Testing Health Check...\n");

  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();

    console.log("✅ Health Check Success:");
    console.log(`   Status: ${data.status}`);
    console.log(`   Uptime: ${Math.floor(data.uptime)}s`);
    console.log(`   Companies: ${data.companies.join(", ")}`);
    console.log("");

    return true;
  } catch (error) {
    console.error("❌ Health Check Failed:", error.message);
    return false;
  }
}

async function testCompany(companyName) {
  console.log(`⛽ Testing ${companyName.toUpperCase()}...`);

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/fuel-prices/${companyName}?english=true`
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "API returned unsuccessful response");
    }

    console.log(`   ✅ Success (${data.scrapeDuration}ms)`);
    console.log(`   Company: ${data.data.company}`);
    console.log(`   Fuel Types: ${data.data.totalFuelTypes}`);
    console.log(`   Price Range: ${data.data.priceRange.min} - ${data.data.priceRange.max} GEL`);

    // Show first 3 fuel prices
    console.log(`   Fuels:`);
    data.data.fuelPrices.slice(0, 3).forEach((fuel) => {
      const name = fuel.fuelTypeEnglish || fuel.fuelType;
      console.log(`      • ${name}: ${fuel.price} GEL`);
    });

    console.log("");
    return true;
  } catch (error) {
    console.error(`   ❌ Failed: ${error.message}`);
    console.log("");
    return false;
  }
}

async function main() {
  console.log("═══════════════════════════════════════════════════════");
  console.log("  🧪 Fuel Prices API Integration Test");
  console.log("═══════════════════════════════════════════════════════\n");

  // Test health check first
  const healthOk = await testHealthCheck();

  if (!healthOk) {
    console.log("⚠️  Health check failed. API might be down.");
    console.log("Continuing with company tests anyway...\n");
  }

  // Test each company
  const results = [];

  for (const company of companies) {
    const success = await testCompany(company);
    results.push({ company, success });
  }

  // Summary
  console.log("═══════════════════════════════════════════════════════");
  console.log("  📊 Test Summary");
  console.log("═══════════════════════════════════════════════════════\n");

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

  console.log(`Total Companies: ${results.length}`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log("");

  if (failCount > 0) {
    console.log("Failed companies:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   • ${r.company}`);
      });
    console.log("");
  }

  if (successCount === results.length) {
    console.log("🎉 All tests passed!");
  } else if (successCount > 0) {
    console.log("⚠️  Some tests failed, but API is partially working.");
  } else {
    console.log("❌ All tests failed. API might be down or unreachable.");
  }

  console.log("");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
