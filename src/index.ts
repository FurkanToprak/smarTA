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
  TextbookSchema,
  SyllabusSchema,
  WorkspaceSchema,
} from './MongoServices';
import express from 'express';
import bodyParser from 'body-parser';

dotenv.config();

const port = Number.parseInt(process.env.PORT || '4000');
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost/test';
mongoose.set('useFindAndModify', false);

/** In order to configure SlackEvents to be directed towards a specifc IP,
 *  the server must respond to Slack's POST request with their challenge parameter.
 */
function configureServer(port: number): void {
  const app = express();
  const jsonParser = bodyParser.json();

  app.get('/', (req, res) => {
    res.send('Hello, world!');
  });

  app.post('/', jsonParser, (req, res) => {
    res.send(req.body.challenge);
  });

  app.listen(port, () => {
    return console.log(`server is listening on ${port}`);
  });
}

/** Sets up event listeners along with some basic logic. */
function initializeSlack(
  port: number,
  mongoConection: mongoose.Connection,
): void {
  const slackWebClient = new WebClient(slackToken);
  const slackEventsClient = createEventAdapter(slackSigningSecret, {
    includeBody: false,
    includeHeaders: false,
    waitForResponse: false,
  });
  slackEventsClient
    .start(port)
    .then(() => {
      slackEventsClient.on('message', async (event: IncomingMessage) => {
        const userResult = await slackWebClient.users.profile.get({
          token: slackToken,
          user: event.user,
        });
        if (userResult.error) {
          // TODO: Slack connection error to MongoDB
        } else {
          const slackUser = userResult.profile as SlackUser;
          // Don't talk to yourself.
          if (
            slackUser.real_name !== 'smarta' &&
            slackUser.real_name !== 'smartatest'
          ) {
            // TODO: Decision tree.
          }
        }
      });

      slackEventsClient.on('app_home_opened', async (event: AppHomeOpened) => {
        const userResult = await slackWebClient.users.profile.get({
          token: slackToken,
          user: event.user,
        });
        if (userResult.error) {
          // TODO: Slack connection error to MongoDB
        } else {
          /** If user is successfully fetched, get more information on the team the user is in. */
          const conversationResult = await slackWebClient.conversations.info({
            token: slackToken,
            channel: event.channel,
          });
          if (conversationResult.error) {
            // TODO: Check if latest can be fetched if there is no text.
            // TODO: Slack error to mongoDB
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
    })
    .catch(reason => {
      console.log('An error occurred when initializing Slack Events Client.');
      // TODO: Slack connection error to MongoDB
      console.log(reason);
    });
}

/** Entry point of the app. */
function entryPoint(developmentMode: boolean): void {
  if (developmentMode) {
    configureServer(port);
  } else {
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
  }
}

entryPoint(false);
