import sqlite3

DB_PATH = "settings.db"

def create_prompts_table():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create table if it doesn't exist
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS prompts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE NOT NULL,
            yaml_prompt TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()
    print("prompts table created")

if __name__ == "__main__":
    create_prompts_table()