# environment errors
envPortException = Exception(
    "No PORT specified in the dotenv file. Make sure there exists a .dotenv file with a specifed port number.")
envSecretException = Exception(
    "No PORT specified in the dotenv file. Make sure there exists a .dotenv file with a specifed secret string.")
envTokenException = Exception(
    "No PORT specified in the dotenv file. Make sure there exists a .dotenv file with a specifed token string.")
envDumpException = Exception(
    "No dumpFile directory specified in the dotenv file. Make sure there exists a .dotenv file with a specifed path string.")
envMongoPasswordException = Exception(
    "No mongoDB password specified in the dotenv file. Make sure there exists a .dotenv file with a specifed password string.")
envMongoDbException = Exception(
    "No mongoDB database specified in the dotenv file. Make sure there exists a .dotenv file with a specifed database string.")
# file-processing errors
fileProcessingError = Exception("Error processing file.")
# database errors
mongoInsertError = Exception("Could not insert into a collection.")
mongoDeleteError = Exception("Could not delete into a collection.")
mongoSearchError = Exception("Could not search into a collection.")
mongoUpdateError = Exception("Could not update into a collection.")