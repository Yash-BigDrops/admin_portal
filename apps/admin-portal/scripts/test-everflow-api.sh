#!/bin/bash

# Test Everflow API endpoints using curl
# Based on: https://developers.everflow.io/docs/network/advertisers/#find-all

API_KEY="G5sv3yETjSgLmVcfB6Q"
BASE_URL="https://api.eflow.team/v1"

echo "=========================================="
echo "Testing Everflow API Endpoints"
echo "=========================================="
echo ""

# Test 1: Affiliates Offers Runnable
echo "1. Testing: /affiliates/offersrunnable"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/affiliates/offersrunnable" \
  -H "X-Eflow-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -50
echo ""
echo ""

# Test 2: Affiliates All Offers
echo "2. Testing: /affiliates/alloffers"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/affiliates/alloffers" \
  -H "X-Eflow-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -50
echo ""
echo ""

# Test 3: Network Offers Table (POST)
echo "3. Testing: /networks/offerstable"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/networks/offerstable?page=1&page_size=1000" \
  -H "X-Eflow-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"filters": {"offer_status": "active"}, "sort_by": {"column": "created", "order": "desc"}}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -50
echo ""
echo ""

# Test 4: Network Offers (based on docs structure)
echo "4. Testing: /networks/offers"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/networks/offers" \
  -H "X-Eflow-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -50
echo ""
echo ""

# Test 5: Affiliates Offers (simpler endpoint)
echo "5. Testing: /affiliates/offers"
echo "----------------------------------------"
curl -X GET "${BASE_URL}/affiliates/offers" \
  -H "X-Eflow-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | head -50
echo ""
echo ""

echo "=========================================="
echo "Testing Complete"
echo "=========================================="

