NEWLINE = '\n'

statusWorkspaceCommand = 'status workspace'
clearWorkspaceCommand = 'clear workspace'


def statusWorkspaceResponse(eventTeam, files):
    return f'''You are in *workspace {eventTeam}*.{NEWLINE}{
    'You have no files.' if len(files) == 0 else '*Files*:' + NEWLINE + 
    NEWLINE.join(map(lambda file: f'- *Topic:* {file["topic"]} *Content:* {file["content"][:20]}...', files))}'''


clearWorkspaceResponse = 'Your workspace files are cleared.'

statusCommand = 'status me'
userCommand = 'user me'
adminCommand = 'admin me'

botHelpCommand = 'help'
questionHelpCommand = 'question help'
inputHelpCommand = 'input help'

listCommandsCommand = 'list commands'
listTopicsCommand = 'list topics'

backQuestionCommand = 'back'
cancelQuestionCommand = 'cancel'

goodBotCommand = 'good bot'
goodBotResponse = ':)'
badBotCommand = 'bad bot'
badBotResponse = ':('

botHelpTip = 'Reply with `' + botHelpCommand + '` for more information.'
inputHelpTip = 'For instructions on uploading files, best practices, and technical limitations, reply with `' + inputHelpCommand + '`'
questionHelpTip = f'To learn how to ask me questions, reply with `{questionHelpCommand}`'

botStatusCommand = 'bot status'


def botStatusResponse(
    goodBot, badBot): return f'I have been a good bot {goodBot} times and a bad bot {badBot} times, making me {int((goodBot * 100) / (goodBot + badBot))} percent good.'


commands = [statusWorkspaceCommand, clearWorkspaceCommand, statusCommand, userCommand, adminCommand,
            botHelpCommand, inputHelpCommand, questionHelpCommand, listCommandsCommand, listTopicsCommand, backQuestionCommand, cancelQuestionCommand, goodBotCommand, badBotCommand, botStatusCommand]
adminRequiredCommands = [statusWorkspaceCommand, clearWorkspaceCommand]

adminTip = f'To become an admin, reply to me with `{adminCommand}`.'
adminRequiredError = 'You need to be an admin to do that. ' + adminTip


def listCommands():
    return f'Below are the commands you can use:{NEWLINE}{NEWLINE.join(map(lambda x: f"`{x}`",commands))}'


def listTopics(files):
    if len(files) == 0:
        return f'You have not uploaded any files. {inputHelpTip}'
    topics = NEWLINE.join(map(lambda file: f'`{file["topic"]}`', files))
    return f'*Topics:*{NEWLINE}{topics}'


def isCommand(message):
    return message in commands


def isAdminCommand(message):
    return message in adminRequiredCommands


def statusResponse(isAdmin, userID, teamID):
    return f'You are a{"n admin" if isAdmin else " user"}. Your slack user ID is {userID} and you live in workspace {teamID}.{NEWLINE}'


userResponse = 'You have become a user. ' + adminTip
adminResponse = 'You have become an admin. To stop being an admin, repond with `' + userCommand + '`'

welcomeUser = 'Welcome! ' + botHelpTip

processStart = 'Processing your file...'
processError = 'There was a problem processing your file. ' + inputHelpTip
processPermError = 'I cannot read files from non-admin users. ' + inputHelpTip
processLinkError = 'I could not download your file. Try again. ' + inputHelpTip
processTypeError = 'I detected an unsupported file type. ' + inputHelpTip

unknownError = 'An unknown error occurred.'


def processTypeError(fileName):
    return f'Only `.pdf` and `.txt` files can be processed. Your incompatible file `{fileName}` was skipped.'


processStop = 'Your files were processed!'
convertFlag = 'convert'


def convertPrefix(
    convertedFileName): return f'*Processed {convertedFileName}:*{NEWLINE}{NEWLINE}'


def convertError(fileName):
    return f'You can only convert `.pdf` files. Your incompatible file {fileName} was skipped.'


