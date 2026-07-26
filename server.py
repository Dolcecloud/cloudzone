from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import time

DATA_FILE = 'server_data.json'

DEFAULT_DATA = {
    "games": [
        {"id": 1, "title": "Forza Horizon 5", "category": "Racing, Speed"},
        {"id": 2, "title": "FC Online / EA FC 25", "category": "Sports, Football"},
        {"id": 3, "title": "Grand Theft Auto V", "category": "Open World, Action"}
    ],
    "users": {},
    "visits": [],
    "servers": [
        {"id": "srv-east-01", "name": "East Node 1", "status": "Online", "load": "42%", "location": "EU", "uptime": "18h 32m"},
        {"id": "srv-us-west", "name": "West Node 2", "status": "Online", "load": "37%", "location": "US", "uptime": "12h 05m"},
        {"id": "srv-apac-03", "name": "APAC Node 3", "status": "Maintenance", "load": "68%", "location": "APAC", "uptime": "2h 20m"}
    ],
    "plans": [
        {"id": "basic", "name": "Basic", "price": "Free", "users": "Unlimited", "status": "Active"},
        {"id": "pro", "name": "Pro", "price": "$9.99/mo", "users": "Priority", "status": "Active"},
        {"id": "enterprise", "name": "Enterprise", "price": "$29.99/mo", "users": "Premium", "status": "Active"}
    ],
    "maintenance": False
}


def load_data():
    if not os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(DEFAULT_DATA, f, ensure_ascii=False, indent=4)
        return DEFAULT_DATA.copy()
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return DEFAULT_DATA.copy()


def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)


STATIC_DIR = os.path.join(os.path.dirname(__file__), 'CloudGamingProject')
app = Flask(__name__, static_folder=STATIC_DIR, static_url_path='/static')
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
CORS(app)

data = load_data()
data.setdefault('maintenance', False)


@app.route('/api/login', methods=['POST'])
def api_login():
    if data.get('maintenance'):
        return jsonify({'status': 'error', 'message': 'maintenance mode enabled'}), 503

    payload = request.get_json() or {}
    user_id = payload.get('user_id') or f"u{int(time.time())}"
    username = payload.get('username') or 'Guest'
    device = payload.get('device_type') or payload.get('device') or 'Unknown'

    user = {
        'id': user_id,
        'name': username,
        'device': device,
        'connected_at': time.strftime('%Y-%m-%d %H:%M:%S')
    }
    data.setdefault('users', {})
    data['users'][user_id] = user
    # Record a visit for this login (real user action)
    try:
        data.setdefault('visits', [])
        ua = request.headers.get('User-Agent', '')
        ip = request.remote_addr or request.headers.get('X-Forwarded-For', '')
        vrec = {'ts': time.strftime('%Y-%m-%d %H:%M:%S'), 'ip': ip, 'ua': ua, 'user_id': user_id}
        data['visits'].append(vrec)
    except Exception:
        pass
    save_data(data)

    return jsonify({'status': 'success', 'user': user, 'games': data.get('games', [])})


@app.route('/api/users', methods=['GET'])
def api_users():
    return jsonify(data.get('users', {}))


@app.route('/api/users/delete', methods=['POST'])
def api_delete_user():
    payload = request.get_json() or {}
    user_id = payload.get('user_id')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'missing user_id'}), 400
    if user_id in data.get('users', {}):
        del data['users'][user_id]
        save_data(data)
        return jsonify({'status': 'success'})
    return jsonify({'status': 'error', 'message': 'user not found'}), 404


@app.route('/api/users/update', methods=['POST'])
def api_update_user():
    payload = request.get_json() or {}
    user_id = payload.get('user_id') or payload.get('id')
    if not user_id:
        return jsonify({'status': 'error', 'message': 'missing user_id'}), 400
    users = data.get('users', {})
    if user_id not in users:
        return jsonify({'status': 'error', 'message': 'user not found'}), 404
    # allow updating name and device
    user = users[user_id]
    if 'name' in payload:
        user['name'] = payload.get('name')
    if 'device' in payload:
        user['device'] = payload.get('device')
    # save and return updated user
    data['users'][user_id] = user
    save_data(data)
    return jsonify({'status': 'success', 'user': user})


@app.route('/api/games', methods=['GET'])
def api_games():
    return jsonify(data.get('games', []))


