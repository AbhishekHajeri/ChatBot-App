from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin, current_user
from dotenv import load_dotenv
from auth import authenticate_user, get_user
from chat import get_gemini_response
import os
import json
import io

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "4ee391a2288b1576cc319184fbee0ab7454161604ef51b0a12f7d2d8255bed60")  # Fallback secret key
login_manager = LoginManager(app)
login_manager.login_view = "login"

@login_manager.user_loader
def load_user(username):
    return get_user(username)

@app.route('/')
@login_required
def index():
    return render_template("index.html")

# Serve login page
@app.route('/login', methods=['GET'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))
    return render_template("login.html")

# Handle login form submit
@app.route('/login', methods=['POST'])
def login_post():
    username = request.form.get("username")
    password = request.form.get("password")
    user = authenticate_user(username, password)
    if user:
        login_user(user)
        return redirect(url_for("index"))
    # Login failed - show error
    return render_template("login.html", error="Invalid credentials, try again.")

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for("login"))

# Chat and other routes
@app.route('/chat', methods=['POST'])
@login_required
def chat():
    try:
        message = request.json["message"]
        chat_history = session.get("chat_history", [])
        response = get_gemini_response(message)
        chat_history.append({"user": message, "bot": response})
        session["chat_history"] = chat_history
        return jsonify({"response": response})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/history')
@login_required
def history():
    return jsonify(session.get("chat_history", []))

@app.route('/download')
@login_required
def download():
    history = session.get("chat_history", [])
    file_content = json.dumps(history, indent=2)
    return send_file(
        io.BytesIO(file_content.encode()),
        mimetype='application/json',
        as_attachment=True,
        download_name='chat_history.json'
    )

@app.route('/clear-chat', methods=['POST'])
@login_required
def clear_chat():
    session["chat_history"] = []
    return jsonify({"success": True})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)