botHelp = f'''
Hi! My name is smarta, your artificially intelligent slack bot. I answer questions based on the textbooks that are fed to me. If you have already fed me information and I know the answer, I can answer your questions!{NEWLINE}
{inputHelpTip}. {questionHelpTip} . For more commands, reply with `{listCommandsCommand}`
'''
exampleTopic = 'blood cells'
exampleQuestion = 'What are blood cells made of?'
questionHelp = f'''
Here's how you ask me questions:\n
*1.* Start the question prompt by replying to me with a topic. For example: "{exampleTopic}". This helps me narrow down the number of pages I have to read. To view the available topics to search from, reply with `{listTopicsCommand}`{NEWLINE}
*2.* If I find matching topics, I'll ask you to select one. If I can't find it, I'll ask you to search again.{NEWLINE}
*3.* To select topics, reply with the number assigned to each topic. For example, "4" is a valid response.{NEWLINE}
*4.* Once a topic is selected, ask a specific question: For example, "{exampleQuestion}".{NEWLINE}
*5.* To go to the previous step, reply with `{backQuestionCommand}`. To cancel your question, reply with `{cancelQuestionCommand}`.{NEWLINE}
*6.* If you leave, I'll keep your results for you. You can keep asking your question when you come back. To stop asking your question, see the above item.
'''

inputHelp = f'''
*Instructions:*{NEWLINE}
*1.* To upload files for smarta to use, you must be an admin. {adminTip}{NEWLINE}
*2.* Firstly, remove the parts of the book that are unnecessary. This includes _but is not limited to_ table of contents, appendices, index, and references.
*3.* Divide your textbook into sections that are as small as possible. Name each file so that it describes the topics that file includes. smarta answers your question best (faster and more accurate) when it is divided into small sections. The ideal size of each section should be around 1-5 pages. A good rule of thumb is that your textbook should be split into _at least_ its subsections.{NEWLINE}
*4.* Upload your files. The input formats accepted are `.txt` files and `.pdf` files. `pdf` files will be converted to text and processed to remove any messy artifacts that smarta cannot understand.{NEWLINE}
*5.* You can always add more files later, so you can always expand the knowledge base.{NEWLINE}
*6.* You can use {statusWorkspaceCommand} to view the content of your workspace and {clearWorkspaceCommand} to clear your input files.{NEWLINE}
{NEWLINE}*Technical Limitations:*{NEWLINE}
*1.* Slack will not process files larger than 1 GB. However, our AI will not work well with files that large. In fact, each file should preferably be as small as possible.{NEWLINE}
*2.* All image-based knowledge will be lost in inputted PDFs.{NEWLINE}
*3.* All knowledge may not be represented, either lost in conversion or sometimes not returned by the chatbot.{NEWLINE}
*4.* While the Natural Language Processing in this chatbot is a result of latest research and rigorous training, it is imperfect by design. To minimize error, provide clear, specific queries and provide human-reviewed `.txt` files.{NEWLINE}
*5.* If you would like to inspect the pdf :arrow_right: text conversion, you can upload one or more `.pdf` files with `{convertFlag}` in the text area and smarta will respond with the `.txt` conversion of each pdf files. These files will not be uploaded but returned back to you so you can download, edit, and reupload after manually editing the `.txt` files.
'''

stateNavigationTip = f'You can reply with `{backQuestionCommand}` to go to the previous step or `{cancelQuestionCommand}` to stop asking your question.'
rephraseTip = 'try rephrasing your topic or asking about something else.'


def relevantTopicsMessage(relevantTopics):
    message = f'Which of these topics sound the most relevant to your question?{NEWLINE}'
    for i in range(len(relevantTopics)):
        message += f'*{i + 1}.* {relevantTopics[i]}{NEWLINE}'
    message += f'If this did not answer your question, {rephraseTip}'
    return message


noRelevantTopicsMessage = f'I could not find a topic like that- {rephraseTip} {stateNavigationTip} {botHelpTip}'

invalidChosenTopicMessage = f"I don't know what that means. Please reply with one of the numbers listed above. {botHelp}"


def choseTopicMessage(topic):
    return f'You have chosen the topic: `{topic}`. What is your specific question? ' + stateNavigationTip


def questionResponse(results):
    n = len(results)
    if n == 0:
        return f'I could not find the answer to your question. You can try asking me again. {questionHelpTip}'
    result = f'Here is what I found:{NEWLINE}'
    for i in range(0, n):
        result += f'*{i + 1}. * {results[i]}{NEWLINE}'
    result += stateNavigationTip
    return result


zeroStateRestriction = f'You cannot cancel your question because you have not asked me one. {questionHelpTip}'
cancelQuestionResponse = f'You have canceled your question. {questionHelpTip}'
backQuestionResponse = f'You have gone to the previous step. {questionHelpTip}'
