# About
`smarta` is your Artificially Intelligent Teaching Assistant

# Architecture

This chatbot is powered with the `Bolt` framework for python. This app listens to event hooks from Slack and responds using its knowledge base (stored in MongoDB) and its NLP Components. This app occupies whichever port specified in the .env file.

## NLP Components
This slackbot indexes the inputted files by topic. The user provides a topic and the user input is fuzzy-matched against the inputted topics. After a section of the textbook is selected, a vector space model is used to calculate the semantic similarity of queries and paragraphs of the textbook. The vector space model uses embeddings that were trained and tested on the [Stanford Question Answering Dataset](https://rajpurkar.github.io/SQuAD-explorer/) 

## Database Schemas 

The below architecture is used for the MongoDB database.

* `[DB] smartav1`
  * `[Collection] Users`
    ```
    _id: ObjectId()
    questions: string[],
    isAdmin: boolean,
    teamID: string,
    state: number,
    relevantTopics: string[],
    chosenTopic: number,
    ```
  * `[Collection] Workspaces`
    ```
    _id: ObjectId(),
    files: { topic: string, content: string }[],
    teamID: string,
    goodBot: number,
    badBot: number,
    ```

# Installation and Usage
You too can clone and host this chatbot. As a prerequisite, you need to have a Slack app and a MongoDB Atlas instance.

1. Set up a virtual environment `python3 -m venv botvenv`
2. Activate the virtual environment `source ./botvenv/bin/activate`. Once you're done using the venv, enter `deactivate` into the command line.
3. Install the requirements `pip install -r requirements.txt`
4. Create a `.env` file and enter the below information:
```
SLACK_SIGNING_SECRET=#STRING
SLACK_OAUTH_TOKEN=#STRING
PORT=#INT
DUMP_FILE_PATH=#STRING
MONGO_PASS=#STRING
MONGO_DB=#STRING
```
5. Run the app `python app.py`

## Hosting

### Hosting Locally (ngrok)
You can use `ngrok` to host locally `./ngrok http <PORT>`

### Deploying to Production
Use `gunicorn --workers=1 -b localhost:8000 app:flask_app`

### Deploying to Heroku
This repo automatically deploys. Just connect my repo `https://github.com/FurkanToprak/smarTA`.

### Configuring Event Listener
If you're hosting this chatbot yourself, make sure your chatbot listens to events at `https://<YOUR_URL>/slack/events`

# Add to your Slack Workspace
To install `smarta`, just click the button below! This button can be embedded in HTML with the code following the button.
<html>
<a href="https://slack.com/oauth/v2/authorize?scope=chat:write,files:read,im:history,im:read,im:write,users.profile:read,users:read&client_id=936236937696.1559445881875"><img alt=""Add to Slack"" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
</html>