import pymongo
import devMessages

MAX_STATE = 3

class Monkey:
    def __init__(self, mongoDatabase, mongoPassword):
        self.mongoDatabase = mongoDatabase
        self.mongoPassword = mongoPassword
        mongoClient = pymongo.MongoClient(
            f'mongodb+srv://smartaconsole:{mongoPassword}@cluster0.skuml.mongodb.net/{mongoDatabase}?retryWrites=true&w=majority')
        self.masterDb = mongoClient[mongoDatabase]
        self.usersCollection = self.masterDb['Users']
        self.workspacesCollection = self.masterDb['Workspaces']

    def insertUser(self, teamID, userID):
        newUser = {
            'questions': [],
            'isAdmin': False,
            'userID': userID,
            'teamID': teamID,
            'state': 0,
            'relevantTopics': [],
            'chosenTopic': -1,
        }
        insertResult = self.usersCollection.insert_one(newUser)
        if not insertResult:
            raise devMessages.mongoInsertError
        else:
            newUser['_id'] = insertResult.inserted_id
        return newUser

    def findUser(self, teamID, userID):
        searchedUser = {
            'userID': userID,
            'teamID': teamID,
        }
        return self.usersCollection.find_one(searchedUser)

    def updateUser(self, teamID, userID, question=None, isAdmin=None, state=None, relevantTopics=None, chosenTopic=None, goodBot=None, badBot=None):
        searchedUser = {
            'userID': userID,
            'teamID': teamID,
        }
        updateDict = {}
        initSet = False
        initPush = False
        if question:
            updateDict['$push'] = {'questions': question}
            initPush = True
        if isAdmin is not None:
            initSet = True
            updateDict['$set'] = {'isAdmin': isAdmin}
        if state is not None:
            if initSet:
                updateDict['$set']['state'] = state
            else:
                updateDict['$set'] = {'state': state}
                initSet = True
        if relevantTopics is not None:
            if initSet:
                updateDict['$set']['relevantTopics'] = relevantTopics
            else:
                updateDict['$set'] = {'relevantTopics': relevantTopics}
                initSet = True
        if chosenTopic is not None:
            if initSet:
                updateDict['$set']['chosenTopic'] = chosenTopic
            else:
                updateDict['$set'] = {'chosenTopic': chosenTopic}
                initSet = True
        operationFlags = {'returnNewDocument': True}
        return self.usersCollection.find_one_and_update(
            searchedUser, updateDict, operationFlags)

    def resetAllUsers(teamID):
        self.usersCollection.updateMany({}, {'$set': {
            'state': 0,
            'questions': [],
            'relevantTopics': [],
            'chosenTopic': -1,
        }})

    def insertWorkspace(self, teamID):
        newWorkspace = {
            'files': [],
            'teamID': teamID,
            'goodBot': 0,
            'badBot': 0,
        }
        insertResult = self.workspacesCollection.insert_one(newWorkspace)
        if not insertResult:
            raise devMessages.mongoInsertError
        else:
            newWorkspace['_id'] = insertResult.inserted_id
        return newWorkspace

    def findWorkspace(self, teamID):
        newWorkspace = {
            'teamID': teamID
        }
        return self.workspacesCollection.find_one(newWorkspace)

    def updateWorkspace(self, teamID, files=None, goodBot=None, badBot=None):
        searchedWorkspace = {
            'teamID': teamID,
        }
        updateDict = {}
        initSet = False
        initPush = False
        if files == -1:
            updateDict['$set'] = {'files': []}
            initSet = True
        elif files is not None:
            updateDict['$push'] = {'files': {'$each': files}}
            initPush = True
        if goodBot is not None:
            if initSet:
                updateDict['$set']['goodBot'] = goodBot
            else:
                updateDict['$set'] = {'goodBot': goodBot}
                initSet = True
        if badBot is not None:
            if initSet:
                updateDict['$set']['badBot'] = badBot
            else:
                updateDict['$set'] = {'badBot': badBot}
                initSet = True
        operationFlags = {'returnNewDocument': True}
        return self.workspacesCollection.find_one_and_update(
            searchedWorkspace, updateDict, operationFlags)

    def insertContent(self, teamID, content):
        pass