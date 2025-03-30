# Flask Gemini Chat API

This application provides a web API using Flask to interact with the Google Generative AI Gemini API, designed to get you started building with Gemini's capabilities.

## Inspiration
The prompt inspired us to help students navigate potential careers in an easy way. In today’s world, choosing the right career path can be overwhelming. People are often unsure about which career would be the best fit for them, especially when it comes to salary expectations and career growth potential. Our project aims to help users explore different career options, understand salary trends, and make informed decisions based on real-time data.

## What It Does
We’ve developed an application that offers two main features:

1. **Career Exploration Questionnaire**: This feature allows users to answer a series of questions to help identify career paths that best align with their skills, interests, and preferences. It provides personalized career suggestions based on the answers provided by the user.

2. **Salary and Growth Rate Chatbot**: In addition to career exploration, we also integrated a chatbot functionality where users can ask questions about different job areas, specifically related to salary information, job responsibilities, and growth potential. The bot gives personalized responses based on real job data, providing salary insights and career outlooks from our database.

## How We Built It
Our app is built using Flask, a lightweight Python web framework, to handle HTTP requests and manage user interactions. The application integrates a job database and creates a chatbot that either provides a career exploration questionnaire (built in React) or salary information from the database.

The app uses natural language processing (NLP) to analyze user queries and provide salary and growth rate information for various job titles. It pulls relevant data from a database that contains detailed salary information for job roles across different regions. By matching user queries with the closest job title and location, the app gives tailored salary insights, including average salaries, growth rates, and other key details.

The app utilizes the following technologies:
- **SQLite Database** for storing detailed job salary information, growth rates, and location data.
- **Flask** for building the web server and handling HTTP requests.
- **Google Gemini AI** for natural language understanding and generating responses.
- **Fuzzy Matching (using Python's difflib)** to match user queries with job titles.

## Challenges We Ran Into
We ran into challenges trying to quickly learn and implement some technologies, such as:
- Connecting the database to the bot and ensuring proper data retrieval.
- Resolving GitHub merge conflicts and handling version control issues.

## Accomplishments That We're Proud Of
We’re proud that we accomplished a great feat in a short amount of time. We also managed to learn new technologies quickly and apply them to build a functional application. Key accomplishments include:
- Successfully integrating Google Gemini AI for intelligent responses.
- Creating a functional and efficient database to store and retrieve job-related data.
- Ensuring that the app can match user queries with the right job titles and provide personalized salary insights.

## What We Learned
We learned that AI can assist in providing coding solutions, but it also helps to get feedback from each other. Through collaboration, we were able to make decisions faster. Other key lessons include:
- How to use the Google Gemini API and manage API responses.
- Implementing conditional rendering and creating a user-friendly experience.
- Structuring the career exploration logic and job matching algorithms.
- Working as a team to troubleshoot problems and optimize workflows.

## What's Next for The Career Quacker
We are looking forward to making the app even better. Some future improvements we plan to integrate include:

- **Personalized Recommendations**: We can consider integrating personalized career development tips based on the user’s skills and interests. This could involve suggesting courses or certifications to increase their chances of landing a higher-paying job in their field of interest.

- **Integration with Job Boards**: We could integrate the app with job boards or real-time job listings. This way, users can not only see salary data but also find active job postings related to their career interests.

- **Visual Career Maps**: Provide users with career progression paths and visualize where they are and where they could be with the right skills and certifications.
- **Enhanced Career Matching**: Improve the career exploration questionnaire by incorporating more advanced data points to give users even more personalized career suggestions.

## Getting Started

### Prerequisites

Ensure you have Python 3.11 or greater installed on your machine. You can download it from [python.org](https://www.python.org/downloads/).

### Installation

Create a new virtual environment:

 - macOS:
   ```bash
   $ python -m venv venv
   $ . venv/bin/activate
   ```

 - Windows:
   ```cmd
   > python -m venv venv
   > .\venv\Scripts\activate
   ```

 - Linux:
    ```bash
    $ python -m venv venv
    $ source venv/bin/activate
    ```

```
cd server-python
```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

### Configuration

Make a copy of the example environment variables file by copying the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Add your [API key](https://ai.google.dev/gemini-api/docs/api-key) to the newly created `.env` file or as an environment variable.

### Running the Application

 ***make sure to put jobs_data.db in the same directory as app.py**

Run the application with the following command:

```bash
cd server-python
python app.py
```

The server will start on `localhost:9000`.

### to run frontend:

```
cd client-react
npm install
npm run start
```


