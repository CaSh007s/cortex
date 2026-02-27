import time
from fastapi import HTTPException
from collections import defaultdict

# Simple in-memory rate limiter for user requests
# Stores: user_id -> list of timestamps
rate_limits = defaultdict(list)

# Configuration
MAX_REQUESTS_PER_MINUTE = 30
MAX_REQUESTS_PER_DAY = 500
ONE_MINUTE = 60
ONE_DAY = 86400

def check_rate_limit(user_id: str):
    """
    Checks if a user has exceeded their rate limit.
    Raises HTTPException 429 if exceeded.
    """
    now = time.time()
    user_requests = rate_limits[user_id]

    # Clean up old requests (older than a day)
    user_requests = [req_time for req_time in user_requests if now - req_time < ONE_DAY]
    
    # Count requests in the last minute
    requests_last_minute = sum(1 for req_time in user_requests if now - req_time < ONE_MINUTE)

    if len(user_requests) >= MAX_REQUESTS_PER_DAY:
        raise HTTPException(status_code=429, detail="Daily rate limit exceeded (500 requests/day).")
    
    if requests_last_minute >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail="Per-minute rate limit exceeded (30 requests/minute).")

    # Add the current request
    user_requests.append(now)
    rate_limits[user_id] = user_requests
