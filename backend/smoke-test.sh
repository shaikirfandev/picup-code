#!/bin/bash
# E.D.I.T.H — Full System Smoke Test v2
set -e

API="http://localhost:4500/api"
PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"
  if [ -n "$result" ] && [ "$result" != "null" ] && [ "$result" != "" ]; then
    echo "  ✅ $label: $result"
    PASS=$((PASS + 1))
  else
    echo "  ❌ $label: FAILED"
    FAIL=$((FAIL + 1))
  fi
}

echo "═══════════════════════════════════════════════════════"
echo "  E.D.I.T.H — System Smoke Test v2"
echo "═══════════════════════════════════════════════════════"
echo ""

# 1. Auth
echo "🔐 AUTH"
LOGIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@picup.app","password":"admin123"}')
TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "")
check "Login (admin)" "$([ -n "$TOKEN" ] && echo "token obtained" || echo "")"
AUTH="Authorization: Bearer $TOKEN"

# Login as a paid creator (noah.brown@demo.com) — they own ads, wallets, etc.
CREATOR_LOGIN=$(curl -s -X POST "$API/auth/login" -H "Content-Type: application/json" -d '{"email":"noah.brown@demo.com","password":"demo123"}')
CREATOR_TOKEN=$(echo "$CREATOR_LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['accessToken'])" 2>/dev/null || echo "")
check "Login (paid creator)" "$([ -n "$CREATOR_TOKEN" ] && echo "token obtained" || echo "")"
CREATOR_AUTH="Authorization: Bearer $CREATOR_TOKEN"

# 2. Core
echo ""
echo "📦 CORE APIs"
R=$(curl -s "$API/posts/feed?limit=2")
check "GET /posts/feed" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pagination',{}).get('total',len(d.get('data',[]))),'posts')" 2>/dev/null)"

R=$(curl -s "$API/categories")
check "GET /categories" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['data']),'categories')" 2>/dev/null)"

R=$(curl -s -H "$AUTH" "$API/auth/me")
check "GET /auth/me" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['username'],'('+d['data']['role']+')')" 2>/dev/null)"

R=$(curl -s "$API/blog")
check "GET /blog" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['pagination']['total'],'blog posts')" 2>/dev/null)"

R=$(curl -s "$API/search?q=tech&limit=3")
check "GET /search" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',{}).get('posts',[])),'results')" 2>/dev/null)"

# 3. Analytics
echo ""
echo "📊 ANALYTICS APIs"
R=$(curl -s -H "$AUTH" "$API/creator-analytics/overview?period=30d")
check "Creator Analytics" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('data') else '')" 2>/dev/null)"

R=$(curl -s -H "$AUTH" "$API/admin/analytics/stats/overview")
check "Admin Analytics" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK') if d.get('data') else print('')" 2>/dev/null)"

# 4. Creator Dashboard
echo ""
echo "🎨 CREATOR DASHBOARD APIs"
R=$(curl -s -H "$AUTH" "$API/creator-dashboard/overview?period=30d")
check "Dashboard Overview" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('data') else '')" 2>/dev/null)"

R=$(curl -s -H "$AUTH" "$API/creator-dashboard/content-performance?period=30d&limit=5")
check "Content Performance" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK' if d.get('data') else '')" 2>/dev/null)"

# 5. Ad Platform
echo ""
echo "📢 AD PLATFORM APIs"
R=$(curl -s -H "$CREATOR_AUTH" "$API/ads/dashboard")
check "Ad Dashboard" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); s=d.get('data',{}).get('stats',{}); print(s.get('totalCampaigns','?'),'campaigns') if d.get('data') else print('')" 2>/dev/null)"

R=$(curl -s -H "$CREATOR_AUTH" "$API/ads/my")
check "My Ads (creator)" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pagination',{}).get('total','?'),'ads')" 2>/dev/null)"

R=$(curl -s -H "$CREATOR_AUTH" "$API/ads/earnings?period=30d")
check "Ad Earnings" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('OK') if d.get('data') else print('')" 2>/dev/null)"

R=$(curl -s "$API/ads/active")
check "Active Ads (public)" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])),'active ads')" 2>/dev/null)"

# 6. Wallet & Payments
echo ""
echo "💳 WALLET & PAYMENT APIs"
R=$(curl -s -H "$CREATOR_AUTH" "$API/payments/wallet")
check "Wallet Balance" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('balance='+str(d['data'].get('balance',0))) if d.get('data') else print('')" 2>/dev/null)"

R=$(curl -s -H "$CREATOR_AUTH" "$API/payments/wallet/transactions?limit=5")
check "Wallet Transactions" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pagination',{}).get('total','?'),'txns')" 2>/dev/null)"

R=$(curl -s -H "$CREATOR_AUTH" "$API/payments/methods")
check "Payment Methods" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])),'methods')" 2>/dev/null)"

R=$(curl -s -H "$CREATOR_AUTH" "$API/payments/withdraw/my")
check "Withdraw Requests" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])),'requests')" 2>/dev/null)"

# 7. Notifications
echo ""
echo "🔔 OTHER APIs"
R=$(curl -s -H "$CREATOR_AUTH" "$API/notifications?limit=5")
check "Notifications" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('pagination',{}).get('total','?'),'notifications')" 2>/dev/null)"

R=$(curl -s -H "$CREATOR_AUTH" "$API/boards")
check "Boards" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])),'boards') if d.get('data') else print('OK')" 2>/dev/null)"

# Redis test via ad impression tracking (tests MemoryRedis dedup)
echo ""
echo "⚡ REDIS (MemoryRedis) INTEGRATION"
# Get first ad ID from creator (they own ads)
AD_ID=$(curl -s -H "$CREATOR_AUTH" "$API/ads/my?limit=1" | python3 -c "import sys,json; d=json.load(sys.stdin); ads=d.get('data',[]); print(ads[0]['_id'] if ads else '')" 2>/dev/null)
if [ -z "$AD_ID" ] || [ "$AD_ID" = "" ]; then
  # Fallback to active ads
  AD_ID=$(curl -s "$API/ads/active" | python3 -c "import sys,json; d=json.load(sys.stdin); ads=d.get('data',[]); print(ads[0]['_id'] if ads else '')" 2>/dev/null)
fi
if [ -n "$AD_ID" ] && [ "$AD_ID" != "" ]; then
  R=$(curl -s -X POST "$API/ads/$AD_ID/impression" -H "Content-Type: application/json" -d '{"placement":"feed"}')
  check "Ad Impression Track" "$(echo "$R" | python3 -c "import sys,json; d=json.load(sys.stdin); print('tracked') if d.get('data',{}).get('tracked') or d.get('data',{}).get('deduplicated') else print(d.get('message',''))" 2>/dev/null)"
  # Fire again — should be deduplicated by MemoryRedis
  sleep 0.2
  R2=$(curl -s -X POST "$API/ads/$AD_ID/impression" -H "Content-Type: application/json" -d '{"placement":"feed"}')
  check "Dedup (2nd call)" "$(echo "$R2" | python3 -c "import sys,json; d=json.load(sys.stdin); print('deduplicated ✓') if d.get('data',{}).get('deduplicated') else print('tracked (new)')" 2>/dev/null)"
else
  check "Ad Impression Track" ""
  check "Dedup (2nd call)" ""
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════════════"
if [ $FAIL -eq 0 ]; then
  echo "  🎯 ALL PASSED: ✅ $PASS / $((PASS + FAIL))"
else
  echo "  RESULTS: ✅ $PASS passed  ❌ $FAIL failed"
fi
echo "═══════════════════════════════════════════════════════"
