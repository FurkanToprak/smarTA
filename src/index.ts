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

const mongoConection = mongoose.createConnection(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoConection.on('error', console.error.bind(console, 'connection error:'));
mongoConection.once('open', function() {
  console.log('Connected!');
});

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
function initializeSlack(port: number): void {
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
        const result = await slackWebClient.users.profile.get({
          token: slackToken,
          user: event.user,
        });
        if (result.error) {
          // TODO: Slack connection error to MongoDB
        } else {
          const slackUser = result.profile as SlackUser;
          // Don't talk to yourself.
          if (
            slackUser.real_name !== 'smarta' &&
            slackUser.real_name !== 'smartatest'
          ) {
            // TODO: Slack stuff
            await slackWebClient.chat.postMessage({
              text: 'TODO:',
              channel: event.channel,
              token: slackToken,
            });
          }
          console.log(slackUser);
        }
      });

      slackEventsClient.on('app_home_opened', async (event: AppHomeOpened) => {
        const result = await slackWebClient.users.profile.get({
          token: slackToken,
          user: event.user,
        });
        if (result.error) {
          // TODO: Slack connection error to MongoDB
        } else {
          const slackUser = result.profile as SlackUser;
          // TODO: Connect mongodb and only give them an intro if they're not connected.
          await slackWebClient.chat.postMessage({
            text: BotPrompts.Introduction,
            channel: event.channel,
            token: slackToken,
          });
          console.log(slackUser);
          console.log(event);
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
    initializeSlack(port);
  }
}

entryPoint(false);
