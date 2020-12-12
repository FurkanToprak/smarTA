import re
import requests
import slackMessages
from uuid import uuid4
from os import remove
from pdfminer.high_level import extract_text
from fuzzywuzzy import fuzz

compiledTeamRegex = re.compile('https://slack-files.com/(.*)-.+-.+')
tooMuchSpaceRegex = re.compile('\s+')


def fetchTeamFromURL(fileURL):
    return compiledTeamRegex.search(fileURL).group(1)


def processFiles(monkey, eventTeam, eventFiles, say, convertFile, userIsAdmin, slackToken, dumpFilePath):
    if not userIsAdmin:
        say(slackMessages.adminRequiredError)
        return
    say(slackMessages.processStart)
    filesToPush = []
    for i in range(len(eventFiles)):
        eventFile = eventFiles[i]
        try:
            fileLink = eventFile['url_private_download']
            fileName = eventFile['name']
            fileType = eventFile['filetype']
            # Get request for the file download
            fileDownload = requests.get(
                fileLink, headers={'Authorization': 'Bearer ' + slackToken})
            if fileType == 'text':
                fileContent = fileDownload.text
            elif fileType == 'pdf':
                # Downloads, mines, and removes file.
                dumpContent = fileDownload.content
                cachedFileName = f'{dumpFilePath}{str(uuid4())}.pdf'
                cachedFile = open(cachedFileName, 'wb')
                cachedFile.write(dumpContent)
                cachedFile.close()
                rawFileContent = extract_text(cachedFileName)
                fileContent = tooMuchSpaceRegex.sub(' ', rawFileContent)
                remove(cachedFileName)
            else:
                say(slackMessages.processTypeError(fileName))
                continue
            if convertFile:
                say(slackMessages.convertPrefix(fileName) + fileContent)
                continue
            else:
                filesToPush.append({'topic': fileName[:-3], 'content': fileContent})
                continue
        except KeyError:
            say(slackMessages.processLinkError)
    monkey.updateWorkspace(eventTeam, filesToPush)
    say(slackMessages.processStop)


def findRelevantTopics(topics, query):
    evals = []
    for topic in topics:
        tokenSortRatio = fuzz.token_sort_ratio(topic, query)
        if tokenSortRatio > 0:
            evals.append((tokenSortRatio, topic))
    evals = sorted(evals, key=lambda eval: eval[0], reverse=True)
    n = len(evals)
    evals = evals[0: min(10, n)]
    return list(map(lambda eval: eval[1], evals))