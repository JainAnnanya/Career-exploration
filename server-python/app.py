import difflib
import sqlite3
import re
from flask import Flask, request, Response, stream_with_context
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)
CORS(app)

# Configure Gemini
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
model = genai.GenerativeModel(model_name="gemini-1.5-flash")

STATES = [
    "Alabama", "Alaska", "Arizona", "California", "Colorado", "Connecticut", "Delaware", "Florida", 
    "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", 
    "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", 
    "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", 
    "South Dakota", "Tennessee", "Texas", "Utah", "Virginia", "Washington", "West Virginia", 
    "Wisconsin", "Wyoming"
]

def extract_location(user_query):
    """Extract location (state) from query."""
    for state in STATES:
        if state.lower() in user_query.lower():
            return state
    return None

def get_all_job_titles():
    """Fetch all unique job titles from the database for better matching."""
    conn = sqlite3.connect('jobs_data.db')
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT occ_title FROM salaries")
    job_titles = [row[0] for row in cursor.fetchall()]
    conn.close()
    return job_titles

def find_closest_job_title(user_query):
    """Find the closest job title from the database using fuzzy matching."""
    job_titles = get_all_job_titles()
    closest_title = difflib.get_close_matches(user_query, job_titles, n=1, cutoff=0.4)
    return closest_title[0] if closest_title else None

def get_job_data(user_query):
    """Fetch job data for the closest matching job title and location from user query."""
    
    closest_title = find_closest_job_title(user_query)
    if not closest_title:
        return f"Sorry, I couldn't find salary data for '{user_query}'."

    location = extract_location(user_query)
    conn = sqlite3.connect('jobs_data.db')
    cursor = conn.cursor()

    query = """
        SELECT occ_title, area_title, a_mean, a_median, h_mean, growth_rate
        FROM salaries
        WHERE occ_title LIKE ?
    """
    params = [f"%{closest_title}%"]

    if location:
        query += " AND area_title LIKE ?"
        params.append(f"%{location}%")

    cursor.execute(query, tuple(params))
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return f"No salary data found for '{closest_title}' in '{location if location else 'any location'}'."

    response = f"**Job Title:** {closest_title}\n\n"
    
    if location:
        response += f"**Location:** {location}\n\n"

    for row in rows:
        occ_title, area_title, a_mean, a_median, h_mean, growth_rate = row
        response += f"**Region:** {area_title}\n"
        response += f"- **Average Salary (Annual):** ${a_mean:,}\n" if a_mean else ""
        response += f"- **Median Salary (Annual):** ${a_median:,}\n" if a_median else ""
        response += f"- **Hourly Wage:** ${h_mean:.2f}\n" if h_mean else ""
        response += f"- **Growth Rate:** {growth_rate}%\n" if growth_rate else ""
        response += "\n"

    return response

def generate_context(job_data):
    """Format job data into a readable string."""
    return job_data

# Routes
@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests with job data context."""
    data = request.json
    msg = data.get('chat', '')
    chat_history = data.get('history', [])

    job_data = get_job_data(msg)
    context = generate_context(job_data)

    prompt = (
        "You are an AI assistant specialized in job exploration. Your primary task is to answer questions "
        "about careers, salaries, and job requirements.\n\n"
        "When a user asks about a job role, first check the 'jobs_data.db' database for salary and employment data. "
        "If relevant data is found, use it to provide accurate salary insights. If salary data is not available, "
        "acknowledge it and proceed with a general industry estimate.\n\n"
        "In addition to salary details, provide comprehensive answers about job responsibilities, required skills, "
        "qualifications, and career growth based on your knowledge. Ensure responses are well-structured, professional, "
        "and clear.\n\n"
        "Use the following structure when applicable:\n\n"
        "**Job Title:** [Job Name]\n\n"
        "**Location:** [Region/State] (if relevant)\n\n"
        "**Average Salary (Annual):** [$XX,XXX]\n\n"
        "**Median Salary (Annual):** [$XX,XXX]\n\n"
        "**Hourly Wage:** [$XX.XX]\n\n"
        "**Growth Rate:** [X.X%]\n\n"
        "**Job Responsibilities:** [List of key tasks]\n\n"
        "**Required Skills:** [List of essential skills]\n\n"
        "**Educational Requirements:** [Degree, certifications, etc.]\n\n"
        "**Career Outlook:** [Job demand, growth potential, industry trends]\n\n"
        f"User query: {msg}\n\nRelevant job data:\n{context}\n\n"
        "Answer concisely and professionally, following the structured format above."
    )

    chat_session = model.start_chat(history=chat_history)
    response = chat_session.send_message(prompt)

    return {"text": response.text}

@app.route("/stream", methods=["POST"])
def stream():
    """Stream responses with real-time updates."""
    def generate():
        data = request.json
        msg = data.get('chat', '')
        chat_history = data.get('history', [])

        job_data = get_job_data(msg)
        context = generate_context(job_data)

        chat_session = model.start_chat(history=chat_history)
        response = chat_session.send_message(
            f"User query: {msg}\n\nRelevant job data:\n{context}\n\nAnswer concisely:",
            stream=True
        )
        for chunk in response:
            yield f"{chunk.text}"

    return Response(stream_with_context(generate()), mimetype="text/event-stream")

# Initialize and run
if __name__ == '__main__':
    app.run(port=os.getenv("PORT", 9000))
