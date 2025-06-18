import mysql.connector
from datetime import datetime

# Database connection
db = mysql.connector.connect(
    host="localhost",
    user="switchmap",
    password="CHANGE_ME_NOW",
    database="switchmap",
)


cursor = db.cursor()

# Fetch all data from bandwidth_data
cursor.execute(
    """
    SELECT device_id, timestamp, ifInOctets_current, ifOutOctets_current
    FROM bandwidth_data
"""
)
rows = cursor.fetchall()

for i in range(1, len(rows)):
    prev_row = rows[i - 1]
    curr_row = rows[i]

    # Calculate the total bandwidth usage (delta)
    delta_in = curr_row[2] - prev_row[2]
    delta_out = curr_row[3] - prev_row[3]
    total_bps = (delta_in + delta_out) * 8  # Bandwidth in bits per second

    # Prepare values for insertion
    device_id = curr_row[0]
    timestamp = curr_row[1]

    print(
        f"Inserting device_id: {device_id}, timestamp: {timestamp}, total_bps: {total_bps}"
    )

    # Insert into bandwidth_usage
    cursor.execute(
        """
        INSERT INTO bandwidth_usage (device_id, timestamp, total_bps)
        VALUES (%s, %s, %s)
    """,
        (device_id, timestamp, total_bps),
    )
    db.commit()

# Close the cursor and connection
cursor.close()
db.close()

print("Bandwidth usage calculation and insertion complete.")
