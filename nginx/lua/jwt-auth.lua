-- JWT Authentication Lua Script for Nginx Open Source
-- Requires: lua-resty-jwt
-- Install: luarocks install lua-resty-jwt

local jwt = require "resty.jwt"

local jwt_secret = os.getenv("JWT_SECRET") or "your-secret-key"

-- Extract JWT token from Authorization header
local function get_jwt_token()
    local auth_header = ngx.var.http_authorization
    if not auth_header then
        return nil
    end
    
    local token = string.match(auth_header, "Bearer%s+(.+)")
    return token
end

-- Validate JWT and extract claims
local function validate_jwt(token)
    if not token then
        return nil, "No token provided"
    end
    
    local jwt_obj = jwt:verify(jwt_secret, token)
    
    if not jwt_obj.verified then
        return nil, "Invalid token"
    end
    
    return jwt_obj.payload, nil
end

-- Main handler
local token = get_jwt_token()

if not token then
    ngx.status = ngx.HTTP_UNAUTHORIZED
    ngx.header.content_type = "application/json"
    ngx.say('{"error": "Unauthorized", "message": "No token provided"}')
    ngx.exit(ngx.HTTP_UNAUTHORIZED)
end

local claims, err = validate_jwt(token)

if not claims then
    ngx.status = ngx.HTTP_UNAUTHORIZED
    ngx.header.content_type = "application/json"
    ngx.say('{"error": "Unauthorized", "message": "' .. (err or "Invalid token") .. '"}')
    ngx.exit(ngx.HTTP_UNAUTHORIZED)
end

-- Extract claims and set headers
if claims.userId then
    ngx.req.set_header("X-User-Id", claims.userId)
end

if claims.email then
    ngx.req.set_header("X-User-Email", claims.email)
end

if claims.roles then
    local roles = type(claims.roles) == "table" and table.concat(claims.roles, ",") or claims.roles
    ngx.req.set_header("X-User-Roles", roles)
end

if claims.scopes then
    local scopes = type(claims.scopes) == "table" and table.concat(claims.scopes, ",") or claims.scopes
    ngx.req.set_header("X-User-Scopes", scopes)
end

-- Continue to backend
return

