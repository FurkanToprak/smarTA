import fs from 'fs';
import path from 'path';
import request from 'request';
import { exec } from 'child_process';
import mongoose from 'mongoose';
import { TextbookSchema, WorkspaceSchema } from './MongoServices';

/* Download and process textbook */
export function scrapeSlackFile(
  fileURL: string,
  fileTeam: string,
  slackToken: string,
  mongoConnection: mongoose.Connection,
): void {
  const pdfFile = path.join(__dirname, `books/${fileTeam}.pdf`);
  const txtFile = path.join(__dirname, `books/${fileTeam}.txt`);
  request({
    url: fileURL,
    headers: {
      Authorization: 'Bearer ' + slackToken,
    },
  })
    .pipe(fs.createWriteStream(pdfFile))
    .on('finish', () => {
      const xpdfProcess = exec(`pdftotext ${pdfFile}`);
      xpdfProcess.on('error', (err: Error) => {
        // Error while using xpdf.
        console.log(err);
      });
      xpdfProcess.on('close', async (code: number) => {
        if (code === 0) {
          const txtContents = fs.readFileSync(txtFile);
          // Split txtContents into sentences & lines.
          const findLinesAndSentences = new RegExp(/([\w .]+)[\n]/g);
          const linesAndSentences = txtContents
            .toString()
            .match(findLinesAndSentences);
          if (!linesAndSentences) {
            throw Error('Empty regex array.');
          }
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const cleanedLinesAndSentences = linesAndSentences!.map(
            (value: string) => {
              return value.trim();
            },
          );
          console.log(linesAndSentences);
          console.log(cleanedLinesAndSentences);
          // Remove the .pdf file.
          const removePdf = exec(`rm ${pdfFile}`);
          removePdf.on('error', function(err) {
            console.log(err);
          });
          const mongoTextbook = mongoConnection.model(
            'TextbookSchema',
            TextbookSchema,
          );
          const mongoWorkspace = mongoConnection.model(
            'WorkspaceSchema',
            WorkspaceSchema,
          );
          const newTextbook = await mongoTextbook.create({
            raw: txtContents,
            urls: [],
          });
          await mongoWorkspace.findOneAndUpdate(
            {
              team: fileTeam,
            },
            { textbook: newTextbook._id },
          );
          // TODO: app.use('/static', express.static(txtFile)))
        } /* Error opening PDF file.*/ else if (code === 1) {
          null;
        } /* Error opening an output file.*/ else if (code === 2) {
          null;
        } /* Error related to PDF permissions.*/ else if (code === 3) {
          null;
        } /* Other exit code; misc. error.*/ else {
          null;
        }
      });
    });
}
