# About
This app occupies whichever port specified in the .env file.

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
## NLTK
A package manager will pop up. Just install the package `punkt`, which is used for sentence-splitting. You can just exit out of the window if it is already installed.

# Add to your Slack Workspace
To install `smarta`, just click the button below! This button can be embedded in HTML with the code following the button.
<html>
<a href="https://slack.com/oauth/v2/authorize?scope=chat:write,files:read,im:history,im:read,im:write,users.profile:read,users:read&client_id=936236937696.1559445881875"><img alt=""Add to Slack"" height="40" width="139" src="https://platform.slack-edge.com/img/add_to_slack.png" srcset="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x" /></a>
</html>