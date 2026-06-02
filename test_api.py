import urllib.request, json

BASE = "http://localhost:8000"

def api(method, path, data=None, token=None, files=None):
    url = BASE + path
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if files:
        import io
        boundary = "----BOUNDARY123"
        body = b""
        for name, (filename, content, mime) in files.items():
            body += f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{filename}\"\r\nContent-Type: {mime}\r\n\r\n".encode()
            body += content if isinstance(content, bytes) else content.encode()
            body += b"\r\n"
        body += f"--{boundary}--\r\n".encode()
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
    elif data is not None:
        body = json.dumps(data).encode()
        headers["Content-Type"] = "application/json"
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    
    try:
        r = urllib.request.urlopen(req, timeout=15)
        return r.status, json.loads(r.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())
    except Exception as e:
        return 0, str(e)

# Login
status, body = api("POST", "/api/auth/login", {"username": "Admin", "password": "admin"})
token = body["token"]
print(f"[LOGIN] OK token={token[:20]}...")

# 1. Create a duty type
status, body = api("POST", "/api/duties/", {
    "name": "General Duty", "short_name": "GD", "color": "#3498db"
}, token=token)
print(f"[CREATE DUTY] {status} id={body.get('id','?')} name={body.get('name','?')}")

# 2. Create a second duty type
status, body = api("POST", "/api/duties/", {
    "name": "Night Duty", "short_name": "ND", "color": "#2c3e50"
}, token=token)
print(f"[CREATE DUTY 2] {status} id={body.get('id','?')}")

# 3. Create a user
status, body = api("POST", "/api/users/", {
    "name": "Test Officer",
    "email": "test@drms.local",
    "password": "test123",
    "role": "User",
    "officer_id": 1
}, token=token)
print(f"[CREATE USER] {status} id={body.get('id','?')} name={body.get('name','?')}")

# 4. List users now
status, body = api("GET", "/api/users/", token=token)
print(f"[USERS] {status} count={len(body)}")

# 5. List duties now
status, body = api("GET", "/api/duties/", token=token)
print(f"[DUTIES] {status} count={len(body)}")
for d in body:
    print(f"   - {d['id']}: {d['name']} ({d['short_name']})")

# 6. Get an officer
status, body = api("GET", "/api/officers/", token=token)
if len(body) > 0:
    o = body[0]
    print(f"[FIRST OFFICER] id={o['id']} rank={o.get('rank','?')} name={o.get('name','?')} g_no={o.get('g_no','?')}")

print("\n=== All tests passed ===")