@app.route('/api/maintenance', methods=['GET'])
def api_maintenance():
    return jsonify({'maintenance': bool(data.get('maintenance', False))})


@app.route('/api/maintenance/update', methods=['POST'])
def api_update_maintenance():
    payload = request.get_json() or {}
    if 'maintenance' not in payload:
        return jsonify({'status': 'error', 'message': 'missing maintenance flag'}), 400
    maintenance = payload.get('maintenance')
    if isinstance(maintenance, str):
        maintenance = maintenance.lower() in ('true', '1', 'yes', 'on')
    else:
        maintenance = bool(maintenance)
    data['maintenance'] = maintenance
    save_data(data)
    return jsonify({'status': 'success', 'maintenance': data['maintenance']})


@app.route('/api/servers', methods=['GET'])
def api_servers():
    return jsonify(data.get('servers', []))


@app.route('/api/servers/update', methods=['POST'])
def api_update_server():
    payload = request.get_json() or {}
    server_id = payload.get('id')
    if not server_id:
        return jsonify({'status': 'error', 'message': 'missing server id'}), 400
    servers = data.get('servers', [])
    for server in servers:
        if server.get('id') == server_id:
            server.update({
                'status': payload.get('status', server.get('status')),
                'load': payload.get('load', server.get('load')),
                'uptime': payload.get('uptime', server.get('uptime'))
            })
            save_data(data)
            return jsonify({'status': 'success', 'server': server})
    return jsonify({'status': 'error', 'message': 'server not found'}), 404


@app.route('/api/plans', methods=['GET'])
def api_plans():
    return jsonify(data.get('plans', []))


@app.route('/api/plans/update', methods=['POST'])
def api_update_plan():
    payload = request.get_json() or {}
    plan_id = payload.get('id')
    if not plan_id:
        return jsonify({'status': 'error', 'message': 'missing plan id'}), 400
    plans = data.get('plans', [])
    for plan in plans:
        if plan.get('id') == plan_id:
            plan.update({
                'status': payload.get('status', plan.get('status')),
                'price': payload.get('price', plan.get('price'))
            })
            save_data(data)
            return jsonify({'status': 'success', 'plan': plan})
    return jsonify({'status': 'error', 'message': 'plan not found'}), 404


@app.route('/api/visit', methods=['POST'])
def api_visit():
    # Record a visit with timestamp, IP, user ID and user agent
    payload = request.get_json(silent=True) or {}
    data.setdefault('visits', [])
    try:
        ua = request.headers.get('User-Agent', '')
        ip = request.remote_addr or request.headers.get('X-Forwarded-For', '')
        record = {
            'ts': time.strftime('%Y-%m-%d %H:%M:%S'),
            'ip': ip,
            'ua': ua,
            'user_id': payload.get('user_id') or payload.get('id') or ''
        }
        if payload.get('username'):
            record['username'] = payload.get('username')
        data['visits'].append(record)
    except Exception:
        # fallback: do nothing
        pass
    save_data(data)
    return jsonify({'count': len(data.get('visits', [])), 'visit': data.get('visits', [])[-1] if data.get('visits') else None})


@app.route('/api/visits', methods=['GET'])
def api_visits():
    visits = data.get('visits', []) or []
    return jsonify({'count': len(visits), 'visits': visits})


@app.route('/admin', methods=['GET'])
@app.route('/admin/', methods=['GET'])
@app.route('/admin.html', methods=['GET'])
def admin_page():
    try:
        return app.send_static_file('admin.html')
    except Exception:
        return 'Admin console unavailable.'


@app.route('/admin.css', methods=['GET'])
def admin_css():
    try:
        return app.send_static_file('admin.css')
    except Exception:
        return 'Admin CSS unavailable.', 404


@app.route('/admin.js', methods=['GET'])
def admin_js():
    try:
        return app.send_static_file('admin.js')
    except Exception:
        return 'Admin JS unavailable.', 404


@app.route('/index.html', methods=['GET'])
def index_html():
    try:
        return app.send_static_file('index.html')
    except Exception:
        return 'App homepage unavailable.'


@app.route('/', methods=['GET'])
def index():
    # Serve static index if present
    try:
        return app.send_static_file('index.html')
    except Exception:
        return 'Cloud Gaming API running.'


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
