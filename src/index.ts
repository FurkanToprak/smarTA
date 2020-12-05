import dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';
import { createEventAdapter } from '@slack/events-api';
import mongoose from 'mongoose';
import {
  AppHomeOpened,
  IncomingMessage,
  SlackUser,
  slackSigningSecret,
  slackToken,
  BotPrompts,
  SlackConversation,
} from './SlackServices';
import {
  UserSchema,
  WorkspaceSchema,
  ErrorSchema,
  TextbookSchema,
} from './MongoServices';
import express from 'express';
import {
  VectorSpaceModel,
  SimilaritySchemas,
  WeighingSchemas,
  WordMappings,
  VectorizedDocument,
} from 'vectorspacemodel';
import { scrapeSlackFile } from './LanguageServices';

dotenv.config();

const port = Number.parseInt(process.env.PORT || '4000');
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost/test';
mongoose.set('useFindAndModify', false);

/** Sets up event listeners along with some basic logic. */
function initializeSlack(
  port: number,
  mongoConection: mongoose.Connection,
): void {
  const slackWebClient = new WebClient(slackToken);
  /**  */
  const slackEventsClient = createEventAdapter(slackSigningSecret, {
    includeBody: false,
    includeHeaders: false,
    waitForResponse: false,
  });
  slackEventsClient.on('message', async (event: IncomingMessage) => {
    const userResult = await slackWebClient.users.profile.get({
      token: slackToken,
      user: event.user,
    });
    if (userResult.error) {
      // Log error to mongodb
      const mongoError = mongoConection.model('ErrorSchema', ErrorSchema);
      mongoError.create({
        error: `Slack web api error: ${userResult.error}`,
        date: Date(),
      });
    } else {
      const slackUser = userResult.profile as SlackUser;
      // Don't talk to yourself.
      if (
        slackUser.real_name !== 'smarta' &&
        slackUser.real_name !== 'smartatest'
      ) {
        /** Create mongo user model. */
        const mongoUser = mongoConection.model('UserSchema', UserSchema);
        /** Create mongo workspace model */
        const mongoWorkspace = mongoConection.model(
          'WorkspaceSchema',
          WorkspaceSchema,
        );
        const userQuery = await mongoUser.findOne({
          name: slackUser.real_name,
        });
        if (userQuery) {
          if (event.files) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const textbookURL = (event.files[0] as any)['url_private'];
            /** Lets user know the textbook is processing. */
            await slackWebClient.chat.postMessage({
              text: BotPrompts.UploadPreprocess,
              channel: event.channel,
              token: slackToken,
            });
            const workspaceQuery = await mongoWorkspace.findOne({
              users: { $all: [userQuery._id] },
            });
            if (workspaceQuery) {
              // Process textbook.
              scrapeSlackFile(
                textbookURL,
                workspaceQuery.get('team'),
                slackToken,
                mongoConection,
              );
              /** Lets user know the textbook is done processing. */
              slackWebClient.chat.postMessage({
                text: BotPrompts.UploadPostprocess,
                channel: event.channel,
                token: slackToken,
              });
            }
          } else {
            const workspaceQuery = await mongoWorkspace.findOne({
              users: { $all: [userQuery._id] },
            });
            if (workspaceQuery) {
              const workspaceTextbook = workspaceQuery.get('textbook') as
                | string
                | undefined;
              if (workspaceTextbook) {
                const mongoTextbook = mongoConection.model(
                  'TextbookSchema',
                  TextbookSchema,
                );
                const textbookQuery = await mongoTextbook.findOne({
                  _id: workspaceTextbook,
                });
                if (textbookQuery) {
                  const rawTextbook = textbookQuery.get('raw') as string;
                  /** Add to list of questions. */
                  await mongoUser.findOneAndUpdate(
                    {
                      _id: userQuery._id,
                    },
                    {
                      $push: {
                        questions: event.text,
                      },
                    },
                  );
                  // TODO: Process Query and answer.
                  console.log('calc');
                  const vsm: VectorSpaceModel = new VectorSpaceModel(
                    SimilaritySchemas.cosineSimilarity,
                    WeighingSchemas.tfidf,
                    WordMappings.caseInsensitive,
                  );
                  const scored = vsm.query(
                    event.text,
                    rawTextbook
                      .split('\n')
                      .map((value: string, index: number) => {
                        return {
                          content: value,
                          // eslint-disable-next-line no-undef
                          meta: new Map<string, number>([['index', index]]),
                        };
                      }),
                    3,
                  );
                  console.log(scored);
                  slackWebClient.chat.postMessage({
                    text:
                      "Here's what I found:\n" +
                      scored
                        .filter(value => value.score > 0)
                        .map((value: VectorizedDocument) => {
                          return `${value.score} ${value.content}`;
                        })
                        .join('\n\n\n'),
                    channel: event.channel,
                    token: slackToken,
                  });
                }
              } else {
                /** Give user an introduction, with directions to upload content. */
                slackWebClient.chat.postMessage({
                  text: BotPrompts.NoUpload,
                  channel: event.channel,
                  token: slackToken,
                });
              }
            } else {
              // Log error to mongodb
              const mongoError = mongoConection.model(
                'ErrorSchema',
                ErrorSchema,
              );
              mongoError.create({
                error: `Workspace query error: ${userQuery}`,
                date: Date(),
              });
            }
          }
        } else {
          // Log error to mongodb.
          const mongoError = mongoConection.model('ErrorSchema', ErrorSchema);
          mongoError.create({
            error: `Slack user query error: ${userQuery}`,
            date: Date(),
          });
        }
      }
    }
  });
  //
  slackEventsClient.on('app_home_opened', async (event: AppHomeOpened) => {
    const userResult = await slackWebClient.users.profile.get({
      token: slackToken,
      user: event.user,
    });
    if (userResult.error) {
      // Slack error to mongoDB
      const mongoError = mongoConection.model('ErrorSchema', ErrorSchema);
      mongoError.create({
        error: `Slack user query error: ${userResult.error}`,
        date: Date(),
      });
    } else {
      /** If user is successfully fetched, get more information on the team the user is in. */
      const conversationResult = await slackWebClient.conversations.info({
        token: slackToken,
        channel: event.channel,
      });
      if (conversationResult.error) {
        // Slack error to mongoDB
        const mongoError = mongoConection.model('ErrorSchema', ErrorSchema);
        mongoError.create({
          error: `Slack conversation query error: ${conversationResult.error}`,
          date: Date(),
        });
      } else {
        const slackConversation = conversationResult.channel as SlackConversation;
        const team = slackConversation.latest.team;
        const slackUser = userResult.profile as SlackUser;
        const name = slackUser.real_name;
        const channel = event.channel;
        /** Create mongo user model. */
        const mongoUser = mongoConection.model('UserSchema', UserSchema);
        /** Create mongo workspace model */
        const mongoWorkspace = mongoConection.model(
          'WorkspaceSchema',
          WorkspaceSchema,
        );
        /** Check if user's workspace has uploaded a textbook. */
        const workspaceQuery = await mongoWorkspace.findOne({ team });
        if (workspaceQuery) {
          const textbook = workspaceQuery.get('textbook');
          /** If textbook */
          if (textbook) {
            /** Find user. If such a user, increment its usage. */
            const updateUserQuery = await mongoUser.findOneAndUpdate(
              {
                name,
                channel,
              },
              {
                $push: {
                  logins: Date(),
                },
              },
            );
            /** If user exists */
            if (updateUserQuery) {
              /** Welcome back user. */
              slackWebClient.chat.postMessage({
                text: BotPrompts.WelcomeBack,
                channel: event.channel,
                token: slackToken,
              });
            } else {
              /** Make user and give user an introduction */
              const newUser = await mongoUser.create({
                name,
                channel,
                questions: [],
                logins: [new Date()],
              });
              mongoWorkspace.findOneAndUpdate(
                { team },
                {
                  $push: {
                    users: newUser,
                  },
                },
              );
              slackWebClient.chat.postMessage({
                text: BotPrompts.Introduction,
                channel: event.channel,
                token: slackToken,
              });
            }
          } else {
            /** Find user. If such a user, increment its usage. */
            const updateUserQuery = await mongoUser.findOneAndUpdate(
              {
                name,
                channel,
              },
              {
                $push: {
                  logins: Date(),
                },
              },
            );
            /** If user exists */
            if (updateUserQuery) {
              /** Welcome back user. */
              slackWebClient.chat.postMessage({
                text: BotPrompts.NoUploadWelcomeBack,
                channel: event.channel,
                token: slackToken,
              });
            } else {
              /** Make user and give user an introduction */
              const newUser = await mongoUser.create({
                name,
                channel,
                questions: [],
                logins: [new Date()],
              });
              mongoWorkspace.findOneAndUpdate(
                { team },
                {
                  $push: {
                    users: newUser,
                  },
                },
              );
              slackWebClient.chat.postMessage({
                text: BotPrompts.NoUploadIntroduction,
                channel: event.channel,
                token: slackToken,
              });
            }
          }
        } else {
          /** No workspace; meaning no user. Create new user on mongo */
          const newUser = await mongoUser.create({
            name,
            channel,
            questions: [],
            logins: [new Date()],
          });
          /** Create new workspace with new user in it. */
          mongoWorkspace.create({
            team,
            users: [newUser._id],
          });
          /** Give user an introduction, with directions to upload content. */
          slackWebClient.chat.postMessage({
            text: BotPrompts.NoUploadIntroduction,
            channel: event.channel,
            token: slackToken,
          });
        }
      }
    }
  });
  /* Create the server. */
  const app = express();
  /** Attack event request listener middleware to /slack endpoint */
  app.use('/slack', slackEventsClient.requestListener());
  /** Serve static files at /books endpoint. */
  app.use('/books', express.static('books'));
  app.post('/slack', (req, res) => {
    console.log(req);
  })
  app.listen(port, () => console.log(`Listening on port ${port}`));
}

/** Entry point of the app. */
const mongoConnection = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoConnection.on('error', () =>
  console.log('Error while connecting to mongodb.'),
);
mongoConnection.once('open', function() {
  initializeSlack(port, mongoConnection);
});
