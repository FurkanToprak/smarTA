from slack_bolt import App
import os
from dotenv import load_dotenv
from devMessages import envPortException, envSecretException, envTokenException, fileProcessingError, envDumpException, envMongoPasswordException, envMongoDbException
import slackMessages
from slackHelpers import fetchTeamFromURL, processFiles, findRelevantTopics
from mongoHelpers import Monkey, MAX_STATE
import pymongo
import requests
from smartaBrain import SmartaBrain
from slack_bolt.adapter.flask import SlackRequestHandler
from flask import Flask, request
# Load environment variables.
load_dotenv()
slackSigningSecret = os.getenv('SLACK_SIGNING_SECRET')
if slackSigningSecret is None:
    raise envSecretException
slackOAuthToken = os.getenv('SLACK_OAUTH_TOKEN')
if slackOAuthToken is None:
    raise envTokenException
admins = os.getenv('SLACK_OAUTH_TOKEN')
appPort = os.getenv('PORT')
try:
    appPort = int(appPort)
except:
    raise envPortException
dumpFilePath = os.getenv('DUMP_FILE_PATH')
if dumpFilePath is None:
    raise envDumpException
mongoPassword = os.getenv('MONGO_PASS')
if mongoPassword is None:
    raise envMongoPasswordException
mongoDatabase = os.getenv('MONGO_DB')
if mongoDatabase is None:
    raise envMongoDbException

# Initialize app.
app = App(
    signing_secret=slackSigningSecret,
    token=slackOAuthToken
)

flask_app = Flask(__name__)
flask_app.debug = True
handler = SlackRequestHandler(app)
# app.start(port=appPort)
if __name__ == '__main__':
    flask_app.run(host='0.0.0.0', port=appPort, debug=True)
# Initialize mongo controller
monkey = Monkey(mongoDatabase, mongoPassword)
# Initialize pretrained BERT NLP model
# brain = SmartaBrain()


def setAdmin(eventTeam, eventUser, status):
    monkey.updateUser(eventTeam, eventUser, isAdmin=status)


def addQuestion(eventTeam, eventUser, question):
    monkey.updateUser(eventTeam, eventUser, question=question)


def processCommand(eventText, eventTeam, eventUser, say, isAdmin, state, goodBot, badBot):
    try:
        if slackMessages.isAdminCommand(eventText) and not isAdmin:
            say(slackMessages.adminRequiredError)
            return
        elif eventText == slackMessages.statusWorkspaceCommand:
            searchResult = monkey.findWorkspace(eventTeam)
            files = searchResult['files']
            say(slackMessages.statusWorkspaceResponse(eventTeam, files))
        elif eventText == slackMessages.clearWorkspaceCommand:
            monkey.updateWorkspace(eventTeam, -1)
            monkey.resetAllUsers(eventTeam)
            say(slackMessages.clearWorkspaceResponse)
        elif eventText == slackMessages.statusCommand:
            say(slackMessages.statusResponse(isAdmin, eventUser, eventTeam))
        elif eventText == slackMessages.userCommand:
            say(slackMessages.userResponse)
            setAdmin(eventTeam, eventUser, False)
        elif eventText == slackMessages.adminCommand:
            say(slackMessages.adminResponse)
            setAdmin(eventTeam, eventUser, True)
        elif eventText == slackMessages.botHelpCommand:
            say(slackMessages.botHelp)
        elif eventText == slackMessages.inputHelpCommand:
            say(slackMessages.inputHelp)
        elif eventText == slackMessages.questionHelpCommand:
            say(slackMessages.questionHelp)
        elif eventText == slackMessages.listCommandsCommand:
            say(slackMessages.listCommands())
        elif eventText == slackMessages.listTopicsCommand:
            searchResult = monkey.findWorkspace(eventTeam)
            files = searchResult['files']
            say(slackMessages.listTopics(files))
        elif eventText == slackMessages.cancelQuestionCommand:
            if state == 0:
                say(slackMessages.zeroStateRestriction)
                return
            else:
                monkey.updateUser(eventTeam, eventUser, state=0)
                say(slackMessages.cancelQuestionResponse)
        elif eventText == slackMessages.backQuestionCommand:
            if state == 0:
                say(slackMessages.zeroStateRestriction)
            else:
                monkey.updateUser(eventTeam, eventUser, state=state - 1)
                say(slackMessages.backQuestionResponse)
        elif eventText == slackMessages.goodBotCommand:
            say(slackMessages.goodBotResponse)
            monkey.updateWorkspace(eventTeam, goodBot=goodBot + 1)
        elif eventText == slackMessages.badBotCommand:
            say(slackMessages.badBotResponse)
            monkey.updateWorkspace(eventTeam, badBot=badBot + 1)
        elif eventText == slackMessages.botStatusCommand:
            say(slackMessages.botStatusResponse(goodBot, badBot))
    except Exception as s:
        print(s)
        say(slackMessages.unknownError)


