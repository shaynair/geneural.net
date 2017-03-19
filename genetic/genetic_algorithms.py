import random
from run_simulation import Simulation
totalWeights = 4
temp = 2**totalWeights
POPULATION_SIZE = temp + temp/10
TOTAL_GENS = 100

class Chromosome(object):

    def avg_fitness(self):
        return self.total_fitness / self.games

    def getRand(self):
        return random.uniform(0,1)

    def __init__(self, weights, cond):
        self.weights = []
        if cond != 1:
            self.weights = weights
        else:
            for i in range(totalWeights):
                self.weights.append(self.getRand())
        self.total_fitness = 0
        self.games = 0


class GeneticAlgorithm(object):

    def genScore(self, weights):
        myMap = {}
        myMap['num_holes'] = weights[0]
        #myMap['num_gaps'] = weights[1]
        #myMap['max_height'] = weights[2]
        #myMap['avg_height'] = weights[3]
        myMap['completed_lines'] = weights[1]
        myMap['bumpiness'] = weights[2]
        myMap['num_blocks'] = weights[3]
        ret = self.sim.simulate(myMap)
        return ret['score']

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
        for i in population:
            i.games = 2
            i.total_fitness = self.genScore(i.weights)
            self.totalScore += i.total_fitness
            #print i.avg_fitness()
        print "got scores"
        print self.totalScore / POPULATION_SIZE
        top = self.getTop(population)
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
            for j in range(numVars):
                tempList.append(top[(i // (len(top) ** j)) % len(top)].weights[j])
            weightList.append(tempList)
        return weightList

    def nextChrome(self):
        self.current_chromosome += 1
        if self.current_chromosome >= POPULATION_SIZE:
            self.current_chromosome = 0
            self.next_generation()

    def getTop(self, population):
        return sorted(population,key = lambda x: x.avg_fitness())[POPULATION_SIZE-4:]



gen = GeneticAlgorithm()
