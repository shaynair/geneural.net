import os
import sys
import zerorpc
import json

ENDPOINT = 3000

class Simulation():
    def __init__(self):
        self.client = zerorpc.Client()
        self.client.connect('tcp://127.0.0.1:' + str(ENDPOINT))

    def simulate(self, heuristics=None):
        if heuristics == None:
            heuristics = {}
        return json.loads(self.client('simulate', json.dumps(heuristics)))