@app.event('app_home_opened')
def Greet(event, say):
    eventUser = event['user']
    say(slackMessages.welcomeUser)


@app.event('message')
def Respond(event, say):
    # Get event metadata
    eventUser = event['user']
    eventText = event['text']
    try:
        eventFiles = event['files']
    except KeyError:
        eventFiles = None  # No files
    try:
        eventTeam = event['team']
    except KeyError:  # This happens when files are sent.
        if eventFiles is None:
            say(slackMessages.unknownError)
            return
        else:
            try:
                firstFileURL = eventFiles[0]['permalink_public']
                eventTeam = fetchTeamFromURL(firstFileURL)
            except:
                say(slackMessages.unknownError)
                return
    # Get this workspace. If workspace doesn't exist, create it.
    thisWorkspace = monkey.findWorkspace(eventTeam)
    if not thisWorkspace:
        thisWorkspace = monkey.insertWorkspace(eventTeam)
    # Get this user. If user doesn't exist, create it.
    thisUser = monkey.findUser(eventTeam, eventUser)
    if not thisUser:
        thisUser = monkey.insertUser(eventTeam, eventUser)
    files = thisWorkspace['files']
    goodBot = thisWorkspace['goodBot']
    badBot = thisWorkspace['badBot']
    isAdmin = thisUser['isAdmin']  # bool
    state = thisUser['state']  # int
    relevantTopics = thisUser['relevantTopics']  # string[]
    chosenTopic = thisUser['chosenTopic']  # int
    # Flags regarding user
    convertFile = eventText == slackMessages.convertFlag
    if slackMessages.isCommand(eventText):  # Process user message
        processCommand(eventText, eventTeam, eventUser,
                       say, isAdmin, state, goodBot, badBot)
        return
    elif eventFiles:  # Process files, if any and if possible
        processFiles(monkey, eventTeam, eventFiles, say, convertFile,
                     isAdmin, slackOAuthToken, dumpFilePath)
        return
    else:  # questions
        addQuestion(eventTeam, eventUser, eventText)
        searchResult = monkey.findWorkspace(eventTeam)
        files = searchResult['files']
        # if state 0 find topic
        if state == 0:
            fileTopics = list(map(lambda file: file["topic"], files))
            relevantTopics = findRelevantTopics(fileTopics, eventText)
            if len(relevantTopics) > 0:
                say(slackMessages.relevantTopicsMessage(relevantTopics))
                monkey.updateUser(eventTeam, eventUser,
                                  state=(1 + state) % MAX_STATE, relevantTopics=relevantTopics)
                return
            else:
                say(slackMessages.noRelevantTopicsMessage)
                return
            return
        # if state 1 choose topic
        elif state == 1:
            try:
                chosenTopic = int(eventText) - 1
            except Exception as s:
                say(slackMessages.invalidChosenTopicMessage)
                return
            if 0 <= chosenTopic and chosenTopic < len(relevantTopics):
                monkey.updateUser(eventTeam, eventUser,
                                  state=(1 + state) % MAX_STATE, chosenTopic=chosenTopic)
                say(slackMessages.choseTopicMessage(
                    relevantTopics[chosenTopic]))
                return
            else:
                say(slackMessages.invalidChosenTopicMessage)
                return
        # if state 2 ask question
        elif state == 2:
            # Get text by retrieving relevant topic.
            relevantText = None
            relevantTopic = relevantTopics[chosenTopic]
            for i in range(0, len(files)):
                if files[i]['topic'] == relevantTopic:
                    relevantText = files[i]['content']
                    break
            if relevantText is None:
                say(slackMessages.unknownError)
                return
            say(slackMessages.questionResponse(
                brain.think(relevantText, eventText)))
            return

@flask_app.route("/slack/events", methods=["POST"])
def slack_events():
    return handler.handle(request)

