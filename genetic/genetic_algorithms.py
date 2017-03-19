import random
import time
from run_simulation import Simulation
totalWeights = 2
numTop = 3
temp = numTop**totalWeights
POPULATION_SIZE = temp + temp*4
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
            for i in range(totalWeights):
                self.weights.append(getRand())
        self.total_fitness = 0
        self.games = 0


class GeneticAlgorithm(object):

    def genScore(self, weights):
        myMap = {}
        #myMap['num_holes'] = weights[0] #36, 0.12s
        myMap['num_gaps'] = weights[0] #40, 0.06s
        #myMap['max_height'] = weights[1] #36 very random don't even , 0.02s
        #myMap['avg_height'] = weights[0] #36, slow af
        myMap['completed_lines'] = weights[1] #38, 0.05s
        #myMap['bumpiness'] = weights[0] # slow af
        #MyMap['num_blocks'] = weights[3] #38, 0.1s
        #MyMap['num_blocks_above_holes'] = weights[0] #???

        t = time.time()
        ret = self.sim.simulate(myMap)
        return (time.time() - t, ret['score'])

    def __init__(self):
        self.population = []
        for i in range(POPULATION_SIZE):
            self.population.append(Chromosome(None,1))
        self.current_chromosome = 0
        self.current_generation = 1
        self.sim = Simulation()
        self.totalScore = 0
        self.next_generation()

    def next_generation(self):
        #where the gen algorithm goes
        print("__________________\n")
        print "GEN: ", self.current_generation
        population = self.population
        self.totalScore = 0
        self.totalTime = 0
        for i in population:
            i.games = 1
            (i.total_fitness, i.time) = self.genScore(i.weights)
            #print i.avg_fitness()
        print "got scores"
        top = self.getTop(population)
        for i in top:
            self.totalScore += i.total_fitness
            self.totalTime += i.time
        print self.totalScore / len(top)
        print self.totalTime / len(top)
        weights = []

        #get n^k from breeding
        print "before breeding"
        breed = self.cross(top)
        print "after breeding"
        for v in breed:
            weights.append(v)
        print "appended crossed weights"

        #randomly gen 4 more
        for v in range(POPULATION_SIZE- temp):
            weights.append(Chromosome(None, 1).weights)
        print "made random stuffs"

        #print weights
        self.current_generation = self.current_generation + 1
        if self.current_generation == TOTAL_GENS:
            return
        print "didn't quit"
        self.population = []
        for i in range(POPULATION_SIZE):
            self.population.append(Chromosome(weights[i],0))
        self.next_generation()


    def cross(self, top):
        weightList = []
        numVars = len(top[0].weights)
        print numVars
        print len(top)
        print len(top)**numVars
        for i in range(len(top)**numVars):
            tempList = []
            invert = random.randint(0,numVars)

            for j in range(numVars):
                w = top[(i // (len(top) ** j)) % len(top)].weights[j]
                if random.uniform(0,1) < 0.2 and j == invert:
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



gen = GeneticAlgorithm()
