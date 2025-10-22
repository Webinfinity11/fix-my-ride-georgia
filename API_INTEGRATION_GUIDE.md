# Fuel Prices API - Integration Guide

> Comprehensive documentation for integrating Georgian fuel price data into your applications

**Version**: 1.0.0
**Last Updated**: October 22, 2025
**Base URL**: `http://localhost:3001` (or your deployed URL)

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Endpoints Documentation](#endpoints-documentation)
5. [Data Schema](#data-schema)
6. [Integration Examples](#integration-examples)
7. [Rate Limiting & Caching](#rate-limiting--caching)
8. [Best Practices](#best-practices)
9. [Error Codes & Troubleshooting](#error-codes--troubleshooting)
10. [Use Cases](#use-cases)
11. [FAQ](#faq)

---

## API Overview

### What is the Fuel Prices API?

The Fuel Prices API is a RESTful web service that provides real-time fuel price data from major Georgian gas station companies. The API scrapes data from [priceshub.ge](https://priceshub.ge/) and serves it in a clean, structured JSON format.

### Who is this API for?

This API is designed for:
- **Web Developers**: Building price comparison websites or dashboards
- **Mobile App Developers**: Creating fuel finder apps for iOS/Android
- **Data Analysts**: Analyzing fuel price trends and market dynamics
- **Business Intelligence**: Integrating fuel costs into logistics and fleet management systems
- **Third-Party Services**: Any application that needs Georgian fuel price data

### Key Features

- **7 Major Companies**: Gulf, Socar, Lukoil, Wissol, Rompetrol, Portal, Connect
- **44+ Fuel Types**: Comprehensive coverage including gasoline, diesel, CNG, LPG
- **Smart Caching**: 15-minute cache reduces load and ensures fast responses
- **Rate Limiting**: Fair usage policy (30 requests/minute per IP)
- **JSON Format**: Clean, consistent data structure
- **No Authentication Required**: Open access for development (authentication can be added for production)
- **Best Price Finder**: Built-in endpoint to find lowest prices across all companies
- **Company-Specific Queries**: Filter data by specific gas station brands

### Data Source

All data is scraped from: `https://priceshub.ge/conti/result.php`

---

## Getting Started

### Prerequisites

- Basic understanding of REST APIs
- HTTP client (curl, Postman, or programming language of choice)
- Your API base URL (replace `localhost:3001` with your deployed URL)

### Your First Request

Let's make a simple request to check if the API is running:

```bash
curl http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-22T12:00:00.000Z",
  "uptime": 3600.5,
  "cache": {
    "keys": 3,
    "stats": {
      "hits": 145,
      "misses": 12,
      "keys": 3,
      "ksize": 3,
      "vsize": 3
    }
  }
}
```

### Quick Start: Get All Fuel Prices

```bash
curl http://localhost:3001/api/fuel-prices
```

That's it! You now have access to fuel prices from all 7 companies.

---

## Authentication

### Current Status: No Authentication Required

The API currently operates without authentication, making it easy to get started during development. All endpoints are publicly accessible.

### Production Considerations

For production deployments, we recommend implementing:
- **API Keys**: Add `x-api-key` header authentication
- **OAuth 2.0**: For more complex authorization scenarios
- **IP Whitelisting**: Restrict access to known clients
- **JWT Tokens**: For user-specific access patterns

**Note**: If you need authentication implemented, please contact the API maintainers.

---

## Endpoints Documentation

### 1. Health Check

Check if the API is running and view cache statistics.

**Endpoint**: `GET /api/health`

**Parameters**: None

**Request Examples:**

```bash
# cURL
curl http://localhost:3001/api/health
```

```javascript
// JavaScript (Fetch)
fetch('http://localhost:3001/api/health')
  .then(response => response.json())
  .then(data => console.log(data));
```

```python
# Python (requests)
import requests

response = requests.get('http://localhost:3001/api/health')
data = response.json()
print(data)
```

**Response Format:**

```json
{
  "status": "ok",
  "timestamp": "2025-10-22T12:00:00.000Z",
  "uptime": 3600.5,
  "cache": {
    "keys": 3,
    "stats": {
      "hits": 145,
      "misses": 12,
      "keys": 3,
      "ksize": 3,
      "vsize": 3
    }
  }
}
```

**Response Fields:**
- `status`: API health status (always "ok" if running)
- `timestamp`: Current server time
- `uptime`: Server uptime in seconds
- `cache.keys`: Number of cached items
- `cache.stats`: Cache hit/miss statistics

**Use Cases:**
- Monitoring API availability
- Checking cache performance
- Health checks in load balancers

---

### 2. Get All Fuel Prices

Retrieve fuel prices from all companies in a single request.

**Endpoint**: `GET /api/fuel-prices`

**Query Parameters:**
- `refresh` (optional): Set to `true` to bypass cache and force fresh scrape

**Request Examples:**

```bash
# cURL - Get cached data
curl http://localhost:3001/api/fuel-prices

# cURL - Force fresh scrape
curl http://localhost:3001/api/fuel-prices?refresh=true
```

```javascript
// JavaScript (Fetch)
async function getAllPrices(forceRefresh = false) {
  const url = `http://localhost:3001/api/fuel-prices${forceRefresh ? '?refresh=true' : ''}`;
  const response = await fetch(url);
  return await response.json();
}

// Usage
const prices = await getAllPrices();
console.log(prices);
```

```javascript
// JavaScript (Axios)
const axios = require('axios');

const getPrices = async (forceRefresh = false) => {
  try {
    const response = await axios.get('http://localhost:3001/api/fuel-prices', {
      params: { refresh: forceRefresh }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching prices:', error);
  }
};
```

```python
# Python (requests)
import requests

def get_all_prices(force_refresh=False):
    params = {'refresh': 'true'} if force_refresh else {}
    response = requests.get('http://localhost:3001/api/fuel-prices', params=params)
    return response.json()

# Usage
prices = get_all_prices()
print(f"Found {prices['data']['totalCompanies']} companies")
```

**Response Format:**

```json
{
  "success": true,
  "timestamp": "2025-10-22T12:00:00.000Z",
  "source": "https://priceshub.ge/conti/result.php",
  "scrapeDuration": 1234,
  "cached": true,
  "cacheAge": 120,
  "data": {
    "companies": [
      {
        "name": "Gulf",
        "fuelPrices": [
          {
            "fuelType": "სუპერ ექტო 100",
            "price": 3.45,
            "currency": "GEL"
          },
          {
            "fuelType": "პრემიუმ ექტო 95",
            "price": 3.29,
            "currency": "GEL"
          }
        ]
      },
      {
        "name": "Socar",
        "fuelPrices": [
          {
            "fuelType": "პრემიუმ 95",
            "price": 3.25,
            "currency": "GEL"
          }
        ]
      }
    ],
    "totalCompanies": 7,
    "totalFuelTypes": 44
  }
}
```

**Response Fields:**
- `success`: Boolean indicating if the request was successful
- `timestamp`: When the data was fetched
- `source`: Original data source URL
- `scrapeDuration`: How long the scraping took (in milliseconds)
- `cached`: Whether this data came from cache
- `cacheAge`: Age of cached data in seconds (0 if fresh)
- `data.companies`: Array of company objects
- `data.totalCompanies`: Total number of companies
- `data.totalFuelTypes`: Total number of fuel types across all companies

**Error Responses:**

```json
{
  "success": false,
  "timestamp": "2025-10-22T12:00:00.000Z",
  "error": "Failed to fetch data after 3 attempts",
  "message": "Connection timeout"
}
```

---

### 3. Get Best Prices

Find the lowest price for each fuel type across all companies.

**Endpoint**: `GET /api/fuel-prices/best`

**Query Parameters:**
- `refresh` (optional): Set to `true` to bypass cache and force fresh scrape

**Request Examples:**

```bash
# cURL
curl http://localhost:3001/api/fuel-prices/best
```

```javascript
// JavaScript (Fetch)
fetch('http://localhost:3001/api/fuel-prices/best')
  .then(response => response.json())
  .then(data => {
    data.data.bestPrices.forEach(item => {
      console.log(`${item.fuelType}: ${item.price} GEL at ${item.company}`);
    });
  });
```

```python
# Python
import requests

response = requests.get('http://localhost:3001/api/fuel-prices/best')
best_prices = response.json()

for item in best_prices['data']['bestPrices']:
    print(f"{item['fuelType']}: {item['price']} GEL at {item['company']}")
```

**Response Format:**

```json
{
  "success": true,
  "timestamp": "2025-10-22T12:00:00.000Z",
  "source": "https://priceshub.ge/conti/result.php",
  "cached": true,
  "cacheAge": 45,
  "data": {
    "bestPrices": [
      {
        "fuelType": "პრემიუმ 95",
        "price": 3.19,
        "currency": "GEL",
        "company": "Socar"
      },
      {
        "fuelType": "დიზელი",
        "price": 3.05,
        "currency": "GEL",
        "company": "Lukoil"
      },
      {
        "fuelType": "CNG",
        "price": 1.85,
        "currency": "GEL",
        "company": "Portal"
      }
    ]
  }
}
```

**Use Cases:**
- Price comparison websites
- "Cheapest fuel near me" features
- Cost optimization for fleet management
- Consumer savings calculators

---

### 4. Get Company-Specific Prices

Retrieve fuel prices for a specific gas station company.

**Endpoint**: `GET /api/fuel-prices/company/:name`

**Path Parameters:**
- `name`: Company name (case-insensitive)
  - Available: `gulf`, `socar`, `lukoil`, `wissol`, `rompetrol`, `portal`, `connect`

**Query Parameters:**
- `refresh` (optional): Set to `true` to bypass cache

**Request Examples:**

```bash
# cURL
curl http://localhost:3001/api/fuel-prices/company/gulf
curl http://localhost:3001/api/fuel-prices/company/Socar
curl http://localhost:3001/api/fuel-prices/company/WISSOL
```

```javascript
// JavaScript (Fetch)
async function getCompanyPrices(companyName) {
  const response = await fetch(
    `http://localhost:3001/api/fuel-prices/company/${companyName}`
  );
  return await response.json();
}

// Usage
const gulfPrices = await getCompanyPrices('gulf');
console.log(gulfPrices);
```

```python
# Python
import requests

def get_company_prices(company_name):
    url = f'http://localhost:3001/api/fuel-prices/company/{company_name}'
    response = requests.get(url)
    return response.json()

# Usage
gulf_prices = get_company_prices('gulf')
print(gulf_prices)
```

**Success Response:**

```json
{
  "success": true,
  "timestamp": "2025-10-22T12:00:00.000Z",
  "source": "https://priceshub.ge/conti/result.php",
  "cached": false,
  "cacheAge": 0,
  "data": {
    "name": "Gulf",
    "fuelPrices": [
      {
        "fuelType": "სუპერ ექტო 100",
        "price": 3.45,
        "currency": "GEL"
      },
      {
        "fuelType": "პრემიუმ ექტო 95",
        "price": 3.29,
        "currency": "GEL"
      },
      {
        "fuelType": "რეგულარი 92",
        "price": 3.15,
        "currency": "GEL"
      },
      {
        "fuelType": "დიზელი",
        "price": 3.10,
        "currency": "GEL"
      }
    ]
  }
}
```

**Error Response (Company Not Found):**

```json
{
  "success": false,
  "timestamp": "2025-10-22T12:00:00.000Z",
  "error": "Company 'invalid' not found",
  "availableCompanies": [
    "Gulf",
    "Socar",
    "Lukoil",
    "Wissol",
    "Rompetrol",
    "Portal",
    "Connect"
  ]
}
```

**Use Cases:**
- Brand-specific mobile apps (e.g., "Gulf Fuel Finder")
- Loyalty program integrations
- Company-specific price alerts
- Competitor price monitoring

---

### 5. Additional Endpoints

#### Clear Cache (Admin)

Force clear all cached data.

**Endpoint**: `GET /api/cache/clear`

```bash
curl http://localhost:3001/api/cache/clear
```

**Response:**
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "keysCleared": 3,
  "timestamp": "2025-10-22T12:00:00.000Z"
}
```

#### Cache Statistics

View detailed cache statistics.

**Endpoint**: `GET /api/cache/stats`

```bash
curl http://localhost:3001/api/cache/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "hits": 245,
    "misses": 18,
    "keys": 3,
    "ksize": 3,
    "vsize": 3
  },
  "keys": ["all-fuel-prices", "best-fuel-prices", "company-gulf"],
  "ttl": 900,
  "timestamp": "2025-10-22T12:00:00.000Z"
}
```

---

## Data Schema

### Company Object

```typescript
interface Company {
  name: string;           // Company name (e.g., "Gulf", "Socar")
  fuelPrices: FuelPrice[]; // Array of fuel prices
}
```

### FuelPrice Object

```typescript
interface FuelPrice {
  fuelType: string;   // Fuel type name (e.g., "პრემიუმ 95", "დიზელი")
  price: number;      // Price in GEL (Georgian Lari)
  currency: string;   // Always "GEL"
}
```

### API Response Envelope

All successful API responses follow this structure:

```typescript
interface ApiResponse {
  success: boolean;        // true for success, false for errors
  timestamp: string;       // ISO 8601 timestamp
  source?: string;         // Original data source URL
  scrapeDuration?: number; // Time taken to scrape (ms)
  cached?: boolean;        // Whether data came from cache
  cacheAge?: number;       // Age of cached data (seconds)
  data?: any;             // Response data (varies by endpoint)
  error?: string;         // Error message (only on failure)
  message?: string;       // Additional context
}
```

### Fuel Type Names

Fuel types are in Georgian language. Common types include:

| Georgian | English | Typical Code |
|----------|---------|--------------|
| პრემიუმ 95 | Premium 95 | Gasoline 95 octane |
| რეგულარი 92 | Regular 92 | Gasoline 92 octane |
| სუპერ ექტო 100 | Super Ecto 100 | Premium 100 octane |
| დიზელი | Diesel | Diesel fuel |
| ევრო დიზელი | Euro Diesel | Euro standard diesel |
| CNG | CNG | Compressed Natural Gas |
| LPG | LPG | Liquefied Petroleum Gas |

---

## Integration Examples

### React Frontend

```javascript
// hooks/useFuelPrices.js
import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001';

export const useFuelPrices = (companyName = null, autoRefresh = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrices = async (forceRefresh = false) => {
    try {
      setLoading(true);

      let url = companyName
        ? `${API_BASE_URL}/api/fuel-prices/company/${companyName}`
        : `${API_BASE_URL}/api/fuel-prices`;

      if (forceRefresh) {
        url += '?refresh=true';
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch prices');
      }

      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    // Auto-refresh every 5 minutes if enabled
    if (autoRefresh) {
      const interval = setInterval(() => fetchPrices(), 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [companyName, autoRefresh]);

  return { data, loading, error, refetch: () => fetchPrices(true) };
};

// Usage in component
import React from 'react';
import { useFuelPrices } from './hooks/useFuelPrices';

function FuelPricesList() {
  const { data, loading, error, refetch } = useFuelPrices();

  if (loading) return <div>Loading fuel prices...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Current Fuel Prices</h1>
      <button onClick={refetch}>Refresh Prices</button>

      {data.data.companies.map(company => (
        <div key={company.name}>
          <h2>{company.name}</h2>
          <ul>
            {company.fuelPrices.map((fuel, idx) => (
              <li key={idx}>
                {fuel.fuelType}: {fuel.price} {fuel.currency}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <p>
        Data cached: {data.cached ? 'Yes' : 'No'}
        {data.cached && ` (${data.cacheAge}s old)`}
      </p>
    </div>
  );
}

export default FuelPricesList;
```

### Vue.js Frontend

```javascript
// composables/useFuelPrices.js
import { ref, onMounted, onUnmounted } from 'vue';

export function useFuelPrices(companyName = null, autoRefresh = false) {
  const data = ref(null);
  const loading = ref(true);
  const error = ref(null);
  let refreshInterval = null;

  const API_BASE_URL = 'http://localhost:3001';

  const fetchPrices = async (forceRefresh = false) => {
    try {
      loading.value = true;
      error.value = null;

      let url = companyName
        ? `${API_BASE_URL}/api/fuel-prices/company/${companyName}`
        : `${API_BASE_URL}/api/fuel-prices`;

      if (forceRefresh) {
        url += '?refresh=true';
      }

      const response = await fetch(url);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch prices');
      }

      data.value = result;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchPrices();

    if (autoRefresh) {
      refreshInterval = setInterval(() => fetchPrices(), 5 * 60 * 1000);
    }
  });

  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
  });

  return {
    data,
    loading,
    error,
    refetch: () => fetchPrices(true)
  };
}

// Usage in component
<template>
  <div>
    <h1>Current Fuel Prices</h1>
    <button @click="refetch" :disabled="loading">Refresh</button>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error }}</div>
    <div v-else>
      <div v-for="company in data.data.companies" :key="company.name">
        <h2>{{ company.name }}</h2>
        <ul>
          <li v-for="(fuel, idx) in company.fuelPrices" :key="idx">
            {{ fuel.fuelType }}: {{ fuel.price }} {{ fuel.currency }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useFuelPrices } from './composables/useFuelPrices';

const { data, loading, error, refetch } = useFuelPrices(null, true);
</script>
```

### Node.js Backend Service

```javascript
// services/fuelPriceService.js
const axios = require('axios');

class FuelPriceService {
  constructor(apiBaseUrl = 'http://localhost:3001') {
    this.apiBaseUrl = apiBaseUrl;
    this.client = axios.create({
      baseURL: apiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Get all fuel prices
   */
  async getAllPrices(forceRefresh = false) {
    try {
      const response = await this.client.get('/api/fuel-prices', {
        params: { refresh: forceRefresh }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get best prices across all companies
   */
  async getBestPrices(forceRefresh = false) {
    try {
      const response = await this.client.get('/api/fuel-prices/best', {
        params: { refresh: forceRefresh }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get prices for a specific company
   */
  async getCompanyPrices(companyName, forceRefresh = false) {
    try {
      const response = await this.client.get(
        `/api/fuel-prices/company/${companyName}`,
        { params: { refresh: forceRefresh } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const response = await this.client.get('/api/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Find cheapest fuel of a specific type
   */
  async findCheapestFuel(fuelType) {
    const result = await this.getAllPrices();

    let cheapest = null;

    result.data.companies.forEach(company => {
      company.fuelPrices.forEach(fuel => {
        if (fuel.fuelType.includes(fuelType)) {
          if (!cheapest || fuel.price < cheapest.price) {
            cheapest = {
              ...fuel,
              company: company.name
            };
          }
        }
      });
    });

    return cheapest;
  }

  /**
   * Handle API errors
   */
  handleError(error) {
    if (error.response) {
      // API responded with error
      return new Error(
        error.response.data.message ||
        error.response.data.error ||
        'API request failed'
      );
    } else if (error.request) {
      // No response received
      return new Error('No response from API server');
    } else {
      // Request setup error
      return new Error(error.message);
    }
  }
}

// Usage example
const fuelService = new FuelPriceService();

async function example() {
  try {
    // Get all prices
    const allPrices = await fuelService.getAllPrices();
    console.log('Total companies:', allPrices.data.totalCompanies);

    // Get best prices
    const bestPrices = await fuelService.getBestPrices();
    console.log('Best prices:', bestPrices.data.bestPrices);

    // Get Gulf prices
    const gulfPrices = await fuelService.getCompanyPrices('gulf');
    console.log('Gulf:', gulfPrices.data);

    // Find cheapest diesel
    const cheapestDiesel = await fuelService.findCheapestFuel('დიზელი');
    console.log('Cheapest diesel:', cheapestDiesel);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

module.exports = FuelPriceService;
```

### Python Backend

```python
# fuel_price_client.py
import requests
from typing import Optional, Dict, List
from datetime import datetime

class FuelPriceClient:
    """Client for interacting with the Fuel Prices API"""

    def __init__(self, base_url: str = "http://localhost:3001"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })

    def get_all_prices(self, force_refresh: bool = False) -> Dict:
        """Get all fuel prices from all companies"""
        params = {'refresh': 'true'} if force_refresh else {}
        response = self.session.get(
            f"{self.base_url}/api/fuel-prices",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json()

    def get_best_prices(self, force_refresh: bool = False) -> Dict:
        """Get the best (lowest) prices for each fuel type"""
        params = {'refresh': 'true'} if force_refresh else {}
        response = self.session.get(
            f"{self.base_url}/api/fuel-prices/best",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json()

    def get_company_prices(self, company_name: str, force_refresh: bool = False) -> Dict:
        """Get prices for a specific company"""
        params = {'refresh': 'true'} if force_refresh else {}
        response = self.session.get(
            f"{self.base_url}/api/fuel-prices/company/{company_name}",
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json()

    def check_health(self) -> Dict:
        """Check API health status"""
        response = self.session.get(f"{self.base_url}/api/health", timeout=5)
        response.raise_for_status()
        return response.json()

    def find_cheapest_fuel(self, fuel_type_keyword: str) -> Optional[Dict]:
        """Find the cheapest fuel matching a keyword"""
        data = self.get_all_prices()

        cheapest = None

        for company in data['data']['companies']:
            for fuel in company['fuelPrices']:
                if fuel_type_keyword.lower() in fuel['fuelType'].lower():
                    if cheapest is None or fuel['price'] < cheapest['price']:
                        cheapest = {
                            **fuel,
                            'company': company['name']
                        }

        return cheapest

    def compare_companies(self, fuel_type_keyword: str) -> List[Dict]:
        """Compare prices of a specific fuel type across all companies"""
        data = self.get_all_prices()

        results = []

        for company in data['data']['companies']:
            for fuel in company['fuelPrices']:
                if fuel_type_keyword.lower() in fuel['fuelType'].lower():
                    results.append({
                        'company': company['name'],
                        'fuelType': fuel['fuelType'],
                        'price': fuel['price'],
                        'currency': fuel['currency']
                    })

        # Sort by price
        results.sort(key=lambda x: x['price'])

        return results

# Usage example
if __name__ == "__main__":
    client = FuelPriceClient()

    try:
        # Check health
        health = client.check_health()
        print(f"API Status: {health['status']}")

        # Get all prices
        all_prices = client.get_all_prices()
        print(f"Total companies: {all_prices['data']['totalCompanies']}")
        print(f"Total fuel types: {all_prices['data']['totalFuelTypes']}")

        # Get best prices
        best_prices = client.get_best_prices()
        print("\nBest Prices:")
        for item in best_prices['data']['bestPrices'][:5]:
            print(f"  {item['fuelType']}: {item['price']} {item['currency']} at {item['company']}")

        # Find cheapest diesel
        cheapest = client.find_cheapest_fuel('დიზელი')
        if cheapest:
            print(f"\nCheapest Diesel: {cheapest['price']} GEL at {cheapest['company']}")

        # Compare diesel prices
        diesel_comparison = client.compare_companies('დიზელი')
        print("\nDiesel Price Comparison:")
        for item in diesel_comparison:
            print(f"  {item['company']}: {item['price']} GEL")

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
```

### React Native Mobile App

```javascript
// services/FuelPriceService.js
import axios from 'axios';

const API_BASE_URL = 'http://your-api-url.com'; // Replace with your API URL

class FuelPriceService {
  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
  }

  async getAllPrices(forceRefresh = false) {
    try {
      const response = await this.client.get('/api/fuel-prices', {
        params: { refresh: forceRefresh }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getBestPrices() {
    try {
      const response = await this.client.get('/api/fuel-prices/best');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getCompanyPrices(companyName) {
    try {
      const response = await this.client.get(
        `/api/fuel-prices/company/${companyName}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  handleError(error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Request failed');
    } else if (error.request) {
      throw new Error('Network error - please check your connection');
    } else {
      throw new Error(error.message);
    }
  }
}

export default new FuelPriceService();

// screens/FuelPricesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import FuelPriceService from '../services/FuelPriceService';

const FuelPricesScreen = () => {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPrices = async () => {
    try {
      setError(null);
      const result = await FuelPriceService.getAllPrices();
      setPrices(result.data.companies);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPrices();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPrices();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Error: {error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={prices}
      keyExtractor={(item) => item.name}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      renderItem={({ item }) => (
        <View style={styles.companyCard}>
          <Text style={styles.companyName}>{item.name}</Text>
          {item.fuelPrices.map((fuel, idx) => (
            <View key={idx} style={styles.fuelRow}>
              <Text style={styles.fuelType}>{fuel.fuelType}</Text>
              <Text style={styles.price}>
                {fuel.price} {fuel.currency}
              </Text>
            </View>
          ))}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  companyCard: {
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  fuelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  fuelType: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0066cc',
  },
  error: {
    color: 'red',
    fontSize: 16,
  },
});

export default FuelPricesScreen;
```

---

## Rate Limiting & Caching

### Rate Limiting

To ensure fair usage and prevent abuse, the API implements rate limiting:

- **Limit**: 30 requests per minute per IP address
- **Window**: 60 seconds (sliding window)
- **Scope**: Per IP address

**Rate Limit Response (429 Too Many Requests):**

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Maximum 30 requests per minute allowed",
  "retryAfter": 15
}
```

**Best Practices:**
- Implement exponential backoff when receiving 429 responses
- Cache responses in your application to reduce API calls
- Use the `refresh=true` parameter sparingly (only when fresh data is critical)
- Monitor your request count and implement client-side rate limiting

**Example: Handling Rate Limits**

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = data.retryAfter || Math.pow(2, i);

        console.log(`Rate limited. Retrying after ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      return await response.json();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
    }
  }
}
```

### Caching

The API implements intelligent caching to improve performance and reduce load on the source website:

- **Cache TTL**: 15 minutes (900 seconds)
- **Cache Scope**: Per endpoint
- **Cache Keys**:
  - `all-fuel-prices` - All prices from all companies
  - `best-fuel-prices` - Best prices across companies
  - `company-{name}` - Company-specific prices

**Cache Indicators in Responses:**

```json
{
  "cached": true,      // Data came from cache
  "cacheAge": 120      // Cache age in seconds
}
```

**Working with Cache:**

1. **Normal Usage**: Let the API handle caching automatically
   ```javascript
   // Uses cache if available
   const prices = await fetch('http://localhost:3001/api/fuel-prices');
   ```

2. **Force Fresh Data**: Use `?refresh=true` when you need real-time data
   ```javascript
   // Bypasses cache, gets fresh data
   const prices = await fetch('http://localhost:3001/api/fuel-prices?refresh=true');
   ```

3. **Check Cache Age**: Monitor `cacheAge` to determine data freshness
   ```javascript
   const result = await fetch('http://localhost:3001/api/fuel-prices');
   const data = await result.json();

   if (data.cacheAge > 600) { // Older than 10 minutes
     console.log('Data is slightly stale');
   }
   ```

**Client-Side Caching Strategy:**

```javascript
class CachedFuelPriceClient {
  constructor(cacheDuration = 5 * 60 * 1000) { // 5 minutes
    this.cache = new Map();
    this.cacheDuration = cacheDuration;
  }

  async getPrices(endpoint) {
    const cached = this.cache.get(endpoint);

    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      console.log('Using client-side cache');
      return cached.data;
    }

    const response = await fetch(`http://localhost:3001${endpoint}`);
    const data = await response.json();

    this.cache.set(endpoint, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}
```

---

## Best Practices

### 1. Error Handling

Always implement robust error handling:

```javascript
async function fetchPrices() {
  try {
    const response = await fetch('http://localhost:3001/api/fuel-prices');

    // Check HTTP status
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Check API success flag
    if (!data.success) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    // Handle network errors
    if (error.name === 'TypeError') {
      console.error('Network error - check your connection');
    }
    // Handle timeout errors
    else if (error.name === 'AbortError') {
      console.error('Request timeout');
    }
    // Handle other errors
    else {
      console.error('Error:', error.message);
    }

    throw error;
  }
}
```

### 2. Respect Rate Limits

Implement client-side throttling:

```javascript
class ThrottledClient {
  constructor(requestsPerMinute = 25) { // Stay under 30 limit
    this.queue = [];
    this.requestCount = 0;
    this.maxRequests = requestsPerMinute;
    this.windowMs = 60000;

    // Reset counter every minute
    setInterval(() => {
      this.requestCount = 0;
    }, this.windowMs);
  }

  async request(url) {
    if (this.requestCount >= this.maxRequests) {
      await new Promise(resolve => setTimeout(resolve, this.windowMs));
    }

    this.requestCount++;
    return fetch(url);
  }
}
```

### 3. Use Appropriate Refresh Strategy

Only use `refresh=true` when necessary:

```javascript
// Good: Use cache for frequent updates
function Dashboard() {
  const [prices, setPrices] = useState(null);

  useEffect(() => {
    // Poll every 5 minutes, use cache
    const interval = setInterval(async () => {
      const data = await fetch('http://localhost:3001/api/fuel-prices');
      setPrices(await data.json());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);
}

// Good: Force refresh on user action
function RefreshButton() {
  const handleRefresh = async () => {
    const data = await fetch('http://localhost:3001/api/fuel-prices?refresh=true');
    // Update UI...
  };

  return <button onClick={handleRefresh}>Refresh Now</button>;
}

// Bad: Forcing refresh on every request
async function fetchPrices() {
  // Don't do this!
  return fetch('http://localhost:3001/api/fuel-prices?refresh=true');
}
```

### 4. Monitor Cache Status

Use cache metadata to optimize your application:

```javascript
async function smartFetch() {
  const response = await fetch('http://localhost:3001/api/fuel-prices');
  const data = await response.json();

  // Inform user about data freshness
  if (data.cached && data.cacheAge > 600) {
    console.log(`Data is ${Math.floor(data.cacheAge / 60)} minutes old`);
  }

  // Decide if refresh is needed
  if (data.cacheAge > 840) { // Nearly expired (14 minutes)
    // Trigger background refresh for next request
    fetch('http://localhost:3001/api/fuel-prices?refresh=true');
  }

  return data;
}
```

### 5. Handle Georgian Text

Fuel type names are in Georgian (UTF-8):

```javascript
// Ensure proper encoding
const response = await fetch('http://localhost:3001/api/fuel-prices', {
  headers: {
    'Accept-Charset': 'utf-8'
  }
});

// For searching/filtering
function searchFuelType(fuelType, searchTerm) {
  return fuelType.toLowerCase().includes(searchTerm.toLowerCase());
}

// Common translations for UI
const fuelTypeTranslations = {
  'პრემიუმ': 'Premium',
  'რეგულარი': 'Regular',
  'დიზელი': 'Diesel',
  'CNG': 'Compressed Natural Gas',
  'LPG': 'Liquefied Petroleum Gas'
};
```

### 6. Implement Fallbacks

Always have a fallback strategy:

```javascript
async function getPricesWithFallback() {
  try {
    // Try primary API
    return await fetch('http://localhost:3001/api/fuel-prices');
  } catch (primaryError) {
    console.warn('Primary API failed, trying backup...');

    try {
      // Try backup API
      return await fetch('http://backup-api.com/api/fuel-prices');
    } catch (backupError) {
      // Use cached data from local storage
      const cached = localStorage.getItem('lastKnownPrices');
      if (cached) {
        console.log('Using locally cached data');
        return JSON.parse(cached);
      }

      throw new Error('All data sources unavailable');
    }
  }
}
```

### 7. Optimize for Mobile

Mobile-specific considerations:

```javascript
// Detect network conditions
async function fetchWithNetworkAwareness() {
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection) {
    // On slow connections, always use cache
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      return fetch('http://localhost:3001/api/fuel-prices'); // Use cache
    }
  }

  // On fast connections, can refresh more often
  return fetch('http://localhost:3001/api/fuel-prices?refresh=true');
}

// Reduce data transfer
async function fetchOnlyNeededCompany(companyName) {
  // More efficient than fetching all and filtering client-side
  return fetch(`http://localhost:3001/api/fuel-prices/company/${companyName}`);
}
```

### 8. Log and Monitor

Implement proper logging:

```javascript
class MonitoredFuelClient {
  async getPrices() {
    const startTime = Date.now();

    try {
      const response = await fetch('http://localhost:3001/api/fuel-prices');
      const data = await response.json();

      const duration = Date.now() - startTime;

      // Log metrics
      console.log({
        endpoint: '/api/fuel-prices',
        duration,
        cached: data.cached,
        cacheAge: data.cacheAge,
        status: 'success'
      });

      return data;
    } catch (error) {
      console.error({
        endpoint: '/api/fuel-prices',
        duration: Date.now() - startTime,
        status: 'error',
        error: error.message
      });

      throw error;
    }
  }
}
```

---

## Error Codes & Troubleshooting

### HTTP Status Codes

| Status Code | Meaning | Common Causes | Solution |
|-------------|---------|---------------|----------|
| 200 OK | Success | - | Data retrieved successfully |
| 404 Not Found | Endpoint doesn't exist | Invalid URL, wrong company name | Check endpoint spelling and company names |
| 429 Too Many Requests | Rate limit exceeded | Too many requests | Implement rate limiting, use backoff |
| 500 Internal Server Error | Server error | Scraping failed, source site down | Retry later, check API logs |
| 503 Service Unavailable | API temporarily down | Server maintenance, overload | Implement retry logic with exponential backoff |

### Common Errors

#### 1. Company Not Found

**Error Response:**
```json
{
  "success": false,
  "error": "Company 'invalid' not found",
  "availableCompanies": ["Gulf", "Socar", "Lukoil", "Wissol", "Rompetrol", "Portal", "Connect"]
}
```

**Cause**: Invalid company name in URL parameter

**Solution**:
```javascript
// Use correct company names (case-insensitive)
const validCompanies = ['gulf', 'socar', 'lukoil', 'wissol', 'rompetrol', 'portal', 'connect'];

if (!validCompanies.includes(companyName.toLowerCase())) {
  console.error('Invalid company name');
}
```

#### 2. Network Timeout

**Error**: Request timeout or connection refused

**Causes**:
- API server is down
- Network connectivity issues
- Firewall blocking requests

**Solutions**:
```javascript
// Increase timeout
const response = await fetch('http://localhost:3001/api/fuel-prices', {
  signal: AbortSignal.timeout(15000) // 15 seconds
});

// Implement retry logic
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}
```

#### 3. CORS Errors (Browser)

**Error**: "Access-Control-Allow-Origin" error

**Cause**: Making requests from a different origin without proper CORS setup

**Solutions**:
1. **Development**: Use a proxy
   ```javascript
   // In package.json (React)
   "proxy": "http://localhost:3001"

   // Then fetch from relative URL
   fetch('/api/fuel-prices')
   ```

2. **Production**: Configure CORS on API server (already done)
   ```javascript
   // API already has CORS enabled
   app.use(cors({ origin: '*' }));
   ```

3. **Alternative**: Use server-side requests (Node.js, Python)

#### 4. Scraping Failures

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to fetch data after 3 attempts: Connection timeout"
}
```

**Causes**:
- Source website is down
- Source website structure changed
- Network issues

**Solutions**:
- Wait and retry (source site may be temporarily down)
- Check if priceshub.ge is accessible
- Report to API maintainers if persists

#### 5. Malformed JSON

**Error**: JSON parse error

**Cause**: Incomplete or corrupted response

**Solution**:
```javascript
async function safeFetch(url) {
  try {
    const response = await fetch(url);
    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (parseError) {
      console.error('Malformed JSON:', text);
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    throw error;
  }
}
```

### Debugging Tips

#### Enable Verbose Logging

```javascript
const DEBUG = true;

async function fetchPrices() {
  if (DEBUG) console.log('Fetching prices...');

  const startTime = Date.now();
  const response = await fetch('http://localhost:3001/api/fuel-prices');

  if (DEBUG) {
    console.log(`Response received in ${Date.now() - startTime}ms`);
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
  }

  const data = await response.json();

  if (DEBUG) {
    console.log('Data:', data);
    console.log('Cached:', data.cached);
    console.log('Companies:', data.data?.totalCompanies);
  }

  return data;
}
```

#### Check API Health First

```javascript
async function diagnoseConnection() {
  try {
    const health = await fetch('http://localhost:3001/api/health');
    const data = await health.json();

    console.log('API Status:', data.status);
    console.log('Uptime:', data.uptime, 'seconds');
    console.log('Cache hits:', data.cache.stats.hits);

    return data.status === 'ok';
  } catch (error) {
    console.error('API is not reachable:', error);
    return false;
  }
}
```

#### Test with cURL

```bash
# Test connectivity
curl -v http://localhost:3001/api/health

# Test with timeout
curl --max-time 10 http://localhost:3001/api/fuel-prices

# View response headers
curl -I http://localhost:3001/api/fuel-prices

# Save response to file
curl http://localhost:3001/api/fuel-prices > response.json
```

---

## Use Cases

### 1. Price Comparison Website

Build a consumer-facing website that helps users find the cheapest fuel in their area.

**Features**:
- Display current prices from all companies
- Highlight best prices
- Show price trends over time
- Filter by fuel type

**Example Implementation**:
```javascript
async function buildComparisonView() {
  const bestPrices = await fetch('http://localhost:3001/api/fuel-prices/best')
    .then(r => r.json());

  // Group by fuel type
  const grouped = bestPrices.data.bestPrices.reduce((acc, item) => {
    const category = categorizeFuelType(item.fuelType);
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  return grouped;
}
```

### 2. Mobile Fuel Finder App

Create a React Native or Flutter app that helps drivers find the nearest gas station with the best prices.

**Features**:
- Real-time price data
- GPS-based station finder
- Price alerts and notifications
- Favorite stations

### 3. Fleet Management System

Integrate fuel price data into a logistics or fleet management system to optimize fuel costs.

**Features**:
- Automatic price monitoring
- Cost forecasting
- Fuel budget optimization
- Historical price analysis

**Example**:
```python
class FleetFuelOptimizer:
    def __init__(self):
        self.client = FuelPriceClient()

    def calculate_fuel_cost(self, distance_km, consumption_per_100km, fuel_type):
        """Calculate trip fuel cost"""
        best = self.client.find_cheapest_fuel(fuel_type)

        liters_needed = (distance_km / 100) * consumption_per_100km
        total_cost = liters_needed * best['price']

        return {
            'liters': liters_needed,
            'cost': total_cost,
            'best_company': best['company'],
            'price_per_liter': best['price']
        }
```

### 4. Price Alert System

Build a notification system that alerts users when prices drop below a threshold.

**Features**:
- User-defined price thresholds
- Email/SMS/push notifications
- Multiple fuel type tracking
- Preferred company monitoring

**Example**:
```javascript
class PriceAlertSystem {
  constructor() {
    this.alerts = new Map();
  }

  addAlert(userId, fuelType, maxPrice) {
    this.alerts.set(userId, { fuelType, maxPrice });
  }

  async checkAlerts() {
    const bestPrices = await fetch('http://localhost:3001/api/fuel-prices/best')
      .then(r => r.json());

    for (const [userId, alert] of this.alerts.entries()) {
      const match = bestPrices.data.bestPrices.find(
        p => p.fuelType.includes(alert.fuelType) && p.price <= alert.maxPrice
      );

      if (match) {
        this.sendNotification(userId, match);
      }
    }
  }
}
```

### 5. Analytics Dashboard

Create a business intelligence dashboard for market analysis and trend visualization.

**Features**:
- Price trends over time
- Market share analysis
- Competitive pricing insights
- Regional price variations

### 6. Chatbot Integration

Integrate fuel prices into a messaging bot (Telegram, WhatsApp, Messenger).

**Example**:
```javascript
// Telegram bot example
bot.onText(/\/prices (.+)/, async (msg, match) => {
  const companyName = match[1];

  const prices = await fetch(
    `http://localhost:3001/api/fuel-prices/company/${companyName}`
  ).then(r => r.json());

  if (prices.success) {
    const message = formatPricesForChat(prices.data);
    bot.sendMessage(msg.chat.id, message);
  }
});
```

### 7. Excel/Google Sheets Integration

Pull live fuel prices into spreadsheets for analysis.

**Example (Google Sheets)**:
```javascript
function getFuelPrices() {
  const response = UrlFetchApp.fetch('http://your-api.com/api/fuel-prices');
  const data = JSON.parse(response.getContentText());

  const sheet = SpreadsheetApp.getActiveSheet();

  data.data.companies.forEach((company, i) => {
    company.fuelPrices.forEach((fuel, j) => {
      sheet.getRange(i * 10 + j + 2, 1).setValue(company.name);
      sheet.getRange(i * 10 + j + 2, 2).setValue(fuel.fuelType);
      sheet.getRange(i * 10 + j + 2, 3).setValue(fuel.price);
    });
  });
}
```

---

## FAQ

### General Questions

**Q: Is the API free to use?**
A: Yes, the API is currently free for development and personal use. Commercial usage terms may apply in the future.

**Q: Do I need an API key?**
A: Currently no. The API is open and requires no authentication. This may change for production deployments.

**Q: What is the rate limit?**
A: 30 requests per minute per IP address. Exceeding this will result in HTTP 429 responses.

**Q: How often is the data updated?**
A: Data is cached for 15 minutes. You can force a fresh scrape using `?refresh=true`, but please use this sparingly.

**Q: Which companies are supported?**
A: Gulf, Socar, Lukoil, Wissol, Rompetrol, Portal, and Connect.

### Technical Questions

**Q: What is the response format?**
A: All responses are in JSON format with UTF-8 encoding.

**Q: How do I handle CORS errors in my browser app?**
A: The API has CORS enabled for all origins (`*`). If you still encounter issues, use a proxy during development or make requests server-side.

**Q: Can I cache responses in my application?**
A: Yes, highly recommended! The API already caches for 15 minutes, but you can implement client-side caching for even better performance.

**Q: What happens if the source website is down?**
A: The API will return a 500 error with details. Implement retry logic with exponential backoff in your application.

**Q: Can I filter by fuel type?**
A: The API doesn't have built-in fuel type filtering. Fetch all prices and filter client-side, or use the `/best` endpoint which groups by fuel type.

### Data Questions

**Q: Why are fuel names in Georgian?**
A: Data is scraped from a Georgian website and returned as-is. You can implement a translation layer in your application if needed.

**Q: Are prices guaranteed to be accurate?**
A: Prices are scraped from priceshub.ge and are as accurate as the source. Always display timestamps to inform users of data freshness.

**Q: How many fuel types are available?**
A: Over 44 different fuel types across all companies, including various octane gasolines, diesel variants, CNG, and LPG.

**Q: Can I get historical price data?**
A: No, the current API only provides real-time data. Historical data would require you to store responses over time.

### Integration Questions

**Q: Can I use this in a mobile app?**
A: Yes! The API works great with React Native, Flutter, Swift, Kotlin, or any platform that can make HTTP requests.

**Q: Is there a JavaScript SDK?**
A: Not officially, but this documentation includes complete integration examples you can adapt.

**Q: Can I self-host the API?**
A: Yes, the API is designed to be easily deployed. Check the backend README for deployment instructions.

**Q: What if I need more than 30 requests per minute?**
A: Contact the API maintainers to discuss higher rate limits for your use case.

### Troubleshooting Questions

**Q: I'm getting 404 errors. What's wrong?**
A: Check your endpoint URLs. Ensure you're using the correct base URL and endpoint paths. Use `/api/health` to test connectivity.

**Q: Requests are timing out. How can I fix this?**
A: Increase your client timeout to at least 15 seconds. The API may take longer if it needs to scrape fresh data.

**Q: I'm getting 429 errors. What should I do?**
A: You've exceeded the rate limit. Implement exponential backoff and respect the `retryAfter` value in the response.

**Q: Can I report bugs or request features?**
A: Yes! Contact the API maintainers through the project's GitHub repository or support channels.

---

## Support & Contact

For questions, bug reports, or feature requests:

- **GitHub**: [Project Repository URL]
- **Email**: [Support Email]
- **Documentation**: This guide
- **API Status**: Check `GET /api/health`

---

## Changelog

### Version 1.0.0 (2025-10-22)
- Initial release
- 5 core endpoints
- Support for 7 companies and 44+ fuel types
- Rate limiting and caching implemented
- Comprehensive documentation

---

**Happy Coding!** Build something amazing with fuel price data.
