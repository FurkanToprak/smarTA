import tensorflow
import tensorflow_hub as hub
import numpy as np

class SmartaBrain():
    def __init__(self):
        self.embed = hub.load("https://tfhub.dev/google/universal-sentence-encoder/4")

    def think(self, answer_text, question):
        sentences = answer_text.split('.')
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
            minIndex = max(0, index - 1)
            maxIndex = min(len(sentences), index + 2)
            window = '.'.join(sentences[minIndex: maxIndex])
            windows.append(window)
        return windows