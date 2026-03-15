import urllib.request
import json

def test_api():
    # Login
    data = json.dumps({'username': 'admin_new', 'password': 'TestPassword123!'}).encode('utf-8')
    req = urllib.request.Request('http://127.0.0.1:8000/api/auth/login/', data=data, headers={'Content-Type': 'application/json'})
    
    try:
        res = urllib.request.urlopen(req)
        token = json.loads(res.read().decode())['access']
        print("Logged in successfully. Token acquired.")
    except urllib.error.HTTPError as e:
        print("Login failed:", e, e.read().decode())
        return

    # POST Category
    cat_data = json.dumps({'name': 'Test Category API'}).encode('utf-8')
    req2 = urllib.request.Request('http://127.0.0.1:8000/api/categories/', data=cat_data, headers={'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token})
    try:
        res2 = urllib.request.urlopen(req2)
        print("POST Category success:", res2.getcode(), res2.read().decode())
    except urllib.error.HTTPError as e:
        print("POST Category failed:", e.getcode(), e.read().decode())

    # GET Categories
    req3 = urllib.request.Request('http://127.0.0.1:8000/api/categories/')
    try:
        res3 = urllib.request.urlopen(req3)
        print("GET Category success:", res3.getcode())
    except urllib.error.HTTPError as e:
        print("GET Category failed:", e.getcode(), e.read().decode())

test_api()
