import tensorflow
import tensorflow_hub as hub
import numpy as np
import re
import nltk

nltk.download()

tokenizer = nltk.data.load('tokenizers/punkt/english.pickle')

class SmartaBrain():
    def __init__(self):
        self.embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")

    def think(self, answer_text, question):
        sentences = tokenizer.tokenize(answer_text)

        sentences.insert(0, question)
        embedding = self.embed(sentences)
        scores = np.inner(embedding, embedding)[0]
        results = []
        for i in range(1, len(sentences)):
            thisScore = scores[i]
            if thisScore > 0:
               results.append((thisScore, i))
        results = sorted(results, key=lambda x: x[0], reverse=True)[0:5]
        windows = []
        for result in results:
            index = result[1]
            window = ''
            if index > 0:
                window += sentences[index - 1]
            window += f' *{sentences[index]}*'
            if index + 1 < len(sentences):
                window += f' {sentences[index + 1]}'            
            windows.append(window)
        return windows