import json
from flask_login import UserMixin

class User(UserMixin):
    def __init__(self, username):
        self.id = username

def load_users():
    with open("users.json") as f:  # Ensure users.json is here
        return json.load(f)

def authenticate_user(username, password):
    users = load_users()
    print(f"Loaded users: {users}")
    print(f"Trying to authenticate {username} with password {password}")
    if username in users:
        print(f"User found. Stored password: {users[username]}")
    else:
        print("User not found.")
    if username in users and users[username].strip() == password.strip():
        return User(username)
    return None

def get_user(username):
    users = load_users()
    if username in users:
        return User(username)
    return None
