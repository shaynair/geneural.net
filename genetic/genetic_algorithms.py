from __future__ import print_function  # Only needed for Python 2
import random
import time
import zerorpc
from run_simulation import Simulation


totalWeights = 4
numTop = 2
gamesPer = 2
temp = numTop**totalWeights
POPULATION_SIZE = temp * 2
TOTAL_GENS = 1000


def getRand(range=1):
    return random.uniform(-range, range)

class Chromosome(object):

    def avg_fitness(self):
        return self.total_fitness / self.games

    def __init__(self, weights, cond):
        self.weights = []
        if cond != 1:
            self.weights = weights
        else:
            for i in xrange(totalWeights):
                self.weights.append(getRand())
        self.total_fitness = 0
        self.games = 0
        self.time = 0
        self.code = ''


class GeneticAlgorithm(object):

    def genScore(self, weights):
        myMap = {}
        myMap['num_holes'] = weights[0] #110, 0.64s
        myMap['avg_height'] = weights[1] #110, 0.82s
        myMap['num_blocks_above_holes'] = weights[2] #110, 0.73s
        myMap['num_gaps'] = weights[3] #64, 0.26s

        ###myMap['num_blocks'] = weights[0] #46, 0.26s
        ####myMap['bumpiness'] = weights[0] # 40, 0.46s <-- no better than random
        ####myMap['max_height'] = weights[0] #41, 0.17s <-- no better than random
        ####myMap['completed_lines'] = weights[0] #40, 0.17s <-- no better than random

        t = time.time()
        ret = self.sim.simulate(myMap)
        return (time.time() - t, ret['score'], ret['moves'])

    def __init__(self):
        self.population = []
        for i in xrange(POPULATION_SIZE):
            self.population.append(Chromosome(None,1))
        self.current_chromosome = 0
        self.current_generation = 1
        self.sim = Simulation()
        self.totalScore = 0

    def next_generation(self):
        if self.current_generation >= TOTAL_GENS:
            return None
        #where the gen algorithm goes
        print("__________________\n")
        print("GEN: " + str(self.current_generation))
        ret = str(self.current_generation) + '\n'
        population = self.population
        self.totalScore = 0
        self.totalTime = 0
        for i in population:
            for q in range(gamesPer):
                i.games += 1
                #i.total_fitness = self.genScore(i.weights)
                #print i.total_fitness
                res = self.genScore(i.weights)
                i.time += res[0]
                i.total_fitness += res[1]
                i.code = res[2]
            #print i.avg_fitness()
        #print "got scores"
        top = self.getTop(population)
        for i in top:
            self.totalScore += i.avg_fitness()
            self.totalTime += i.time
            print("replay " + str(i.avg_fitness()) + " with " + i.code)
            ret += str(i.avg_fitness()) + '\n'
            ret += i.code + '\n'
        ret += str(self.totalScore / len(top)) + '\n'
        print("score: " + str(self.totalScore / len(top)))
        print("time: " + str(self.totalTime / len(top)))
        weights = []

        #get n^k from breeding
        #print "before breeding"
        breed = self.cross(top)
        #print "after breeding"
        for v in breed:
            weights.append(v)
        #print "appended crossed weights"

        #randomly gen 4 more
        for v in range(POPULATION_SIZE- temp):
            weights.append(Chromosome(None, 1).weights)
        #print "made random stuffs"

        #print weights
        self.current_generation = self.current_generation + 1
        if self.current_generation == TOTAL_GENS:
            return ret
        #print "didn't quit"
        self.population = []
        for i in xrange(POPULATION_SIZE):
            self.population.append(Chromosome(weights[i],0))
        return ret

    def cross(self, top):
        weightList = []
        numVars = len(top[0].weights)
        print("variables: " + str(numVars))
        print("top: " + str(len(top)))
        print("candidates: " + str(len(top)**numVars))
        for i in xrange(len(top)**numVars):
            tempList = []
            invert = random.randint(0,numVars)

            for j in xrange(numVars):
                w = top[(i // (len(top) ** j)) % len(top)].weights[j]
                if j == invert and random.uniform(0,1) < 0.2:
                    w = -w
                tempList.append(w)
            weightList.append(tempList)
        return weightList

    def nextChrome(self):
        self.current_chromosome += 1
        if self.current_chromosome >= POPULATION_SIZE:
            self.current_chromosome = 0
            self.next_generation()

    def getTop(self, population):
        return sorted(population,key = lambda x: x.avg_fitness())[-numTop:]

GA = GeneticAlgorithm()

if __name__ == '__main__':
    f = open('file.txt', 'w')
    f2 = open('file2.txt', 'w')
    while True:
        s = GA.next_generation()
        if s is None:
            break
        f.write(s)
        print(s, file=f2)
    f.close()
    f2.close()
