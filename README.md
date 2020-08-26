# smarta

An artificially intelligent chatbot that uses Slack to interface to students.

smarTA does the following:
* Accepts textbooks to be uploaded through Slack in pdf/plaintext format
* Performs NLP pre-processing in order to vectorize/index the documents.
* Answers students' questions through Slack

---
## Architecture

```
.
├── build | Build version
├── node_modules
├── nodemon.json | nodemon configs
├── package.json
├── package-lock.json
├── README.md
├── src | Development version
│   ├── index.ts | General webhook/database/server configurations
│   ├── LanguageServices.ts | Where the NLP magic happens
│   ├── MongoServices.ts | Mongo Schemas
│   └── SlackServices.ts | Slack I/O interfacing
└── tsconfig.json | Typescript configs
```
---
## TODO
Pick a better (faster) NLP model to fetch user queries.