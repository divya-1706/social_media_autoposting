import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "social.db")

def run_migrations():
    if not os.path.exists(DB_PATH):
        print(f"[MIGRATION] Database file not found at {DB_PATH}, skipping migration.")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Check columns in linkedin_users table if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='linkedin_users';")
    if cursor.fetchone():
        cursor.execute("PRAGMA table_info(linkedin_users);")
        columns = [column[1] for column in cursor.fetchall()]

        if "refresh_token" not in columns:
            print("[MIGRATION] Adding refresh_token column to linkedin_users table...")
            cursor.execute("ALTER TABLE linkedin_users ADD COLUMN refresh_token VARCHAR;")
            conn.commit()

        if "expires_at" not in columns:
            print("[MIGRATION] Adding expires_at column to linkedin_users table...")
            cursor.execute("ALTER TABLE linkedin_users ADD COLUMN expires_at VARCHAR;")
            conn.commit()

    conn.close()
    print("[MIGRATION] Database schema check completed.")

if __name__ == "__main__":
    run_migrations()
