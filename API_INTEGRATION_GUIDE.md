# Fuel Prices API - Complete Documentation

**Version:** 1.0.0
**Base URL:** `https://fuel-prices-backend.onrender.com`
**Last Updated:** 2025-10-27

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Rate Limiting](#rate-limiting)
4. [Common Endpoints](#common-endpoints)
5. [Company Endpoints](#company-endpoints)
   - [Wissol](#wissol)
   - [Portal](#portal)
   - [Connect](#connect)
   - [Socar](#socar)
   - [Gulf](#gulf)
   - [Rompetrol](#rompetrol)
6. [Response Formats](#response-formats)
7. [Error Handling](#error-handling)
8. [Code Examples](#code-examples)
9. [Best Practices](#best-practices)

---

## Overview

Fuel Prices API provides real-time fuel price data from 6 major fuel companies in Georgia. The API scrapes official company websites and provides a unified, standardized JSON interface.

### Supported Companies

| Company | Fuel Types | Data Source | Update Frequency |
|---------|------------|-------------|------------------|
| **Wissol** | 7 | API | Real-time |
| **Portal** | 5 | HTML | Real-time |
| **Connect** | 6 | HTML | Real-time |
| **Socar** | 7 | HTML | Real-time |
| **Gulf** | 7 | HTML | Real-time |
| **Rompetrol** | 5 | HTML | Real-time |

**Total:** 37 fuel types across all companies

### Features

- ✅ Real-time fuel prices from official sources
- ✅ Georgian and English fuel type names
- ✅ Historical price data (where available)
- ✅ Price comparison and statistics
- ✅ Caching (15-minute TTL)
- ✅ Rate limiting (30 requests/minute per IP)
- ✅ Comprehensive error handling
- ✅ Health monitoring endpoints

---

## Authentication

**Current Version:** No authentication required

All endpoints are publicly accessible. Future versions may implement API keys for higher rate limits.

---

## Rate Limiting

**Limit:** 30 requests per minute per IP address

### Rate Limit Response

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Maximum 30 requests per minute allowed",
  "retryAfter": 45
}
```

**HTTP Status Code:** `429 Too Many Requests`

---

## Common Endpoints

### Health Check

Check API status and available companies.

**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-27T12:00:00.000Z",
  "uptime": 3600.5,
  "companies": [
    "wissol",
    "portal",
    "connect",
    "socar",
    "gulf",
    "rompetrol"
  ]
}
```

**cURL Example:**
```bash
curl http://localhost:3001/api/health
```

---

## Company Endpoints

All companies follow similar endpoint patterns with minor variations based on available features.

### Standard Endpoint Pattern

Each company supports these core endpoints:

- `GET /api/fuel-prices/{company}` - Current prices
- `GET /api/fuel-prices/{company}/fuel-types` - Available fuel types
- `GET /api/fuel-prices/{company}/fuel/:fuelType` - Specific fuel details
- `GET /api/fuel-prices/{company}/summary` - Statistical summary
- `GET /api/fuel-prices/{company}/compare` - Price comparison
- `GET /api/fuel-prices/{company}/health` - Company scraper health

---

## Wissol

**Data Source:** https://api.wissol.ge/fuelpricehistory
**Method:** Direct API calls
**Fuel Types:** 7

### Endpoints

#### 1. Get Current Prices

```
GET /api/fuel-prices/wissol
```

**Query Parameters:**
- `english` (boolean) - Include English translations

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/wissol?english=true"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "source": "https://api.wissol.ge/fuelpricehistory",
  "scrapeDuration": 52,
  "data": {
    "company": "Wissol",
    "fuelPrices": [
      {
        "fuelType": "ECTO 100",
        "fuelTypeEnglish": "ECTO 100 (Premium)",
        "price": 3.69,
        "currency": "GEL"
      },
      {
        "fuelType": "ECTO PLUS",
        "fuelTypeEnglish": "ECTO Plus (95 octane)",
        "price": 3.39,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 7,
    "priceRange": {
      "min": 1.85,
      "max": 3.69
    }
  }
}
```

#### 2. Get Fuel Types

```
GET /api/fuel-prices/wissol/fuel-types
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "data": {
    "fuelTypes": [
      {
        "name": "ECTO 100",
        "englishName": "ECTO 100 (Premium)"
      }
    ],
    "totalTypes": 7
  }
}
```

#### 3. Get Historical Prices

```
GET /api/fuel-prices/wissol/historical/:fuelType
```

**Parameters:**
- `fuelType` - Fuel type name (URL encoded)
- Query param `days` - Number of days (default: 30, max: 90)

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/wissol/historical/ECTO%20100?days=7"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fuelType": "ECTO 100",
    "historicalPrices": [
      {
        "date": "2025-10-27",
        "price": 3.69
      }
    ],
    "totalRecords": 7,
    "priceChange": {
      "amount": 0.05,
      "percentage": 1.37
    }
  }
}
```

#### 4. Get Summary

```
GET /api/fuel-prices/wissol/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Wissol",
    "summary": {
      "totalFuelTypes": 7,
      "averagePrice": 2.95,
      "minPrice": 1.85,
      "maxPrice": 3.69,
      "priceSpread": 1.84
    },
    "fuelPrices": [...]
  }
}
```

#### 5. Compare Prices

```
GET /api/fuel-prices/wissol/compare
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Wissol",
    "cheapestFuel": {
      "fuelType": "GAS",
      "price": 1.85
    },
    "mostExpensiveFuel": {
      "fuelType": "ECTO 100",
      "price": 3.69
    },
    "comparisons": [...]
  }
}
```

---

## Portal

**Data Source:** https://portal.com.ge/georgian/newfuel
**Method:** HTML Scraping (Cheerio)
**Fuel Types:** 5

### Endpoints

#### 1. Get Current Prices

```
GET /api/fuel-prices/portal
```

**Query Parameters:**
- `english` (boolean) - Include English translations
- `specifications` (boolean) - Include fuel specifications

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/portal?english=true&specifications=true"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "source": "https://portal.com.ge/georgian/newfuel",
  "scrapeDuration": 184,
  "data": {
    "company": "Portal",
    "fuelPrices": [
      {
        "fuelType": "SUPER",
        "fuelTypeEnglish": "Super 100",
        "price": 3.29,
        "currency": "GEL",
        "specifications": "100 ოქტანი"
      }
    ],
    "totalFuelTypes": 5,
    "priceRange": {
      "min": 2.89,
      "max": 3.29
    }
  }
}
```

#### 2. Get Fuel Types

```
GET /api/fuel-prices/portal/fuel-types
```

#### 3. Get Specific Fuel

```
GET /api/fuel-prices/portal/fuel/:fuelType
```

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/portal/fuel/SUPER"
```

#### 4. Get Summary

```
GET /api/fuel-prices/portal/summary
```

#### 5. Compare Prices

```
GET /api/fuel-prices/portal/compare
```

#### 6. Get Specifications

```
GET /api/fuel-prices/portal/specifications
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Portal",
    "fuelSpecifications": [
      {
        "fuelType": "SUPER",
        "fuelTypeEnglish": "Super 100",
        "price": 3.29,
        "currency": "GEL",
        "specifications": "100 ოქტანი"
      }
    ]
  }
}
```

---

## Connect

**Data Source:** https://connect.com.ge/fuel/index.php
**Method:** HTML Scraping (Cheerio)
**Fuel Types:** 6 (includes LPG)

### Endpoints

#### 1. Get Current Prices

```
GET /api/fuel-prices/connect
```

**Query Parameters:**
- `english` (boolean) - Include English translations

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/connect?english=true"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "source": "https://connect.com.ge/fuel/index.php",
  "scrapeDuration": 521,
  "data": {
    "company": "Connect",
    "fuelPrices": [
      {
        "fuelType": "სუპერი",
        "fuelTypeEnglish": "Super (100 octane)",
        "price": 3.29,
        "currency": "GEL"
      },
      {
        "fuelType": "აირი",
        "fuelTypeEnglish": "LPG (Liquefied Petroleum Gas)",
        "price": 1.80,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 6,
    "priceRange": {
      "min": 1.80,
      "max": 3.29
    }
  }
}
```

#### 2. Get Fuel Types

```
GET /api/fuel-prices/connect/fuel-types
```

#### 3. Get Specific Fuel

```
GET /api/fuel-prices/connect/fuel/:fuelType
```

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/connect/fuel/სუპერი"
# Or with URL encoding
curl "http://localhost:3001/api/fuel-prices/connect/fuel/%E1%83%A1%E1%83%A3%E1%83%9E%E1%83%94%E1%83%A0%E1%83%98"
```

#### 4. Get Summary

```
GET /api/fuel-prices/connect/summary
```

#### 5. Compare Prices

```
GET /api/fuel-prices/connect/compare
```

---

## Socar

**Data Source:** https://sgp.ge/price-archive
**Method:** HTML Scraping (Cheerio)
**Fuel Types:** 7 (includes CNG, Nano series)
**Historical Data:** 30+ days available

### Endpoints

#### 1. Get Current Prices

```
GET /api/fuel-prices/socar
```

**Query Parameters:**
- `english` (boolean) - Include English translations

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/socar?english=true"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "source": "https://sgp.ge/price-archive",
  "scrapeDuration": 196,
  "data": {
    "company": "Socar",
    "fuelPrices": [
      {
        "fuelType": "Nano სუპერი",
        "fuelTypeEnglish": "Nano Super (98 octane)",
        "price": 3.57,
        "currency": "GEL"
      },
      {
        "fuelType": "CNG",
        "fuelTypeEnglish": "CNG (Compressed Natural Gas)",
        "price": 1.69,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 7,
    "priceRange": {
      "min": 1.69,
      "max": 3.57
    }
  }
}
```

#### 2. Get Fuel Types

```
GET /api/fuel-prices/socar/fuel-types
```

#### 3. Get Specific Fuel

```
GET /api/fuel-prices/socar/fuel/:fuelType
```

#### 4. Get All Historical Prices

```
GET /api/fuel-prices/socar/historical
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Socar",
    "historicalData": [
      {
        "fuelType": "Nano სუპერი",
        "fuelTypeEnglish": "Nano Super (98 octane)",
        "priceHistory": [
          {
            "date": "2025-10-27",
            "price": 3.57
          }
        ],
        "totalRecords": 30
      }
    ]
  }
}
```

#### 5. Get Historical Prices by Fuel Type

```
GET /api/fuel-prices/socar/historical/:fuelType
```

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/socar/historical/CNG"
```

#### 6. Get Summary

```
GET /api/fuel-prices/socar/summary
```

#### 7. Compare Prices

```
GET /api/fuel-prices/socar/compare
```

#### 8. Get Price Trends

```
GET /api/fuel-prices/socar/trend
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Socar",
    "trends": [
      {
        "fuelType": "Nano სუპერი",
        "currentPrice": 3.57,
        "trend": "stable",
        "change7Days": 0.00,
        "change30Days": 0.05,
        "percentChange": 1.42
      }
    ]
  }
}
```

---

## Gulf

**Data Source:** https://gulf.ge/ge/fuel_prices
**Method:** HTML Scraping (Cheerio)
**Fuel Types:** 7 (G-Force premium series + standard)
**Historical Data:** 14+ days available

### Endpoints

#### 1. Get Current Prices

```
GET /api/fuel-prices/gulf
```

**Query Parameters:**
- `english` (boolean) - Include English translations

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/gulf?english=true"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "source": "https://gulf.ge/ge/fuel_prices",
  "scrapeDuration": 112,
  "data": {
    "company": "Gulf",
    "fuelPrices": [
      {
        "fuelType": "G-Force სუპერი",
        "abbreviation": "GS",
        "price": 3.57,
        "currency": "GEL"
      },
      {
        "fuelType": "გაზი",
        "abbreviation": "CNG",
        "price": 1.69,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 7,
    "priceRange": {
      "min": 1.69,
      "max": 3.57
    }
  }
}
```

#### 2. Get Fuel Types

```
GET /api/fuel-prices/gulf/fuel-types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fuelTypes": [
      {
        "georgianName": "G-Force სუპერი",
        "abbreviation": "GS",
        "englishName": "G-Force Super (98 octane)"
      }
    ],
    "totalTypes": 7
  }
}
```

#### 3. Get Specific Fuel

Supports both full name and abbreviation:

```
GET /api/fuel-prices/gulf/fuel/:fuelType
```

**Examples:**
```bash
# By abbreviation
curl "http://localhost:3001/api/fuel-prices/gulf/fuel/GS"

# By full name
curl "http://localhost:3001/api/fuel-prices/gulf/fuel/G-Force%20სუპერი"
```

#### 4. Get Historical Prices

```
GET /api/fuel-prices/gulf/history/:fuelType?days=14
```

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/gulf/history/GS?days=7"
```

#### 5. Get G-Force Premium Fuels Only

```
GET /api/fuel-prices/gulf/g-force
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Gulf",
    "category": "G-Force Premium Fuels",
    "fuelPrices": [
      {
        "fuelType": "G-Force სუპერი",
        "abbreviation": "GS",
        "price": 3.57,
        "currency": "GEL"
      },
      {
        "fuelType": "G-Force პრემიუმი",
        "abbreviation": "GP",
        "price": 3.12,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 4
  }
}
```

#### 6. Get Standard Fuels Only

```
GET /api/fuel-prices/gulf/standard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Gulf",
    "category": "Standard Fuels",
    "fuelPrices": [
      {
        "fuelType": "ევრო რეგულარი",
        "abbreviation": "ER",
        "price": 2.97,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 3
  }
}
```

#### 7. Get Summary

```
GET /api/fuel-prices/gulf/summary
```

#### 8. Compare Prices

```
GET /api/fuel-prices/gulf/compare
```

---

## Rompetrol

**Data Source:** https://www.rompetrol.ge/
**Method:** HTML Scraping (Cheerio)
**Fuel Types:** 5 (Efix premium series + standard)

### Endpoints

#### 1. Get Current Prices

```
GET /api/fuel-prices/rompetrol
```

**Query Parameters:**
- `english` (boolean) - Include English translations

**Example:**
```bash
curl "http://localhost:3001/api/fuel-prices/rompetrol?english=true"
```

**Response:**
```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "source": "https://www.rompetrol.ge/",
  "scrapeDuration": 284,
  "data": {
    "company": "Rompetrol",
    "fuelPrices": [
      {
        "fuelType": "efix სუპერი",
        "abbreviation": "ES",
        "price": 3.59,
        "currency": "GEL"
      },
      {
        "fuelType": "ევრო დიზელი",
        "abbreviation": "D",
        "price": 3.10,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 5,
    "priceRange": {
      "min": 3.04,
      "max": 3.59
    }
  }
}
```

#### 2. Get Fuel Types

```
GET /api/fuel-prices/rompetrol/fuel-types
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fuelTypes": [
      {
        "georgianName": "efix სუპერი",
        "abbreviation": "ES",
        "englishName": "Efix Super (Premium 95+ octane)"
      }
    ],
    "totalTypes": 5
  }
}
```

#### 3. Get Specific Fuel

Supports both full name and abbreviation:

```
GET /api/fuel-prices/rompetrol/fuel/:fuelType
```

**Examples:**
```bash
# By abbreviation
curl "http://localhost:3001/api/fuel-prices/rompetrol/fuel/ES"

# By full name
curl "http://localhost:3001/api/fuel-prices/rompetrol/fuel/efix%20სუპერი"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fuelType": "efix სუპერი",
    "abbreviation": "ES",
    "fuelTypeEnglish": "Efix Super (Premium 95+ octane)",
    "price": 3.59,
    "currency": "GEL",
    "specifications": "Premium quality with advanced additives"
  }
}
```

#### 4. Get Efix Premium Fuels Only

```
GET /api/fuel-prices/rompetrol/efix
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Rompetrol",
    "category": "Efix Premium Fuels",
    "fuelPrices": [
      {
        "fuelType": "efix სუპერი",
        "abbreviation": "ES",
        "price": 3.59,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 3
  }
}
```

#### 5. Get Standard Fuels Only

```
GET /api/fuel-prices/rompetrol/standard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "company": "Rompetrol",
    "category": "Standard Fuels",
    "fuelPrices": [
      {
        "fuelType": "ევრო რეგულარი",
        "abbreviation": "ER",
        "price": 3.04,
        "currency": "GEL"
      }
    ],
    "totalFuelTypes": 2
  }
}
```

#### 6. Get Summary

```
GET /api/fuel-prices/rompetrol/summary
```

#### 7. Compare Prices

```
GET /api/fuel-prices/rompetrol/compare
```

---

## Response Formats

### Success Response

All successful responses follow this structure:

```json
{
  "success": true,
  "timestamp": "2025-10-27T12:00:00.000Z",
  "source": "https://example.com",
  "scrapeDuration": 250,
  "data": {
    // Company-specific data
  }
}
```

**Fields:**
- `success` (boolean) - Always `true` for successful responses
- `timestamp` (string, ISO-8601) - When the data was fetched
- `source` (string) - Original data source URL
- `scrapeDuration` (number) - Time taken to scrape in milliseconds
- `data` (object) - The actual response data

### Error Response

```json
{
  "success": false,
  "error": "Error category",
  "message": "Detailed error message",
  "timestamp": "2025-10-27T12:00:00.000Z"
}
```

**HTTP Status Codes:**
- `200` - Success
- `404` - Fuel type not found / Endpoint not found
- `429` - Rate limit exceeded
- `500` - Internal server error

---

## Error Handling

### Common Error Types

#### 1. Fuel Type Not Found

```json
{
  "success": false,
  "error": "Fuel type 'INVALID_FUEL' not found",
  "timestamp": "2025-10-27T12:00:00.000Z"
}
```

**HTTP Status:** `404`

#### 2. Network Error

```json
{
  "success": false,
  "error": "Failed to fetch data after 3 attempts: Connection timeout",
  "timestamp": "2025-10-27T12:00:00.000Z"
}
```

**HTTP Status:** `500`

#### 3. Parsing Error

```json
{
  "success": false,
  "error": "No fuel prices found on page",
  "timestamp": "2025-10-27T12:00:00.000Z"
}
```

**HTTP Status:** `500`

#### 4. Rate Limit Exceeded

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Maximum 30 requests per minute allowed",
  "retryAfter": 45
}
```

**HTTP Status:** `429`

### Retry Strategy

The API implements automatic retry with exponential backoff:

1. **First attempt:** Immediate
2. **Second attempt:** Wait 2 seconds
3. **Third attempt:** Wait 4 seconds

After 3 failed attempts, an error is returned.

---

## Code Examples

### JavaScript (Node.js)

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

// Get current prices for all companies
async function getAllPrices() {
  const companies = ['wissol', 'portal', 'connect', 'socar', 'gulf', 'rompetrol'];

  for (const company of companies) {
    try {
      const response = await axios.get(`${BASE_URL}/api/fuel-prices/${company}?english=true`);
      console.log(`${company}:`, response.data.data.fuelPrices);
    } catch (error) {
      console.error(`Error fetching ${company}:`, error.message);
    }
  }
}

// Get specific fuel type
async function getSpecificFuel(company, fuelType) {
  try {
    const response = await axios.get(
      `${BASE_URL}/api/fuel-prices/${company}/fuel/${encodeURIComponent(fuelType)}`
    );
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// Compare prices across companies
async function comparePrices(fuelTypeName) {
  const companies = ['wissol', 'portal', 'connect', 'socar', 'gulf', 'rompetrol'];
  const prices = [];

  for (const company of companies) {
    try {
      const response = await axios.get(`${BASE_URL}/api/fuel-prices/${company}?english=true`);
      const fuel = response.data.data.fuelPrices.find(
        f => f.fuelTypeEnglish?.toLowerCase().includes(fuelTypeName.toLowerCase())
      );

      if (fuel) {
        prices.push({
          company,
          fuelType: fuel.fuelType,
          price: fuel.price
        });
      }
    } catch (error) {
      console.error(`Error with ${company}:`, error.message);
    }
  }

  // Sort by price
  return prices.sort((a, b) => a.price - b.price);
}

// Usage
getAllPrices();
getSpecificFuel('gulf', 'GS').then(console.log);
comparePrices('premium').then(prices => {
  console.log('Premium fuel prices (cheapest first):');
  prices.forEach(p => console.log(`${p.company}: ${p.price} GEL`));
});
```

### JavaScript (Browser/React)

```javascript
import { useState, useEffect } from 'react';

function FuelPrices() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        const response = await fetch(
          'http://localhost:3001/api/fuel-prices/wissol?english=true'
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.success) {
          setPrices(data.data.fuelPrices);
        } else {
          throw new Error(data.error || 'Failed to fetch prices');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Wissol Fuel Prices</h2>
      <ul>
        {prices.map((fuel, index) => (
          <li key={index}>
            {fuel.fuelTypeEnglish || fuel.fuelType}: {fuel.price} {fuel.currency}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Python

```python
import requests
from typing import List, Dict, Optional

BASE_URL = 'http://localhost:3001'

def get_company_prices(company: str, english: bool = True) -> Optional[Dict]:
    """Get current fuel prices for a company."""
    try:
        params = {'english': 'true'} if english else {}
        response = requests.get(
            f'{BASE_URL}/api/fuel-prices/{company}',
            params=params,
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f'Error fetching {company}: {e}')
        return None

def compare_all_companies() -> List[Dict]:
    """Compare prices across all companies."""
    companies = ['wissol', 'portal', 'connect', 'socar', 'gulf', 'rompetrol']
    all_prices = []

    for company in companies:
        data = get_company_prices(company)
        if data and data.get('success'):
            company_data = data['data']
            all_prices.append({
                'company': company_data['company'],
                'totalFuelTypes': company_data['totalFuelTypes'],
                'priceRange': company_data['priceRange'],
                'averagePrice': sum(f['price'] for f in company_data['fuelPrices']) / len(company_data['fuelPrices'])
            })

    return sorted(all_prices, key=lambda x: x['averagePrice'])

def find_cheapest_fuel(fuel_name: str) -> Optional[Dict]:
    """Find the cheapest price for a specific fuel type across all companies."""
    companies = ['wissol', 'portal', 'connect', 'socar', 'gulf', 'rompetrol']
    cheapest = None

    for company in companies:
        data = get_company_prices(company)
        if data and data.get('success'):
            for fuel in data['data']['fuelPrices']:
                english_name = fuel.get('fuelTypeEnglish', fuel['fuelType'])
                if fuel_name.lower() in english_name.lower():
                    if cheapest is None or fuel['price'] < cheapest['price']:
                        cheapest = {
                            'company': company,
                            'fuelType': fuel['fuelType'],
                            'englishName': english_name,
                            'price': fuel['price']
                        }

    return cheapest

# Usage
if __name__ == '__main__':
    # Get Wissol prices
    wissol_data = get_company_prices('wissol')
    if wissol_data:
        print(f"Wissol has {wissol_data['data']['totalFuelTypes']} fuel types")

    # Compare all companies
    comparison = compare_all_companies()
    print('\nCompanies ranked by average fuel price:')
    for idx, company in enumerate(comparison, 1):
        print(f"{idx}. {company['company']}: {company['averagePrice']:.2f} GEL average")

    # Find cheapest premium
    cheapest_premium = find_cheapest_fuel('premium')
    if cheapest_premium:
        print(f"\nCheapest premium: {cheapest_premium['company']} - {cheapest_premium['price']} GEL")
```

### cURL

```bash
# Get health status
curl http://localhost:3001/api/health

# Get Wissol prices with English names
curl "http://localhost:3001/api/fuel-prices/wissol?english=true"

# Get Gulf G-Force premium fuels
curl http://localhost:3001/api/fuel-prices/gulf/g-force

# Get specific fuel by abbreviation
curl http://localhost:3001/api/fuel-prices/rompetrol/fuel/ES

# Get Socar historical data
curl "http://localhost:3001/api/fuel-prices/socar/historical/CNG"

# Get summary with statistics
curl http://localhost:3001/api/fuel-prices/wissol/summary

# Pretty print with jq
curl -s "http://localhost:3001/api/fuel-prices/portal?english=true" | jq .

# Extract only prices
curl -s "http://localhost:3001/api/fuel-prices/wissol" | jq '.data.fuelPrices[] | {type: .fuelType, price: .price}'

# Save to file
curl -o wissol_prices.json "http://localhost:3001/api/fuel-prices/wissol?english=true"
```

---

## Best Practices

### 1. Caching

The API implements 15-minute caching. To optimize:

- **Don't refresh more often than every 15 minutes** - You'll get cached data anyway
- **Use the cached data** - Fuel prices typically change daily, not every minute
- **Implement client-side caching** - Cache responses on your end too

### 2. Error Handling

Always handle errors gracefully:

```javascript
try {
  const response = await fetch(apiUrl);
  const data = await response.json();

  if (!data.success) {
    // Handle API-level error
    console.error('API Error:', data.error);
    return;
  }

  // Process successful data
  processData(data.data);
} catch (error) {
  // Handle network/parsing errors
  console.error('Network Error:', error);
}
```

### 3. Rate Limiting

Respect the rate limits:

- **30 requests per minute per IP**
- Implement exponential backoff on 429 errors
- Consider batching requests if fetching multiple companies

```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
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

### 4. URL Encoding

Always URL-encode fuel type names with Georgian characters:

```javascript
// Good
const fuelType = encodeURIComponent('G-Force სუპერი');
fetch(`/api/fuel-prices/gulf/fuel/${fuelType}`);

// Bad (will fail)
fetch('/api/fuel-prices/gulf/fuel/G-Force სუპერი');
```

### 5. Use Abbreviations

When available, prefer abbreviations for cleaner URLs:

```bash
# Preferred
curl http://localhost:3001/api/fuel-prices/gulf/fuel/GS

# Works but less clean
curl "http://localhost:3001/api/fuel-prices/gulf/fuel/G-Force%20%E1%83%A1%E1%83%A3%E1%83%9E%E1%83%94%E1%83%A0%E1%83%98"
```

### 6. Request English Translations

Always request English translations for better UX:

```bash
curl "http://localhost:3001/api/fuel-prices/wissol?english=true"
```

### 7. Monitor Health Endpoint

Regularly check the health endpoint:

```javascript
setInterval(async () => {
  const health = await fetch('/api/health').then(r => r.json());
  if (health.status !== 'ok') {
    console.warn('API health check failed:', health);
  }
}, 60000); // Every minute
```

---

## Troubleshooting

### Issue: 404 Not Found

**Problem:** Endpoint returns 404

**Solutions:**
1. Check the endpoint URL is correct
2. Verify the company name is lowercase
3. URL-encode Georgian characters in fuel type names
4. Check if the fuel type exists with `/fuel-types` endpoint

### Issue: Empty or Missing Data

**Problem:** Response has `success: true` but empty fuel prices

**Solutions:**
1. Check if the source website is accessible
2. Try the `/health` endpoint for the specific company
3. Check logs for scraping errors
4. Verify the website structure hasn't changed

### Issue: Slow Response Times

**Problem:** Requests take >5 seconds

**Solutions:**
1. Check if it's the first request (not cached)
2. Verify network connectivity to source websites
3. Check server logs for timeout errors
4. Consider using cached endpoints or increasing client timeout

### Issue: Rate Limit Errors

**Problem:** Getting 429 errors

**Solutions:**
1. Reduce request frequency
2. Implement proper retry logic with exponential backoff
3. Use the `retryAfter` value from error response
4. Cache responses on client side

---

## Support and Feedback

### GitHub

Issues and feature requests: [GitHub Repository](#)

### Documentation Updates

This documentation is maintained in:
`/home/bekolozi/Desktop/fuel-prices/backend/docs/API_DOCUMENTATION.md`

---

## Changelog

### Version 1.0.0 (2025-10-27)

**Initial Release**

- ✅ 6 company integrations (Wissol, Portal, Connect, Socar, Gulf, Rompetrol)
- ✅ 37 total fuel types
- ✅ 50+ API endpoints
- ✅ Real-time price scraping
- ✅ Historical data (Wissol, Socar, Gulf)
- ✅ English translations
- ✅ Caching (15-minute TTL)
- ✅ Rate limiting (30 req/min)
- ✅ Comprehensive error handling
- ✅ Health monitoring endpoints

---

## License

[Your License Here]

---

**Last Updated:** 2025-10-27
**API Version:** 1.0.0
**Documentation Version:** 1.0.0
