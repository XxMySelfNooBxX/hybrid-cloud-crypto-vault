from flask import Flask, request, jsonify, send_file
import os, requests, sqlite3, io
from datetime import datetime, timezone, timedelta
from PIL import Image
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from google.cloud import kms
import logging
app = Flask(__name__)

# ─── IST TIMEZONE ───────────────────────────────────────────────
IST = timezone(timedelta(hours=5, minutes=30))

# ─── GCP KMS CONFIGURATION ──────────────────────────────────────
PROJECT_ID   = "cloud-project-486813"
LOCATION     = "asia-south1"
KEY_RING     = "vault-keyring"
KEY_NAME     = "master-key"
KMS_KEY_PATH = f"projects/{PROJECT_ID}/locations/{LOCATION}/keyRings/{KEY_RING}/cryptoKeys/{KEY_NAME}"
kms_client   = kms.KeyManagementServiceClient()

# ─── FORENSIC DB ────────────────────────────────────────────────
DB_PATH = '/tmp/vault_logs.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''CREATE TABLE IF NOT EXISTS logs
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      time TEXT, ip TEXT, location TEXT,
                      device TEXT, action TEXT, status TEXT)''')
init_db()

def log_event(ip, action, status, user_agent):
    IST = timezone(timedelta(hours=5, minutes=30))
    time_str = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")
    # Force-log to GCP Cloud Logging so we can see it
    logging.warning(f"[VAULT] IST time_str={time_str} | UTC={datetime.now(timezone.utc).strftime('%H:%M:%S')}")

    device   = "Desktop/Laptop" if ("Windows" in user_agent or "Macintosh" in user_agent) else "Mobile/Unknown"
    location = "Unknown"
    if ip and ip != "127.0.0.1":
        try:
            res = requests.get(f"http://ip-api.com/json/{ip}", timeout=2).json()
            if res.get("status") == "success":
                location = f"{res.get('city')}, {res.get('countryCode')}"
        except: pass
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            "INSERT INTO logs (time, ip, location, device, action, status) VALUES (?,?,?,?,?,?)",
            (time_str, ip, location, device, action, status)
        )

def _corsify(response, status=200):
    response.headers.add("Access-Control-Allow-Origin",  "*")
    response.headers.add("Access-Control-Allow-Headers", "*")
    response.headers.add("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE")
    response.status_code = status
    return response

# ─── TZ DEBUG (remove after confirming fix) ───────────────────
@app.route('/tz-test')
def tz_test():
    ist_time = datetime.now(IST).strftime("%Y-%m-%d %H:%M:%S")
    utc_time = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    return jsonify({"ist": ist_time, "utc": utc_time, "offset": "+05:30"})

# ─── TEXT ENCRYPTION ──────────────────────────────────────────
@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
def text_engine():
    if request.method == 'OPTIONS': return _corsify(jsonify({'status': 'ok'}))
    if request.method == 'GET':     return "Hybrid Vault Backend Active!"

    ip         = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0]
    user_agent = request.headers.get('User-Agent', '')

    try:
        data     = request.get_json()
        message  = data.get('message', '')
        password = data.get('key', '')
        mode     = data.get('mode', 'encrypt')

        if mode == 'encrypt':
            dek = os.urandom(32)
            iv  = os.urandom(12)
            cipher    = Cipher(algorithms.AES(dek), modes.GCM(iv), backend=default_backend())
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(message.encode()) + encryptor.finalize()

            enc_res      = kms_client.encrypt(request={'name': KMS_KEY_PATH, 'plaintext': dek, 'additional_authenticated_data': password.encode()})
            encrypted_dek = enc_res.ciphertext
            len_dek       = len(encrypted_dek).to_bytes(2, byteorder='big')
            final_result  = (len_dek + encrypted_dek + iv + encryptor.tag + ciphertext).hex()
            log_event(ip, "TEXT ENCRYPT", "SUCCESS", user_agent)

        else:
            encrypted_data = bytes.fromhex(message)
            len_dek        = int.from_bytes(encrypted_data[0:2], 'big')
            encrypted_dek  = encrypted_data[2 : 2+len_dek]
            iv             = encrypted_data[2+len_dek     : 2+len_dek+12]
            tag            = encrypted_data[2+len_dek+12  : 2+len_dek+28]
            ciphertext     = encrypted_data[2+len_dek+28  :]

            try:
                dec_res = kms_client.decrypt(request={'name': KMS_KEY_PATH, 'ciphertext': encrypted_dek, 'additional_authenticated_data': password.encode()})
                dek     = dec_res.plaintext
            except Exception:
                log_event(ip, "TEXT DECRYPT", "FAIL: INVALID KEY", user_agent)
                return _corsify(jsonify({"error": "Access Denied: Invalid Password"}), 403)

            cipher    = Cipher(algorithms.AES(dek), modes.GCM(iv, tag), backend=default_backend())
            decryptor = cipher.decryptor()
            final_result = (decryptor.update(ciphertext) + decryptor.finalize()).decode('utf-8')
            log_event(ip, "TEXT DECRYPT", "SUCCESS", user_agent)

        return _corsify(jsonify({"result": final_result, "status": "Success"}))

    except Exception as e:
        log_event(ip, "TEXT OP", f"ERROR: {str(e)[:20]}", user_agent)
        return _corsify(jsonify({"error": str(e)}), 500)


# ─── FILE ENCRYPTION ──────────────────────────────────────────
@app.route('/file', methods=['POST', 'OPTIONS'])
def file_engine():
    if request.method == 'OPTIONS': return _corsify(jsonify({'status': 'ok'}))

    ip         = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0]
    user_agent = request.headers.get('User-Agent', '')

    try:
        file          = request.files.get('file')
        password      = request.form.get('key', '')
        mode          = request.form.get('mode', 'encrypt')
        format_choice = request.form.get('format', 'original')

        if not file or not password:
            return _corsify(jsonify({"error": "Missing file or key"}), 400)

        file_bytes = file.read()
        filename   = file.filename

        if mode == 'encrypt':
            if format_choice != 'original':
                try:
                    img = Image.open(io.BytesIO(file_bytes))
                    if img.mode in ("RGBA", "P") and format_choice == "jpg":
                        img = img.convert("RGB")
                    out = io.BytesIO()
                    img.save(out, format=format_choice.upper())
                    file_bytes = out.getvalue()
                    filename   = filename.rsplit('.', 1)[0] + f".{format_choice}"
                except Exception:
                    pass

            dek       = os.urandom(32)
            iv        = os.urandom(12)
            cipher    = Cipher(algorithms.AES(dek), modes.GCM(iv), backend=default_backend())
            encryptor = cipher.encryptor()
            ciphertext = encryptor.update(file_bytes) + encryptor.finalize()

            enc_res       = kms_client.encrypt(request={'name': KMS_KEY_PATH, 'plaintext': dek, 'additional_authenticated_data': password.encode()})
            encrypted_dek = enc_res.ciphertext
            len_dek       = len(encrypted_dek).to_bytes(2, byteorder='big')
            name_bytes    = filename.encode('utf-8')
            len_name      = len(name_bytes).to_bytes(1, byteorder='big')
            final_payload = len_dek + encrypted_dek + iv + encryptor.tag + len_name + name_bytes + ciphertext

            log_event(ip, f"FILE ENCRYPT ({filename})", "SUCCESS", user_agent)
            response = send_file(io.BytesIO(final_payload), download_name=filename + ".enc", as_attachment=True)
            return _corsify(response)

        else:
            len_dek       = int.from_bytes(file_bytes[0:2], 'big')
            encrypted_dek = file_bytes[2      : 2+len_dek]
            iv            = file_bytes[2+len_dek : 2+len_dek+12]
            tag           = file_bytes[2+len_dek+12 : 2+len_dek+28]
            len_name      = int.from_bytes(file_bytes[2+len_dek+28 : 2+len_dek+29], 'big')
            orig_name     = file_bytes[2+len_dek+29 : 2+len_dek+29+len_name].decode('utf-8')
            ciphertext    = file_bytes[2+len_dek+29+len_name :]

            try:
                dec_res = kms_client.decrypt(request={'name': KMS_KEY_PATH, 'ciphertext': encrypted_dek, 'additional_authenticated_data': password.encode()})
                dek     = dec_res.plaintext
            except Exception:
                log_event(ip, "FILE DECRYPT", "FAIL: INVALID KEY", user_agent)
                return _corsify(jsonify({"error": "Access Denied: Invalid Password"}), 403)

            cipher    = Cipher(algorithms.AES(dek), modes.GCM(iv, tag), backend=default_backend())
            decryptor = cipher.decryptor()
            decrypted = decryptor.update(ciphertext) + decryptor.finalize()

            log_event(ip, f"FILE DECRYPT ({orig_name})", "SUCCESS", user_agent)
            response = send_file(io.BytesIO(decrypted), download_name=orig_name, as_attachment=True)
            return _corsify(response)

    except Exception as e:
        log_event(ip, "FILE OP", "ERROR", user_agent)
        return _corsify(jsonify({"error": str(e)}), 500)


# ─── LOGS ─────────────────────────────────────────────────────
@app.route('/logs', methods=['GET', 'OPTIONS'])
def get_logs():
    if request.method == 'OPTIONS': return _corsify(jsonify({'status': 'ok'}))

    ip            = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0]
    personal_only = request.args.get('personal', 'false').lower() == 'true'

    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        if personal_only:
            rows = conn.execute("SELECT * FROM logs WHERE ip=? ORDER BY id DESC LIMIT 50", (ip,)).fetchall()
        else:
            rows = conn.execute("SELECT * FROM logs ORDER BY id DESC LIMIT 50").fetchall()
        logs_list = [dict(r) for r in rows]

    return _corsify(jsonify({"logs": logs_list}))


# ─── PANIC WIPE ───────────────────────────────────────────────
@app.route('/panic', methods=['POST', 'OPTIONS'])
def panic_wipe():
    if request.method == 'OPTIONS': return _corsify(jsonify({'status': 'ok'}))

    ip         = request.headers.get('X-Forwarded-For', request.remote_addr).split(',')[0]
    user_agent = request.headers.get('User-Agent', '')

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute("DELETE FROM logs")

    log_event(ip, "SYSTEM PURGE", "PANIC WIPE EXECUTED", user_agent)
    return _corsify(jsonify({"status": "Logs Wiped"}))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8080)