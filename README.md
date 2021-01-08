# About

`smarta` is an open-source Artificially Intelligent Teaching Assistant that uses vector space modeling to understand textbooks and syllabi.

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

If you're on a hosting service like Heroku or Digital Ocean, you'll have to go to settings and configure the environment variables there.

5. Run the app `python app.py`

# Hosting

As a forewarning, after any of these scripts are used, give the server some time (20-30 secs locally, perhaps more on public hosting services) to initialize. This will allow locally required resources to be fetched from any remote servers.

### Hosting Locally (ngrok)

You can use `ngrok` to host locally `./ngrok http <PORT>`

### Deploying to Production

Use `gunicorn -b 0.0.0.0:<PORT> app:flask_app`

### Preloading
Startup may take too long, causing workers to time out and quit. In that case, either manually increase timeout time or preload:
`gunicorn -b 0.0.0.0:8000 --preload app:flask_app`

### Deploying to Heroku/DIgitalOcean/AWS Elastic Bean Stalk

This repo automatically deploys for most major hosting services. Just connect my repo `https://github.com/FurkanToprak/smarTA`.

* *Note:* This server has some considerable boot time, so you may have to find good ways to bind the WSGI server to your desired PORT (through gunicorn).

### Relevant Endpoints

#### 
Make sure your Slack App is configured to listen to events from `https://<YOUR_URL>/slack/events`

#### Add to your Slack Workspace

To install `smarta`, just go to `https://<YOUR_URL>/slack/install` and click the button identical to the one below! The button generated is _unique_ and _secure_.

<html>
<center>
<a><img alt="Add to Slack" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
</center>
</html>

# Architecture

This chatbot is powered with the `Bolt` framework for python. This app listens to event hooks from Slack and responds using its knowledge base (stored in MongoDB) and its NLP Components. This app occupies whichever port specified in the .env file.

## NLP Components

This slackbot indexes the inputted files by topic. The user provides a topic and the user input is fuzzy-matched against the inputted topics. After a section of the textbook is selected, a vector space model is used to calculate the semantic similarity of queries and paragraphs of the textbook. The vector space model uses embeddings that were trained and tested on the [Stanford Question Answering Dataset](https://rajpurkar.github.io/SQuAD-explorer/)

## Database Schemas

The below architecture is used for the MongoDB database.

- `[DB] smartav1`
  - `[Collection] Users`
    ```
    _id: ObjectId()
    questions: string[],
    isAdmin: boolean,
    teamID: string,
    state: number,
    relevantTopics: string[],
    chosenTopic: number,
    ```
  - `[Collection] Workspaces`
    ```
    _id: ObjectId(),
    files: { topic: string, content: string }[],
    teamID: string,
    goodBot: number,
    badBot: number,
    ```
