import time
import os
import redis
from fastapi import HTTPException
from collections import defaultdict

# Fallback in-memory rate limiter (used if REDIS_URL is not provided)
rate_limits = defaultdict(list)

# Configuration
MAX_REQUESTS_PER_MINUTE = 5
MAX_REQUESTS_PER_DAY = 20
ONE_MINUTE = 60
ONE_DAY = 86400

# Initialize Redis client (None if REDIS_URL not configured)
redis_url = os.getenv("REDIS_URL")
redis_client = redis.Redis.from_url(redis_url) if redis_url else None

def check_rate_limit(user_id: str):
    """
    Checks if a user has exceeded their rate limit.
    Raises HTTPException 429 if exceeded.
    """
    if redis_client:
        _check_rate_limit_redis(user_id)
    else:
        _check_rate_limit_memory(user_id)

def _check_rate_limit_redis(user_id: str):
    try:
        current_minute = int(time.time() // ONE_MINUTE)
        current_day = int(time.time() // ONE_DAY)

        minute_key = f"rate_limit:{user_id}:min:{current_minute}"
        day_key = f"rate_limit:{user_id}:day:{current_day}"

        # Increment counters
        req_minute = redis_client.incr(minute_key)
        if req_minute == 1:
            redis_client.expire(minute_key, ONE_MINUTE * 2)

        req_day = redis_client.incr(day_key)
        if req_day == 1:
            redis_client.expire(day_key, ONE_DAY * 2)

        if req_day > MAX_REQUESTS_PER_DAY:
            raise HTTPException(status_code=429, detail=f"Daily rate limit exceeded ({MAX_REQUESTS_PER_DAY} requests/day).")
        
        if req_minute > MAX_REQUESTS_PER_MINUTE:
            raise HTTPException(status_code=429, detail=f"Per-minute rate limit exceeded ({MAX_REQUESTS_PER_MINUTE} requests/minute).")
            
    except redis.RedisError as e:
        print(f"Redis rate limiting error: {e}")
        # Fallback to allow request if Redis is temporarily down
        pass
    except HTTPException:
        # Re-raise standard HTTP exceptions
        raise 

def _check_rate_limit_memory(user_id: str):
    now = time.time()
    user_requests = rate_limits[user_id]

    # Clean up old requests (older than a day)
    user_requests = [req_time for req_time in user_requests if now - req_time < ONE_DAY]
    
    # Count requests in the last minute
    requests_last_minute = sum(1 for req_time in user_requests if now - req_time < ONE_MINUTE)

    if len(user_requests) >= MAX_REQUESTS_PER_DAY:
        raise HTTPException(status_code=429, detail=f"Daily rate limit exceeded ({MAX_REQUESTS_PER_DAY} requests/day).")
    
    if requests_last_minute >= MAX_REQUESTS_PER_MINUTE:
        raise HTTPException(status_code=429, detail=f"Per-minute rate limit exceeded ({MAX_REQUESTS_PER_MINUTE} requests/minute).")

    # Add the current request
    user_requests.append(now)
    rate_limits[user_id] = user_requests
