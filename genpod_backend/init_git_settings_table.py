import sqlite3

DB_PATH = "settings.db"

def create_git_settings_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS git_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            platform_name TEXT NOT NULL,
            encrypted_token TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("git_settings table created")

if __name__ == "__main__":
    create_git_settings_table() 